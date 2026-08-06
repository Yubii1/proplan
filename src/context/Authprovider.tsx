// src/context/AuthProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ProfileType = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null; // from DB
  logo_url?: string | null;  // public URL from storage
};

type AuthContextType = {
  session: any;
  loading: boolean;
  profile: ProfileType | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (!error && data) {
        let logoUrl: string | null = null;

        if (data.avatar_url) {
          const { data: publicUrlData } = supabase.storage
            .from('user-logos')
            .getPublicUrl(data.avatar_url);
          logoUrl = publicUrlData?.publicUrl ?? null;
        }

        setProfile({ ...data, logo_url: logoUrl });
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
      setProfile(null);
    }
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
        ]);

        if (!mounted) return;

        if (sessionResult === null) {
          console.warn('Auth getSession timed out — clearing stale session');
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          return;
        }

        const {
          data: { session: initialSession },
        } = sessionResult;

        setSession(initialSession);
        if (initialSession?.user?.id) {
          // Don't block the splash/auth gate on profile fetch
          fetchProfile(initialSession.user.id);
        }
      } catch (e) {
        console.error('Auth init failed:', e);
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Never call getSession/getUser inside this callback — it deadlocks with initAuth.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession?.user?.id) {
          fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    const refreshInterval = setInterval(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error.message);
      } else if (data.session && mounted) {
        setSession(data.session);
      }
    }, 15 * 60 * 1000);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, loading, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
