import React, { useEffect, useRef, useState } from 'react';
import { Entrega, Veiculo } from '../types';
import { DEFAULT_BASE } from '../utils/routingEngine';
import { MapPin, Navigation, Truck, RefreshCw } from 'lucide-react';

interface SimulatedMapProps {
  baseCoords?: { lat: number; lng: number };
  entregas: Entrega[];
  rotas?: Record<number, Entrega[]>; // clusterId -> ordered entregas
  veiculosSelecionados?: Veiculo[];
  onSelectEntrega?: (entrega: Entrega) => void;
}

export default function SimulatedMap({
  baseCoords = { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude },
  entregas,
  rotas = {},
  veiculosSelecionados = []
}: SimulatedMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routesRef = useRef<any[]>([]);

  // Distinct colors for routes
  const routeColors = [
    '#2563eb', // Blue
    '#059669', // Emerald
    '#7c3aed', // Violet
    '#d97706', // Amber
    '#db2777', // Pink
    '#0891b2', // Cyan
    '#dc2626', // Red
  ];

  // Dynamic loading of Leaflet from CDNs
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync / update map markers and paths
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [baseCoords.lat, baseCoords.lng],
        12
      );

      // Add a beautiful modern vector tile layer (CartoDB Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear existing routes
    routesRef.current.forEach(r => r.remove());
    routesRef.current = [];

    // Base CD Hub marker icon
    const baseIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-violet-400 opacity-75"></span>
        <div class="relative w-5 h-5 rounded-full bg-violet-600 border-2 border-white flex items-center justify-center shadow-lg">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const baseMarker = L.marker([baseCoords.lat, baseCoords.lng], { icon: baseIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-1" style="font-family: sans-serif; font-size: 11px;">
          <b style="font-size: 12px; color: #7c3aed;">CD Hub Principal</b><br/>
          ${DEFAULT_BASE.nome}<br/>
          ${DEFAULT_BASE.cidade} - ${DEFAULT_BASE.estado}
        </div>
      `);
    markersRef.current.push(baseMarker);

    // Add delivery points markers
    entregas.forEach((ent, i) => {
      // Find color and route label
      let pointColor = '#4b5563'; // slate-600
      let routeLabel = 'Não Roteada';
      Object.entries(rotas).forEach(([cId, points], rIdx) => {
        if (points.some(p => p.id === ent.id || p.chave === ent.chave)) {
          pointColor = routeColors[rIdx % routeColors.length];
          routeLabel = `Rota ${rIdx + 1}`;
        }
      });

      const pinIcon = L.divIcon({
        html: `<div class="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all hover:scale-125" style="background-color: ${pointColor}">
          <div class="w-1 h-1 bg-white rounded-full"></div>
        </div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([ent.latitude, ent.longitude], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; min-width: 170px;">
            <b style="font-size: 12px; color: #0f172a; display: block; margin-bottom: 3px;">${ent.cliente}</b>
            <b>Operação:</b> <span class="uppercase text-violet-600 font-bold">${ent.tipoOperacao}</span><br/>
            <b>Chave:</b> <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px;">${ent.chave}</code><br/>
            <b>Peso Carga:</b> ${ent.pesoMercadoriaKg} kg<br/>
            <b>Status:</b> <span style="color: ${ent.status === 'Pendente' ? '#d97706' : '#059669'}">${ent.status}</span><br/>
            <b>Alocação:</b> <span style="color: ${pointColor}; font-weight: bold;">${routeLabel}</span><br/>
            <span style="display: block; margin-top: 4px; color: #64748b; font-size: 10px; border-top: 1px solid #f1f5f9; pt-4">${ent.endereco}</span>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Draw paths for active routes
    Object.entries(rotas).forEach(([clusterId, points], idx) => {
      const color = routeColors[idx % routeColors.length];
      if (points.length === 0) return;

      const pathLatLngs = [
        [baseCoords.lat, baseCoords.lng],
        ...points.map(p => [p.latitude, p.longitude]),
        [baseCoords.lat, baseCoords.lng]
      ];

      // Outer glow line
      const glowPath = L.polyline(pathLatLngs, {
        color: color,
        weight: 8,
        opacity: 0.15
      }).addTo(map);
      routesRef.current.push(glowPath);

      // Inner active line
      const activePath = L.polyline(pathLatLngs, {
        color: color,
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 6'
      }).addTo(map);
      routesRef.current.push(activePath);
    });

    // Auto fit map bounds to cover all points
    const allCoords = [
      baseCoords,
      ...entregas.map(e => ({ lat: e.latitude, lng: e.longitude }))
    ];

    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([baseCoords.lat, baseCoords.lng], 13);
    }
  }, [leafletLoaded, entregas, rotas, baseCoords]);

  if (!leafletLoaded) {
    return (
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[500px] w-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 animate-pulse">Carregando mapa interativo georreferenciado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[500px] w-full group">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 relative" style={{ background: '#f1f5f9' }} />

      {/* Top Left Status Overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 border border-slate-800/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-300 shadow-xl flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 text-violet-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          NÚCLEO GEORREFERENCIADO REAL
        </div>
        <div>CD Central: {DEFAULT_BASE.cidade} - {DEFAULT_BASE.estado}</div>
        <div>Pontos Plotados: <span className="text-white font-bold">{entregas.length}</span></div>
        {Object.keys(rotas).length > 0 && (
          <div className="text-emerald-400 font-semibold">Rotas Otimizadas: {Object.keys(rotas).length}</div>
        )}
      </div>

      {/* Legends Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/95 border border-slate-800/80 backdrop-blur px-3.5 py-2.5 rounded-xl text-[10px] font-mono text-slate-400 flex flex-col gap-1.5 shadow-xl max-w-[170px] pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 border border-white" />
          <span className="text-slate-200">Hub CD Central</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-white" />
          <span className="text-slate-400">Não Roteado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t border-dashed border-blue-500 inline-block" />
          <span className="text-slate-400">Rotas Ativas (Vetor)</span>
        </div>
      </div>
    </div>
  );
}
