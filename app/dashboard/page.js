'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../../lib/UserContext';
import { calculateMatchScore } from '../../lib/matching';
import { supabase } from '../../lib/supabase';
import { geocodeLocation, getDrivingRoute } from '../../lib/navigation';
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
          vehicle_info: vehicleInfoStr,
          kyc_dob: kycDob,
          kyc_id_type: kycIdType,
          kyc_id_number: kycIdNumber,
          kyc_id_file: kycIdFile,
          kyc_license_number: isDriver ? kycLicenseNumber : null,
          kyc_license_expiry: isDriver ? kycLicenseExpiry : null,
          kyc_license_file: isDriver ? kycLicenseFile : null
        };

        const { error: profileErr } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (profileErr) throw profileErr;

        const { error: authErr } = await supabase.auth.updateUser({
          data: updates
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
              vehicle_info: vehicleInfoStr,
              kyc_dob: kycDob,
              kyc_id_type: kycIdType,
              kyc_id_number: kycIdNumber,
              kyc_id_file: kycIdFile,
              kyc_license_number: isDriver ? kycLicenseNumber : null,
              kyc_license_expiry: isDriver ? kycLicenseExpiry : null,
              kyc_license_file: isDriver ? kycLicenseFile : null
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
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Admin User Directory Filters
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('all'); // all | driver | passenger | admin
  const [adminStatusFilter, setAdminStatusFilter] = useState('all'); // all | verified | unverified | banned

  // State for KYC Dossier & Chat Modals
  const [selectedKycUser, setSelectedKycUser] = useState(null);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeRatingItem, setActiveRatingItem] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'System Active', message: 'Smart Commute Matcher and real-time transit telemetry are fully operational.', type: 'success', time: '12:00 AM', read: false },
    { id: '2', title: 'Vetting Complete', message: 'Municipal safety checks approved. Vetted status granted.', type: 'info', time: '12:05 AM', read: false }
  ]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Helper to add toast notification and append to notification log hub
  const triggerNotification = (message, type = 'success', title = 'Notification') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    const newNotif = {
      id,
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('coride_onboarding_dismissed');
      if (dismissed === 'true') {
        setShowOnboarding(false);
      }
    }
  }, []);

  // Check for pending ratings on load or user changes
  useEffect(() => {
    if (user) {
      checkForPendingRatings();
    }
  }, [user]);

  // Load datasets from Supabase or mock DB
  const loadData = async () => {
    if (typeof window === 'undefined') return;
    
    if (supabase) {
      try {
        const { data: dbTrips, error: tripsErr } = await supabase
          .from('trips')
          .select('*')
          .order('departure_time', { ascending: true });
          
        const { data: dbBookings, error: bookingsErr } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
          
        const { data: dbSubsidies, error: subsidiesErr } = await supabase
          .from('subsidies')
          .select('*')
          .order('created_at', { ascending: false });
          
        let dbRewards = { points: 0, reserved_spot: null };
        if (user) {
          const { data: rewardsData, error: rewardsErr } = await supabase
            .from('campus_rewards')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          if (rewardsData && !rewardsErr) {
            dbRewards = rewardsData;
          }
        }
        
        if (dbTrips && !tripsErr) {
          const populatedTrips = dbTrips.map(t => {
            const driver = allProfiles.find(p => p.id === t.driver_id);
            return {
              ...t,
              driver_name: driver?.full_name || 'Driver',
              driver_avatar: driver?.avatar || '',
              driver_rating: driver?.rating || 5.0
            };
          });
          setTrips(populatedTrips);
        }
        
        if (dbBookings && !bookingsErr) {
          const populatedBookings = dbBookings.map(b => {
            const passenger = allProfiles.find(p => p.id === b.passenger_id);
            return {
              ...b,
              passenger_name: passenger?.full_name || 'Passenger',
              passenger_avatar: passenger?.avatar || ''
            };
          });
          setBookings(populatedBookings);
        }
        
        if (dbSubsidies && !subsidiesErr) setSubsidies(dbSubsidies);
        setCampusRewards(dbRewards);
      } catch (err) {
        console.error('Error loading Supabase data:', err);
      }
    } else {
      const storedTrips = localStorage.getItem('coride_mock_trips');
      const storedBookings = localStorage.getItem('coride_mock_bookings');
      const storedSubsidies = localStorage.getItem('coride_mock_subsidies');
      const storedRewards = localStorage.getItem('coride_mock_campus_rewards');

      if (storedTrips) setTrips(JSON.parse(storedTrips));
      if (storedBookings) setBookings(JSON.parse(storedBookings));
      if (storedSubsidies) setSubsidies(JSON.parse(storedSubsidies));
      if (storedRewards) setCampusRewards(JSON.parse(storedRewards));
    }
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

  // 💬 REAL-TIME CHAT SYNC (SUPABASE OR LOCALSTORAGE FALLBACK)
  useEffect(() => {
    if (!activeChatBooking) {
      setChatMessages([]);
      return;
    }

    let activeChannel = null;

    const loadChatHistory = async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('booking_id', activeChatBooking.id)
          .order('created_at', { ascending: true });
        
        if (data && !error) {
          setChatMessages(data);
        }
      } else {
        const storedMsgs = JSON.parse(localStorage.getItem('coride_mock_messages') || '[]');
        const filtered = storedMsgs.filter(m => m.booking_id === activeChatBooking.id);
        setChatMessages(filtered);
      }
    };

    loadChatHistory();

    if (supabase) {
      activeChannel = supabase
        .channel(`chat-room-${activeChatBooking.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${activeChatBooking.id}` },
          (payload) => {
            setChatMessages(prev => [...prev, payload.new]);
          }
        )
        .subscribe();
    }

    return () => {
      if (activeChannel && supabase) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [activeChatBooking]);

  // Send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatBooking) return;

    const messageText = chatInput.trim();
    setChatInput('');

    const newMsg = {
      booking_id: activeChatBooking.id,
      sender_id: user.id,
      content: messageText
    };

    try {
      if (supabase) {
        const { error } = await supabase
          .from('messages')
          .insert([newMsg]);
        if (error) throw error;
      } else {
        const storedMsgs = JSON.parse(localStorage.getItem('coride_mock_messages') || '[]');
        const formattedMsg = {
          id: `msg-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...newMsg
        };
        const updated = [...storedMsgs, formattedMsg];
        localStorage.setItem('coride_mock_messages', JSON.stringify(updated));
        
        setChatMessages(prev => [...prev, formattedMsg]);

        const isUserPassenger = user.id === activeChatBooking.passenger_id;
        const trip = trips.find(t => t.id === activeChatBooking.trip_id);
        const botName = isUserPassenger ? (trip?.driver_name || 'Alex Mercer') : activeChatBooking.passenger_name;
        const botId = isUserPassenger ? (trip?.driver_id || 'usr-1') : activeChatBooking.passenger_id;

        setTimeout(() => {
          const replies = [
            `Perfect! Looking forward to sharing the commute.`,
            `Sounds great! I will be at the pick-up spot on time.`,
            `Sure, that works for me. See you soon!`,
            `Got it. I will keep you posted if I run into traffic.`,
            `Awesome! Let's save some fuel together! 🚗🌱`
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];

          const botMsg = {
            id: `msg-bot-${Date.now()}`,
            booking_id: activeChatBooking.id,
            sender_id: botId,
            content: randomReply,
            created_at: new Date().toISOString()
          };

          const freshMsgs = JSON.parse(localStorage.getItem('coride_mock_messages') || '[]');
          localStorage.setItem('coride_mock_messages', JSON.stringify([...freshMsgs, botMsg]));

          setActiveChatBooking(currentChat => {
            if (currentChat && currentChat.id === activeChatBooking.id) {
              setChatMessages(prev => [...prev, botMsg]);
              triggerNotification(`New message from ${botName}`, 'info', 'Message Received');
            }
            return currentChat;
          });
        }, 1500);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      triggerNotification(err.message || 'Failed to send message.', 'warning', 'Chat Error');
    }
  };

  const triggerSimulatedEvent = () => {
    if (!user) return;

    const eventType = Math.floor(Math.random() * 4); // 0, 1, 2, 3
    const mockNames = ['Emily Chen', 'Professor Miller', 'John Connor', 'Liam Stark', 'Sophia Davis'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];

    if (eventType === 0) {
      // EVENT: A driver posts a new commute route
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      const newMockTrip = {
        id: `trip-sim-${Date.now()}`,
        driver_id: 'usr-sim-driver',
        driver_name: randomName,
        driver_avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
        driver_rating: 4.8,
        origin: 'Kintambo Magasin',
        destination: 'Lemba (Sous-région)',
        departure_time: new Date(Date.now() + 6 * 3600000).toISOString(),
        seats_available: 3,
        seats_total: 4,
        price: 3.00,
        preferences: { pets: true, smoking: false, music: 'Afrobeats', conversation: 'Flexible' },
        route_coordinates: [[-4.3168, 15.2635], [-4.3414 + latOffset, 15.2856 + lngOffset], [-4.3444 + latOffset, 15.3115 + lngOffset], [-4.3942, 15.3188]]
      };

      const currentTrips = JSON.parse(localStorage.getItem('coride_mock_trips') || '[]');
      const updated = [...currentTrips, newMockTrip];
      localStorage.setItem('coride_mock_trips', JSON.stringify(updated));
      loadData();

      triggerNotification(
        `🚗 ${randomName} just posted a new commute: Kintambo to Lemba!`,
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
          `💵 Admin audited and APPROVED your $${randomClaim.subsidy_amount.toFixed(2)} CoRide Fuel Bonus payout!`,
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
  const handleBookTrip = async (tripId) => {
    if (!user) {
      triggerNotification('Please sign in to book a ride.', 'warning', 'Authentication Needed');
      return;
    }
    
    const existing = bookings.find(b => b.trip_id === tripId && b.passenger_id === user.id);
    if (existing) {
      triggerNotification('You have already requested a booking for this trip.', 'info', 'Booking Exists');
      return;
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('bookings')
          .insert([{
            trip_id: tripId,
            passenger_id: user.id,
            status: 'pending'
          }]);
        if (error) throw error;
        
        triggerNotification('Booking request submitted. The driver has been alerted!', 'success', 'Request Sent');
        await loadData();
      } else {
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
            `Driver ${targetTrip?.driver_name || 'Alex Mercer'} accepted your booking for ${targetTrip?.destination || 'UNIKIN'}. Real-time tracking is now available!`,
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
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to request booking.', 'warning', 'Booking Error');
    }
  };

  // PASSENGER / DRIVER: Cancel Booking (releases seats)
  const handleCancelBooking = async (bookingId) => {
    try {
      let bookingItem = bookings.find(b => b.id === bookingId);
      if (!bookingItem) return;

      const targetTrip = trips.find(t => t.id === bookingItem.trip_id);
      const isAccepted = bookingItem.status === 'accepted';

      if (supabase) {
        if (isAccepted && targetTrip) {
          const { error: tripErr } = await supabase
            .from('trips')
            .update({ seats_available: targetTrip.seats_available + 1 })
            .eq('id', targetTrip.id);
          if (tripErr) throw tripErr;
        }

        const { error: bookingErr } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        if (bookingErr) throw bookingErr;
      } else {
        const freshBookings = JSON.parse(localStorage.getItem('coride_mock_bookings') || '[]');
        const updatedBookings = freshBookings.filter(b => b.id !== bookingId);
        localStorage.setItem('coride_mock_bookings', JSON.stringify(updatedBookings));

        if (isAccepted && targetTrip) {
          const freshTrips = JSON.parse(localStorage.getItem('coride_mock_trips') || '[]');
          const updatedTrips = freshTrips.map(t => {
            if (t.id === targetTrip.id) {
              return { ...t, seats_available: Math.min(t.seats_total, t.seats_available + 1) };
            }
            return t;
          });
          localStorage.setItem('coride_mock_trips', JSON.stringify(updatedTrips));
        }
      }

      triggerNotification('Carpool booking has been cancelled and seats updated.', 'info', 'Booking Cancelled');
      loadData();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      triggerNotification(err.message || 'Failed to cancel booking.', 'warning', 'Error');
    }
  };

  // DRIVER: Cancel posted trip (marks all bookings as cancelled / deletes them)
  const handleCancelTrip = async (tripId) => {
    if (!confirm('Are you sure you want to cancel this entire commute route? All passenger bookings will be cancelled.')) {
      return;
    }
    try {
      if (supabase) {
        const { error: bookingErr } = await supabase
          .from('bookings')
          .delete()
          .eq('trip_id', tripId);
        if (bookingErr) throw bookingErr;

        const { error: tripErr } = await supabase
          .from('trips')
          .delete()
          .eq('id', tripId);
        if (tripErr) throw tripErr;
      } else {
        const freshTrips = JSON.parse(localStorage.getItem('coride_mock_trips') || '[]');
        const updatedTrips = freshTrips.filter(t => t.id !== tripId);
        localStorage.setItem('coride_mock_trips', JSON.stringify(updatedTrips));

        const freshBookings = JSON.parse(localStorage.getItem('coride_mock_bookings') || '[]');
        const updatedBookings = freshBookings.filter(b => b.trip_id !== tripId);
        localStorage.setItem('coride_mock_bookings', JSON.stringify(updatedBookings));
      }

      triggerNotification('Commute route cancelled and removed from matching feed.', 'warning', 'Trip Cancelled');
      loadData();
    } catch (err) {
      console.error('Error cancelling trip:', err);
      triggerNotification(err.message || 'Failed to cancel trip.', 'warning', 'Error');
    }
  };

  // DRIVER: Post new trip
  const handlePostTrip = async (e) => {
    e.preventDefault();
    if (!postOrigin || !postDestination || !postTime) {
      triggerNotification('Please specify the route start, destination, and departure time.', 'warning', 'Invalid Input');
      return;
    }

    triggerNotification('Geocoding route & calculating optimal road path...', 'info', 'Geocoding');

    try {
      // 1. Geocode Start and Destination
      const originRes = await geocodeLocation(postOrigin);
      const destRes = await geocodeLocation(postDestination);

      if (!originRes || !destRes) {
        triggerNotification('Could not resolve locations. Standard route used as a fallback.', 'warning', 'Fallback Used');
      }

      const originCoords = originRes ? [originRes.lat, originRes.lng] : [-4.3032, 15.3120];
      const destCoords = destRes ? [destRes.lat, destRes.lng] : [-4.4172, 15.3124];

      // 2. Calculate optimal road routing via OSRM
      const routeData = await getDrivingRoute(originCoords, destCoords);
      if (!routeData) {
        throw new Error('Failed to generate driving directions.');
      }

      const routeCoords = routeData.coordinates;
      const distanceKm = routeData.distanceKm;
      const durationMins = routeData.durationMins;

      // Automatically calculate recommended split price and fuel subsidy
      const finalPrice = parseFloat(postPrice) || parseFloat((distanceKm * 0.12).toFixed(2)) || 2.00;
      const subsidyAmount = parseFloat((distanceKm * 0.25).toFixed(2));

      const preferences = {
        pets: postPets,
        smoking: postSmoking,
        music: postMusic,
        conversation: postConversation
      };

      if (supabase) {
        const { error } = await supabase
          .from('trips')
          .insert([{
            driver_id: user.id,
            origin: originRes ? originRes.name : postOrigin,
            destination: destRes ? destRes.name : postDestination,
            departure_time: new Date(postTime).toISOString(),
            seats_available: parseInt(postSeats),
            seats_total: parseInt(postSeats),
            price: finalPrice,
            preferences,
            route_coordinates: routeCoords
          }]);
        if (error) throw error;
        
        triggerNotification(`Published commute: ${originRes ? originRes.name : postOrigin} to ${destRes ? destRes.name : postDestination} (${distanceKm} km, ~${durationMins} mins) is live!`, 'success', 'Trip Posted');
        
        setPostOrigin('');
        setPostDestination('');
        setPostTime('');
        await loadData();
      } else {
        const newTrip = {
          id: `trip-${Date.now()}`,
          driver_id: user.id,
          driver_name: user.full_name,
          driver_avatar: user.avatar,
          driver_rating: user.rating,
          origin: originRes ? originRes.name : postOrigin,
          destination: destRes ? destRes.name : postDestination,
          departure_time: new Date(postTime).toISOString(),
          seats_available: parseInt(postSeats),
          seats_total: parseInt(postSeats),
          price: finalPrice,
          preferences,
          route_coordinates: routeCoords
        };

        const updatedTrips = [...trips, newTrip];
        updateLocalStorage('trips', updatedTrips);

        setPostOrigin('');
        setPostDestination('');
        setPostTime('');
        
        triggerNotification(`Published commute: ${newTrip.origin} to ${newTrip.destination} (${distanceKm} km, ~${durationMins} mins) is live!`, 'success', 'Trip Posted');
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to publish route.', 'warning', 'Error');
    }
  };

  const handlePreviewRoute = async (e) => {
    if (e) e.preventDefault();
    if (!postOrigin || !postDestination) {
      triggerNotification('Please enter both a start point and destination to preview the route.', 'warning', 'Preview Error');
      return;
    }

    triggerNotification('Fetching real driving route preview...', 'info', 'Geocoding');

    try {
      const originRes = await geocodeLocation(postOrigin);
      const destRes = await geocodeLocation(postDestination);

      if (!originRes || !destRes) {
        triggerNotification('Could not find locations. Try using more common names in Kinshasa.', 'warning', 'Geocoding Failed');
        return;
      }

      const routeData = await getDrivingRoute([originRes.lat, originRes.lng], [destRes.lat, destRes.lng]);
      if (routeData) {
        setActiveRouteCoordinates(routeData.coordinates);
        setTrackingActive(false);
        triggerNotification(`Previewing road route: ${originRes.name} to ${destRes.name} (${routeData.distanceKm} km, ~${routeData.durationMins} mins)`, 'success', 'Route Plotted');
      } else {
        triggerNotification('Could not calculate driving directions.', 'warning', 'Routing Failed');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Error generating route preview.', 'warning', 'Error');
    }
  };

  // DRIVER: Manage Bookings (Accept/Reject)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId);
        if (error) throw error;

        if (newStatus === 'accepted') {
          const booking = bookings.find(x => x.id === bookingId);
          const targetTrip = trips.find(t => t.id === booking.trip_id);
          if (targetTrip && targetTrip.seats_available > 0) {
            const { error: seatErr } = await supabase
              .from('trips')
              .update({ seats_available: targetTrip.seats_available - 1 })
              .eq('id', targetTrip.id);
            if (seatErr) throw seatErr;

            const { data: rewards, error: rewardsErr } = await supabase
              .from('campus_rewards')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            
            const currentPoints = rewards?.points || 0;
            const newPoints = currentPoints + 25;
            
            if (rewards) {
              await supabase
                .from('campus_rewards')
                .update({ points: newPoints, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
            } else {
              await supabase
                .from('campus_rewards')
                .insert([{ user_id: user.id, points: newPoints }]);
            }
            triggerNotification('You earned 25 campus priority points for carpooling with a peer!', 'success', 'Campus Priority Points');
          }
        }
        triggerNotification(
          `Passenger booking request has been ${newStatus}.`, 
          newStatus === 'accepted' ? 'success' : 'warning', 
          `Booking ${newStatus === 'accepted' ? 'Accepted' : 'Declined'}`
        );
        await loadData();
      } else {
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
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to update booking status.', 'warning', 'Error');
    }
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
      `Trip completed! CoRide Fuel Bonus claim of $${amount} submitted for local verification.`,
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
  const handleApproveSubsidy = async (subsidyId) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('subsidies')
          .update({ status: 'approved' })
          .eq('id', subsidyId);
        if (error) throw error;
        await loadData();
      } else {
        const updated = subsidies.map(s => {
          if (s.id === subsidyId) return { ...s, status: 'approved' };
          return s;
        });
        updateLocalStorage('subsidies', updated);
      }
      triggerNotification('Subsidy audit approved. Municipal funds disbursed!', 'success', 'Subsidy Audited');
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to approve subsidy claim.', 'warning', 'Admin Error');
    }
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

  const driverAcceptedBookings = bookings.filter(b => 
    b.status === 'accepted' && 
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

            {user.is_verified && (
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-bold text-brand-text-muted">Identity Vetting</p>
                <button
                  onClick={() => setSelectedKycUser(user)}
                  className="w-full py-1.5 bg-brand-purple/20 hover:bg-brand-purple/35 text-brand-purple text-[10px] font-bold rounded-xl border border-brand-purple/10 transition-all cursor-pointer text-center"
                >
                  View Vetting Details
                </button>
              </div>
            )}
          </div>
        )}

        {/* CoRide Loyalty Points & Parking Rewards */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-brand-purple/5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-brand-purple" />
            <h3 className="text-sm font-bold text-white">Preferred Parking Points</h3>
          </div>
          <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
            Earn points by sharing rides with others. Swap points for preferred parking slots at partner hubs.
          </p>
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
            <div>
              <span className="text-[10px] text-brand-text-muted">Points Balance</span>
              <p className="text-lg font-extrabold text-brand-purple">{campusRewards.points} pts</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-brand-text-muted">Reserved Spot</span>
              <p className="text-xs font-semibold text-white">{campusRewards.reserved_spot || 'None - Claim slot'}</p>
            </div>
          </div>
          
          {campusRewards.points >= 50 && !campusRewards.reserved_spot && (
            <button
              onClick={async () => {
                if (supabase) {
                  try {
                    const { error } = await supabase
                      .from('campus_rewards')
                      .update({
                        points: campusRewards.points - 50,
                        reserved_spot: 'UNIKIN Parking - Spot A8',
                        updated_at: new Date().toISOString()
                      })
                      .eq('user_id', user.id);
                    if (error) throw error;
                    await loadData();
                    triggerNotification('Reserved parking pass UNIKIN Parking - Spot A8 successfully claimed!', 'success', 'Parking Rewards');
                  } catch (e) {
                    console.error(e);
                    triggerNotification('Failed to claim slot in database.', 'warning', 'Error');
                  }
                } else {
                  const updated = { points: campusRewards.points - 50, reserved_spot: 'UNIKIN Parking - Spot A8' };
                  updateLocalStorage('campus_rewards', updated);
                  triggerNotification('Reserved parking pass UNIKIN Parking - Spot A8 successfully claimed!', 'success', 'Parking Rewards');
                }
              }}
              className="w-full mt-3 py-2 rounded-xl bg-brand-purple text-brand-dark text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer animate-pulse"
            >
              Claim Slot (-50 pts)
            </button>
          )}
        </div>

        {/* Peer Inbox (Active Chats) */}
        {user && (
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-brand-cyan"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Peer Inbox
              </h3>
              {bookings.filter(b => (b.passenger_id === user.id || trips.some(t => t.id === b.trip_id && t.driver_id === user.id)) && (b.status === 'accepted' || b.status === 'pending')).length > 0 && (
                <span className="text-[9px] bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded-full font-bold">
                  {bookings.filter(b => (b.passenger_id === user.id || trips.some(t => t.id === b.trip_id && t.driver_id === user.id)) && (b.status === 'accepted' || b.status === 'pending')).length} active
                </span>
              )}
            </div>

            {(() => {
              const activeChats = bookings.filter(b => 
                (b.passenger_id === user.id || trips.some(t => t.id === b.trip_id && t.driver_id === user.id)) &&
                (b.status === 'accepted' || b.status === 'pending')
              );

              if (activeChats.length === 0) {
                return <p className="text-[10px] text-brand-text-muted italic leading-normal">No active chat sessions. Book a ride to start peer coordination.</p>;
              }

              return (
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {activeChats.map(b => {
                    const isPassenger = b.passenger_id === user.id;
                    const trip = trips.find(t => t.id === b.trip_id);
                    const partnerName = isPassenger ? (trip?.driver_name || 'Driver') : b.passenger_name;
                    const partnerAvatar = isPassenger ? (trip?.driver_avatar || '') : b.passenger_avatar;
                    const partnerRole = isPassenger ? 'Driver' : 'Passenger';
                    
                    return (
                      <button
                        key={b.id}
                        onClick={() => setActiveChatBooking(b)}
                        className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-2 transition-all text-xs text-white"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <img src={partnerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={partnerName} className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{partnerName}</p>
                          <p className="text-[8px] text-brand-text-muted capitalize truncate">{partnerRole} • Click to chat</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

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

        {/* Development Sandbox Swapper */}
        {user && user.role === 'admin' && (
          <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-brand-cyan/5 mt-4">
            <span className="text-[10px] text-brand-cyan uppercase font-extrabold tracking-wider block mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse"></span>
              Role Sandbox Swapper
            </span>
            <p className="text-[10px] text-brand-text-muted leading-tight mb-3">
              Quickly swap active profiles to test different dashboards and view roles.
            </p>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    switchProfile('usr-2'); // Sarah (Passenger)
                    triggerNotification('Swapped session to Sarah Connor (Passenger)', 'info', 'Role Sandbox');
                  }}
                  className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    user?.id === 'usr-2'
                      ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan'
                      : 'bg-white/5 border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  Passenger
                </button>
                <button
                  onClick={() => {
                    switchProfile('usr-1'); // Alex (Driver)
                    triggerNotification('Swapped session to Alex Mercer (Driver)', 'info', 'Role Sandbox');
                  }}
                  className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    user?.id === 'usr-1'
                      ? 'bg-brand-emerald/15 border-brand-emerald text-brand-emerald'
                      : 'bg-white/5 border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  Driver
                </button>
              </div>
              <button
                onClick={() => {
                  switchProfile('usr-3'); // Marcus (Unverified Driver)
                  triggerNotification('Swapped session to Marcus Vance (Unverified Driver)', 'info', 'Role Sandbox');
                }}
                className={`w-full py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                  user?.id === 'usr-3'
                    ? 'bg-yellow-500/15 border-yellow-500 text-yellow-500'
                    : 'bg-white/5 border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                }`}
              >
                Unverified Driver (Marcus)
              </button>
              <button
                onClick={() => {
                  switchProfile('usr-admin'); // System Admin
                  triggerNotification('Swapped session to System Admin', 'info', 'Role Sandbox');
                }}
                className={`w-full py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                  user?.id === 'usr-admin'
                    ? 'bg-brand-purple/15 border-brand-purple text-brand-purple'
                    : 'bg-white/5 border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                }`}
              >
                System Admin (Superadmin)
              </button>
            </div>
          </div>
        )}

      </div>

      {/* CENTER WORKSPACE: WORKFLOW VIEWS */}
      <div className="lg:col-span-9 flex flex-col gap-8">
        {/* WELCOME HEADER BAR WITH NOTIFICATION BELL */}
        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4 flex-wrap gap-4 relative">
          <div>
            <h1 className="text-lg font-bold text-glow-cyan text-white">Welcome back, {user.full_name}!</h1>
            <p className="text-xs text-brand-text-muted mt-0.5">Explore commutes, verify peer credentials, and coordinate shared transit lines in Kinshasa.</p>
          </div>

          {/* Bell Icon & Dropdown Wrapper */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white flex items-center justify-center relative cursor-pointer"
            >
              <Bell className="w-5 h-5 text-brand-cyan" />
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-cyan text-brand-dark font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-dark animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel border border-white/10 shadow-2xl p-3 z-50 animate-fade-in flex flex-col gap-2 bg-brand-dark/95">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-brand-cyan" /> Notifications Log
                  </span>
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setNotifDropdownOpen(false);
                    }}
                    className="text-[10px] text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-brand-text-muted italic py-6 text-center">No recent alerts or screen updates.</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-2 rounded-lg text-[11px] leading-tight border transition-colors ${
                          n.type === 'success' ? 'bg-brand-emerald/5 border-brand-emerald/10 text-white' :
                          n.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-white' :
                          n.type === 'info' ? 'bg-brand-cyan/5 border-brand-cyan/10 text-white' :
                          'bg-white/5 border-white/5 text-white'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-white">{n.title}</span>
                          <span className="text-[8px] text-brand-text-muted shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-brand-text-muted mt-1 leading-normal">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showOnboarding && (
          <div className="glass-panel rounded-3xl p-6 border border-brand-cyan/20 bg-brand-cyan/5 flex flex-col gap-4 relative animate-fade-in">
            <button 
              onClick={() => {
                setShowOnboarding(false);
                localStorage.setItem('coride_onboarding_dismissed', 'true');
                triggerNotification('Onboarding guide dismissed. You can always access help in the menu.', 'info', 'Guide Closed');
              }}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
              title="Dismiss Guide"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-cyan animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Guide de Démarrage Rapide (Quick Start Guide)</h2>
            </div>
            
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Bienvenue sur **CoRide Kinshasa**! Notre plateforme met en relation des conducteurs et des passagers pour partager les trajets quotidiens, réduire les embouteillages et économiser sur le carburant. Suivez ces 3 étapes simples pour commencer :
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold text-xs">1</span>
                <h3 className="text-xs font-bold text-white">Valider mon Profil (Verification)</h3>
                <p className="text-[10px] text-brand-text-muted leading-relaxed">
                  Tous les membres passent par une vérification d'identité (carte d'identité/passeport) pour assurer la sécurité de notre communauté.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-emerald/20 text-brand-emerald flex items-center justify-center font-bold text-xs">2</span>
                <h3 className="text-xs font-bold text-white">Rechercher ou Publier</h3>
                <p className="text-[10px] text-brand-text-muted leading-relaxed">
                  **Conducteurs**: publiez vos trajets et divisez vos frais. **Passagers**: recherchez des trajets correspondants et réservez votre siège.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-xs">3</span>
                <h3 className="text-xs font-bold text-white">Coordonner & Voyager</h3>
                <p className="text-[10px] text-brand-text-muted leading-relaxed">
                  Utilisez notre messagerie intégrée pour fixer le point de rendez-vous, suivez le véhicule en direct sur la carte, et gagnez des bonus!
                </p>
              </div>
            </div>
          </div>
        )}

        {!user.is_verified && user.role !== 'admin' ? (
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

              {/* Your Booked Commutes */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col gap-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-brand-cyan" /> Your Booked Commutes
                </h2>
                
                {userBookings.length === 0 ? (
                  <p className="text-xs text-brand-text-muted italic bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    You haven't booked any commutes yet. Use the search panel below to find and book a ride.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {userBookings.map(booking => {
                      const trip = trips.find(t => t.id === booking.trip_id);
                      return (
                        <div 
                          key={booking.id} 
                          className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3 hover:border-brand-cyan/20 transition-all"
                        >
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                <img 
                                  src={trip?.driver_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                                  alt={trip?.driver_name || 'Driver'} 
                                  className="object-cover w-full h-full" 
                                />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                  {trip?.driver_name || 'Vetted Driver'} 
                                  <span className="text-[10px] text-brand-cyan">({trip?.driver_rating || '5.0'} ★)</span>
                                </p>
                                <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                                  booking.status === 'accepted' ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 animate-pulse' :
                                  booking.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  'bg-white/5 text-brand-text-muted border border-white/10'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs font-bold text-brand-emerald">${trip?.price || '8.00'}</p>
                              <p className="text-[9px] text-brand-text-muted mt-0.5">
                                {trip ? new Date(trip.departure_time).toLocaleDateString() : ''}
                              </p>
                            </div>
                          </div>

                          {/* Route details */}
                          <div className="grid grid-cols-2 gap-3 text-[11px] bg-brand-dark/50 p-2.5 rounded-lg border border-white/5">
                            <div>
                              <span className="text-[8px] uppercase text-brand-text-muted">From</span>
                              <p className="font-semibold text-white/90 truncate">{trip?.origin || 'Origin Location'}</p>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase text-brand-text-muted">To</span>
                              <p className="font-semibold text-white/90 truncate">{trip?.destination || 'Destination Location'}</p>
                            </div>
                          </div>

                          {/* Contact & Driver details */}
                          {trip?.vehicle_info && (
                            <p className="text-[10px] text-brand-text-muted italic">
                              Vehicle: <span className="text-white/80">{trip.vehicle_info}</span>
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex justify-between items-center border-t border-white/5 pt-3 flex-wrap gap-2">
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Cancel Booking
                            </button>

                            <div className="flex gap-2">
                              {/* Chat trigger */}
                              <button
                                onClick={() => {
                                  setActiveChatBooking(booking);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                Chat Driver
                              </button>

                              {/* Live Track trigger */}
                              {booking.status === 'accepted' && trip && (
                                <button
                                  onClick={() => handleTrackTrip(trip, booking)}
                                  className="px-3 py-1.5 rounded-lg bg-brand-cyan hover:bg-cyan-400 text-brand-dark text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-brand-cyan/10"
                                >
                                  <Navigation className="w-3 h-3" /> Track Location
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Search Panel */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4">Find Commutes</h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan" />
                      <input 
                        type="text" 
                        placeholder="Origin (e.g., Gombe, Kintambo)" 
                        value={originQuery}
                        onChange={(e) => setOriginQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-emerald" />
                      <input 
                        type="text" 
                        placeholder="Destination (e.g., UNIKIN, Lemba)" 
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

                  {/* Real-time geocoding search route map preview */}
                  <div className="border-t border-white/5 pt-4 mt-3 flex justify-between items-center flex-wrap gap-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!originQuery && !destQuery) {
                          triggerNotification('Please enter an origin or destination in the search fields to plot on the map.', 'warning', 'Search Empty');
                          return;
                        }
                        triggerNotification('Finding locations on map...', 'info', 'Geocoding');
                        try {
                          let originCoords = null;
                          let destCoords = null;
                          let originName = '';
                          let destName = '';

                          if (originQuery) {
                            const res = await geocodeLocation(originQuery);
                            if (res) {
                              originCoords = [res.lat, res.lng];
                              originName = res.name;
                            }
                          }

                          if (destQuery) {
                            const res = await geocodeLocation(destQuery);
                            if (res) {
                              destCoords = [res.lat, res.lng];
                              destName = res.name;
                            }
                          }

                          if (originCoords && destCoords) {
                            const routeData = await getDrivingRoute(originCoords, destCoords);
                            if (routeData) {
                              setActiveRouteCoordinates(routeData.coordinates);
                              setTrackingActive(false);
                              triggerNotification(`Showing route: ${originName} to ${destName} (${routeData.distanceKm} km)`, 'success', 'Route Found');
                            } else {
                              triggerNotification('Could not calculate a road route between these points.', 'warning', 'Routing Error');
                            }
                          } else if (originCoords) {
                            setActiveRouteCoordinates([originCoords]);
                            setTrackingActive(false);
                            triggerNotification(`Showing location: ${originName}`, 'success', 'Location Found');
                          } else if (destCoords) {
                            setActiveRouteCoordinates([destCoords]);
                            setTrackingActive(false);
                            triggerNotification(`Showing location: ${destName}`, 'success', 'Location Found');
                          } else {
                            triggerNotification('Could not resolve these locations in Kinshasa.', 'warning', 'No Results');
                          }
                        } catch (err) {
                          console.error(err);
                          triggerNotification('Error searching locations.', 'warning', 'Error');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/25 border border-brand-cyan/20 text-brand-cyan text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-cyan/5"
                    >
                      <Map className="w-4 h-4 text-brand-cyan" /> Show Search Route on Map
                    </button>
                    <span className="text-[10px] text-brand-text-muted">
                      100% free driving directions
                    </span>
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
                      Driver **{selectedTripForMap?.driver_name}** is navigating along the Kinshasa commute line. Estimated arrival is 25 minutes.
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
                        placeholder="e.g., Gombe (Centre-ville)" 
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
                        placeholder="e.g., UNIKIN Parking" 
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

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button 
                      type="button" 
                      onClick={handlePreviewRoute}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Map className="w-4 h-4 text-brand-cyan" /> Preview Route
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 rounded-xl bg-brand-emerald text-brand-dark font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Plus className="w-4 h-4" /> Publish Route
                    </button>
                  </div>
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

              {/* Driver Satellite Transit Map */}
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-brand-emerald" /> Route Visualizer
                  </h2>
                </div>

                <div className="w-full h-[240px] rounded-xl overflow-hidden relative border border-white/5 mb-4">
                  <MapComponent 
                    routeCoordinates={activeRouteCoordinates} 
                    animateCar={false}
                    onRouteSelected={(coords) => {
                      setActiveRouteCoordinates(coords);
                    }}
                  />
                </div>

                <p className="text-[10px] text-brand-text-muted leading-relaxed">
                  Select a commute route from **Your Posted Rides** to visualize the coordinates on the map.
                </p>
              </div>
              
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setActiveRouteCoordinates(trip.route_coordinates);
                                triggerNotification(`Viewing route to ${trip.destination} on map.`, 'info', 'Route Selected');
                              }}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold border border-white/10 transition-all cursor-pointer"
                            >
                              View Route
                            </button>
                            <button
                              onClick={() => handleCancelTrip(trip.id)}
                              className="px-3 py-1 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Cancel Commute
                            </button>
                            <button
                              onClick={() => handleCompleteRide(trip)}
                              className="px-3 py-1 rounded bg-brand-cyan hover:bg-cyan-400 text-brand-dark text-[10px] font-bold transition-all cursor-pointer shadow-md shadow-brand-cyan/10"
                            >
                              Mark Completed
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmed Passengers */}
              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Confirmed Peer Commuters</h3>
                
                {driverAcceptedBookings.length === 0 ? (
                  <p className="text-xs text-brand-text-muted italic bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    No confirmed peer passengers yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {driverAcceptedBookings.map(booking => {
                      const trip = trips.find(t => t.id === booking.trip_id);
                      return (
                        <div key={booking.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3 hover:border-brand-emerald/10 transition-all">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                <img src={booking.passenger_avatar} alt={booking.passenger_name} className="object-cover w-full h-full" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white">{booking.passenger_name}</p>
                                <p className="text-[10px] text-brand-text-muted">
                                  commutes to: <span className="text-white/80">{trip?.destination || 'Destination'}</span>
                                </p>
                              </div>
                            </div>

                            <span className="text-[9px] bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded-full font-bold uppercase">
                              Active
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-white/5 pt-3">
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Remove Rider
                            </button>

                            <button
                              onClick={() => setActiveChatBooking(booking)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              Chat Passenger
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

                            {/* KYC Info Button */}
                            <button
                              onClick={() => setSelectedKycUser(p)}
                              className="px-2 py-1 rounded bg-brand-purple/20 hover:bg-brand-purple text-brand-purple hover:text-brand-dark text-[10px] font-bold transition-all cursor-pointer"
                            >
                              KYC Info
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

      {/* KYC DOSSIER MODAL OVERLAY */}
      {selectedKycUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-2xl w-full rounded-3xl p-6 border border-white/10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-scale-in relative">
            <button
              onClick={() => setSelectedKycUser(null)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] bg-brand-purple/15 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                KYC Dossier Review
              </span>
              <h3 className="text-lg font-bold text-white mt-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-purple" /> {selectedKycUser.full_name}'s Vetting Info
              </h3>
              <p className="text-xs text-brand-text-muted">
                Audit registered identity, driving license verification, and physical vehicle safety checklists.
              </p>
            </div>

            {/* Profile trust summary */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-brand-purple">
                <img 
                  src={selectedKycUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                  alt="User Avatar" 
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white leading-tight">{selectedKycUser.full_name}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">{selectedKycUser.email}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-[10px] text-brand-text-muted capitalize">Role: <strong className="text-white">{selectedKycUser.role}</strong></span>
                  <span className="text-[10px] text-brand-text-muted">Status: <strong className={selectedKycUser.is_verified ? "text-brand-emerald" : "text-yellow-500"}>{selectedKycUser.is_verified ? "Verified" : "Pending Vetting"}</strong></span>
                  {selectedKycUser.is_banned && <span className="text-[10px] text-red-400 font-bold">Suspended</span>}
                </div>
              </div>
            </div>

            {/* KYC Submission Details */}
            {selectedKycUser.kyc_dob ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ID Details Card */}
                <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Identity Details</h4>
                  
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">Date of Birth:</span>
                      <span className="text-white font-semibold">{selectedKycUser.kyc_dob}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">ID Type:</span>
                      <span className="text-white font-semibold capitalize">{selectedKycUser.kyc_id_type?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">Document Number:</span>
                      <span className="text-white font-semibold">{selectedKycUser.kyc_id_number}</span>
                    </div>
                  </div>

                  {selectedKycUser.kyc_id_file ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] uppercase font-bold text-brand-text-muted">Official ID Image:</span>
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group cursor-pointer bg-black flex items-center justify-center">
                        <img 
                          src={selectedKycUser.kyc_id_file} 
                          alt="ID Document" 
                          className="object-contain max-h-full" 
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-yellow-500 italic mt-2">No ID image document uploaded.</p>
                  )}
                </div>

                {/* Driver Licensing Card */}
                {selectedKycUser.role === 'driver' && (
                  <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Driver Licensing</h4>
                    
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-brand-text-muted">License Plate:</span>
                        <span className="text-white font-semibold">{selectedKycUser.vehicle_info || 'Not Vetted'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-text-muted">License Number:</span>
                        <span className="text-white font-semibold">{selectedKycUser.kyc_license_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-text-muted">Expiry Date:</span>
                        <span className="text-white font-semibold">{selectedKycUser.kyc_license_expiry || 'N/A'}</span>
                      </div>
                    </div>

                    {selectedKycUser.kyc_license_file ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-[10px] uppercase font-bold text-brand-text-muted">Driving License:</span>
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group cursor-pointer bg-black flex items-center justify-center">
                          <img 
                            src={selectedKycUser.kyc_license_file} 
                            alt="License Document" 
                            className="object-contain max-h-full" 
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-yellow-500 italic mt-2">No license photo uploaded.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-brand-text-muted text-xs border border-dashed border-white/5 rounded-2xl">
                This user has not completed the identity verification form yet.
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5 justify-end">
              <button
                onClick={() => setSelectedKycUser(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
              
              <button
                onClick={async () => {
                  await handleToggleVerify(selectedKycUser.id, selectedKycUser.is_verified);
                  setSelectedKycUser(prev => ({ ...prev, is_verified: !prev.is_verified }));
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedKycUser.is_verified 
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                    : 'bg-brand-emerald/15 text-brand-emerald hover:bg-brand-emerald/25 border border-brand-emerald/20'
                }`}
              >
                {selectedKycUser.is_verified ? 'Revoke Verification' : 'Verify Account'}
              </button>

              <button
                onClick={async () => {
                  await handleToggleBan(selectedKycUser.id, selectedKycUser.is_banned);
                  setSelectedKycUser(prev => ({ ...prev, is_banned: !prev.is_banned }));
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedKycUser.is_banned 
                    ? 'bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25' 
                    : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                }`}
              >
                {selectedKycUser.is_banned ? 'Restore Account' : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REAL-TIME CHAT MODAL OVERLAY */}
      {activeChatBooking && (() => {
        const isUserPassenger = user.id === activeChatBooking.passenger_id;
        const trip = trips.find(t => t.id === activeChatBooking.trip_id);
        const chatPartnerName = isUserPassenger ? (trip?.driver_name || 'Vetted Driver') : activeChatBooking.passenger_name;
        const chatPartnerAvatar = isUserPassenger ? (trip?.driver_avatar || '') : activeChatBooking.passenger_avatar;
        const chatPartnerRole = isUserPassenger ? 'Driver' : 'Passenger';
        
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-white/10 flex flex-col h-[520px] max-h-[80vh] animate-scale-in relative shadow-2xl">
              
              {/* Close Button */}
              <button
                onClick={() => setActiveChatBooking(null)}
                className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 relative">
                  <img 
                    src={chatPartnerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                    alt="Chat Partner Avatar" 
                    className="object-cover w-full h-full" 
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-emerald rounded-full border-2 border-brand-dark"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{chatPartnerName}</h4>
                  <p className="text-[10px] text-brand-text-muted capitalize mt-0.5">{chatPartnerRole} • Active Coordination</p>
                </div>
              </div>

              {/* Message History area */}
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 scrollbar-thin pr-1">
                {chatMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-brand-text-muted text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="mb-2 text-white/20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p className="font-semibold text-white/40">Secure Peer-to-Peer Chat</p>
                    <p className="text-[10px] max-w-[200px] mt-1 text-center">Coordinate departure times, locations, and safety preferences in real time.</p>
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isSenderMe = msg.sender_id === user.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[75%] ${isSenderMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isSenderMe 
                            ? 'bg-brand-cyan text-brand-dark rounded-tr-none font-medium' 
                            : 'bg-white/5 border border-white/5 text-white rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] text-brand-text-muted mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input area */}
              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-4 shrink-0">
                <input
                  type="text"
                  placeholder="Type a secure message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2.5 bg-brand-cyan hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-brand-cyan text-brand-dark font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-brand-cyan/10 shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        );
      })()}

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
