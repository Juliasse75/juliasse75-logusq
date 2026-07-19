import React, { useEffect, useRef, useState } from 'react';
import { Entrega, Veiculo } from '../types';
import { DEFAULT_BASE } from '../utils/routingEngine';
import { MapPin, Navigation, Truck, RefreshCw, Eye, EyeOff, Layers, Filter, Clock } from 'lucide-react';

// Haversine formula to compute exact distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface SimulatedMapProps {
  baseCoords?: { lat: number; lng: number };
  entregas: Entrega[];
  rotas?: Record<number, Entrega[]>; // clusterId -> ordered entregas
  veiculosSelecionados?: Veiculo[];
  activeRoutes?: Record<string, { driver: string; driverEmail?: string; vehicle: string; path: Entrega[]; km: number; duration: number }>;
  onSelectEntrega?: (entrega: Entrega) => void;
  emergencias?: any[];
}

export default function SimulatedMap({
  baseCoords = { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude },
  entregas,
  rotas = {},
  veiculosSelecionados = [],
  activeRoutes = {},
  emergencias = []
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
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);

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

  // OSRM Street-Aligned Route Geometry state and fetch hook
  const [realStreetRoutes, setRealStreetRoutes] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    if (!leafletLoaded) return;
    const displayed = getRoutesToDisplay();
    const routeKeys = Object.keys(displayed);
    if (routeKeys.length === 0) return;

    routeKeys.forEach(clusterId => {
      const points = displayed[clusterId as any];
      if (!points || points.length === 0) return;

      const routeCoords = [
        [baseCoords.lng, baseCoords.lat],
        ...points.map(p => [p.longitude || -43.93, p.latitude || -19.93]),
        [baseCoords.lng, baseCoords.lat]
      ];
      
      const coordString = routeCoords.map(c => `${c[0]},${c[1]}`).join(';');
      const cacheKey = `${clusterId}_${coordString}`;

      // Avoid redundant fetches for identical coordinate paths
      if ((realStreetRoutes as any)[cacheKey]) return;

      fetch(`/api/route?coords=${encodeURIComponent(coordString)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.routes && data.routes[0]) {
            const geom = data.routes[0].geometry;
            if (geom && geom.coordinates) {
              const latLngs = geom.coordinates.map((coord: any) => [coord[1], coord[0]] as [number, number]);
              setRealStreetRoutes(prev => ({
                ...prev,
                [cacheKey]: latLngs,
                [clusterId]: latLngs
              }));
              console.log(`🛣️ OSRM: Rota real pelas ruas traçada para o cluster ${clusterId}.`);
            }
          }
        })
        .catch(err => {
          console.warn('Erro ao obter rota real pelas ruas via OSRM, usando linha reta:', err);
        });
    });
  }, [entregas, rotas, activeRoutes, leafletLoaded]);

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
      // Use CartoDB Voyager as the "Rua" style - detailed colorful street map that uses a high-performance CDN to prevent loading blocks
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; 
    } else if (mapStyle === 'voyager') {
      // Use CartoDB Positron as the "Claro" style - clean, light-grey, high-contrast minimalist layout
      tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'; 
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

      // Track sequence and segment math details
      let sequenceNum = '';
      let indexInPath = -1;
      let pathArray: Entrega[] = [];

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
            // Find index sequence
            const matchedIdx = r.path.findIndex(p => p.id === ent.id || p.chave === ent.chave);
            if (matchedIdx !== -1) {
              indexInPath = matchedIdx;
              sequenceNum = (matchedIdx + 1).toString();
              pathArray = r.path;
            }
          }
        });
      } else {
        // Match with legacy rotas
        Object.entries(rotas).forEach(([cId, points], rIdx) => {
          if (points.some(p => p.id === ent.id || p.chave === ent.chave)) {
            pointColor = routeColors[rIdx % routeColors.length];
            routeLabel = `Rota ${rIdx + 1}`;
            // Find index sequence
            const matchedIdx = points.findIndex(p => p.id === ent.id || p.chave === ent.chave);
            if (matchedIdx !== -1) {
              indexInPath = matchedIdx;
              sequenceNum = (matchedIdx + 1).toString();
              pathArray = points;
            }
          }
        });
      }

      // Compute coordinate segment details from the previous point in sequence
      let prevLat = baseCoords.lat;
      let prevLng = baseCoords.lng;
      let prevPointName = 'CD Hub Principal';

      if (indexInPath !== -1 && pathArray.length > 0) {
        if (indexInPath > 0) {
          const prevStop = pathArray[indexInPath - 1];
          prevLat = prevStop.latitude;
          prevLng = prevStop.longitude;
          prevPointName = prevStop.cliente;
        }
      }

      // Calculate distance and traffic-aware transit estimate
      const distFromPrev = calculateHaversineDistance(prevLat, prevLng, ent.latitude, ent.longitude);
      const transitTimeEst = Math.max(2, Math.round(distFromPrev * 1.8 * 1.25)); // City speed multiplier + traffic factor

      // If filter is active and this point does not match, either fade it out or hide it.
      const opacity = isPointMatch ? 1.0 : 0.15;

      // Overrides pointColor with green for delivered and red for cancelled/failed
      let markerColor = pointColor;
      if (ent.status === 'Entregue') {
        markerColor = '#22c55e'; // Green for success
      } else if (ent.status === 'Cancelado') {
        markerColor = '#ef4444'; // Red for failure
      }

      const pinIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all hover:scale-125 font-sans font-black text-[10px] text-white" 
          style="background-color: ${markerColor}; opacity: ${opacity};">
          ${sequenceNum || '•'}
        </div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([ent.latitude, ent.longitude], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; min-width: 195px;">
            <b style="font-size: 12px; color: #0f172a; display: block; margin-bottom: 3px;">${ent.cliente}</b>
            
            <div style="margin-bottom: 4px;">
              <span style="background-color: ${markerColor}; color: white; font-weight: bold; font-size: 9px; padding: 1px 5px; border-radius: 3px; text-transform: uppercase;">
                ${ent.tipoOperacao} ${sequenceNum ? `#${sequenceNum}` : ''}
              </span>
              <span style="font-weight: bold; margin-left: 5px; color: ${ent.status === 'Pendente' ? '#d97706' : ent.status === 'Cancelado' ? '#ef4444' : '#22c55e'}">${ent.status === 'Pendente' ? 'Pendente' : ent.status === 'Cancelado' ? 'Cancelada' : 'Entregue'}</span>
            </div>

            <div style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 4px 0; margin: 4px 0;">
              <div><b>📍 Ponto Anterior:</b> ${prevPointName}</div>
              <div><b>🛣️ Trecho:</b> ${distFromPrev.toFixed(1)} km (${transitTimeEst} min c/ trânsito)</div>
              <div><b>⏱️ Tempo de Parada:</b> 
                ${ent.status === 'Entregue' 
                  ? `<span style="color: #059669; font-weight: bold;">✓ ${ent.duracaoAtendimentoMinutos || 5} min parado</span>` 
                  : ent.tempoInicioAtendimento 
                    ? `<span style="color: #d97706; font-weight: bold; animation: pulse 1s infinite;">⚡ Em atendimento...</span>`
                    : `<span style="color: #64748b;">Aguardando (Est: 10 min)</span>`
                }
              </div>
            </div>

            <b>Chave NF:</b> <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px;">${ent.chave}</code><br/>
            <b>Peso Carga:</b> ${ent.pesoMercadoriaKg} kg<br/>
            <b>Rota:</b> <span style="color: ${pointColor}; font-weight: bold;">${routeLabel}</span><br/>
            <span style="display: block; margin-top: 4px; color: #64748b; font-size: 10px;">${ent.endereco}</span>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Draw path vectors for filtered routes
    Object.entries(displayedRotas).forEach(([clusterId, points], idx) => {
      const color = routeColors[idx % routeColors.length];
      if (!points || points.length === 0) return;

      // Draw real OSRM street-aligned route if available, otherwise fallback to straight lines
      const pathLatLngs = realStreetRoutes[clusterId] || [
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

    // Draw emergency markers
    if (emergencias && emergencias.length > 0) {
      emergencias.forEach((em) => {
        // If filters are active, check if this driver or vehicle matches
        const matchDriver = selectedDriverFilter === 'all' || em.driverName === selectedDriverFilter;
        const matchVehicle = selectedVehicleFilter === 'all' || em.vehicle === selectedVehicleFilter;
        
        if (!matchDriver || !matchVehicle) return;

        const lat = em.latitude !== undefined ? em.latitude : (em.lat !== undefined ? em.lat : DEFAULT_BASE.latitude);
        const lng = em.longitude !== undefined ? em.longitude : (em.lng !== undefined ? em.lng : DEFAULT_BASE.longitude);

        const emIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center pointer-events-auto">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-500 opacity-75"></span>
            <div class="relative w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg hover:scale-125 transition-all">
              <span class="text-white font-black text-xs animate-pulse">E</span>
            </div>
          </div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const emMarker = L.marker([lat, lng], { icon: emIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; min-width: 200px;">
              <b style="font-size: 13px; color: #dc2626; display: flex; items-center gap-1; margin-bottom: 4px;">
                🚨 ALERTA DE EMERGÊNCIA
              </b>
              <div style="margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; pb-3px;">
                <b>Motorista:</b> <span style="color: #0f172a; font-weight: bold;">${em.driverName}</span><br/>
                <b>Veículo:</b> <span style="color: #059669; font-weight: bold;">${em.vehicle}</span><br/>
                <b>Horário:</b> <span style="font-mono: true;">${em.horario}</span>
              </div>
              <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 6px; border-radius: 6px; font-size: 10px; margin-bottom: 4px;">
                <b>Ocorrência:</b> ${em.tipo || 'Pane Mecânica'}<br/>
                <b>Detalhes:</b> ${em.justificativa || 'Sem detalhes fornecidos.'}
              </div>
              <span style="font-size: 8px; color: #ef4444; font-weight: bold; text-transform: uppercase; tracking: 0.05em;">Ação corretiva requerida no painel</span>
            </div>
          `);
        markersRef.current.push(emMarker);
      });
    }

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
      }).filter(Boolean) as { lat: number; lng: number }[],
      ...emergencias.map(em => {
        const matchDriver = selectedDriverFilter === 'all' || em.driverName === selectedDriverFilter;
        const matchVehicle = selectedVehicleFilter === 'all' || em.vehicle === selectedVehicleFilter;
        if (matchDriver && matchVehicle) {
          const lat = em.latitude !== undefined ? em.latitude : (em.lat !== undefined ? em.lat : DEFAULT_BASE.latitude);
          const lng = em.longitude !== undefined ? em.longitude : (em.lng !== undefined ? em.lng : DEFAULT_BASE.longitude);
          return { lat, lng };
        }
        return null;
      }).filter(Boolean) as { lat: number; lng: number }[]
    ];

    if (activeCoords.length > 1) {
      const bounds = L.latLngBounds(activeCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([baseCoords.lat, baseCoords.lng], 13);
    }
  }, [leafletLoaded, entregas, displayedRotas, baseCoords, mapStyle, selectedDriverFilter, selectedVehicleFilter, activeRoutes, emergencias, realStreetRoutes]);

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

  // Build dynamic routes list with calculated distances and segments for the interactive overlay
  const sidebarRoutes = Object.entries(displayedRotas).map(([idxKey, pathPoints], rIdx) => {
    const clusterId = Number(idxKey);
    let routeId = `Rota ${clusterId + 1}`;
    let driverName = 'Não Alocado';
    let vehicleName = 'Disponível';
    const isCompletedCount = pathPoints.filter(p => p.status === 'Entregue').length;

    // Try matching with activeRoutes details
    if (activeRoutes && Object.keys(activeRoutes).length > 0) {
      const matchedEntry = Object.entries(activeRoutes).find(([actRouteId, r]) => {
        return r.path.length === pathPoints.length && r.path.every((p, pIdx) => p.id === pathPoints[pIdx]?.id || p.chave === pathPoints[pIdx]?.chave);
      });
      if (matchedEntry) {
        routeId = matchedEntry[0];
        driverName = matchedEntry[1].driver;
        vehicleName = matchedEntry[1].vehicle;
      }
    }

    // Calculate segment details
    let prevL = baseCoords.lat;
    let prevG = baseCoords.lng;
    let accumulatedKm = 0;
    const segments: { from: string; to: string; toName: string; km: number; time: number }[] = [];
    
    pathPoints.forEach((stop, stopIdx) => {
      const dist = calculateHaversineDistance(prevL, prevG, stop.latitude, stop.longitude);
      accumulatedKm += dist;
      segments.push({
        from: stopIdx === 0 ? 'CD' : `#${stopIdx}`,
        to: `#${stopIdx + 1}`,
        toName: stop.cliente,
        km: dist,
        time: Math.max(2, Math.round(dist * 1.8 * 1.25))
      });
      prevL = stop.latitude;
      prevG = stop.longitude;
    });

    // Final return segment to CD
    if (pathPoints.length > 0) {
      const finalDist = calculateHaversineDistance(prevL, prevG, baseCoords.lat, baseCoords.lng);
      accumulatedKm += finalDist;
      segments.push({
        from: `#${pathPoints.length}`,
        to: 'CD',
        toName: 'Retorno CD',
        km: finalDist,
        time: Math.max(2, Math.round(finalDist * 1.8 * 1.25))
      });
    }

    return {
      routeId,
      driverName,
      vehicleName,
      color: routeColors[rIdx % routeColors.length],
      pathPoints,
      accumulatedKm,
      segments,
      completedCount: isCompletedCount
    };
  }).filter(r => r.pathPoints.length > 0);

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

          {/* Resumo de Rotas Toggle */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
            <button
              type="button"
              onClick={() => setShowRoutesPanel(prev => !prev)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                showRoutesPanel 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Mostrar ou ocultar o painel flutuante de resumo das rotas"
            >
              <Clock className="w-3.5 h-3.5" />
              {showRoutesPanel ? 'Ocultar Rotas' : 'Visualizar Rotas'}
            </button>
          </div>

          {/* Contrast / Map Style Toggle */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Contraste:</span>
            <div className="flex bg-slate-950 border border-slate-800 rounded p-0.5">
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${mapStyle === 'dark' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Alta visibilidade escura"
              >
                Escuro
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('osm')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${mapStyle === 'osm' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Rico em detalhes e contrastes"
              >
                Rua
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('voyager')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${mapStyle === 'voyager' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
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
        {showRoutesPanel && (
          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 border border-slate-800 backdrop-blur-md p-3.5 rounded-xl text-[11px] text-slate-300 shadow-2xl flex flex-col gap-2 max-w-[290px] max-h-[85%] overflow-y-auto pointer-events-auto font-sans">
            <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-2">
              <div className="flex items-center gap-1.5 text-violet-400 font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PAINEL DE ROTAS
              </div>
            </div>
            <div className="space-y-0.5 text-slate-400 font-sans">
              <div><b>CD Central:</b> <span className="text-white font-semibold">{DEFAULT_BASE.cidade} - {DEFAULT_BASE.estado}</span></div>
              <div><b>Pontos Totais:</b> <span className="text-white font-bold">{entregas.length}</span></div>
            </div>

            {/* List of active routes mapped */}
            {sidebarRoutes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <span>📊 Resumo de Roteamento</span>
                  <span>{sidebarRoutes.length} Rota(s)</span>
                </div>
                
                <div className="space-y-1.5">
                  {sidebarRoutes.map((r) => {
                    const pathLen = r.pathPoints.length;
                    const durationEst = Math.round(r.accumulatedKm * 1.8 * 1.25) + (pathLen * 10); // 1.8 min/km + 10m stop
                    
                    return (
                      <details key={r.routeId} className="group bg-slate-950/80 border border-slate-850 rounded-lg overflow-hidden transition-all">
                        <summary className="p-2 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 list-none outline-none select-none">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full inline-block border border-white" style={{ backgroundColor: r.color }} />
                            <div>
                              <div className="font-extrabold text-white text-[11px]">{r.routeId}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{r.driverName} • {r.vehicleName.split(' ')[0]}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-emerald-400 font-bold font-mono">{r.accumulatedKm.toFixed(1)} km</div>
                            <div className="text-[8px] text-slate-500 font-mono uppercase font-black">{r.completedCount}/{pathLen} OK</div>
                          </div>
                        </summary>

                        <div className="p-2 border-t border-slate-900 bg-slate-950 text-[10px] space-y-1.5">
                          <div className="flex justify-between text-slate-400 border-b border-slate-900 pb-1 mb-1 font-mono">
                            <span>⏱️ Duração Est. Trânsito:</span>
                            <span className="text-white font-bold">{durationEst} min</span>
                          </div>
                          
                          <div className="text-[9px] font-mono text-slate-400 space-y-1">
                            <div className="font-semibold text-slate-500 uppercase tracking-wider text-[8px] mb-1">Sequência & Trechos</div>
                            {r.segments.map((seg, sIdx) => (
                              <div key={sIdx} className="flex justify-between items-start gap-2 border-l border-slate-800 pl-1.5 ml-1">
                                <div>
                                  <span className="text-white font-bold">{seg.from} ➔ {seg.to}</span>
                                  <div className="text-[8px] text-slate-500 truncate max-w-[130px]">{seg.toName}</div>
                                </div>
                                <span className="text-slate-300 font-bold whitespace-nowrap">{seg.km.toFixed(1)} km ({seg.time}m)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legends Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 border border-slate-800/80 backdrop-blur px-3 py-2 rounded-lg text-[9px] font-mono text-slate-400 flex flex-col gap-1 shadow-xl max-w-[170px] pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 border border-white" />
            <span className="text-slate-200">Hub CD Central</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 border border-white" />
            <span className="text-slate-400">Ponto Não Roteado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white" />
            <span className="text-emerald-400 font-bold">Entrega Realizada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 border border-white" />
            <span className="text-red-400 font-bold">Insucesso / Falha</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 border border-white"></span>
            </span>
            <span className="text-red-500 font-black">E - Emergência Ativa</span>
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
