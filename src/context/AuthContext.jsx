import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const userRef = React.useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync ref with state
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let isInitialized = false;

    // STEP 1: Fast path — getSession() reads from localStorage INSTANTLY (no network).
    // This makes the app render immediately on page refresh.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      isInitialized = true;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // STEP 2: Listen for subsequent auth changes (login, logout, token refresh).
    // The isInitialized flag prevents this from firing a duplicate fetchProfile
    // right after the getSession() call completes on initial page load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isInitialized) return;

      if (session?.user) {
        // ONLY update and fetch if the user ID has actually changed 
        // This prevents "flicker" on tab focus when Supabase re-verifies session.
        if (session.user.id !== userRef.current?.id) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear state if it's a definitive sign-out event.
        // This prevents temporary sync nulls from kicking the user out.
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, we might be hitting a registration state.
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role || null,
      loading,
      login,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
