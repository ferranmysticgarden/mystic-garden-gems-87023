import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useDeepLinks } from './useDeepLinks';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar deep links para apps nativas
  useDeepLinks();

  useEffect(() => {
    let mounted = true;

    // Failsafe: avoid getting stuck forever on loading state
    const failSafeId = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only sync state here (no other supabase calls)
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      window.clearTimeout(failSafeId);
    });

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        if (mounted) setLoading(false);
      })
      .finally(() => {
        window.clearTimeout(failSafeId);
      });

    return () => {
      mounted = false;
      window.clearTimeout(failSafeId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};
