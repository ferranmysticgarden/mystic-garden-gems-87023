import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);

  const createPayment = async (productId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Debes iniciar sesión para realizar una compra');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId },
      });

      if (error) throw error;

      if (data?.url) {
        // Abrir Stripe Checkout en una nueva pestaña
        window.open(data.url, '_blank');
        toast.success('Redirigiendo a Stripe Checkout...');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error('Error al crear el pago: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    loading,
  };
};