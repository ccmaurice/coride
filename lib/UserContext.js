'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockSupabase, supabase } from './supabase';

const UserContext = createContext({
  user: null,
  role: 'passenger',
  loading: true,
  login: async (email) => {},
  signup: async (email, full_name, role, vehicle_info) => {},
  logout: async () => {},
  switchProfile: (userId) => {},
  allProfiles: [],
  refreshUser: () => {},
  refreshAllProfiles: () => {}
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState([]);
  
  const client = supabase || mockSupabase;

  const loadUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await client.auth.getUser();
      if (data && data.user) {
        let dbProfile = {};
        if (supabase) {
          try {
            const { data: dbProf, error: dbError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
            if (dbProf && !dbError) {
              dbProfile = dbProf;
            }
          } catch (e) {
            console.error('Error fetching db profile:', e);
          }
        }
        setUser({
          id: data.user.id,
          email: data.user.email,
          ...(data.user.user_metadata || {}),
          ...dbProfile
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllProfiles = async () => {
    if (typeof window === 'undefined') return;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) {
          setAllProfiles(data);
        }
      } catch (e) {
        console.error('Error loading all profiles:', e);
      }
    } else {
      const stored = localStorage.getItem('coride_mock_profiles');
      if (stored) {
        setAllProfiles(JSON.parse(stored));
      }
    }
  };

  useEffect(() => {
    loadUser();
    loadAllProfiles();
    
    // Listen for storage changes to sync profiles
    const handleStorage = () => {
      loadAllProfiles();
      loadUser();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data && data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        ...(data.user.user_metadata || {})
      });
    }
    setLoading(false);
    return data;
  };

  const signup = async (email, password, full_name, role, vehicle_info) => {
    setLoading(true);
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
          vehicle_info
        }
      }
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data && data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        ...(data.user.user_metadata || {})
      });
    }
    loadAllProfiles();
    setLoading(false);
    return data;
  };

  const logout = async () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coride_current_user_id');
    }
    await client.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const switchProfile = async (userId) => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined') {
        if (supabase) {
          let email = '';
          if (userId === 'usr-1') email = 'alex@coride.io';
          else if (userId === 'usr-2') email = 'sarah@coride.io';
          else if (userId === 'usr-3') email = 'marcus@coride.io';
          else if (userId === 'usr-admin') email = 'admin@coride.io';
          
          if (email) {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password: 'password123'
            });
            if (error) {
              console.error('Failed to authenticate switched profile:', error);
            }
          }
        }
        localStorage.setItem('coride_current_user_id', userId);
        await loadUser();
        await loadAllProfiles();
      }
    } catch (err) {
      console.error('Error switching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      role: user?.role || 'passenger',
      loading,
      login,
      signup,
      logout,
      switchProfile: (uid) => switchProfile(uid),
      allProfiles,
      refreshUser: loadUser,
      refreshAllProfiles: loadAllProfiles
    }}>
      {children}
    </UserContext.Provider>
  );
};
