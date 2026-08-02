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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (!error && data) {
      let logoUrl: string | null = null;

      // If user has avatar_url in DB, try to fetch the signed/public URL from storage
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
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: userData, error } = await supabase.auth.getUser();

        if (error || !userData.user) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        } else {
          setSession(session);
          await fetchProfile(session.user.id);
        }
      } else {
        setSession(null);
        setProfile(null);
      }

      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession) {
          const { data: userData, error } = await supabase.auth.getUser();
          if (error || !userData.user) {
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
          } else {
            setSession(newSession);
            await fetchProfile(newSession.user.id);
          }
        } else {
          setSession(null);
          setProfile(null);
        }
      }
    );

    // Refresh session every 15 minutes
    const refreshInterval = setInterval(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error.message);
      } else if (data.session) {
        setSession(data.session);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
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
