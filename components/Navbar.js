'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '../lib/UserContext';
import { Car, Compass, User, LogOut, ChevronDown, CheckCircle, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, switchProfile, allProfiles } = useUser();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10">
            <img 
              src="/coride_logo.png" 
              alt="CoRide Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-brand-cyan bg-clip-text text-transparent">
            Co<span className="text-brand-cyan">Ride</span>
          </span>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors hover:text-white ${isActive('/') ? 'text-brand-cyan text-glow-cyan' : 'text-brand-text-muted'}`}
          >
            Home
          </Link>
          <Link 
            href="/dashboard" 
            className={`text-sm font-medium transition-colors hover:text-white ${isActive('/dashboard') ? 'text-brand-cyan text-glow-cyan' : 'text-brand-text-muted'}`}
          >
            Dashboard
          </Link>
        </nav>

        {/* PROFILE ACTION & SWITCHER */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left"
              >
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20">
                  <img 
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                    alt={user.full_name} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="hidden sm:block text-xs">
                  <p className="font-semibold leading-none text-white max-w-[100px] truncate">{user.full_name}</p>
                  <p className="text-[10px] text-brand-text-muted capitalize flex items-center gap-0.5 mt-0.5">
                    {user.role}
                    {user.is_verified && <CheckCircle className="w-2.5 h-2.5 text-brand-emerald inline" />}
                    {user.role === 'admin' && <Shield className="w-2.5 h-2.5 text-brand-purple inline" />}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-brand-text-muted hidden sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 border border-white/10 animate-fade-in">
                  {user.role === 'admin' && (
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                      <p className="text-[10px] uppercase font-bold text-brand-text-muted">Simulate User Role</p>
                      <p className="text-xs text-white/50 mb-2">Quickly swap accounts to test different dashboard roles:</p>
                      
                      {/* User Quick Switcher */}
                      <div className="flex flex-col gap-1">
                        {allProfiles.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              switchProfile(p.id);
                              setDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors ${
                              user.id === p.id 
                                ? 'bg-brand-cyan/15 text-brand-cyan font-medium border border-brand-cyan/20' 
                                : 'hover:bg-white/5 text-brand-text-muted hover:text-white'
                            }`}
                          >
                            <span className="truncate">{p.full_name} ({p.role})</span>
                            {user.id === p.id && <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs hover:bg-white/5 text-white transition-colors"
                  >
                    <Compass className="w-4 h-4" /> Go to Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-cyan text-brand-dark hover:bg-cyan-400 transition-colors shadow-lg btn-glow-cyan"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
