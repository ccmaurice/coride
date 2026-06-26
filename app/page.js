'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Shield, 
  Gift, 
  DollarSign, 
  Users, 
  Sparkles, 
  Car, 
  CheckCircle 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (origin || destination) {
      router.push(`/dashboard?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-dark overflow-hidden relative">
      
      {/* Dynamic Glow Circles Background */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 md:px-8 text-center max-w-5xl mx-auto flex-1 flex flex-col justify-center items-center">
        
        {/* Generated Logo Image Embed */}
        <div className="mb-6 animate-float flex flex-col items-center">
          <img 
            src="/coride_logo.png" 
            alt="CoRide Branding Logo" 
            className="w-24 h-24 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] border border-white/10" 
          />
          <span className="mt-2 text-xs uppercase tracking-widest text-brand-cyan font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan inline" /> Partagez le trajet, divisez les frais • Share the ride, split the costs
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Covoiturage Moderne à <br />
          <span className="bg-gradient-to-r from-brand-cyan via-brand-emerald to-brand-purple bg-clip-text text-transparent text-glow-cyan">
            Kinshasa
          </span>
        </h1>
        
        <p className="text-base md:text-lg text-brand-text-muted max-w-2xl mb-10 leading-relaxed">
          CoRide met en relation conducteurs et passagers en temps réel. Partagez vos frais de déplacement, gagnez des bonus carburant et profitez de places de parking privilégiées aux universités et centres d'affaires.
        </p>

        {/* HERO SEARCH WIDGET */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-3xl glass-panel rounded-2xl p-4 md:p-6 mb-12 shadow-2xl flex flex-col md:flex-row items-center gap-4 border border-white/10"
        >
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Input */}
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-cyan" />
              <input 
                type="text" 
                placeholder="Lieu de départ (e.g., Gombe, Kintambo, Victoire)" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-text-muted text-sm focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>
            
            {/* Destination Input */}
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-emerald" />
              <input 
                type="text" 
                placeholder="Lieu d'arrivée (e.g., UNIKIN, Limete, Lemba)" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-text-muted text-sm focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald transition-all"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-brand-dark font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg btn-glow-cyan cursor-pointer shrink-0"
          >
            Rechercher <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link 
            href="/dashboard?tab=driver" 
            className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Car className="w-4 h-4 text-brand-cyan" /> Proposer un trajet (Devenir Conducteur)
          </Link>
        </div>
      </section>

      {/* CORE FEATURES PILLARS */}
      <section className="py-16 px-4 md:px-8 border-t border-white/5 bg-brand-card/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Pourquoi voyager avec <span className="text-brand-cyan">CoRide</span> ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Trust & Safety */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-brand-cyan" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white">Sécurité Validée</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Votre sécurité est notre priorité. Tous les conducteurs passent par une vérification d'identité stricte (permis de conduire et pièces d'identité vérifiés).
              </p>
            </div>

            {/* Smart Matching */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-emerald" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white">Mise en Relation</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Notre algorithme trouve instantanément les conducteurs et passagers qui partagent le même itinéraire et les mêmes horaires.
              </p>
            </div>

            {/* Government Incentives */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-brand-purple" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white">Bonus Carburant</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Gagnez des bonus financiers par kilomètre parcouru en covoiturant. Moins de voitures sur la route, plus d'économies dans votre poche !
              </p>
            </div>

            {/* Campus Priority */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white">Parking Privilégié</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Accumulez des points de fidélité à chaque trajet partagé et débloquez des places de parking réservées aux universités partenaires (ex: UNIKIN).
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* INTERACTIVE MOCK TRIP ESTIMATOR */}
      <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1">
            <span className="text-xs font-bold text-brand-cyan uppercase tracking-widest">Estimation des Économies & Bonus</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2 mb-4">
              Gagnez en Partageant
            </h2>
            <p className="text-sm text-brand-text-muted leading-relaxed mb-6">
              CoRide vous aide à rentabiliser vos sièges vides. En transportant d'autres membres de la communauté, vous réduisez vos frais de carburant et gagnez des bonus à chaque kilomètre.
            </p>
            
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
              <div>
                <p className="text-xs text-brand-text-muted">Bonus CoRide</p>
                <p className="text-xl md:text-2xl font-bold text-brand-cyan mt-1">$0.25<span className="text-xs text-brand-text-muted">/km</span></p>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Partage Passager</p>
                <p className="text-xl md:text-2xl font-bold text-brand-emerald mt-1">~$0.12<span className="text-xs text-brand-text-muted">/km</span></p>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Parking VIP</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-500 mt-1">Prioritaire</p>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-xs text-brand-text-muted">Trajet Quotidien (30 km)</span>
              <span className="text-xs font-semibold text-white">Bonus : $7.50/jour</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-xs text-brand-text-muted">Économies par Semaine</span>
              <span className="text-xs font-semibold text-brand-cyan">$37.50 accumulés</span>
            </div>
            <Link 
              href="/dashboard" 
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-brand-dark text-center font-bold text-sm hover:opacity-90 transition-opacity btn-glow-cyan"
            >
              Commencer Maintenant
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
