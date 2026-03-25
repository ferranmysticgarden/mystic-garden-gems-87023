import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Users, DollarSign, TrendingUp, Calendar, ShieldAlert, Eye, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PRODUCTS } from '@/data/products';
import { UserDetailModal } from './admin/UserDetailModal';

interface Profile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  expires_at: string | null;
  profiles?: {
    email: string;
    display_name: string;
  };
}

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  todayUsers: number;
  todayRevenue: number;
}

interface GuestStats {
  todaySessions: number;
  weekSessions: number;
  totalSessions: number;
  uniqueToday: number;
  uniqueWeek: number;
  uniqueTotal: number;
  // Funnel 24h
  uniqueLast24h: number;
  sessions24h: number;
  purchaseAttempts24h: number;
  purchaseCancelled24h: number;
  offersShown24h: number;
  noLivesModal24h: number;
  billingErrors24h: number;
  purchaseSuccess24h: number;
}

// Revenue calculation uses actual prices from products catalog
const PRODUCT_PRICES: Record<string, number> = Object.fromEntries(
  PRODUCTS.map(p => [p.id, p.price])
);
// Also map stripe-prefixed IDs
PRODUCTS.forEach(p => {
  PRODUCT_PRICES[`stripe_${p.id}`] = p.price;
  PRODUCT_PRICES[`gp_${p.id}`] = p.price;
});

const PRODUCT_NAMES: Record<string, string> = {
  "gems_100": "100 Gemas",
  "gems_300": "300 Gemas",
  "gems_1200": "1200 Gemas",
  "no_ads_month": "Sin Anuncios (1 Mes)",
  "no_ads_forever": "Sin Anuncios (Para Siempre)",
  "garden_pass": "Pase de Jardín Mensual",
  "starter_pack": "Pack Inicial €0.99",
  "continue_game": "Continuar Partida",
  "buy_moves": "Comprar Movimientos",
  "quick_life": "Vida Rápida",
};

