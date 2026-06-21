'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../../lib/UserContext';
import { calculateMatchScore } from '../../lib/matching';
import { supabase } from '../../lib/supabase';
import { 
  Search, 
  MapPin, 
  Plus, 
  DollarSign, 
  Award, 
  Check, 
  X, 
  UserCheck, 
  ShieldAlert, 
  Clock, 
  SlidersHorizontal,
  Compass,
  Map,
  Users,
  Car,
  Settings,
  Sparkles,
  Navigation,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Activity,
  Database,
  RefreshCw,
  Camera
} from 'lucide-react';

// Load MapComponent dynamically to prevent SSR errors (Leaflet accesses window object)
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] md:h-[450px] bg-brand-card rounded-2xl flex items-center justify-center border border-white/10">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-brand-cyan border-t-transparent animate-spin"></div>
        <p className="text-xs text-brand-text-muted">Initializing Map Engine...</p>
      </div>
    </div>
  )
});

function KYCForm({ user, triggerNotification, onVerified }) {
  const [kycFullName, setKycFullName] = useState(user?.full_name || '');
  const [kycDob, setKycDob] = useState('');
  const [kycIdType, setKycIdType] = useState('passport'); // passport | license | national_id
  const [kycIdNumber, setKycIdNumber] = useState('');
  const [kycIdFile, setKycIdFile] = useState('');
  const [kycIdFileName, setKycIdFileName] = useState('');

  const [kycLicenseNumber, setKycLicenseNumber] = useState('');
  const [kycLicenseExpiry, setKycLicenseExpiry] = useState('');
  const [kycLicenseFile, setKycLicenseFile] = useState('');
  const [kycLicenseFileName, setKycLicenseFileName] = useState('');
  const [kycVehicleModel, setKycVehicleModel] = useState('');
  const [kycLicensePlate, setKycLicensePlate] = useState('');
  
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const handleKycFileChange = (e, fileType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerNotification('Please select a file smaller than 2MB.', 'warning', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (fileType === 'id') {
        setKycIdFile(reader.result);
        setKycIdFileName(file.name);
      } else if (fileType === 'license') {
        setKycLicenseFile(reader.result);
        setKycLicenseFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteKYC = async (e) => {
    e.preventDefault();
    if (!kycFullName || !kycDob || !kycIdNumber || !kycIdFile) {
      triggerNotification('Please fill in all identity verification fields and upload your ID document.', 'warning', 'Incomplete Form');
      return;
    }

    const isDriver = user?.role === 'driver';
    if (isDriver) {
      if (!kycLicenseNumber || !kycLicenseExpiry || !kycLicenseFile || !kycVehicleModel || !kycLicensePlate) {
        triggerNotification('Drivers must provide driving license details and vehicle registration details.', 'warning', 'Incomplete Form');
        return;
      }
    }

    setSubmittingKyc(true);

    try {
      const vehicleInfoStr = isDriver ? `${kycVehicleModel} (${kycLicensePlate})` : null;

      if (supabase) {
        const updates = {
          full_name: kycFullName,
          is_verified: true,
          vehicle_info: vehicleInfoStr
        };

        const { error: profileErr } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (profileErr) throw profileErr;

        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            full_name: kycFullName,
            is_verified: true,
            vehicle_info: vehicleInfoStr
          }
        });

        if (authErr) throw authErr;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        const updated = profiles.map(p => {
          if (p.id === user.id) {
            return {
              ...p,
              full_name: kycFullName,
              is_verified: true,
              vehicle_info: vehicleInfoStr
            };
          }
          return p;
        });
        localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));
      }

      triggerNotification('KYC Verification approved! Your identity has been verified automatically.', 'success', 'Identity Verified');
      await onVerified();
      setSubmittingKyc(false);
    } catch (err) {
      console.error('Error submitting KYC:', err);
      triggerNotification(err.message || 'Failed to submit KYC verification.', 'warning', 'KYC Error');
      setSubmittingKyc(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-brand-cyan" /> Identity Verification (KYC)
        </h2>
        <p className="text-xs text-brand-text-muted mt-1">
          To comply with safety guidelines and start sharing rides, please verify your account. Your document details are processed securely and verified instantly.
        </p>
      </div>

      <form onSubmit={handleCompleteKYC} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Full Legal Name</label>
            <input 
              type="text" 
              value={kycFullName}
              onChange={(e) => setKycFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Date of Birth</label>
            <input 
              type="date" 
              value={kycDob}
              onChange={(e) => setKycDob(e.target.value)}
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-brand-cyan focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">ID Document Type</label>
            <select 
              value={kycIdType}
              onChange={(e) => setKycIdType(e.target.value)}
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-brand-cyan focus:outline-none"
            >
              <option value="passport">Passport</option>
              <option value="license">Driver's License</option>
              <option value="national_id">National ID Card</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">ID Document Number</label>
            <input 
              type="text" 
              value={kycIdNumber}
              onChange={(e) => setKycIdNumber(e.target.value)}
              placeholder="A12345678"
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1.5">Upload Official ID Photo</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer">
              <span>Select ID Image</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleKycFileChange(e, 'id')}
                className="hidden" 
              />
            </label>
            <span className="text-xs text-brand-text-muted truncate">
              {kycIdFileName || 'No file selected (under 2MB)'}
            </span>
          </div>
          {kycIdFile && (
            <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
              <img src={kycIdFile} alt="ID preview" className="object-cover w-full h-full" />
            </div>
          )}
        </div>

        {user?.role === 'driver' && (
          <div className="border-t border-white/5 pt-5 flex flex-col gap-5 animate-fade-in">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Driver Vetting Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Driving License Number</label>
                <input 
                  type="text" 
                  value={kycLicenseNumber}
                  onChange={(e) => setKycLicenseNumber(e.target.value)}
                  placeholder="DL-99887766"
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">License Expiry Date</label>
                <input 
                  type="date" 
                  value={kycLicenseExpiry}
                  onChange={(e) => setKycLicenseExpiry(e.target.value)}
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-brand-cyan focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1.5">Upload Driving License Photo</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer">
                  <span>Select License Image</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleKycFileChange(e, 'license')}
                    className="hidden" 
                  />
                </label>
                <span className="text-xs text-brand-text-muted truncate">
                  {kycLicenseFileName || 'No file selected (under 2MB)'}
                </span>
              </div>
              {kycLicenseFile && (
                <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
                  <img src={kycLicenseFile} alt="License preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>

            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-t border-white/5 pt-5">Vehicle Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Vehicle Model & Year</label>
                <input 
                  type="text" 
                  value={kycVehicleModel}
                  onChange={(e) => setKycVehicleModel(e.target.value)}
                  placeholder="Tesla Model Y (2024)"
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">License Plate Number</label>
                <input 
                  type="text" 
                  value={kycLicensePlate}
                  onChange={(e) => setKycLicensePlate(e.target.value)}
                  placeholder="7XYZ88"
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submittingKyc}
          className="w-full mt-4 py-3 rounded-xl bg-brand-cyan text-brand-dark font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-cyan/10 disabled:opacity-50 btn-glow-cyan"
        >
          {submittingKyc ? (
            <div className="w-5 h-5 rounded-full border-2 border-brand-dark border-t-transparent animate-spin"></div>
          ) : (
            <>
              <Check className="w-4 h-4" /> Submit & Verify Automatically
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { user, role, switchProfile, allProfiles, loading, refreshUser, refreshAllProfiles, logout } = useUser();

  // State Management
  const [activeTab, setActiveTab] = useState('passenger'); // passenger | driver | admin
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  
  // Passenger Filters
  const [petFriendlyFilter, setPetFriendlyFilter] = useState(false);
  const [musicFilter, setMusicFilter] = useState('');
  const [smokingFilter, setSmokingFilter] = useState(false);

  // Driver Posted Trip Form State
  const [postOrigin, setPostOrigin] = useState('');
  const [postDestination, setPostDestination] = useState('');
  const [postTime, setPostTime] = useState('');
  const [postPrice, setPostPrice] = useState('8.00');
  const [postSeats, setPostSeats] = useState('4');
  const [postPets, setPostPets] = useState(false);
  const [postSmoking, setPostSmoking] = useState(false);
  const [postMusic, setPostMusic] = useState('Pop / Top40');
  const [postConversation, setPostConversation] = useState('Friendly');

  // Application Data (Simulated DB tables synced to LocalStorage)
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [subsidies, setSubsidies] = useState([]);
  const [campusRewards, setCampusRewards] = useState({ points: 0, reserved_spot: null });

  // Map & Live Tracking State
  const [activeRouteCoordinates, setActiveRouteCoordinates] = useState([]);
  const [selectedTripForMap, setSelectedTripForMap] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);

  // Toast Notification State
  const [toasts, setToasts] = useState([]);
  const [simulatorActive, setSimulatorActive] = useState(true);

  // Admin User Directory Filters
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('all'); // all | driver | passenger | admin
  const [adminStatusFilter, setAdminStatusFilter] = useState('all'); // all | verified | unverified | banned

  // Ride & Commuter Rating State
  const [activeRatingItem, setActiveRatingItem] = useState(null); // The completed ride item being rated
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Helper to add toast notification
  const triggerNotification = (message, type = 'success', title = 'Notification') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerNotification('Please select an image smaller than 2MB.', 'warning', 'File Too Large');
      return;
    }

    setUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;

        if (supabase) {
          // 1. Live Mode (Supabase)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ avatar: base64String })
            .eq('id', user.id);

          if (profileError) throw profileError;

          const { error: authError } = await supabase.auth.updateUser({
            data: { avatar: base64String }
          });

          if (authError) throw authError;
        } else {
          // 2. Mock Mode (Local Storage)
          const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
          const updated = profiles.map(p => {
            if (p.id === user.id) {
              return { ...p, avatar: base64String };
            }
            return p;
          });
          localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));

          // Sync avatar across mock trips
          const storedTrips = localStorage.getItem('coride_mock_trips');
          if (storedTrips) {
            const tripsObj = JSON.parse(storedTrips);
            const updatedTrips = tripsObj.map(t => {
              if (t.driver_id === user.id) return { ...t, driver_avatar: base64String };
              return t;
            });
            localStorage.setItem('coride_mock_trips', JSON.stringify(updatedTrips));
          }

          // Sync avatar across mock bookings
          const storedBookings = localStorage.getItem('coride_mock_bookings');
          if (storedBookings) {
            const bookingsObj = JSON.parse(storedBookings);
            const updatedBookings = bookingsObj.map(b => {
              if (b.passenger_id === user.id) return { ...b, passenger_avatar: base64String };
              return b;
            });
            localStorage.setItem('coride_mock_bookings', JSON.stringify(updatedBookings));
          }

          loadData();
        }

        await refreshUser();
        triggerNotification('Your profile picture has been updated successfully.', 'success', 'Avatar Updated');
        setUploadingAvatar(false);
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      triggerNotification(err.message || 'Failed to update avatar image.', 'warning', 'Upload Error');
      setUploadingAvatar(false);
    }
  };

  // Sync Search Query from Home Page URL
  useEffect(() => {
    const origin = searchParams.get('origin');
    const dest = searchParams.get('destination');
    const tab = searchParams.get('tab');
    
    if (origin) setOriginQuery(origin);
    if (dest) setDestQuery(dest);
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Check for pending ratings on load or user changes
  useEffect(() => {
    if (user) {
      checkForPendingRatings();
    }
  }, [user]);

  // Load datasets from mock DB
  const loadData = () => {
    if (typeof window === 'undefined') return;
    const storedTrips = localStorage.getItem('coride_mock_trips');
    const storedBookings = localStorage.getItem('coride_mock_bookings');
    const storedSubsidies = localStorage.getItem('coride_mock_subsidies');
    const storedRewards = localStorage.getItem('coride_mock_campus_rewards');

    if (storedTrips) setTrips(JSON.parse(storedTrips));
    if (storedBookings) setBookings(JSON.parse(storedBookings));
    if (storedSubsidies) setSubsidies(JSON.parse(storedSubsidies));
    if (storedRewards) setCampusRewards(JSON.parse(storedRewards));
  };

  // Sync local data across tabs / switch events
  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Refresh tab role if user profile is swapped in Navbar
    if (user) {
      if (user.role === 'admin') setActiveTab('admin');
      else if (user.role === 'driver') setActiveTab('driver');
      else setActiveTab('passenger');
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // 📡 REAL-TIME UPDATE CHANNEL (PHYSICAL SUPABASE CONNECTION)
  useEffect(() => {
    if (!supabase) return; // Skip if in mock mode

    // Subscribe to real-time PG changes for Bookings, Trips, and Subsidies
    const bookingsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          loadData();
          if (payload.eventType === 'INSERT') {
            const booking = payload.new;
            if (user && user.role === 'driver') {
              triggerNotification(
                `New passenger booking request received for your trip.`,
                'info',
                'Booking Request'
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const booking = payload.new;
            if (user && booking.passenger_id === user.id) {
              triggerNotification(
                `Your booking status was updated to: ${booking.status.toUpperCase()}`,
                booking.status === 'accepted' ? 'success' : 'warning',
                'Booking Update'
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trips' },
        (payload) => {
          loadData();
          triggerNotification(
            `A new trip from ${payload.new.origin} to ${payload.new.destination} was just posted.`,
            'info',
            'New Trip Posted'
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, [user]);

  const triggerSimulatedEvent = () => {
    if (!user) return;

    const eventType = Math.floor(Math.random() * 4); // 0, 1, 2, 3
    const mockNames = ['Emily Chen', 'Professor Miller', 'John Connor', 'Liam Stark', 'Sophia Davis'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];

    if (eventType === 0) {
      // EVENT: A driver posts a new commute route
      const latOffset = (Math.random() - 0.5) * 0.08;
      const newMockTrip = {
        id: `trip-sim-${Date.now()}`,
        driver_id: 'usr-sim-driver',
        driver_name: randomName,
        driver_avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
        driver_rating: 4.8,
        origin: 'East Bay Berkeley Office',
        destination: 'Stanford University Campus',
        departure_time: new Date(Date.now() + 6 * 3600000).toISOString(),
        seats_available: 3,
        seats_total: 4,
        price: 9.00,
        preferences: { pets: true, smoking: false, music: 'Lo-Fi Beats', conversation: 'Flexible' },
        route_coordinates: [[37.8715, -122.2730], [37.6879 + latOffset, -122.4702], [37.4275, -122.1697]]
      };

      const currentTrips = JSON.parse(localStorage.getItem('coride_mock_trips') || '[]');
      const updated = [...currentTrips, newMockTrip];
      localStorage.setItem('coride_mock_trips', JSON.stringify(updated));
      loadData();

      triggerNotification(
        `🚗 ${randomName} just posted a new commute: Berkeley to Stanford!`,
        'info',
        'Live Route Added'
      );
    } 
    else if (eventType === 1 && user.role === 'driver') {
      // EVENT: A passenger requests a booking on the driver's active trip
      const activeDriverTrips = trips.filter(t => t.driver_id === user.id);
      if (activeDriverTrips.length > 0) {
        const randomTrip = activeDriverTrips[Math.floor(Math.random() * activeDriverTrips.length)];
        
        // Check if passenger already has a booking
        const existing = bookings.some(b => b.trip_id === randomTrip.id && b.passenger_name === randomName);
        if (!existing) {
          const newMockBooking = {
            id: `book-sim-${Date.now()}`,
            trip_id: randomTrip.id,
            passenger_id: `usr-sim-pass-${Date.now()}`,
            passenger_name: randomName,
            passenger_avatar: `https://images.unsplash.com/photo-${1544005313 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
            status: 'pending',
            created_at: new Date().toISOString()
          };

          const currentBookings = JSON.parse(localStorage.getItem('coride_mock_bookings') || '[]');
          const updated = [...currentBookings, newMockBooking];
          localStorage.setItem('coride_mock_bookings', JSON.stringify(updated));
          loadData();

          triggerNotification(
            `🔔 Passenger ${randomName} requested a seat on your commute to ${randomTrip.destination}.`,
            'info',
            'Booking Requested'
          );
        }
      }
    } 
    else if (eventType === 2 && user.role === 'admin') {
      // EVENT: A new driver registers for vetting
      const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
      const alreadyPending = profiles.some(p => p.email === 'pending-vet@coride.io');
      
      if (!alreadyPending) {
        const newPendingProfile = {
          id: `usr-sim-vet-${Date.now()}`,
          email: 'pending-vet@coride.io',
          full_name: `${randomName} (Classmate)`,
          role: 'driver',
          avatar: `https://images.unsplash.com/photo-${1506794778202 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
          rating: 5.0,
          trips_count: 0,
          is_verified: false,
          vehicle_info: 'Chevrolet Volt (White)'
        };
        profiles.push(newPendingProfile);
        localStorage.setItem('coride_mock_profiles', JSON.stringify(profiles));
        loadData();

        triggerNotification(
          `🛡️ ${randomName} registered a vehicle. Background vetting check pending approval!`,
          'warning',
          'Safety Vetting Queue'
        );
      }
    }
    else if (eventType === 3 && user.role === 'driver') {
      // EVENT: Admin audits and approves driver's pending subsidy claim
      const pendingClaims = subsidies.filter(s => s.driver_id === user.id && s.status === 'pending');
      if (pendingClaims.length > 0) {
        const randomClaim = pendingClaims[0];
        
        const currentSubsidies = JSON.parse(localStorage.getItem('coride_mock_subsidies') || '[]');
        const updated = currentSubsidies.map(s => {
          if (s.id === randomClaim.id) return { ...s, status: 'approved' };
          return s;
        });
        localStorage.setItem('coride_mock_subsidies', JSON.stringify(updated));
        loadData();

        triggerNotification(
          `💵 Admin audited and APPROVED your $${randomClaim.subsidy_amount.toFixed(2)} Nabogo subsidy payout!`,
          'success',
          'Subsidy Disbursed'
        );
      }
    }
  };

  // 🤖 REAL-TIME EVENT SIMULATOR (MOCK MODE WORKSPACE ENGINE)
  // Simulates dynamic commuter activity in the background every 18 seconds
  useEffect(() => {
    if (supabase || !simulatorActive) return; // Disable simulator if physical Supabase is connected or simulator inactive

    const interval = setInterval(() => {
      triggerSimulatedEvent();
    }, 18000);

    return () => clearInterval(interval);
  }, [user, trips, bookings, subsidies, simulatorActive]);

  const updateLocalStorage = (key, data) => {
    localStorage.setItem(`coride_mock_${key}`, JSON.stringify(data));
    loadData(); // Reload UI state
  };

  // PASSENGER: Request Booking
  const handleBookTrip = (tripId) => {
    if (!user) {
      triggerNotification('Please sign in to book a ride.', 'warning', 'Authentication Needed');
      return;
    }
    
    const existing = bookings.find(b => b.trip_id === tripId && b.passenger_id === user.id);
    if (existing) {
      triggerNotification('You have already requested a booking for this trip.', 'info', 'Booking Exists');
      return;
    }

    const newBooking = {
      id: `book-${Date.now()}`,
      trip_id: tripId,
      passenger_id: user.id,
      passenger_name: user.full_name,
      passenger_avatar: user.avatar,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const updated = [...bookings, newBooking];
    updateLocalStorage('bookings', updated);
    
    triggerNotification('Booking request submitted. The driver has been alerted!', 'success', 'Request Sent');

    // MOCK REAL-TIME RESPONSE AFTER 5 SECONDS:
    // Simulated Driver auto-accepts passenger to demonstrate tracking notification!
    setTimeout(() => {
      const targetTrip = trips.find(t => t.id === tripId);
      triggerNotification(
        `Driver ${targetTrip?.driver_name || 'Alex Mercer'} accepted your booking for ${targetTrip?.destination || 'Stanford'}. Real-time tracking is now available!`,
        'success',
        'Booking Accepted 🚗'
      );
      
      const freshBookings = JSON.parse(localStorage.getItem('coride_mock_bookings') || '[]');
      const finalBookings = freshBookings.map(b => {
        if (b.trip_id === tripId && b.passenger_id === user.id) {
          if (targetTrip && targetTrip.seats_available > 0) {
            targetTrip.seats_available -= 1;
            localStorage.setItem('coride_mock_trips', JSON.stringify(trips));
          }
          return { ...b, status: 'accepted' };
        }
        return b;
      });
      localStorage.setItem('coride_mock_bookings', JSON.stringify(finalBookings));
      loadData();
    }, 5000);
  };

  // DRIVER: Post new trip
  const handlePostTrip = (e) => {
    e.preventDefault();
    if (!postOrigin || !postDestination || !postTime) {
      triggerNotification('Please specify the route start, destination, and departure time.', 'warning', 'Invalid Input');
      return;
    }

    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    const routeCoords = [
      [37.7749, -122.4194],
      [37.6213 + latOffset, -122.3790 + lngOffset],
      [37.4852 + latOffset, -122.2364 + lngOffset],
      [37.4275, -122.1697]
    ];

    const newTrip = {
      id: `trip-${Date.now()}`,
      driver_id: user.id,
      driver_name: user.full_name,
      driver_avatar: user.avatar,
      driver_rating: user.rating,
      origin: postOrigin,
      destination: postDestination,
      departure_time: new Date(postTime).toISOString(),
      seats_available: parseInt(postSeats),
      seats_total: parseInt(postSeats),
      price: parseFloat(postPrice),
      preferences: {
        pets: postPets,
        smoking: postSmoking,
        music: postMusic,
        conversation: postConversation
      },
      route_coordinates: routeCoords
    };

    const updatedTrips = [...trips, newTrip];
    updateLocalStorage('trips', updatedTrips);

    setPostOrigin('');
    setPostDestination('');
    setPostTime('');
    
    triggerNotification('Your commute route has been published to the community feed!', 'success', 'Trip Posted');
  };

  // DRIVER: Manage Bookings (Accept/Reject)
  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        if (newStatus === 'accepted') {
          const booking = bookings.find(x => x.id === bookingId);
          const targetTrip = trips.find(t => t.id === booking.trip_id);
          if (targetTrip && targetTrip.seats_available > 0) {
            targetTrip.seats_available -= 1;
            updateLocalStorage('trips', trips);
            
            const updatedRewards = {
              ...campusRewards,
              points: campusRewards.points + 25
            };
            updateLocalStorage('campus_rewards', updatedRewards);
            triggerNotification('You earned 25 campus priority points for carpooling with a peer!', 'success', 'Campus Priority Points');
          }
        }
        return { ...b, status: newStatus };
      }
      return b;
    });
    updateLocalStorage('bookings', updatedBookings);
    
    triggerNotification(
      `Passenger booking request has been ${newStatus}.`, 
      newStatus === 'accepted' ? 'success' : 'warning', 
      `Booking ${newStatus === 'accepted' ? 'Accepted' : 'Declined'}`
    );
  };

  // DRIVER: Complete Ride & Claim Nabogo Subsidy
  const handleCompleteRide = async (trip) => {
    const distanceKm = 45;
    const amount = (distanceKm * 0.25).toFixed(2);
    
    // Create subsidy claim
    const newSubsidy = {
      id: `sub-${Date.now()}`,
      driver_id: user.id,
      trip_id: trip.id,
      distance_km: distanceKm,
      subsidy_amount: parseFloat(amount),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Find bookings associated with this trip
    const tripBookings = bookings.filter(b => b.trip_id === trip.id && b.status === 'accepted');

    // Create completed ride records for ratings
    const completedRecords = tripBookings.map(b => ({
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trip_id: trip.id,
      driver_id: trip.driver_id,
      driver_name: trip.driver_name,
      driver_avatar: trip.driver_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      passenger_id: b.passenger_id,
      passenger_name: b.passenger_name,
      passenger_avatar: b.passenger_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      destination: trip.destination,
      departure_time: trip.departure_time,
      rated_by_passenger: false,
      rated_by_driver: false
    }));

    if (supabase) {
      try {
        const { error: subErr } = await supabase.from('subsidies').insert(newSubsidy);
        if (subErr) throw subErr;

        if (completedRecords.length > 0) {
          const { error: compErr } = await supabase.from('completed_rides').insert(completedRecords.map(r => ({
            trip_id: r.trip_id,
            driver_id: r.driver_id,
            driver_name: r.driver_name,
            driver_avatar: r.driver_avatar,
            passenger_id: r.passenger_id,
            passenger_name: r.passenger_name,
            passenger_avatar: r.passenger_avatar,
            destination: r.destination,
            departure_time: r.departure_time,
            rated_by_passenger: false,
            rated_by_driver: false
          })));
          if (compErr) throw compErr;
        }

        const { error: tripErr } = await supabase.from('trips').delete().eq('id', trip.id);
        if (tripErr) throw tripErr;

      } catch (err) {
        console.error('Error completing live ride:', err);
        triggerNotification('Failed to complete ride on server.', 'warning', 'Error');
        return;
      }
    } else {
      const currentSubsidies = [...subsidies, newSubsidy];
      localStorage.setItem('coride_mock_subsidies', JSON.stringify(currentSubsidies));
      setSubsidies(currentSubsidies);

      const existingCompleted = JSON.parse(localStorage.getItem('coride_mock_completed_rides') || '[]');
      const updatedCompleted = [...existingCompleted, ...completedRecords];
      localStorage.setItem('coride_mock_completed_rides', JSON.stringify(updatedCompleted));

      const updatedTrips = trips.filter(t => t.id !== trip.id);
      localStorage.setItem('coride_mock_trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
    }

    triggerNotification(
      `Trip completed! Nabogo subsidy claim of $${amount} submitted for municipal verification.`,
      'success',
      'Subsidy Submitted'
    );

    loadData();
    checkForPendingRatings();
  };

  // ADMIN: Vetting Drivers
  const handleVerifyDriver = async (driverId) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', driverId);
        if (error) throw error;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        const updated = profiles.map(p => {
          if (p.id === driverId) {
            return { ...p, is_verified: true };
          }
          return p;
        });
        localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));
      }
      
      triggerNotification('Driver credentials reviewed and status set to Verified!', 'success', 'Vetting Approved');
      await refreshAllProfiles();
      loadData();
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to verify driver.', 'warning', 'Admin Error');
    }
  };

  // ADMIN: Approve Subsidies
  const handleApproveSubsidy = (subsidyId) => {
    const updated = subsidies.map(s => {
      if (s.id === subsidyId) return { ...s, status: 'approved' };
      return s;
    });
    updateLocalStorage('subsidies', updated);
    
    triggerNotification('Subsidy audit approved. Municipal funds disbursed!', 'success', 'Subsidy Audited');
  };

  // ADMIN ACTIONS: Toggle Verification
  const handleToggleVerify = async (profileId, currentStatus) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: !currentStatus })
          .eq('id', profileId);
        if (error) throw error;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        const updated = profiles.map(p => {
          if (p.id === profileId) return { ...p, is_verified: !currentStatus };
          return p;
        });
        localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));
      }
      triggerNotification(`User verification status updated.`, 'success', 'Admin Action');
      await refreshAllProfiles();
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to update verification.', 'warning', 'Admin Error');
    }
  };

  // ADMIN ACTIONS: Toggle Ban
  const handleToggleBan = async (profileId, currentStatus) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_banned: !currentStatus })
          .eq('id', profileId);
        if (error) throw error;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        const updated = profiles.map(p => {
          if (p.id === profileId) return { ...p, is_banned: !currentStatus };
          return p;
        });
        localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));
      }
      triggerNotification(`User account has been ${!currentStatus ? 'suspended (banned)' : 'restored'}.`, 'success', 'Admin Action');
      await refreshAllProfiles();
      
      if (profileId === user.id) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to update ban status.', 'warning', 'Admin Error');
    }
  };

  // ADMIN ACTIONS: Edit User Role
  const handleUpdateUserRole = async (profileId, newRole) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', profileId);
        if (error) throw error;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        const updated = profiles.map(p => {
          if (p.id === profileId) return { ...p, role: newRole };
          return p;
        });
        localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));
      }
      triggerNotification(`User role updated to ${newRole}.`, 'success', 'Admin Action');
      await refreshAllProfiles();
      
      if (profileId === user.id) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to update user role.', 'warning', 'Admin Error');
    }
  };

  // ADMIN ACTIONS: Delete User Profile
  const handleDeleteUserProfile = async (profileId, email) => {
    if (!confirm(`Are you sure you want to permanently delete profile for ${email}? This action is irreversible.`)) {
      return;
    }
    try {
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profileId);
        if (error) throw error;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        const updated = profiles.filter(p => p.id !== profileId);
        localStorage.setItem('coride_mock_profiles', JSON.stringify(updated));
      }
      triggerNotification(`User profile for ${email} has been permanently deleted.`, 'success', 'Admin Action');
      await refreshAllProfiles();
      
      if (profileId === user.id) {
        logout();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to delete user profile.', 'warning', 'Admin Error');
    }
  };

  const checkForPendingRatings = async () => {
    if (!user) return;
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('completed_rides')
          .select('*')
          .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`);
        
        if (data && !error) {
          const pending = data.find(r => 
            (r.passenger_id === user.id && !r.rated_by_passenger) ||
            (r.driver_id === user.id && !r.rated_by_driver)
          );
          if (pending) {
            setActiveRatingItem(pending);
            setRatingStars(5);
            setRatingComment('');
          } else {
            setActiveRatingItem(null);
          }
        }
      } catch (e) {
        console.error('Error checking live ratings:', e);
      }
    } else {
      const completed = JSON.parse(localStorage.getItem('coride_mock_completed_rides') || '[]');
      const pending = completed.find(r => 
        (r.passenger_id === user.id && !r.rated_by_passenger) ||
        (r.driver_id === user.id && !r.rated_by_driver)
      );
      if (pending) {
        setActiveRatingItem(pending);
        setRatingStars(5);
        setRatingComment('');
      } else {
        setActiveRatingItem(null);
      }
    }
  };

  const handleSkipRating = async () => {
    if (!activeRatingItem) return;
    
    const isPassenger = user.id === activeRatingItem.passenger_id;
    const updates = isPassenger ? { rated_by_passenger: true } : { rated_by_driver: true };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('completed_rides')
          .update(updates)
          .eq('id', activeRatingItem.id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
      }
    } else {
      const completed = JSON.parse(localStorage.getItem('coride_mock_completed_rides') || '[]');
      const updated = completed.map(r => {
        if (r.id === activeRatingItem.id) {
          return { ...r, ...updates };
        }
        return r;
      });
      localStorage.setItem('coride_mock_completed_rides', JSON.stringify(updated));
    }
    
    triggerNotification('Rating skipped.', 'info', 'Feedback');
    setActiveRatingItem(null);
    checkForPendingRatings();
  };

  const handleSubmitRating = async () => {
    if (!activeRatingItem) return;

    const isPassenger = user.id === activeRatingItem.passenger_id;
    const targetUserId = isPassenger ? activeRatingItem.driver_id : activeRatingItem.passenger_id;
    const updates = isPassenger ? { rated_by_passenger: true } : { rated_by_driver: true };

    try {
      if (supabase) {
        const { error } = await supabase
          .from('completed_rides')
          .update(updates)
          .eq('id', activeRatingItem.id);
        if (error) throw error;
      } else {
        const completed = JSON.parse(localStorage.getItem('coride_mock_completed_rides') || '[]');
        const updated = completed.map(r => {
          if (r.id === activeRatingItem.id) {
            return { ...r, ...updates };
          }
          return r;
        });
        localStorage.setItem('coride_mock_completed_rides', JSON.stringify(updated));
      }

      let targetProfile = null;
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();
        if (data && !error) targetProfile = data;
      } else {
        const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
        targetProfile = profiles.find(p => p.id === targetUserId);
      }

      if (targetProfile) {
        const currentRating = parseFloat(targetProfile.rating || 5.0);
        const currentCount = parseInt(targetProfile.trips_count || 0);
        const newCount = currentCount + 1;
        const newRating = parseFloat(((currentRating * currentCount) + ratingStars) / newCount).toFixed(2);

        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .update({
              rating: parseFloat(newRating),
              trips_count: newCount
            })
            .eq('id', targetUserId);
          if (error) throw error;
        } else {
          const profiles = JSON.parse(localStorage.getItem('coride_mock_profiles') || '[]');
          const updatedProfiles = profiles.map(p => {
            if (p.id === targetUserId) {
              return { ...p, rating: parseFloat(newRating), trips_count: newCount };
            }
            return p;
          });
          localStorage.setItem('coride_mock_profiles', JSON.stringify(updatedProfiles));
        }

        triggerNotification(`Thank you! Rating of ${ratingStars} ★ submitted.`, 'success', 'Rating Submitted');
      }

      await refreshAllProfiles();
      await refreshUser();
      loadData();
      setActiveRatingItem(null);
      
      setTimeout(() => {
        checkForPendingRatings();
      }, 500);
    } catch (err) {
      console.error('Error submitting rating:', err);
      triggerNotification(err.message || 'Failed to submit rating.', 'warning', 'Rating Error');
    }
  };

  // Setup view for map tracking when passenger has accepted trip
  const handleTrackTrip = (trip, booking) => {
    setSelectedTripForMap(trip);
    setActiveRouteCoordinates(trip.route_coordinates);
    setTrackingActive(true);
    triggerNotification('Live satellite GPS tracking initialized.', 'info', 'GPS Running');
  };

  const getMatchingTrips = () => {
    return trips
      .map(trip => {
        const score = calculateMatchScore(trip, {
          origin: originQuery,
          destination: destQuery,
          preferences: {
            pets: petFriendlyFilter ? true : undefined,
            smoking: smokingFilter ? true : undefined,
            music: musicFilter || undefined
          }
        });
        return { ...trip, matchScore: score };
      })
      .filter(trip => {
        if (originQuery && !trip.origin.toLowerCase().includes(originQuery.toLowerCase()) && !originQuery.toLowerCase().includes(trip.origin.toLowerCase())) {
          return false;
        }
        if (destQuery && !trip.destination.toLowerCase().includes(destQuery.toLowerCase()) && !destQuery.toLowerCase().includes(trip.destination.toLowerCase())) {
          return false;
        }
        if (petFriendlyFilter && !trip.preferences?.pets) {
          return false;
        }
        if (smokingFilter && !trip.preferences?.smoking) {
          return false;
        }
        if (musicFilter && trip.preferences?.music !== musicFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const matchingTrips = getMatchingTrips();
  const userBookings = bookings.filter(b => b.passenger_id === user?.id);
  const driverTrips = trips.filter(t => t.driver_id === user?.id);
  
  const driverPendingBookings = bookings.filter(b => 
    b.status === 'pending' && 
    trips.some(t => t.id === b.trip_id && t.driver_id === user?.id)
  );

  const filteredProfiles = allProfiles.filter(p => {
    const matchesSearch = !adminSearchQuery || 
                          p.full_name?.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
                          p.email?.toLowerCase().includes(adminSearchQuery.toLowerCase());
    
    const matchesRole = adminRoleFilter === 'all' || p.role === adminRoleFilter;
    
    let matchesStatus = true;
    if (adminStatusFilter === 'verified') matchesStatus = p.is_verified && !p.is_banned;
    else if (adminStatusFilter === 'unverified') matchesStatus = !p.is_verified && !p.is_banned;
    else if (adminStatusFilter === 'banned') matchesStatus = p.is_banned;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-dark min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-brand-cyan border-t-transparent animate-spin"></div>
          <p className="text-xs text-brand-text-muted">Loading your CoRide Dashboard...</p>
        </div>
      </div>
    );
  }

  if (user && user.is_banned) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-dark min-h-[70vh] px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="glass-panel max-w-md w-full rounded-2xl p-8 border border-red-500/20 text-center flex flex-col items-center gap-4 bg-red-500/5 relative z-10 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Account Suspended</h1>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Your CoRide account has been suspended by a platform administrator for violating community guidelines.
          </p>
          <button 
            onClick={() => logout()}
            className="w-full mt-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-dark min-h-[70vh] px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-white/10 text-center relative z-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-6 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-lock text-brand-cyan"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Access Restricted</h2>
          <p className="text-xs text-brand-text-muted leading-relaxed mb-6">
            Please sign in or register a CoRide account to view your carpooling matches, post new commutes, and request bookings.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/login" 
              className="w-full py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-brand-dark font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg btn-glow-cyan"
            >
              Sign In to CoRide
            </Link>
            <Link 
              href="/" 
              className="text-xs text-brand-text-muted hover:text-white transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
      
      {/* TOAST SYSTEM RENDERING ENGINE */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl border shadow-2xl flex gap-3 pointer-events-auto animate-slide-in relative overflow-hidden transition-all ${
              t.type === 'success' ? 'bg-brand-emerald/10 border-brand-emerald/30 text-white' :
              t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-white' :
              t.type === 'info' ? 'bg-brand-cyan/10 border-brand-cyan/30 text-white' :
              'bg-brand-card/90 border-white/10 text-white'
            }`}
          >
            <div className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shrink-bar ${
              t.type === 'success' ? 'bg-brand-emerald' :
              t.type === 'warning' ? 'bg-amber-500' :
              t.type === 'info' ? 'bg-brand-cyan' :
              'bg-brand-purple'
            }`} />

            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-brand-emerald" />}
              {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-brand-cyan" />}
            </div>
            
            <div className="flex-1">
              <p className="font-bold text-xs leading-none mb-1 flex items-center gap-1.5">
                {t.title}
              </p>
              <p className="text-[11px] text-brand-text-muted leading-tight">{t.message}</p>
            </div>
            
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-brand-text-muted hover:text-white transition-colors h-fit self-start shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* LEFT SIDEBAR: PROFILE & ROLE SWITCHER */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* User Card */}
        {user && (
          <div className="glass-panel rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <label className="relative group w-14 h-14 rounded-full overflow-hidden border-2 border-brand-cyan cursor-pointer shrink-0 block">
                {uploadingAvatar ? (
                  <div className="w-full h-full bg-brand-dark/80 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={user.full_name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-brand-cyan" />
                    </div>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
              <div>
                <h2 className="font-bold text-white flex items-center gap-1.5">
                  {user.full_name}
                  {user.is_verified && <UserCheck className="w-4 h-4 text-brand-emerald" />}
                </h2>
                <p className="text-xs text-brand-text-muted capitalize">{user.role} Account</p>
              </div>
            </div>

            {/* Profile Trust Rating */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-text-muted">Trust Score</p>
                <p className="text-sm font-semibold text-brand-cyan mt-0.5">{user.rating} ★</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-text-muted">Commutes Logged</p>
                <p className="text-sm font-semibold text-white mt-0.5">{user.trips_count || 0}</p>
              </div>
            </div>
            
            {user.vehicle_info && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[10px] uppercase font-bold text-brand-text-muted">Vetted Vehicle</p>
                <p className="text-xs text-white/90 italic mt-0.5">{user.vehicle_info}</p>
              </div>
            )}
          </div>
        )}

        {/* PARS Campus Integration Rewards */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-brand-purple/5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-brand-purple" />
            <h3 className="text-sm font-bold text-white">Campus Parking Points</h3>
          </div>
          <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
            Earn points by sharing rides with classmates. Swap points for reserved premium spots.
          </p>
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
            <div>
              <span className="text-[10px] text-brand-text-muted">Points Balance</span>
              <p className="text-lg font-extrabold text-brand-purple">{campusRewards.points} pts</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-brand-text-muted">Reserved Spot</span>
              <p className="text-xs font-semibold text-white">{campusRewards.reserved_spot || 'None - Claim spot'}</p>
            </div>
          </div>
          
          {campusRewards.points >= 50 && !campusRewards.reserved_spot && (
            <button
              onClick={() => {
                const updated = { points: campusRewards.points - 50, reserved_spot: 'Lot A - Spot #08' };
                updateLocalStorage('campus_rewards', updated);
                triggerNotification('Reserved parking pass Lot A - Spot #08 successfully claimed!', 'success', 'Campus Integration');
              }}
              className="w-full mt-3 py-2 rounded-xl bg-brand-purple text-brand-dark text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer animate-pulse"
            >
              Claim Spot (-50 pts)
            </button>
          )}
        </div>

        {/* Dynamic Navigation Roles (Tab Selectors) */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('passenger')}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-between text-left text-sm font-semibold transition-all ${
              activeTab === 'passenger' 
                ? 'bg-brand-cyan text-brand-dark shadow-lg btn-glow-cyan' 
                : 'bg-white/5 border border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Passenger Dashboard
            </span>
          </button>

          <button
            onClick={() => setActiveTab('driver')}
            disabled={user?.role === 'passenger'}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-between text-left text-sm font-semibold transition-all ${
              user?.role === 'passenger' ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'driver' 
                ? 'bg-brand-emerald text-brand-dark shadow-lg' 
                : 'bg-white/5 border border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <Car className="w-4 h-4" /> Driver Hub
            </span>
            {user?.role === 'passenger' && <span className="text-[9px] uppercase border border-white/20 px-1.5 py-0.5 rounded text-white/50">Driver Only</span>}
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-between text-left text-sm font-semibold transition-all ${
                activeTab === 'admin' 
                  ? 'bg-brand-purple text-brand-dark shadow-lg' 
                  : 'bg-white/5 border border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Administration
              </span>
            </button>
          )}
        </div>

      </div>

      {/* CENTER WORKSPACE: WORKFLOW VIEWS */}
      <div className="lg:col-span-9 flex flex-col gap-8">
        {!user.is_verified ? (
          <KYCForm 
            user={user} 
            triggerNotification={triggerNotification} 
            onVerified={async () => {
              await refreshAllProfiles();
              await refreshUser();
              loadData();
            }} 
          />
        ) : (
          <>
        
        {/* PASSENGER DASHBOARD TAB */}
        {activeTab === 'passenger' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Passenger Actions & Trip Search */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Search Panel */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4">Find Commutes</h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan" />
                      <input 
                        type="text" 
                        placeholder="Origin (e.g., San Francisco)" 
                        value={originQuery}
                        onChange={(e) => setOriginQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-emerald" />
                      <input 
                        type="text" 
                        placeholder="Destination (e.g., Stanford)" 
                        value={destQuery}
                        onChange={(e) => setDestQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald transition-all"
                      />
                    </div>
                  </div>

                  {/* Preference filter sliders */}
                  <div className="border-t border-white/5 pt-3 mt-1">
                    <p className="text-[10px] uppercase font-bold text-brand-text-muted flex items-center gap-1.5 mb-3">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Ride Preferences
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <label className="flex items-center gap-2 text-xs text-brand-text-muted hover:text-white cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={petFriendlyFilter} 
                          onChange={(e) => setPetFriendlyFilter(e.target.checked)}
                          className="rounded text-brand-cyan focus:ring-brand-cyan border-white/10" 
                        />
                        Pet Friendly
                      </label>
                      <label className="flex items-center gap-2 text-xs text-brand-text-muted hover:text-white cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={smokingFilter} 
                          onChange={(e) => setSmokingFilter(e.target.checked)}
                          className="rounded text-brand-cyan focus:ring-brand-cyan border-white/10" 
                        />
                        Allows Smoking
                      </label>
                      
                      <select
                        value={musicFilter}
                        onChange={(e) => setMusicFilter(e.target.value)}
                        className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-text-muted focus:outline-none focus:border-brand-cyan"
                      >
                        <option value="">Any Music Genre</option>
                        <option value="Indie Rock">Indie Rock</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Pop / Top40">Pop / Top40</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Results / Matches */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-brand-text-muted uppercase tracking-wider">Smart Matcher Results</h3>
                  {!supabase && <span className="text-[10px] bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">📡 Live Feed Active</span>}
                </div>
                
                {matchingTrips.length === 0 ? (
                  <div className="p-8 text-center text-brand-text-muted text-xs border border-dashed border-white/5 rounded-2xl">
                    No active trips posted. Log in as a Driver to post a trip!
                  </div>
                ) : (
                  matchingTrips.map(trip => {
                    const isBooked = bookings.some(b => b.trip_id === trip.id && b.passenger_id === user?.id);
                    const bookingStatus = bookings.find(b => b.trip_id === trip.id && b.passenger_id === user?.id)?.status;
                    
                    return (
                      <div key={trip.id} className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-brand-cyan/20 transition-all flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                              <img src={trip.driver_avatar} alt={trip.driver_name} className="object-cover w-full h-full" />
                            </div>
                            <div>
                              <p className="font-bold text-white flex items-center gap-1">
                                {trip.driver_name}
                                <span className="text-[10px] text-brand-cyan font-normal">{trip.driver_rating} ★</span>
                              </p>
                              <p className="text-[10px] text-brand-text-muted flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(trip.departure_time).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="inline-flex px-2 py-0.5 rounded-full bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan text-[10px] font-bold">
                              {trip.matchScore}% Match
                            </div>
                            <p className="text-base font-bold text-brand-emerald mt-1.5">${trip.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Trip Route Details */}
                        <div className="grid grid-cols-2 gap-4 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                          <div>
                            <span className="text-[9px] uppercase text-brand-text-muted">Origin</span>
                            <p className="font-semibold truncate text-white/90">{trip.origin}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase text-brand-text-muted">Destination</span>
                            <p className="font-semibold truncate text-white/90">{trip.destination}</p>
                          </div>
                        </div>

                        {/* Booking CTA */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-1">
                          <div className="flex gap-2">
                            {trip.preferences.pets && <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-brand-cyan">🐕 Pets Ok</span>}
                            {trip.preferences.smoking && <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-brand-cyan">🚬 Smoking Allowed</span>}
                            {trip.preferences.music && <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-brand-cyan">🎵 {trip.preferences.music}</span>}
                          </div>

                          {isBooked ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize ${
                                bookingStatus === 'accepted' ? 'bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/20 animate-pulse' :
                                bookingStatus === 'rejected' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                'bg-white/5 text-brand-text-muted border border-white/10'
                              }`}>
                                {bookingStatus}
                              </span>
                              {bookingStatus === 'accepted' && (
                                <button
                                  onClick={() => handleTrackTrip(trip, bookings.find(b => b.trip_id === trip.id))}
                                  className="px-3 py-1 bg-brand-cyan hover:bg-cyan-400 text-brand-dark rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Navigation className="w-3.5 h-3.5" /> Track Route
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBookTrip(trip.id)}
                              disabled={trip.seats_available === 0}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                                trip.seats_available === 0 
                                  ? 'bg-white/5 text-brand-text-muted cursor-not-allowed border border-white/5' 
                                  : 'bg-brand-cyan text-brand-dark hover:bg-cyan-400 btn-glow-cyan cursor-pointer'
                              }`}
                            >
                              {trip.seats_available === 0 ? 'Full' : `Book Ride (${trip.seats_available} seats left)`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Passenger Satellite Map Tracker */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-brand-cyan" /> 
                    {trackingActive ? 'Live Commute Tracker' : 'Satellite Transit Map'}
                  </h2>
                  {trackingActive && (
                    <button
                      onClick={() => setTrackingActive(false)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Close Tracker
                    </button>
                  )}
                </div>

                <div className="flex-1 w-full h-[320px] rounded-xl overflow-hidden relative border border-white/5 mb-4">
                  <MapComponent 
                    routeCoordinates={activeRouteCoordinates} 
                    animateCar={trackingActive}
                    onRouteSelected={(coords) => {
                      if (!trackingActive) {
                        setActiveRouteCoordinates(coords);
                        triggerNotification('Custom draft route placed on map.', 'info', 'Route Updated');
                      }
                    }}
                  />
                </div>

                {trackingActive ? (
                  <div className="p-3 rounded-xl bg-brand-cyan/15 border border-brand-cyan/20 text-xs">
                    <p className="font-semibold text-brand-cyan flex items-center gap-1.5 animate-pulse">
                      <Bell className="w-3.5 h-3.5" /> Real-Time Satellite Tracking Active
                    </p>
                    <p className="text-[10px] text-white/70 mt-1">
                      Driver **{selectedTripForMap?.driver_name}** is navigating along the SF Peninsula commute line. Estimated arrival is 34 minutes.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-brand-text-muted leading-relaxed">
                    Click anywhere on the map to define a custom route draft. When you book a ride and the driver accepts, the active vehicle GPS route tracking will launch here automatically.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* DRIVER HUB TAB */}
        {activeTab === 'driver' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Driver Actions: Post Trip & Pending Bookings */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Post Trip Form */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4">Post a Commute Route</h2>
                <form onSubmit={handlePostTrip} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-muted">Start Point</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g., SF Downtown" 
                        value={postOrigin}
                        onChange={(e) => setPostOrigin(e.target.value)}
                        className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-muted">Destination</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g., Stanford Lot C" 
                        value={postDestination}
                        onChange={(e) => setPostDestination(e.target.value)}
                        className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-muted">Departure Time</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={postTime}
                        onChange={(e) => setPostTime(e.target.value)}
                        className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-muted">Seat Price ($)</label>
                      <input 
                        type="number" 
                        step="0.50"
                        min="0"
                        value={postPrice}
                        onChange={(e) => setPostPrice(e.target.value)}
                        className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-muted">Seats Available</label>
                      <input 
                        type="number" 
                        min="1"
                        max="8"
                        value={postSeats}
                        onChange={(e) => setPostSeats(e.target.value)}
                        className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      />
                    </div>
                  </div>

                  {/* Driver Preferences */}
                  <div className="border-t border-white/5 pt-3 mt-1">
                    <span className="text-[10px] uppercase font-bold text-brand-text-muted block mb-3">Trip Preferences</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-xs text-brand-text-muted select-none cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={postPets} 
                            onChange={(e) => setPostPets(e.target.checked)}
                            className="rounded text-brand-cyan focus:ring-brand-cyan border-white/10" 
                          />
                          Allow Passenger Pets
                        </label>
                        <label className="flex items-center gap-2 text-xs text-brand-text-muted select-none cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={postSmoking} 
                            onChange={(e) => setPostSmoking(e.target.checked)}
                            className="rounded text-brand-cyan focus:ring-brand-cyan border-white/10" 
                          />
                          Allow Smoking
                        </label>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-brand-text-muted">Music:</span>
                          <select 
                            value={postMusic} 
                            onChange={(e) => setPostMusic(e.target.value)}
                            className="py-1 px-2 rounded bg-white/5 border border-white/10 text-[11px] text-white"
                          >
                            <option value="Pop / Top40">Pop / Top40</option>
                            <option value="Indie Rock">Indie Rock</option>
                            <option value="Jazz">Jazz</option>
                            <option value="Classic Rock">Classic Rock</option>
                            <option value="Quiet">None (No music)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-brand-text-muted">Talk:</span>
                          <select 
                            value={postConversation} 
                            onChange={(e) => setPostConversation(e.target.value)}
                            className="py-1 px-2 rounded bg-white/5 border border-white/10 text-[11px] text-white"
                          >
                            <option value="Friendly">Friendly Conversation</option>
                            <option value="Quiet">Quiet Journey</option>
                            <option value="Flexible">Flexible (Rider's Choice)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full mt-4 py-3 rounded-xl bg-brand-emerald text-brand-dark font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" /> Post Commute Route
                  </button>
                </form>
              </div>

              {/* Ride Booking Requests Panel */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pending Booking Requests</h3>
                
                {driverPendingBookings.length === 0 ? (
                  <div className="p-6 text-center text-brand-text-muted text-xs border border-dashed border-white/5 rounded-xl">
                    No pending booking requests from passengers.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {driverPendingBookings.map(book => {
                      const trip = trips.find(t => t.id === book.trip_id);
                      return (
                        <div key={book.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img src={book.passenger_avatar} alt={book.passenger_name} className="object-cover w-full h-full" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{book.passenger_name}</p>
                              <p className="text-[10px] text-brand-text-muted flex items-center gap-1">
                                wants to join: {trip?.destination}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateBookingStatus(book.id, 'accepted')}
                              className="p-1.5 rounded-lg bg-brand-emerald/20 hover:bg-brand-emerald text-brand-emerald hover:text-brand-dark transition-colors cursor-pointer"
                              title="Accept Booking"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(book.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer"
                              title="Reject Booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right sidebar: Driver stats & Subsidies */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Nabogo Subsidy Dashboard */}
              <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-brand-cyan/5">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-brand-cyan" />
                  <h3 className="text-sm font-bold text-white">Government Subsidies</h3>
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
                  Denmark-inspired Nabogo incentive program. Receive $0.25/km for every community passenger ride verified by municipal tracking.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-brand-text-muted uppercase">Claimed Subsidies</span>
                    <p className="text-lg font-bold text-brand-cyan mt-0.5">
                      ${subsidies.reduce((acc, curr) => curr.status === 'approved' ? acc + curr.subsidy_amount : acc, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-brand-text-muted uppercase">Pending Verification</span>
                    <p className="text-lg font-bold text-yellow-500 mt-0.5">
                      ${subsidies.reduce((acc, curr) => curr.status === 'pending' ? acc + curr.subsidy_amount : acc, 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* List of Driver's Subsidy Claims */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-brand-text-muted">Subsidy Claims Log</span>
                  {subsidies.length === 0 ? (
                    <p className="text-[10px] text-brand-text-muted italic">No subsidies claimed yet.</p>
                  ) : (
                    subsidies.map(sub => (
                      <div key={sub.id} className="p-2.5 rounded-lg bg-white/5 text-[11px] flex justify-between items-center border border-white/5">
                        <div>
                          <p className="font-semibold text-white/90">Verified Route Commute</p>
                          <p className="text-[9px] text-brand-text-muted">{sub.distance_km} km driven</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">${sub.subsidy_amount.toFixed(2)}</p>
                          <span className={`text-[8px] uppercase px-1 rounded ${
                            sub.status === 'approved' ? 'bg-brand-emerald/15 text-brand-emerald' : 'bg-yellow-500/15 text-yellow-500'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Driver Commutes */}
              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Your Posted Rides</h3>
                
                {driverTrips.length === 0 ? (
                  <p className="text-xs text-brand-text-muted italic">You have no active commutes posted.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {driverTrips.map(trip => (
                      <div key={trip.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-semibold text-white">{trip.destination}</p>
                            <p className="text-[10px] text-brand-text-muted">Starts: {trip.origin}</p>
                          </div>
                          <span className="text-xs font-bold text-brand-emerald">${trip.price.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                          <span className="text-[10px] text-brand-text-muted">{trip.seats_available}/{trip.seats_total} seats available</span>
                          <button
                            onClick={() => handleCompleteRide(trip)}
                            className="px-3 py-1 rounded bg-brand-cyan hover:bg-cyan-400 text-brand-dark text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ADMINISTRATION DASHBOARD TAB */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Superadmin System Monitoring & Control Panel */}
            <div className="lg:col-span-12 flex flex-col gap-6">
              
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Users */}
                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-text-muted uppercase font-bold">Total Platform Users</span>
                    <p className="text-2xl font-extrabold text-white mt-1">{allProfiles.length}</p>
                    <p className="text-[9px] text-brand-text-muted mt-1">
                      {allProfiles.filter(p => p.role === 'driver').length} Drivers • {allProfiles.filter(p => p.role === 'passenger').length} Passengers
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
                    <Users className="w-5 h-5 text-brand-cyan" />
                  </div>
                </div>

                {/* Total Active Trips */}
                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-text-muted uppercase font-bold">Active Commutes</span>
                    <p className="text-2xl font-extrabold text-brand-emerald mt-1">{trips.length}</p>
                    <p className="text-[9px] text-brand-text-muted mt-1">
                      {trips.reduce((acc, t) => acc + t.seats_available, 0)} open passenger seats
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center border border-brand-emerald/20">
                    <Car className="w-5 h-5 text-brand-emerald" />
                  </div>
                </div>

                {/* Total Subsidy Amount */}
                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-text-muted uppercase font-bold">Subsidy Disbursed</span>
                    <p className="text-2xl font-extrabold text-brand-purple mt-1">
                      ${subsidies.reduce((acc, s) => s.status === 'approved' ? acc + s.subsidy_amount : acc, 0).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-brand-text-muted mt-1">
                      ${subsidies.reduce((acc, s) => s.status === 'pending' ? acc + s.subsidy_amount : acc, 0).toFixed(2)} pending audit approvals
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20">
                    <DollarSign className="w-5 h-5 text-brand-purple" />
                  </div>
                </div>

                {/* Platform Compliance Rate */}
                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-text-muted uppercase font-bold">System Status</span>
                    <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse"></span>
                      100% Operational
                    </p>
                    <p className="text-[9px] text-brand-text-muted mt-1">
                      Mock DB Simulator {simulatorActive ? 'ACTIVE' : 'PAUSED'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Activity className="w-5 h-5 text-brand-text-muted" />
                  </div>
                </div>

              </div>

              {/* System Control Panel Panel */}
              <div className="glass-panel rounded-3xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-brand-cyan" /> Superadmin Database & Simulator Controls
                    </h2>
                    <p className="text-xs text-brand-text-muted mt-1">
                      Trigger background commuter activity simulations, audit local caches, or reset all data tables.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {/* Toggle Simulator */}
                    <button
                      onClick={() => {
                        setSimulatorActive(!simulatorActive);
                        triggerNotification(
                          `Real-time commuter simulation ${!simulatorActive ? 'activated' : 'deactivated'}.`,
                          'info',
                          'Simulator Control'
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        simulatorActive 
                          ? 'bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400' 
                          : 'bg-brand-cyan/15 hover:bg-brand-cyan/25 border border-brand-cyan/20 text-brand-cyan'
                      }`}
                    >
                      {simulatorActive ? 'Pause Simulator' : 'Start Simulator'}
                    </button>

                    {/* Force Sim Event */}
                    <button
                      onClick={() => {
                        triggerSimulatedEvent();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Force Simulation Event
                    </button>

                    {/* Reset Database */}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reset the mock database? All custom registrations, posted trips, and subsidy audits will be wiped.')) {
                          localStorage.removeItem('coride_mock_seeded');
                          localStorage.removeItem('coride_mock_profiles');
                          localStorage.removeItem('coride_mock_trips');
                          localStorage.removeItem('coride_mock_bookings');
                          localStorage.removeItem('coride_mock_subsidies');
                          localStorage.removeItem('coride_mock_campus_rewards');
                          localStorage.removeItem('coride_current_user_id'); // sign out
                          loadData();
                          triggerNotification('Platform database reset to initial seeds.', 'success', 'System Seed Reset');
                          window.location.reload();
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" /> Reset Database
                    </button>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Left Col: Driver Vetting & Moderation */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Trust & Safety Driver Vetting */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-brand-purple" />
                  <h2 className="text-base font-bold text-white">Trust & Safety: Driver Vetting</h2>
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
                  Verify driver licenses, vehicle inspection records, and background check checks to maintain platform security.
                </p>

                {allProfiles.filter(p => p.role === 'driver' && !p.is_verified).length === 0 ? (
                  <div className="p-4 text-center text-brand-text-muted text-xs border border-dashed border-white/5 rounded-xl">
                    No pending driver verifications. All active drivers vetted!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {allProfiles.filter(p => p.role === 'driver' && !p.is_verified).map(profile => (
                      <div key={profile.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img src={profile.avatar} alt={profile.full_name} className="object-cover w-full h-full" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{profile.full_name}</p>
                            <p className="text-[10px] text-brand-text-muted">{profile.vehicle_info || 'No vehicle declared'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleVerifyDriver(profile.id)}
                          className="px-3 py-1.5 bg-brand-purple hover:bg-purple-400 text-brand-dark rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Vet & Verify
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Directory & Moderation */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand-cyan" />
                    <h2 className="text-base font-bold text-white">User Directory & Moderation</h2>
                  </div>
                  <span className="text-xs text-brand-text-muted">
                    {filteredProfiles.length} of {allProfiles.length} Users Listed
                  </span>
                </div>

                <p className="text-xs text-brand-text-muted leading-relaxed">
                  Manage user accounts, toggle safety verifications, update platform roles, ban violators, or permanently delete profiles.
                </p>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div>
                    <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Search User</label>
                    <input 
                      type="text" 
                      placeholder="Name or email..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Filter Role</label>
                    <select 
                      value={adminRoleFilter}
                      onChange={(e) => setAdminRoleFilter(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:border-brand-cyan focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="driver">Drivers</option>
                      <option value="passenger">Passengers</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Filter Status</label>
                    <select 
                      value={adminStatusFilter}
                      onChange={(e) => setAdminStatusFilter(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:border-brand-cyan focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                      <option value="banned">Banned Only</option>
                    </select>
                  </div>
                </div>

                {/* User List */}
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                  {filteredProfiles.length === 0 ? (
                    <div className="p-8 text-center text-brand-text-muted text-xs border border-dashed border-white/5 rounded-xl">
                      No users matching the filters were found.
                    </div>
                  ) : (
                    filteredProfiles.map(p => (
                      <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/10">
                        {/* User Metadata */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                            <img src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={p.full_name} className="object-cover w-full h-full" />
                            {p.is_banned && (
                              <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                                <span className="text-[8px] bg-red-600 text-white font-extrabold px-1 rounded">BANNED</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-white leading-tight">{p.full_name}</p>
                              {p.is_verified && <span className="text-[8px] font-bold bg-brand-emerald/10 text-brand-emerald px-1.5 py-0.5 rounded-full border border-brand-emerald/20">Vetted</span>}
                              {p.is_banned && <span className="text-[8px] font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20">Suspended</span>}
                            </div>
                            <p className="text-[10px] text-brand-text-muted leading-tight mt-0.5">{p.email}</p>
                            <p className="text-[9px] text-brand-text-muted leading-tight mt-0.5">Rating: {p.rating} ★ • {p.trips_count || 0} rides</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                          {/* Role Selector */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] text-brand-text-muted uppercase font-bold">Access Role</span>
                            <select 
                              value={p.role} 
                              onChange={(e) => handleUpdateUserRole(p.id, e.target.value)}
                              disabled={p.id === user.id} // Cannot demote yourself
                              className="py-1 px-2 rounded bg-brand-dark border border-white/10 text-[10px] text-white focus:outline-none cursor-pointer"
                            >
                              <option value="passenger">Passenger</option>
                              <option value="driver">Driver</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5 mt-2 md:mt-0">
                            {/* Toggle Vetting */}
                            <button
                              onClick={() => handleToggleVerify(p.id, p.is_verified)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                p.is_verified 
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                  : 'bg-brand-emerald/15 text-brand-emerald hover:bg-brand-emerald/25'
                              }`}
                            >
                              {p.is_verified ? 'Unverify' : 'Verify'}
                            </button>

                            {/* Toggle Ban */}
                            <button
                              onClick={() => handleToggleBan(p.id, p.is_banned)}
                              disabled={p.id === user.id} // Cannot ban yourself
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                p.is_banned 
                                  ? 'bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25' 
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              }`}
                            >
                              {p.is_banned ? 'Restore' : 'Suspend'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUserProfile(p.id, p.email)}
                              disabled={p.id === user.id} // Cannot delete yourself
                              className="px-2 py-1 rounded bg-red-500/25 hover:bg-red-500 text-red-400 text-[10px] font-bold hover:text-white transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Col: Subsidy Claim Audit */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Nabogo Subsidy Approvals */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-brand-cyan" />
                  <h2 className="text-base font-bold text-white">Nabogo Government Subsidy Audit</h2>
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
                  Review verified route transit logs and disburse government funds ($0.25/km) for completed carpooling trips.
                </p>

                {subsidies.filter(s => s.status === 'pending').length === 0 ? (
                  <div className="p-4 text-center text-brand-text-muted text-xs border border-dashed border-white/5 rounded-xl">
                    No pending subsidy approval requests.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {subsidies.filter(s => s.status === 'pending').map(sub => (
                      <div key={sub.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-semibold text-white">Driver ID: {sub.driver_id.slice(0, 8)}...</p>
                            <p className="text-[10px] text-brand-text-muted">Commute Distance: {sub.distance_km} km</p>
                          </div>
                          <span className="text-sm font-bold text-brand-cyan">${sub.subsidy_amount.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => handleApproveSubsidy(sub.id)}
                            className="px-3 py-1 bg-brand-cyan hover:bg-cyan-400 text-brand-dark rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Approve Payout
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
          </>
        )}
      </div>

      {/* RATING MODAL OVERLAY */}
      {activeRatingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-white/10 flex flex-col gap-4 animate-scale-in">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              {user?.id === activeRatingItem.passenger_id ? 'Rate Your Driver & Ride' : 'Rate Your Passenger'}
            </h3>
            
            <p className="text-xs text-brand-text-muted">
              {user?.id === activeRatingItem.passenger_id 
                ? `How was your carpooling commute to ${activeRatingItem.destination} with ${activeRatingItem.driver_name}?`
                : `How was ${activeRatingItem.passenger_name} as a passenger on your commute to ${activeRatingItem.destination}?`
              }
            </p>

            {/* User Info being rated */}
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                <img 
                  src={user?.id === activeRatingItem.passenger_id ? activeRatingItem.driver_avatar : activeRatingItem.passenger_avatar} 
                  alt="User avatar" 
                  className="object-cover w-full h-full" 
                />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {user?.id === activeRatingItem.passenger_id ? activeRatingItem.driver_name : activeRatingItem.passenger_name}
                </p>
                <p className="text-[10px] text-brand-text-muted capitalize">
                  {user?.id === activeRatingItem.passenger_id ? 'Driver' : 'Passenger'}
                </p>
              </div>
            </div>

            {/* Stars Selector */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingStars(star)}
                  className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${star <= ratingStars ? 'text-brand-cyan text-glow-cyan' : 'text-white/20'}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="text-[10px] text-brand-text-muted uppercase font-bold block mb-1">Feedback (Optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience with the community..."
                rows={3}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleSkipRating}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors cursor-pointer border border-white/5 text-center"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 py-2.5 rounded-xl bg-brand-cyan text-brand-dark font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center btn-glow-cyan"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-brand-dark min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-brand-cyan border-t-transparent animate-spin"></div>
          <p className="text-xs text-brand-text-muted text-glow-cyan">Initialising CoRide Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
