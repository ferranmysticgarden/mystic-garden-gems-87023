import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Trash2, Shield } from 'lucide-react';

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const UserDetailModal = ({ userId, open, onClose, onRefresh }: UserDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [edits, setEdits] = useState<Record<string, any>>({});

  useEffect(() => {
    if (userId && open) loadDetail();
  }, [userId, open]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const loadDetail = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('admin-action', {
        headers,
        body: { action: 'get_user_detail', payload: { userId } },
      });
      if (error) throw error;
      setDetail(data);
      setEdits({});
    } catch (e: any) {
      toast.error('Error cargando datos: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (field: string, value: any) => {
    try {
      const headers = await getAuthHeaders();
      const { error } = await supabase.functions.invoke('admin-action', {
        headers,
        body: { action: 'update_progress', payload: { userId, field, value } },
      });
      if (error) throw error;
      toast.success(`${field} actualizado`);
      loadDetail();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const setRole = async (role: string) => {
    try {
      const headers = await getAuthHeaders();
      const { error } = await supabase.functions.invoke('admin-action', {
        headers,
        body: { action: 'set_role', payload: { userId, role } },
      });
      if (error) throw error;
      toast.success(`Rol cambiado a ${role}`);
      loadDetail();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const deleteUser = async () => {
    if (!confirm('¿ELIMINAR este usuario permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      const headers = await getAuthHeaders();
      const { error } = await supabase.functions.invoke('admin-action', {
        headers,
        body: { action: 'delete_user', payload: { userId } },
      });
      if (error) throw error;
      toast.success('Usuario eliminado');
      onClose();
      onRefresh();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (!confirm('¿Eliminar esta compra?')) return;
    try {
      const headers = await getAuthHeaders();
      const { error } = await supabase.functions.invoke('admin-action', {
        headers,
        body: { action: 'delete_purchase', payload: { purchaseId } },
      });
      if (error) throw error;
      toast.success('Compra eliminada');
      loadDetail();
      onRefresh();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const progressFields = [
    { key: 'gems', label: 'Gemas', type: 'number' },
    { key: 'lives', label: 'Vidas', type: 'number' },
    { key: 'current_level', label: 'Nivel', type: 'number' },
    { key: 'hammer_count', label: 'Martillos', type: 'number' },
    { key: 'undo_count', label: 'Deshacer', type: 'number' },
    { key: 'shuffle_count', label: 'Barajar', type: 'number' },
  ];

  const currentRole = detail?.roles?.length ? detail.roles[0].role : 'user';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {detail?.profile?.display_name || detail?.profile?.email || 'Usuario'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Info */}
            <div className="text-sm text-muted-foreground">
              <p>Email: {detail.profile?.email}</p>
              <p>Registro: {detail.profile?.created_at ? new Date(detail.profile.created_at).toLocaleString('es-ES') : '-'}</p>
            </div>

            {/* Progress edits */}
            <div>
              <h3 className="font-semibold mb-3">Progreso del juego</h3>
              <div className="grid grid-cols-2 gap-3">
                {progressFields.map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={edits[f.key] ?? detail.progress?.[f.key] ?? 0}
                        onChange={e => setEdits(prev => ({ ...prev, [f.key]: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-sm"
                      />
                      {edits[f.key] !== undefined && edits[f.key] !== detail.progress?.[f.key] && (
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => saveField(f.key, edits[f.key])}>
                          <Save className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <h3 className="font-semibold mb-2">Rol: <span className="text-primary">{currentRole}</span></h3>
              <div className="flex gap-2">
                {['user', 'moderator', 'admin'].map(r => (
                  <Button key={r} size="sm" variant={currentRole === r ? 'default' : 'outline'}
                    onClick={() => setRole(r)} className="text-xs capitalize">{r}</Button>
                ))}
              </div>
            </div>

            {/* Purchases */}
            <div>
              <h3 className="font-semibold mb-2">Compras ({detail.purchases?.length || 0})</h3>
              {detail.purchases?.length ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {detail.purchases.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                      <div>
                        <span className="font-medium">{p.product_id}</span>
                        <span className="text-muted-foreground ml-2">{new Date(p.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 px-1 text-destructive" onClick={() => deletePurchase(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">Sin compras</p>}
            </div>

            {/* Danger zone */}
            <div className="border-t pt-4">
              <Button variant="destructive" size="sm" onClick={deleteUser} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar usuario permanentemente
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