interface AdminDashboardProps {
  onBack?: () => void;
}

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRevenue: 0,
    todayUsers: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [guestStats, setGuestStats] = useState<GuestStats>({
    todaySessions: 0, weekSessions: 0, totalSessions: 0,
    uniqueToday: 0, uniqueWeek: 0, uniqueTotal: 0,
    uniqueLast24h: 0, sessions24h: 0, purchaseAttempts24h: 0,
    purchaseCancelled24h: 0, offersShown24h: 0, noLivesModal24h: 0,
    billingErrors24h: 0, purchaseSuccess24h: 0,
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = useCallback(async (dataType: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('admin-data', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { dataType },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch admin data');
    }

    return response.data?.data;
  }, []);

  const loadData = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch all data through secure Edge Function
      const [profilesData, purchasesData, guestData] = await Promise.all([
        fetchAdminData('profiles'),
        fetchAdminData('purchases'),
        fetchAdminData('guest_stats'),
      ]);

      if (guestData) setGuestStats(guestData);

      // Get user emails for purchases
      const userIds = [...new Set((purchasesData || []).map((p: Purchase) => p.user_id))];
      const userProfiles = (profilesData || []).filter((p: Profile) => userIds.includes(p.id));

      // Combine purchases with profile data, filter out non-catalog products (€0)
      const purchasesWithProfiles = (purchasesData || [])
        .filter((purchase: Purchase) => PRODUCT_PRICES[purchase.product_id] > 0)
        .map((purchase: Purchase) => ({
          ...purchase,
          profiles: userProfiles.find((p: Profile) => p.id === purchase.user_id) || {
            email: 'Unknown',
            display_name: 'Unknown'
          }
        }));

      // Sort by most recent first
      const sortedUsers = (profilesData || []).sort(
        (a: Profile, b: Profile) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const sortedPurchases = purchasesWithProfiles.sort(
        (a: Purchase, b: Purchase) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setUsers(sortedUsers);
      setPurchases(sortedPurchases);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUsers = (profilesData || []).filter(
        (u: Profile) => new Date(u.created_at) >= today
      ).length;

      const totalRevenue = purchasesWithProfiles.reduce(
        (sum: number, p: Purchase) => sum + (PRODUCT_PRICES[p.product_id] || 0),
        0
      );

      const todayRevenue = purchasesWithProfiles
        .filter((p: Purchase) => new Date(p.created_at) >= today)
        .reduce((sum: number, p: Purchase) => sum + (PRODUCT_PRICES[p.product_id] || 0), 0);

      setStats({
        totalUsers: profilesData?.length || 0,
        totalRevenue,
        todayUsers,
        todayRevenue,
      });
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      if (background) {
        toast.error('No se pudo actualizar el dashboard');
      } else {
        setError('Error al cargar los datos. Verifica que tienes permisos de administrador.');
        toast.error('Error al cargar los datos');
      }
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [fetchAdminData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadData(true);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => void loadData()} variant="outline">
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto space-y-6 flex min-h-[calc(100vh-3rem)] flex-col justify-center">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {onBack && (
              <Button onClick={onBack} variant="outline" className="w-fit">
                ← Menú principal
              </Button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Dashboard de Administración</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {lastUpdatedAt
                  ? `Última actualización: ${lastUpdatedAt.toLocaleString('es-ES')}${refreshing ? ' · actualizando…' : ''}`
                  : 'Cargando datos reales…'}
              </p>
            </div>
          </div>
          <Button onClick={() => void loadData()} variant="outline" disabled={loading || refreshing}>
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Totales</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              +{stats.todayUsers} hoy
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturación catálogo</p>
                <p className="text-3xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              +€{stats.todayRevenue.toFixed(2)} hoy · antes de comisiones e impuestos
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compras Totales</p>
                <p className="text-3xl font-bold">{purchases.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversión</p>
                <p className="text-3xl font-bold">
                  {stats.totalUsers > 0 
                    ? ((purchases.length / stats.totalUsers) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Funnel Metrics - Last 24h */}
        <Card className="p-6 border-2 border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">📊 Embudo de hoy (se reinicia a medianoche UTC)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">🔵 Dispositivos únicos</p>
              <p className="text-3xl font-bold text-primary">{guestStats.uniqueLast24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">👥 Sesiones invitados</p>
              <p className="text-3xl font-bold">{guestStats.sessions24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">🎁 Ofertas mostradas</p>
              <p className="text-3xl font-bold text-blue-500">{guestStats.offersShown24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">💀 Sin vidas (modal)</p>
              <p className="text-3xl font-bold text-orange-500">{guestStats.noLivesModal24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">🛒 Intentos compra</p>
              <p className="text-3xl font-bold text-green-500">{guestStats.purchaseAttempts24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">❌ Canceladas usuario</p>
              <p className="text-3xl font-bold text-red-500">{guestStats.purchaseCancelled24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">⚠️ Errores billing</p>
              <p className="text-3xl font-bold text-destructive">{guestStats.billingErrors24h}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">✅ Compras registradas</p>
              <p className="text-3xl font-bold text-green-600">{guestStats.purchaseSuccess24h}</p>
            </div>
          </div>
        </Card>

        {/* Guest Session Stats - Historical */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-bold">Sesiones de Invitados (histórico)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Hoy</p>
              <p className="text-3xl font-bold">{guestStats.uniqueToday}</p>
              <p className="text-xs text-muted-foreground">dispositivos únicos · {guestStats.todaySessions} sesiones</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Últimos 7 días</p>
              <p className="text-3xl font-bold">{guestStats.uniqueWeek}</p>
              <p className="text-xs text-muted-foreground">dispositivos únicos · {guestStats.weekSessions} sesiones</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Total histórico</p>
              <p className="text-3xl font-bold">{guestStats.uniqueTotal}</p>
              <p className="text-xs text-muted-foreground">dispositivos únicos · {guestStats.totalSessions} sesiones</p>
            </div>
          </div>
        </Card>


        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Compras Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Usuario</th>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Monto</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(0, 10).map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      {new Date(purchase.created_at).toLocaleString('es-ES')}
                    </td>
                    <td className="p-2">
                      {purchase.profiles?.display_name || 'Usuario'}<br />
                      <span className="text-xs text-muted-foreground">
                        {purchase.profiles?.email}
                      </span>
                    </td>
                    <td className="p-2">{PRODUCT_NAMES[purchase.product_id] || purchase.product_id}</td>
                    <td className="p-2">€{(PRODUCT_PRICES[purchase.product_id] || 0).toFixed(2)}</td>
                    <td className="p-2">
                      {purchase.expires_at ? (
                        new Date(purchase.expires_at) > new Date() ? (
                          <span className="text-green-500">Activo</span>
                        ) : (
                          <span className="text-red-500">Expirado</span>
                        )
                      ) : (
                        <span className="text-blue-500">Permanente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Users */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Usuarios Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha de Registro</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      {new Date(user.created_at).toLocaleString('es-ES')}
                    </td>
                    <td className="p-2">{user.display_name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                        onClick={() => { setSelectedUserId(user.id); setShowUserModal(true); }}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <UserDetailModal
          userId={selectedUserId}
          open={showUserModal}
          onClose={() => setShowUserModal(false)}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
};
