import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Navigation, Search, Check, AlertCircle, Compass, Layers, Globe, ClipboardPaste } from 'lucide-react';

interface CdHubMapPickerProps {
  latitude?: number | string;
  longitude?: number | string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
  empresaNome?: string;
}

export default function CdHubMapPicker({
  latitude,
  longitude,
  endereco = '',
  numero = '',
  bairro = '',
  cidade = '',
  estado = '',
  cep = '',
  onCoordinatesChange,
  empresaNome = 'CD Hub Central'
}: CdHubMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets' | 'dark'>('streets');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; text: string } | null>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteInputValue, setPasteInputValue] = useState('');

  // Parse current numeric coords with fallbacks
  const numLat = typeof latitude === 'number' ? latitude : parseFloat(String(latitude || ''));
  const numLng = typeof longitude === 'number' ? longitude : parseFloat(String(longitude || ''));
  
  const validLat = !isNaN(numLat) && numLat >= -90 && numLat <= 90 ? numLat : -22.4811;
  const validLng = !isNaN(numLng) && numLng >= -180 && numLng <= 180 ? numLng : -42.2028;

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    const initMap = () => {
      if (!mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [validLat, validLng],
          zoom: 15,
          zoomControl: true,
          attributionControl: false
        });

        // Add custom Tile Layer
        const tiles = {
          dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        };

        const tileLayer = L.tileLayer(tiles[mapStyle], {
          maxZoom: 19
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        // Custom Glowing CD Hub Icon
        const cdIcon = L.divIcon({
          className: 'cd-hub-custom-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
              <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(139, 92, 246, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #7c3aed; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(124, 58, 237, 0.9), 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div style="margin-top: 4px; background: rgba(15, 23, 42, 0.95); color: #c4b5fd; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(139, 92, 246, 0.5); white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); font-family: monospace;">
                ${empresaNome} (Origem)
              </div>
            </div>
          `,
          iconSize: [36, 48],
          iconAnchor: [18, 20]
        });

        // Add Draggable Marker
        const marker = L.marker([validLat, validLng], {
          draggable: true,
          icon: cdIcon
        }).addTo(map);

        marker.on('dragend', (event: any) => {
          const pos = event.target.getLatLng();
          onCoordinatesChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
          setStatusMessage({
            type: 'success',
            text: `🎯 Ponto ajustado manualmente pelo pino: (${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)})`
          });
        });

        // Click on map moves marker
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onCoordinatesChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
          setStatusMessage({
            type: 'success',
            text: `🎯 Ponto ajustado pelo clique no mapa: (${lat.toFixed(6)}, ${lng.toFixed(6)})`
          });
        });

        mapRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    };

    if (!(window as any).L) {
      const scriptId = 'leaflet-script-picker';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          if (!isCancelled) initMap();
        };
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
    } else {
      initMap();
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update map view & marker when lat/lng change from external inputs
  useEffect(() => {
    if (mapRef.current && markerRef.current && !isNaN(validLat) && !isNaN(validLng)) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - validLat) > 0.00001 || Math.abs(currentPos.lng - validLng) > 0.00001) {
        markerRef.current.setLatLng([validLat, validLng]);
        mapRef.current.panTo([validLat, validLng], { animate: true, duration: 0.5 });
      }
    }
  }, [validLat, validLng]);

  // Update Tile layer style
  useEffect(() => {
    if (mapRef.current && tileLayerRef.current && (window as any).L) {
      const L = (window as any).L;
      mapRef.current.removeLayer(tileLayerRef.current);
      
      const tiles = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      };

      const newTile = L.tileLayer(tiles[mapStyle], { maxZoom: 19 }).addTo(mapRef.current);
      tileLayerRef.current = newTile;
    }
  }, [mapStyle]);

  // Handle GPS location from device
  const handleGetDeviceGps = () => {
    if (!navigator.geolocation) {
      setStatusMessage({ type: 'error', text: 'Geolocalização GPS não é suportada pelo seu navegador.' });
      return;
    }

    setIsLocatingGps(true);
    setStatusMessage({ type: 'info', text: 'Obtendo posição GPS do dispositivo...' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        
        onCoordinatesChange(lat, lng);
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 17);
        }

        setIsLocatingGps(false);
        setStatusMessage({
          type: 'success',
          text: `📍 GPS Capturado com Alta Precisão: (${lat}, ${lng}) - Precisão: ~${Math.round(position.coords.accuracy)}m`
        });
      },
      (error) => {
        setIsLocatingGps(false);
        let msg = 'Erro ao obter localização GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permissão de GPS negada no navegador. Permita o acesso à localização ou ajuste clicando no mapa.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Sinal GPS indisponível no momento. Use o mapa ou cole as coordenadas.';
        }
        setStatusMessage({ type: 'warning', text: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Smart Search using Geocoding API with multi-query fallbacks
  const handleSearchGeocode = async () => {
    setIsSearchingGeocode(true);
    setStatusMessage({ type: 'info', text: 'Pesquisando endereço nos servidores cartográficos...' });

    try {
      const streetPart = `${endereco}${numero ? `, ${numero}` : ''}${bairro ? ` - ${bairro}` : ''}`.trim();
      const queryParams = new URLSearchParams();
      if (streetPart) queryParams.set('street', streetPart);
      if (cidade) queryParams.set('city', cidade);
      if (estado) queryParams.set('state', estado);
      if (cep) queryParams.set('postalcode', cep);
      queryParams.set('q', `${streetPart ? `${streetPart}, ` : ''}${cidade}${estado ? ` - ${estado}` : ''}`);

      const res = await fetch(`/api/geocode?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat && data.lng) {
          const lat = parseFloat(Number(data.lat).toFixed(6));
          const lng = parseFloat(Number(data.lng).toFixed(6));
          
          onCoordinatesChange(lat, lng);
          if (mapRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapRef.current.setView([lat, lng], 16);
          }

          setIsSearchingGeocode(false);
          setStatusMessage({
            type: 'success',
            text: `🎯 Endereço Localizado: ${data.displayName || `${lat}, ${lng}`}`
          });
          return;
        }
      }

      setStatusMessage({
        type: 'warning',
        text: 'Não foi possível encontrar a numeração exata automaticamente. Clique no mapa ou arraste o pino para fixar o local exato.'
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Falha na conexão com o serviço de geocodificação. Ajuste o ponto diretamente no mapa.'
      });
    } finally {
      setIsSearchingGeocode(false);
    }
  };

  // Extract coords from pasted text or Google Maps link
  const handleParsePastedCoords = () => {
    const raw = pasteInputValue.trim();
    if (!raw) return;

    let parsedLat: number | null = null;
    let parsedLng: number | null = null;

    // Pattern 1: Google Maps URL containing /@lat,lng,
    const urlMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      parsedLat = parseFloat(urlMatch[1]);
      parsedLng = parseFloat(urlMatch[2]);
    }

    // Pattern 2: Google Maps search URL ?q=lat,lng
    if (!parsedLat) {
      const qMatch = raw.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        parsedLat = parseFloat(qMatch[1]);
        parsedLng = parseFloat(qMatch[2]);
      }
    }

    // Pattern 3: Standard coordinate string: "-22.4811, -42.2028" or "-22.4811 -42.2028"
    if (!parsedLat) {
      const coordMatch = raw.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
      if (coordMatch) {
        parsedLat = parseFloat(coordMatch[1]);
        parsedLng = parseFloat(coordMatch[2]);
      }
    }

    if (parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng)) {
      onCoordinatesChange(parseFloat(parsedLat.toFixed(6)), parseFloat(parsedLng.toFixed(6)));
      if (mapRef.current && markerRef.current) {
        markerRef.current.setLatLng([parsedLat, parsedLng]);
        mapRef.current.setView([parsedLat, parsedLng], 17);
      }

      setStatusMessage({
        type: 'success',
        text: `✓ Coordenadas importadas com sucesso: (${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)})`
      });
      setPasteModalOpen(false);
      setPasteInputValue('');
    } else {
      alert('Formato não reconhecido. Cole coordenadas no formato "-22.4811, -42.2028" ou um link completo do Google Maps.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Toolbar on top of map */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-violet-400" />
            Calibrador Cartográfico Interativo do CD HUB
          </span>
          <span className="text-[9px] bg-violet-500/20 text-violet-300 font-mono px-2 py-0.5 rounded-full border border-violet-500/30">
            Arraste ou Clique no Mapa
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Map Layer Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                mapStyle === 'streets' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rua
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satélite
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                mapStyle === 'dark' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Escuro
            </button>
          </div>

          {/* Device GPS Button */}
          <button
            type="button"
            onClick={handleGetDeviceGps}
            disabled={isLocatingGps}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Usa o sensor GPS do seu dispositivo para posicionar o CD Hub onde você está agora"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            {isLocatingGps ? 'Captando GPS...' : 'Meu GPS Atual'}
          </button>

          {/* Search Geocode Button */}
          <button
            type="button"
            onClick={handleSearchGeocode}
            disabled={isSearchingGeocode}
            className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5 text-violet-400" />
            {isSearchingGeocode ? 'Buscando...' : 'Buscar Endereço'}
          </button>

          {/* Paste Coords or Google Maps Link */}
          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Colar coordenadas GPS ou link do Google Maps"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
            Colar Link / GPS
          </button>
        </div>
      </div>

      {/* Paste Coordinates Modal */}
      {pasteModalOpen && (
        <div className="bg-slate-900 border border-amber-500/40 p-3.5 rounded-xl space-y-2.5 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <ClipboardPaste className="w-4 h-4 text-amber-400" /> Colar Coordenadas ou Link do Google Maps
            </span>
            <button
              type="button"
              onClick={() => setPasteModalOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕ Fechar
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Abra o Google Maps, localize o galpão do seu CD Hub, copie o link de compartilhamento ou as coordenadas (ex: <code>-22.5936, -41.9961</code>) e cole abaixo:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={pasteInputValue}
              onChange={e => setPasteInputValue(e.target.value)}
              placeholder="Cole o link do Google Maps ou coordenadas (ex: -22.4811, -42.2028)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="button"
              onClick={handleParsePastedCoords}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-lg text-xs transition-all shrink-0 cursor-pointer shadow-md shadow-amber-600/30"
            >
              Aplicar Ponto
            </button>
          </div>
        </div>
      )}

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'warning'
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : statusMessage.type === 'info'
              ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-[10px] ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        <div
          ref={mapContainerRef}
          style={{ height: '300px', width: '100%' }}
          className="z-0"
        />

        {/* Floating helper instruction badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 backdrop-blur border border-slate-800 text-[10px] text-slate-300 px-3 py-1.5 rounded-lg shadow-lg z-10 flex items-center gap-2 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-violet-400" />
          <span>
            Ponto Ativo: <strong className="text-white font-mono">{validLat.toFixed(6)}, {validLng.toFixed(6)}</strong> (Clique para reposicionar)
          </span>
        </div>
      </div>
    </div>
  );
}
