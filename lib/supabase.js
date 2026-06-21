import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are provided
const hasCredentials = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here';

export const supabase = hasCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Simulated in-memory / localStorage DB for out-of-the-box fallback
const getMockData = (key, defaultData = []) => {
  if (typeof window === 'undefined') return defaultData;
  const data = localStorage.getItem(`coride_mock_${key}`);
  return data ? JSON.parse(data) : defaultData;
};

const setMockData = (key, data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`coride_mock_${key}`, JSON.stringify(data));
  }
};

// Seed initial mock data if empty
const seedMockData = () => {
  if (typeof window === 'undefined') return;
  
  const profiles = getMockData('profiles');
  const needsReseed = !localStorage.getItem('coride_mock_seeded') || (profiles.length > 0 && !profiles[0].password);

  if (needsReseed) {
    const mockProfiles = [
      { id: 'usr-1', email: 'alex@coride.io', password: 'password123', full_name: 'Alex Mercer', role: 'driver', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', rating: 4.9, trips_count: 42, is_verified: true, vehicle_info: 'Tesla Model 3 (Midnight Silver)' },
      { id: 'usr-2', email: 'sarah@coride.io', password: 'password123', full_name: 'Sarah Connor', role: 'passenger', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', rating: 4.8, trips_count: 15, is_verified: true, vehicle_info: null },
      { id: 'usr-3', email: 'marcus@coride.io', password: 'password123', full_name: 'Marcus Vance', role: 'driver', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80', rating: 4.7, trips_count: 28, is_verified: false, vehicle_info: 'Toyota Prius (Emerald Green)' },
      { id: 'usr-admin', email: 'admin@coride.io', password: 'password123', full_name: 'System Admin', role: 'admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', rating: 5.0, trips_count: 0, is_verified: true, vehicle_info: null }
    ];

    const mockTrips = [
      {
        id: 'trip-1',
        driver_id: 'usr-1',
        driver_name: 'Alex Mercer',
        driver_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        driver_rating: 4.9,
        origin: 'San Francisco Downtown',
        destination: 'Stanford University Campus',
        departure_time: new Date(Date.now() + 4 * 3600000).toISOString(), // 4 hours from now
        seats_available: 3,
        seats_total: 4,
        price: 8.50,
        preferences: { pets: true, smoking: false, music: 'Indie Rock', conversation: 'Friendly' },
        route_coordinates: [[37.7749, -122.4194], [37.6879, -122.4702], [37.5585, -122.3130], [37.4275, -122.1697]]
      },
      {
        id: 'trip-2',
        driver_id: 'usr-3',
        driver_name: 'Marcus Vance',
        driver_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        driver_rating: 4.7,
        origin: 'San Jose Airport (SJC)',
        destination: 'Stanford University Campus',
        departure_time: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours from now
        seats_available: 2,
        seats_total: 3,
        price: 6.00,
        preferences: { pets: false, smoking: false, music: 'Jazz', conversation: 'Quiet' },
        route_coordinates: [[37.3639, -121.9289], [37.4024, -122.0722], [37.4275, -122.1697]]
      }
    ];

    const mockBookings = [
      { id: 'book-1', trip_id: 'trip-1', passenger_id: 'usr-2', passenger_name: 'Sarah Connor', passenger_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', status: 'accepted', created_at: new Date(Date.now() - 24 * 3600000).toISOString() }
    ];

    const mockSubsidies = [
      { id: 'sub-1', driver_id: 'usr-1', trip_id: 'trip-completed-1', distance_km: 45, subsidy_amount: 11.25, status: 'approved', created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString() }
    ];

    const mockCampusRewards = {
      points: 120,
      reserved_spot: 'Lot B - Spot 12'
    };

    setMockData('profiles', mockProfiles);
    setMockData('trips', mockTrips);
    setMockData('bookings', mockBookings);
    setMockData('subsidies', mockSubsidies);
    setMockData('campus_rewards', mockCampusRewards);
    localStorage.setItem('coride_current_user_id', 'usr-2');
    localStorage.setItem('coride_mock_seeded', 'true');
  }
};

// Run seed immediately
if (typeof window !== 'undefined') {
  seedMockData();
}

// Mock DB operations mimicking supabase client queries
export const mockSupabase = {
  auth: {
    getUser: () => {
      if (typeof window === 'undefined') return { data: { user: null }, error: null };
      const currentUserId = localStorage.getItem('coride_current_user_id');
      if (!currentUserId) return { data: { user: null }, error: null };
      const profiles = getMockData('profiles');
      const userProfile = profiles.find(p => p.id === currentUserId);
      return { data: { user: userProfile ? { id: userProfile.id, email: userProfile.email, user_metadata: userProfile } : null }, error: null };
    },
    signInWithPassword: ({ email, password }) => {
      const profiles = getMockData('profiles');
      const profile = profiles.find(p => p.email === email);
      if (!profile) {
        return { data: null, error: new Error('User not found') };
      }
      if (profile.password && profile.password !== password) {
        return { data: null, error: new Error('Invalid password') };
      }
      localStorage.setItem('coride_current_user_id', profile.id);
      return { data: { user: { id: profile.id, email: profile.email, user_metadata: profile } }, error: null };
    },
    signUp: ({ email, password, options }) => {
      const profiles = getMockData('profiles');
      const newId = `usr-${Date.now()}`;
      const newProfile = {
        id: newId,
        email,
        password: password || 'password123',
        full_name: options?.data?.full_name || email.split('@')[0],
        role: options?.data?.role || 'passenger',
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=150&q=80`,
        rating: 5.0,
        trips_count: 0,
        is_verified: options?.data?.role === 'passenger', // auto-verify passengers
        vehicle_info: options?.data?.vehicle_info || null
      };
      profiles.push(newProfile);
      setMockData('profiles', profiles);
      localStorage.setItem('coride_current_user_id', newId);
      return { data: { user: { id: newId, email, user_metadata: newProfile } }, error: null };
    },
    signOut: () => {
      localStorage.removeItem('coride_current_user_id');
      return { error: null };
    },
    updateUser: async ({ data }) => {
      if (typeof window === 'undefined') return { data: null, error: null };
      const currentUserId = localStorage.getItem('coride_current_user_id');
      if (!currentUserId) return { data: null, error: new Error('Not logged in') };
      const profiles = getMockData('profiles');
      const updated = profiles.map(p => {
        if (p.id === currentUserId) {
          return { ...p, ...data };
        }
        return p;
      });
      setMockData('profiles', updated);
      const updatedProfile = updated.find(p => p.id === currentUserId);
      return { data: { user: { id: currentUserId, email: updatedProfile.email, user_metadata: updatedProfile } }, error: null };
    }
  },
  from: (table) => {
    return {
      select: (query = '*') => {
        const data = getMockData(table);
        let result = [...data];
        
        return {
          eq: (field, value) => {
            result = result.filter(item => item[field] === value);
            return {
              order: (orderField, { ascending = true } = {}) => {
                result.sort((a, b) => {
                  if (a[orderField] < b[orderField]) return ascending ? -1 : 1;
                  if (a[orderField] > b[orderField]) return ascending ? 1 : -1;
                  return 0;
                });
                return { data: result, error: null };
              },
              data: result,
              error: null
            };
          },
          order: (orderField, { ascending = true } = {}) => {
            result.sort((a, b) => {
              if (a[orderField] < b[orderField]) return ascending ? -1 : 1;
              if (a[orderField] > b[orderField]) return ascending ? 1 : -1;
              return 0;
            });
            return { data: result, error: null };
          },
          data: result,
          error: null
        };
      },
      insert: (newRecords) => {
        const data = getMockData(table);
        const formattedRecords = Array.isArray(newRecords) 
          ? newRecords.map(r => ({ id: `${table.slice(0,3)}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, created_at: new Date().toISOString(), ...r }))
          : [{ id: `${table.slice(0,3)}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, created_at: new Date().toISOString(), ...newRecords }];
          
        const updated = [...data, ...formattedRecords];
        setMockData(table, updated);
        return { data: formattedRecords, error: null };
      },
      update: (updates) => {
        return {
          eq: (field, value) => {
            const data = getMockData(table);
            const updated = data.map(item => {
              if (item[field] === value) {
                return { ...item, ...updates };
              }
              return item;
            });
            setMockData(table, updated);
            return { data: updated.filter(item => item[field] === value), error: null };
          }
        };
      },
      delete: () => {
        return {
          eq: (field, value) => {
            const data = getMockData(table);
            const filtered = data.filter(item => item[field] !== value);
            setMockData(table, filtered);
            return { error: null };
          }
        };
      }
    };
  }
};

// Utility to switch user profile in UI
export const switchCurrentUser = (userId) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('coride_current_user_id', userId);
  }
};
