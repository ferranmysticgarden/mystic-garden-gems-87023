import { usePayment } from './usePayment';

/**
 * @deprecated Use usePayment instead. This hook is kept for backward compatibility.
 * usePayment handles both Stripe (web) and Google Play Billing (Android) automatically.
 */
export const useStripePayment = () => {
  const { createPayment, loading, isAndroid, isGooglePlayAvailable } = usePayment();

  return {
    createPayment,
    loading,
    // Legacy compatibility
    isAndroid,
    isGooglePlayAvailable,
  };
};