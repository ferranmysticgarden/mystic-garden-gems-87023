 import { useState, useEffect, useCallback } from 'react';
 
 /**
  * Interface para el estado guardado del juego antes de pagar
  */
 export interface PendingPurchaseState {
   levelId: number;
   moves: number;
   score: number;
   collected: Record<string, number>;
   productId: string;
   timestamp: number;
 }
 
 const STORAGE_KEY = 'pending_purchase_state';
 const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos
 
 /**
  * Hook para gestionar el estado del juego durante pagos con Stripe
  * Guarda el estado antes de ir a Stripe y lo restaura al volver
  */
 export const usePendingPurchase = () => {
   const [pendingState, setPendingState] = useState<PendingPurchaseState | null>(null);
   const [paymentSuccess, setPaymentSuccess] = useState(false);
 
   // Detectar si venimos de un pago exitoso
   useEffect(() => {
     const urlParams = new URLSearchParams(window.location.search);
     const paymentStatus = urlParams.get('payment');
     
     if (paymentStatus === 'success') {
       // Cargar estado guardado
       const savedState = loadPendingState();
       if (savedState) {
         setPendingState(savedState);
         setPaymentSuccess(true);
         console.log('[PendingPurchase] Estado restaurado tras pago:', savedState);
       }
       
       // Limpiar URL sin recargar
       const newUrl = window.location.pathname;
       window.history.replaceState({}, '', newUrl);
     } else if (paymentStatus === 'cancel') {
       // Limpiar estado si canceló
       clearPendingState();
       const newUrl = window.location.pathname;
       window.history.replaceState({}, '', newUrl);
     }
   }, []);
 
   // Guardar estado antes de ir a Stripe
   const savePendingState = useCallback((state: Omit<PendingPurchaseState, 'timestamp'>) => {
     const fullState: PendingPurchaseState = {
       ...state,
       timestamp: Date.now(),
     };
     localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
     console.log('[PendingPurchase] Estado guardado:', fullState);
   }, []);
 
   // Cargar estado guardado
   const loadPendingState = (): PendingPurchaseState | null => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (!saved) return null;
       
       const state: PendingPurchaseState = JSON.parse(saved);
       
       // Verificar que no haya expirado
       if (Date.now() - state.timestamp > EXPIRY_TIME) {
         clearPendingState();
         return null;
       }
       
       return state;
     } catch {
       return null;
     }
   };
 
   // Limpiar estado después de usarlo
   const clearPendingState = useCallback(() => {
     localStorage.removeItem(STORAGE_KEY);
     setPendingState(null);
     setPaymentSuccess(false);
     console.log('[PendingPurchase] Estado limpiado');
   }, []);
 
   return {
     pendingState,
     paymentSuccess,
     savePendingState,
     clearPendingState,
   };
 };