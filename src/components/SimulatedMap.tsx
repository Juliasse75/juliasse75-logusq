import React, { useEffect, useRef, useState } from 'react';
import { Entrega, Veiculo } from '../types';
import { DEFAULT_BASE } from '../utils/routingEngine';
import { MapPin, Navigation, Truck, RefreshCw, Eye, EyeOff, Layers, Filter } from 'lucide-react';

interface SimulatedMapProps {
  baseCoords?: { lat: number; lng: number };
  entregas: Entrega[];
  rotas?: Record<number, Entrega[]>; // clusterId -> ordered entregas
  veiculosSelecionados?: Veiculo[];
  activeRoutes?: Record<string, { driver: string; driverEmail?: string; vehicle: string; path: Entrega[]; km: number; duration: number }>;
  onSelectEntrega?: (entrega: Entrega) => void;
}

export default function SimulatedMap({
  baseCoords = { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude },
  entregas,
  rotas = {},
  veiculosSelecionados = [],
  activeRoutes = {}
}: SimulatedMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routesRef = useRef<any[]>([]);

  // Filters and Styles state
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('all');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');
  const [mapStyle, setMapStyle] = useState<'dark' | 'osm' | 'voyager'>('dark');

  // Distinct bright colors for routes to maximize contrast on both dark and light tiles
  const routeColors = [
    '#2563eb', // Blue
    '#10b981', // Emerald/Green
    '#8b5cf6', // Violet
    '#f59e0b', // Amber/Orange
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#ef4444', // Red
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

  // Get filtered routes to draw on the map
  const getRoutesToDisplay = (): Record<number, Entrega[]> => {
    const hasActiveRoutes = activeRoutes && Object.keys(activeRoutes).length > 0;
    if (!hasActiveRoutes) {
      return rotas;
    }

    const filteredRotas: Record<number, Entrega[]> = {};
    Object.entries(activeRoutes).forEach(([routeId, r], idx) => {
      const matchDriver = selectedDriverFilter === 'all' || r.driver === selectedDriverFilter;
      const matchVehicle = selectedVehicleFilter === 'all' || r.vehicle === selectedVehicleFilter;
      
      if (matchDriver && matchVehicle) {
        filteredRotas[idx] = r.path;
      } else {
        filteredRotas[idx] = []; // Empty path = hide route line
      }
    });

    return filteredRotas;
  };

  const displayedRotas = getRoutesToDisplay();

  // Extract unique drivers and vehicles for filter select lists
  const uniqueDrivers = activeRoutes 
    ? Array.from(new Set(Object.values(activeRoutes).map(r => r.driver))).filter(Boolean)
    : [];
  const uniqueVehicles = activeRoutes 
    ? Array.from(new Set(Object.values(activeRoutes).map(r => r.vehicle))).filter(Boolean)
    : [];

  // Sync / update map markers, tile layers, and paths
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
    }

    const map = mapRef.current;

    // Update Tile Layer on mapStyle change
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // dark high-contrast (Default)
    if (mapStyle === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // standard colorful street
    } else if (mapStyle === 'voyager') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; // voyager light
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

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

    // Filter points and display
    const isFilterActive = selectedDriverFilter !== 'all' || selectedVehicleFilter !== 'all';

    entregas.forEach((ent) => {
      // Find color and route label for this delivery point
      let pointColor = '#64748b'; // slate-500 default
      let routeLabel = 'Não Roteada';
      let isPointMatch = !isFilterActive;

      // Match with activeRoutes if exists
      if (activeRoutes && Object.keys(activeRoutes).length > 0) {
        Object.entries(activeRoutes).forEach(([routeId, r], rIdx) => {
          const matchDriver = selectedDriverFilter === 'all' || r.driver === selectedDriverFilter;
          const matchVehicle = selectedVehicleFilter === 'all' || r.vehicle === selectedVehicleFilter;
          const containsPoint = r.path.some(p => p.id === ent.id || p.chave === ent.chave);
          
          if (containsPoint) {
            pointColor = routeColors[rIdx % routeColors.length];
            routeLabel = `${routeId} (${r.driver})`;
            if (matchDriver && matchVehicle) {
              isPointMatch = true;
            }
          }
        });
      } else {
        // Match with legacy rotas
        Object.entries(rotas).forEach(([cId, points], rIdx) => {
          if (points.some(p => p.id === ent.id || p.chave === ent.chave)) {
            pointColor = routeColors[rIdx % routeColors.length];
            routeLabel = `Rota ${rIdx + 1}`;
          }
        });
      }

      // If filter is active and this point does not match, either fade it out or hide it.
      // Fading it out maintains spatial context but keeps selected route visible.
      const opacity = isPointMatch ? 1.0 : 0.15;

      const pinIcon = L.divIcon({
        html: `<div class="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all hover:scale-125" 
          style="background-color: ${pointColor}; opacity: ${opacity};">
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
            <span style="display: block; margin-top: 4px; color: #64748b; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 4px;">${ent.endereco}</span>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Draw path vectors for filtered routes
    Object.entries(displayedRotas).forEach(([clusterId, points], idx) => {
      const color = routeColors[idx % routeColors.length];
      if (!points || points.length === 0) return;

      const pathLatLngs = [
        [baseCoords.lat, baseCoords.lng],
        ...points.map(p => [p.latitude, p.longitude]),
        [baseCoords.lat, baseCoords.lng]
      ];

      // Outer glow line
      const glowPath = L.polyline(pathLatLngs, {
        color: color,
        weight: 8,
        opacity: 0.2
      }).addTo(map);
      routesRef.current.push(glowPath);

      // Inner active line (dash pattern gives a vector movement sensation)
      const activePath = L.polyline(pathLatLngs, {
        color: color,
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 6'
      }).addTo(map);
      routesRef.current.push(activePath);
    });

    // Auto fit map bounds to cover visible filtered points
    const activeCoords = [
      baseCoords,
      ...entregas.map(e => {
        // Only include if matches active filters
        let isMatch = !isFilterActive;
        if (activeRoutes && Object.keys(activeRoutes).length > 0) {
          Object.values(activeRoutes).forEach(r => {
            const matchDriver = selectedDriverFilter === 'all' || r.driver === selectedDriverFilter;
            const matchVehicle = selectedVehicleFilter === 'all' || r.vehicle === selectedVehicleFilter;
            if (matchDriver && matchVehicle && r.path.some(p => p.id === e.id || p.chave === e.id)) {
              isMatch = true;
            }
          });
        }
        return isMatch ? { lat: e.latitude, lng: e.longitude } : null;
      }).filter(Boolean) as { lat: number; lng: number }[]
    ];

    if (activeCoords.length > 1) {
      const bounds = L.latLngBounds(activeCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([baseCoords.lat, baseCoords.lng], 13);
    }
  }, [leafletLoaded, entregas, displayedRotas, baseCoords, mapStyle, selectedDriverFilter, selectedVehicleFilter, activeRoutes]);

  if (!leafletLoaded) {
    return (
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[520px] w-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 animate-pulse">Carregando mapa interativo georreferenciado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[550px] w-full group flex flex-col isolate">
      
      {/* Map Control Toolbar (Header) */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap gap-3 items-center justify-between z-[1001]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Painel Cartográfico de Distribuição</span>
        </div>

        {/* Filters and Style selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Driver filter */}
          {uniqueDrivers.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Motorista:</span>
              <select
                value={selectedDriverFilter}
                onChange={e => setSelectedDriverFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white font-sans max-w-[140px]"
              >
                <option value="all">-- Todos --</option>
                {uniqueDrivers.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Vehicle filter */}
          {uniqueVehicles.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Veículo:</span>
              <select
                value={selectedVehicleFilter}
                onChange={e => setSelectedVehicleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white font-sans max-w-[130px]"
              >
                <option value="all">-- Todos --</option>
                {uniqueVehicles.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Contrast / Map Style Toggle */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Contraste:</span>
            <div className="flex bg-slate-950 border border-slate-800 rounded p-0.5">
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${mapStyle === 'dark' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Alta visibilidade escura"
              >
                Escuro
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('osm')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${mapStyle === 'osm' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Rico em detalhes e contrastes"
              >
                Rua
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('voyager')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${mapStyle === 'voyager' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Original claro"
              >
                Claro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Canvas Workspace */}
      <div className="flex-1 relative">
        {/* Actual Map Element */}
        <div ref={mapContainerRef} className="w-full h-full z-0 relative" style={{ background: '#020617' }} />

        {/* Top Left Status Overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 rounded-lg text-[10px] font-mono text-slate-300 shadow-xl flex flex-col gap-0.5 pointer-events-none">
          <div className="flex items-center gap-1.5 text-violet-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            VETOR GEORREFERENCIADO
          </div>
          <div>CD Central: <span className="text-white font-sans">{DEFAULT_BASE.cidade} - {DEFAULT_BASE.estado}</span></div>
          <div>Pontos Totais: <span className="text-white font-bold">{entregas.length}</span></div>
          {Object.keys(displayedRotas).some(k => displayedRotas[Number(k)]?.length > 0) && (
            <div className="text-emerald-400 font-semibold">Rotas Filtradas Ativas</div>
          )}
        </div>

        {/* Legends Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 border border-slate-800/80 backdrop-blur px-3 py-2 rounded-lg text-[9px] font-mono text-slate-400 flex flex-col gap-1 shadow-xl max-w-[160px] pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 border border-white" />
            <span className="text-slate-200">Hub CD Central</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 border border-white" />
            <span className="text-slate-400">Ponto Não Roteado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
            <span className="text-slate-400">Vetor Direcional de Rota</span>
          </div>
        </div>
      </div>
    </div>
  );
}
