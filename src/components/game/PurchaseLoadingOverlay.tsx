import { useEffect, useState } from 'react';

/**
 * Global overlay that shows a spinner while a Google Play purchase is being processed.
 * Listens for custom events dispatched by usePayment.
 */
export const PurchaseLoadingOverlay = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    window.addEventListener('purchase_loading_start', show);
    window.addEventListener('purchase_loading_end', hide);

    return () => {
      window.removeEventListener('purchase_loading_start', show);
      window.removeEventListener('purchase_loading_end', hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-10 py-8 shadow-2xl border border-border">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg font-semibold text-foreground">Procesando compra…</p>
        <p className="text-sm text-muted-foreground">No cierres la app</p>
      </div>
    </div>
  );
};
