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
    await client.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const switchProfile = (userId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('coride_current_user_id', userId);
      loadUser();
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
      switchProfile,
      allProfiles,
      refreshUser: loadUser,
      refreshAllProfiles: loadAllProfiles
    }}>
      {children}
    </UserContext.Provider>
  );
};
