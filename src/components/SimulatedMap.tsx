import React, { useState } from 'react';
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
  const [selectedPin, setSelectedPin] = useState<any>(null);

  // Determine SVG viewbox bounds from all coordinates
  const allCoords = [
    baseCoords,
    ...entregas.map(e => ({ lat: e.latitude, lng: e.longitude }))
  ];

  const lats = allCoords.map(c => c.lat);
  const lngs = allCoords.map(c => c.lng);

  const minLat = Math.min(...lats, -19.98);
  const maxLat = Math.max(...lats, -19.82);
  const minLng = Math.min(...lngs, -44.02);
  const maxLng = Math.max(...lngs, -43.88);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  // Map coordinates to SVG percentage coordinates (width 800, height 500)
  const mapToSvg = (lat: number, lng: number) => {
    // Invert lat because SVG y goes down
    const x = ((lng - minLng) / lngRange) * 720 + 40;
    const y = (1 - (lat - minLat) / latRange) * 420 + 40;
    return { x, y };
  };

  const baseSvg = mapToSvg(baseCoords.lat, baseCoords.lng);

  // Distinct colors for routes
  const routeColors = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#ef4444', // Red
  ];

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[500px] w-full group">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      
      {/* Status Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/95 border border-slate-800/80 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-mono text-slate-300 shadow-lg flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 text-violet-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          NÚCLEO GEORREFERENCIADO LOGUSQ
        </div>
        <div>CD Central: {DEFAULT_BASE.cidade} - {DEFAULT_BASE.estado}</div>
        <div>Pontos Plotados: <span className="text-white font-bold">{entregas.length}</span></div>
        {Object.keys(rotas).length > 0 && (
          <div className="text-emerald-400">Rotas Otimizadas: {Object.keys(rotas).length}</div>
        )}
      </div>

      <svg className="w-full h-full relative z-0" viewBox="0 0 800 500">
        {/* Animated radar rings around Base */}
        <circle cx={baseSvg.x} cy={baseSvg.y} r="15" fill="none" stroke="#7c3aed" strokeWidth="1" className="animate-ping opacity-25" />
        <circle cx={baseSvg.x} cy={baseSvg.y} r="35" fill="none" stroke="#2563eb" strokeWidth="1" className="opacity-10" />

        {/* Draw Routes Path Lines */}
        {Object.entries(rotas).map(([clusterId, points], idx) => {
          const color = routeColors[idx % routeColors.length];
          if (points.length === 0) return null;

          // Build polyline starting from Base, passing through all stops, and back to Base
          let pathString = `M ${baseSvg.x} ${baseSvg.y}`;
          points.forEach(p => {
            const pt = mapToSvg(p.latitude, p.longitude);
            // Simulate Manhattan style street corner logic
            const midX = pt.x;
            const midY = baseSvg.y; // horizontal then vertical for a neat network feel
            pathString += ` L ${midX} ${midY} L ${pt.x} ${pt.y}`;
          });
          pathString += ` L ${baseSvg.x} ${baseSvg.y}`;

          return (
            <g key={`route-group-${clusterId}`}>
              {/* Thick transparent glow line for easier clicking/hover */}
              <path
                d={pathString}
                fill="none"
                stroke={color}
                strokeWidth="8"
                className="opacity-10 hover:opacity-25 transition-opacity cursor-pointer"
              />
              {/* Actual route path line with dashing animation */}
              <path
                d={pathString}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 4"
                className="animate-[dash_30s_linear_infinite]"
              />
            </g>
          );
        })}

        {/* Draw Base pin */}
        <g 
          className="cursor-pointer"
          onClick={() => setSelectedPin({
            tipo: 'Hub Principal',
            nome: DEFAULT_BASE.nome,
            cidade: DEFAULT_BASE.cidade,
            estado: DEFAULT_BASE.estado,
            coords: `${baseCoords.lat.toFixed(4)}, ${baseCoords.lng.toFixed(4)}`
          })}
        >
          <circle cx={baseSvg.x} cy={baseSvg.y} r="10" fill="#7c3aed" className="shadow-lg" />
          <circle cx={baseSvg.x} cy={baseSvg.y} r="5" fill="#ffffff" />
        </g>

        {/* Draw Delivery pins */}
        {entregas.map((ent, i) => {
          const pt = mapToSvg(ent.latitude, ent.longitude);
          
          // Determine which route/color this point belongs to
          let pointColor = '#475569'; // default slate grey for unassigned
          let routeIdx = -1;
          Object.entries(rotas).forEach(([cId, points], rIdx) => {
            if (points.some(p => p.id === ent.id || p.chave === ent.chave)) {
              pointColor = routeColors[rIdx % routeColors.length];
              routeIdx = rIdx;
            }
          });

          return (
            <g 
              key={`pin-${ent.id || i}`}
              className="cursor-pointer group/pin"
              onClick={() => setSelectedPin({
                tipo: ent.tipoOperacao,
                nome: ent.cliente,
                endereco: ent.endereco,
                peso: `${ent.pesoMercadoriaKg} kg`,
                status: ent.status,
                chave: ent.chave,
                rota: routeIdx !== -1 ? `Rota ${routeIdx + 1}` : 'Não Roteada',
                coords: `${ent.latitude.toFixed(4)}, ${ent.longitude.toFixed(4)}`
              })}
            >
              {/* Highlight Ring */}
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="8" 
                fill="none" 
                stroke={pointColor} 
                strokeWidth="2" 
                className="opacity-0 group-hover/pin:opacity-100 transition-opacity" 
              />
              {/* Pin Center */}
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="5" 
                fill={pointColor} 
                className="transition-transform duration-150 transform group-hover/pin:scale-125" 
              />
              <circle cx={pt.x} cy={pt.y} r="2" fill="#ffffff" />
            </g>
          );
        })}
      </svg>

      {/* Pin Detail Overlay */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 border border-slate-800 backdrop-blur-md p-4 rounded-xl shadow-2xl flex flex-col gap-2 max-w-sm text-xs font-sans text-slate-200">
          <div className="flex justify-between items-start">
            <span className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-violet-400" />
              {selectedPin.nome || 'Detalhes do Ponto'}
            </span>
            <button 
              onClick={() => setSelectedPin(null)}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
            <div><span className="text-slate-400">Tipo:</span> <span className="font-semibold text-violet-400 uppercase">{selectedPin.tipo}</span></div>
            {selectedPin.chave && <div><span className="text-slate-400">Chave:</span> <span className="font-mono text-slate-300">{selectedPin.chave}</span></div>}
            {selectedPin.peso && <div><span className="text-slate-400">Carga:</span> <span className="font-mono text-slate-300">{selectedPin.peso}</span></div>}
            {selectedPin.status && <div><span className="text-slate-400">Status:</span> <span className="text-emerald-400">{selectedPin.status}</span></div>}
            {selectedPin.rota && <div><span className="text-slate-400">Alocação:</span> <span className="text-blue-400 font-semibold">{selectedPin.rota}</span></div>}
            <div className="col-span-2 mt-1 border-t border-slate-800/40 pt-1">
              <span className="text-slate-400">Coords:</span> <span className="font-mono text-slate-400">{selectedPin.coords}</span>
            </div>
          </div>
          {selectedPin.endereco && (
            <div className="text-[11px] text-slate-400 line-clamp-2">
              <span className="text-slate-300 font-bold">Endereço:</span> {selectedPin.endereco}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 border border-slate-800/80 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-mono text-slate-400 flex flex-col gap-1 shadow-lg max-w-[150px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span>CD Hub Savassi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-600" />
          <span>Não Roteado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-blue-500 inline-block" />
          <span>Rotas de Entrega</span>
        </div>
      </div>
    </div>
  );
}
