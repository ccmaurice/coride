'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../lib/UserContext';
import { 
  Mail, 
  User, 
  Car, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Lock
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { user, login, signup, loading: authLoading } = useUser();
  
  // Tab control: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('passenger'); // passenger | driver
  const [vehicleInfo, setVehicleInfo] = useState('');
  
  // UX states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      setErrorMsg('');
      setSuccessMsg('');
      setSubmitting(true);
      
      await login(email, password);
      
      setSuccessMsg('Signed in successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (role === 'driver' && !vehicleInfo) {
      setErrorMsg('Please specify your vehicle information.');
      return;
    }

    try {
      setErrorMsg('');
      setSuccessMsg('');
      setSubmitting(true);
      
      await signup(email, password, fullName, role, role === 'driver' ? vehicleInfo : null);
      
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Try a different email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-brand-dark min-h-[85vh] py-12 px-4 relative overflow-hidden">
      
      {/* Background Decorative Neon Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs text-brand-text-muted hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link>

        {/* Brand Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/coride_logo.png" 
            alt="CoRide Logo" 
            className="w-16 h-16 rounded-2xl shadow-xl border border-white/10 mb-3" 
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome to <span className="text-brand-cyan text-glow-cyan">CoRide</span>
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">Smart commuting and carpooling platform</p>
        </div>

        {/* Auth Panel Card */}
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          
          {/* Tab selectors */}
          <div className="grid grid-cols-2 border-b border-white/5 bg-white/[0.02]">
            <button
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg('');
                setSuccessMsg('');
                setPassword('');
              }}
              className={`py-3.5 text-xs font-bold transition-all relative ${
                activeTab === 'signin' 
                  ? 'text-brand-cyan border-b-2 border-brand-cyan bg-white/[0.02]' 
                  : 'text-brand-text-muted hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
                setSuccessMsg('');
                setPassword('');
              }}
              className={`py-3.5 text-xs font-bold transition-all relative ${
                activeTab === 'signup' 
                  ? 'text-brand-cyan border-b-2 border-brand-cyan bg-white/[0.02]' 
                  : 'text-brand-text-muted hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 md:p-8">
            
            {/* Notifications */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 animate-slide-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs flex items-start gap-2.5 animate-slide-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* forms */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input 
                      type="email" 
                      placeholder="e.g. classmate@school.edu" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-muted">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-brand-text-muted/60 mt-0.5">
                    For seeded users: use email above and password <span className="text-brand-cyan">password123</span>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="w-full py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-brand-dark font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg btn-glow-cyan cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-muted">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input 
                      type="email" 
                      placeholder="e.g. classmate@school.edu" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-muted">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input 
                      type="password" 
                      placeholder="Minimum 6 characters" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    />
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-muted">I want to join as</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('passenger')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === 'passenger' 
                          ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' 
                          : 'bg-white/5 border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Passenger
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === 'driver' 
                          ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' 
                          : 'bg-white/5 border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" /> Driver
                    </button>
                  </div>
                </div>

                {/* Conditional Vehicle Info */}
                {role === 'driver' && (
                  <div className="flex flex-col gap-1.5 animate-slide-in">
                    <label className="text-[10px] uppercase font-bold text-brand-text-muted">Vehicle Details (Vetting Queue)</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input 
                        type="text" 
                        placeholder="e.g. Chevrolet Bolt (White) or Tesla Model Y" 
                        value={vehicleInfo}
                        onChange={(e) => setVehicleInfo(e.target.value)}
                        required={role === 'driver'}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-brand-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-brand-text-muted">
                      💡 Drivers are placed in a background vetting queue for safety check before vehicle approval.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="w-full py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-brand-dark font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg btn-glow-cyan cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Registering...' : 'Register Account'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
