'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function MapComponent({ routeCoordinates = [], animateCar = false, onRouteSelected }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const carMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [animationIndex, setAnimationIndex] = useState(0);

  // Initialize Map
  const initMap = () => {
    if (typeof window === 'undefined' || !window.L || mapInstanceRef.current) return;

    const L = window.L;

    // Custom Map Styling (Dark themed tile server from CartoDB)
    const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const defaultCenter = [-4.325, 15.312]; // Kinshasa default
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 11,
      layers: [darkTileLayer]
    });

    mapInstanceRef.current = map;

    // Optional click handler to simulate selecting a route
    map.on('click', (e) => {
      if (onRouteSelected) {
        // Generate a random mock route from current center to click point
        const origin = defaultCenter;
        const dest = [e.latlng.lat, e.latlng.lng];
        const route = [
          origin,
          [origin[0] + (dest[0] - origin[0]) * 0.3, origin[1] + (dest[1] - origin[1]) * 0.1],
          [origin[0] + (dest[0] - origin[0]) * 0.7, origin[1] + (dest[1] - origin[1]) * 0.8],
          dest
        ];
        onRouteSelected(route);
      }
    });
  };

  useEffect(() => {
    if (leafletLoaded) {
      initMap();
    }
    
    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Handle Route Rendering & Animation
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !window.L) return;
    
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clean old layers
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
    if (carMarkerRef.current) map.removeLayer(carMarkerRef.current);

    if (!routeCoordinates || routeCoordinates.length === 0) return;

    // Add Route Polyline (Glowing cyan line)
    routePolylineRef.current = L.polyline(routeCoordinates, {
      color: '#06b6d4',
      weight: 4,
      opacity: 0.8,
      shadowBlur: 10,
      shadowColor: '#06b6d4'
    }).addTo(map);

    // Custom Icon for start/end
    const startIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="w-6 h-6 rounded-full bg-brand-cyan border-2 border-white flex items-center justify-center text-brand-dark font-bold text-[9px]">A</div>`,
      iconSize: [24, 24]
    });

    const endIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="w-6 h-6 rounded-full bg-brand-emerald border-2 border-white flex items-center justify-center text-brand-dark font-bold text-[9px]">B</div>`,
      iconSize: [24, 24]
    });

    // Start/End markers
    startMarkerRef.current = L.marker(routeCoordinates[0], { icon: startIcon }).addTo(map);
    endMarkerRef.current = L.marker(routeCoordinates[routeCoordinates.length - 1], { icon: endIcon }).addTo(map);

    // Zoom map to fit the route bounds
    const bounds = L.latLngBounds(routeCoordinates);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Car Icon for tracking simulation
    const carIcon = L.divIcon({
      className: 'custom-car-marker',
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center bg-brand-cyan text-brand-dark rounded-xl shadow-lg border border-white/20">
          <div class="pulse-ring"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
      `,
      iconSize: [32, 32]
    });

    // Place initial car marker at start of route
    carMarkerRef.current = L.marker(routeCoordinates[0], { icon: carIcon }).addTo(map);

    // Animate car moving along route coordinates
    if (animateCar && routeCoordinates.length > 1) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < routeCoordinates.length - 1) {
          currentIndex++;
          const nextPos = routeCoordinates[currentIndex];
          if (carMarkerRef.current) {
            carMarkerRef.current.setLatLng(nextPos);
          }
        } else {
          // Loop back to start to simulate constant tracking
          currentIndex = 0;
          if (carMarkerRef.current) {
            carMarkerRef.current.setLatLng(routeCoordinates[0]);
          }
        }
      }, 2500); // Step every 2.5 seconds

      return () => clearInterval(interval);
    }

  }, [routeCoordinates, leafletLoaded, animateCar]);

  return (
    <div className="w-full h-full relative">
      {/* Leaflet JS CDN Script loader */}
      <Script 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        onLoad={() => setLeafletLoaded(true)}
      />
      
      {/* Map DOM Element */}
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[300px] md:min-h-[450px] shadow-2xl relative z-10" 
      />

      {/* Map Loader Overlay */}
      {!leafletLoaded && (
        <div className="absolute inset-0 bg-brand-dark/95 flex items-center justify-center z-20 rounded-2xl border border-white/10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-brand-cyan border-t-transparent animate-spin"></div>
            <p className="text-xs text-brand-text-muted">Loading Satellite Navigation Maps...</p>
          </div>
        </div>
      )}
    </div>
  );
}
