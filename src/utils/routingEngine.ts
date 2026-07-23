import { Entrega } from '../types';

// Coordinates for Brazil's logistics hubs (default base is Belo Horizonte / Savassi)
export const DEFAULT_BASE = {
  nome: 'Centro de Distribuição Central LogusQ (Savassi)',
  latitude: -19.9388,
  longitude: -43.9386,
  cidade: 'Belo Horizonte',
  estado: 'MG',
};

// Simple Geocoder Database tagged with Region to prevent cross-region keyword pollution
const REGIONAL_GEOCODE_DB: { key: string; region: string; lat: number; lng: number }[] = [
  // Espírito Santo (ES)
  { key: '29168-000', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: '29168', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'civit ii', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'civit 2', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'civit', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'rodovia br-101 norte, 1250', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'enseada do suá', region: 'ES', lat: -20.3142, lng: -40.2922 },
  { key: 'praia do canto', region: 'ES', lat: -20.3015, lng: -40.2911 },

  // Rio de Janeiro (RJ)
  { key: '21040-360', region: 'RJ', lat: -22.8610, lng: -43.2535 },
  { key: '21040', region: 'RJ', lat: -22.8610, lng: -43.2535 },
  { key: 'avenida brasil, 7500', region: 'RJ', lat: -22.8610, lng: -43.2535 },
  { key: 'copacabana', region: 'RJ', lat: -22.9714, lng: -43.1826 },
  { key: 'barra da tijuca', region: 'RJ', lat: -23.0016, lng: -43.3444 },

  // São Paulo (SP)
  { key: '01310-100', region: 'SP', lat: -23.5614, lng: -46.6559 },
  { key: 'avenida paulista', region: 'SP', lat: -23.5614, lng: -46.6559 },

  // Minas Gerais (MG)
  { key: 'savassi', region: 'MG', lat: -19.9388, lng: -43.9386 },
  { key: 'pampulha', region: 'MG', lat: -19.8519, lng: -43.9749 },
];

// Major Cities Coordinate Map across Brazilian States
const CITY_COORDS: Record<string, { lat: number; lng: number; region: string }> = {
  // Santa Catarina (SC)
  'joinville': { lat: -26.3045, lng: -48.8464, region: 'SC' },
  'florianópolis': { lat: -27.5954, lng: -48.5480, region: 'SC' },
  'florianopolis': { lat: -27.5954, lng: -48.5480, region: 'SC' },
  'blumenau': { lat: -26.9194, lng: -49.0661, region: 'SC' },
  'itajai': { lat: -26.9078, lng: -48.6619, region: 'SC' },
  'itajaí': { lat: -26.9078, lng: -48.6619, region: 'SC' },
  'chapecó': { lat: -27.1004, lng: -52.6152, region: 'SC' },
  'chapeco': { lat: -27.1004, lng: -52.6152, region: 'SC' },
  'criciúma': { lat: -28.6775, lng: -49.3703, region: 'SC' },
  'criciuma': { lat: -28.6775, lng: -49.3703, region: 'SC' },
  'balneário camboriú': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'balneario camboriu': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'camboriú': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'camboriu': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'jaraguá do sul': { lat: -26.4853, lng: -49.0825, region: 'SC' },
  'jaragua do sul': { lat: -26.4853, lng: -49.0825, region: 'SC' },
  'lages': { lat: -27.8161, lng: -50.3261, region: 'SC' },
  'palhoça': { lat: -27.6453, lng: -48.6698, region: 'SC' },
  'palhoca': { lat: -27.6453, lng: -48.6698, region: 'SC' },
  'brusque': { lat: -27.0983, lng: -48.9133, region: 'SC' },
  'tubarão': { lat: -28.4736, lng: -49.0153, region: 'SC' },
  'tubarao': { lat: -28.4736, lng: -49.0153, region: 'SC' },
  'são josé': { lat: -27.6136, lng: -48.6366, region: 'SC' },
  'sao jose': { lat: -27.6136, lng: -48.6366, region: 'SC' },
  'concórdia': { lat: -27.2342, lng: -52.0258, region: 'SC' },
  'concordia': { lat: -27.2342, lng: -52.0258, region: 'SC' },
  'rio do sul': { lat: -27.2144, lng: -49.6431, region: 'SC' },
  'araranguá': { lat: -28.9358, lng: -49.4936, region: 'SC' },
  'ararangua': { lat: -28.9358, lng: -49.4936, region: 'SC' },
  'navegantes': { lat: -26.8986, lng: -48.6542, region: 'SC' },
  'caçador': { lat: -26.7753, lng: -51.0136, region: 'SC' },
  'cacador': { lat: -26.7753, lng: -51.0136, region: 'SC' },
  'gaspar': { lat: -26.9317, lng: -48.9583, region: 'SC' },
  'içara': { lat: -28.7139, lng: -49.3000, region: 'SC' },
  'icara': { lat: -28.7139, lng: -49.3000, region: 'SC' },
  'videira': { lat: -27.0083, lng: -51.1522, region: 'SC' },
  'mafra': { lat: -26.1122, lng: -49.8058, region: 'SC' },
  'canoinhas': { lat: -26.1772, lng: -50.3900, region: 'SC' },
  'indaial': { lat: -26.8981, lng: -49.2319, region: 'SC' },

  // Paraná (PR)
  'curitiba': { lat: -25.4284, lng: -49.2733, region: 'PR' },
  'londrina': { lat: -23.3103, lng: -51.1628, region: 'PR' },
  'maringá': { lat: -23.42099, lng: -51.93305, region: 'PR' },
  'maringa': { lat: -23.42099, lng: -51.93305, region: 'PR' },
  'ponta grossa': { lat: -25.095, lng: -50.1619, region: 'PR' },
  'foz do iguaçu': { lat: -25.5469, lng: -54.5882, region: 'PR' },
  'foz do iguacu': { lat: -25.5469, lng: -54.5882, region: 'PR' },
  'cascavel': { lat: -24.9558, lng: -53.4553, region: 'PR' },

  // Rio Grande do Sul (RS)
  'porto alegre': { lat: -30.0346, lng: -51.2177, region: 'RS' },
  'caxias do sul': { lat: -29.1681, lng: -51.1794, region: 'RS' },
  'pelotas': { lat: -31.7654, lng: -52.3376, region: 'RS' },
  'canoas': { lat: -29.9178, lng: -51.1836, region: 'RS' },

  // São Paulo (SP)
  'são paulo': { lat: -23.5505, lng: -46.6333, region: 'SP' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, region: 'SP' },
  'campinas': { lat: -22.9099, lng: -47.0626, region: 'SP' },
  'santos': { lat: -23.9608, lng: -46.3331, region: 'SP' },
  'guarulhos': { lat: -23.4542, lng: -46.5333, region: 'SP' },
  'são josé dos campos': { lat: -23.1791, lng: -45.8872, region: 'SP' },
  'sao jose dos campos': { lat: -23.1791, lng: -45.8872, region: 'SP' },
  'sorocaba': { lat: -23.5015, lng: -47.4581, region: 'SP' },
  'ribeirão preto': { lat: -21.1775, lng: -47.8103, region: 'SP' },

  // Rio de Janeiro (RJ)
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, region: 'RJ' },
  'niterói': { lat: -22.8833, lng: -43.1036, region: 'RJ' },
  'niteroi': { lat: -22.8833, lng: -43.1036, region: 'RJ' },
  'duque de caxias': { lat: -22.7856, lng: -43.3117, region: 'RJ' },
  'nova iguaçu': { lat: -22.7592, lng: -43.4511, region: 'RJ' },
  'campos dos goytacazes': { lat: -21.7545, lng: -41.3244, region: 'RJ' },

  // Espírito Santo (ES)
  'serra': { lat: -20.1385, lng: -40.2920, region: 'ES' },
  'vitória': { lat: -20.3155, lng: -40.3128, region: 'ES' },
  'vitoria': { lat: -20.3155, lng: -40.3128, region: 'ES' },
  'vila velha': { lat: -20.3297, lng: -40.2925, region: 'ES' },
  'cariacica': { lat: -20.2639, lng: -40.4165, region: 'ES' },
  'linhares': { lat: -19.3911, lng: -40.0722, region: 'ES' },
  'cachoeiro de itapemirim': { lat: -20.8489, lng: -41.1128, region: 'ES' },

  // Minas Gerais (MG)
  'belo horizonte': { lat: -19.9167, lng: -43.9345, region: 'MG' },
  'uberlândia': { lat: -18.9186, lng: -48.2772, region: 'MG' },
  'uberlandia': { lat: -18.9186, lng: -48.2772, region: 'MG' },
  'juiz de fora': { lat: -21.7642, lng: -43.3496, region: 'MG' },
  'contagem': { lat: -19.9317, lng: -44.0536, region: 'MG' },
};

/**
 * Normalizes and geocodes an address.
 * Prioritizes explicit state/city context and fallback base coordinates to eliminate
 * any cross-state pollution (e.g. Santa Catarina deliveries landing in RJ or SP).
 */
export function geocodeAddress(
  endereco: string,
  fallbackBaseCoords?: { lat: number; lng: number }
): { lat: number; lng: number } {
  const clean = endereco.toLowerCase().trim();
  const defaultBase = fallbackBaseCoords || { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude };

  if (!clean || clean === '-') {
    return { lat: defaultBase.lat, lng: defaultBase.lng };
  }

  // 1. Detect explicit region (State / UF) in address string
  let detectedRegion: string | null = null;
  if (/\b(sc|santa catarina)\b/i.test(clean)) detectedRegion = 'SC';
  else if (/\b(rj|rio de janeiro)\b/i.test(clean)) detectedRegion = 'RJ';
  else if (/\b(sp|são paulo|sao paulo)\b/i.test(clean)) detectedRegion = 'SP';
  else if (/\b(mg|minas gerais)\b/i.test(clean)) detectedRegion = 'MG';
  else if (/\b(es|espírito santo|espirito santo)\b/i.test(clean)) detectedRegion = 'ES';
  else if (/\b(pr|paraná|parana)\b/i.test(clean)) detectedRegion = 'PR';
  else if (/\b(rs|rio grande do sul)\b/i.test(clean)) detectedRegion = 'RS';

  // 2. Check explicit city lookup in CITY_COORDS
  for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
    if (new RegExp(`\\b${cityName}\\b`, 'i').test(clean)) {
      // Generate a deterministic jitter around the city center
      let hash = 0;
      for (let i = 0; i < clean.length; i++) {
        hash = clean.charCodeAt(i) + ((hash << 5) - hash);
      }
      const latOffset = (((hash & 0xff) / 255) - 0.5) * 0.04;
      const lngOffset = ((((hash >> 8) & 0xff) / 255) - 0.5) * 0.04;

      return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset,
      };
    }
  }

  // 3. Check Regional Geocode DB (matched only if region aligns)
  for (const item of REGIONAL_GEOCODE_DB) {
    if (clean.includes(item.key)) {
      if (!detectedRegion || detectedRegion === item.region) {
        let hash = 0;
        for (let i = 0; i < clean.length; i++) {
          hash = clean.charCodeAt(i) + ((hash << 5) - hash);
        }
        return {
          lat: item.lat + (((hash & 0x0f) / 15) - 0.5) * 0.005,
          lng: item.lng + ((((hash >> 4) & 0x0f) / 15) - 0.5) * 0.005,
        };
      }
    }
  }

  // 4. Region State Level Fallbacks if city wasn't explicitly found
  let baseLat = defaultBase.lat;
  let baseLng = defaultBase.lng;

  if (detectedRegion === 'SC' || (fallbackBaseCoords && fallbackBaseCoords.lat < -25 && fallbackBaseCoords.lat > -30 && fallbackBaseCoords.lng < -48 && fallbackBaseCoords.lng > -55)) {
    // Default SC anchor (Florianópolis / Joinville region)
    if (!fallbackBaseCoords || fallbackBaseCoords.lat > -25) {
      baseLat = -27.5954;
      baseLng = -48.5480;
    }
  } else if (detectedRegion === 'RJ') {
    baseLat = -22.9068;
    baseLng = -43.1729;
  } else if (detectedRegion === 'SP') {
    baseLat = -23.5505;
    baseLng = -46.6333;
  } else if (detectedRegion === 'MG') {
    baseLat = -19.9167;
    baseLng = -43.9345;
  } else if (detectedRegion === 'ES') {
    baseLat = -20.1385;
    baseLng = -40.2920;
  } else if (detectedRegion === 'PR') {
    baseLat = -25.4284;
    baseLng = -49.2733;
  } else if (detectedRegion === 'RS') {
    baseLat = -30.0346;
    baseLng = -51.2177;
  }

  // Generate deterministic offset around base location
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (((hash & 0xff) / 255) - 0.5) * 0.05;
  const lngOffset = ((((hash >> 8) & 0xff) / 255) - 0.5) * 0.05;

  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset,
  };
}

/**
 * Travelling Salesperson Problem (TSP) Solver
 * Uses the Nearest Neighbor algorithm starting from Base to optimize the route.
 */
export function optimizeTSP(baseLat: number, baseLng: number, entregas: Entrega[]): Entrega[] {
  if (entregas.length === 0) return [];

  const unvisited = [...entregas];
  const route: Entrega[] = [];
  let currentLat = baseLat;
  let currentLng = baseLng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistanceSq = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const p = unvisited[i];
      // Euclidean distance square (sufficient for local routing)
      const distSq = Math.pow(p.latitude - currentLat, 2) + Math.pow(p.longitude - currentLng, 2);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearestIndex = i;
      }
    }

    const nextNode = unvisited.splice(nearestIndex, 1)[0];
    route.push(nextNode);
    currentLat = nextNode.latitude;
    currentLng = nextNode.longitude;
  }

  return route;
}

/**
 * K-Means Clustering for vehicle route assignment
 * Segments deliveries into 'k' groups, then runs TSP optimization on each.
 */
export function clusterAndOptimize(
  entregas: Entrega[], 
  numVeiculos: number, 
  baseLat: number = DEFAULT_BASE.latitude, 
  baseLng: number = DEFAULT_BASE.longitude
): Record<number, Entrega[]> {
  if (entregas.length === 0 || numVeiculos <= 0) return {};

  const k = Math.min(numVeiculos, entregas.length);
  
  // 1. Initialize centroids (K-Means++ style or simply select first k spaced nodes)
  const centroids = unrepeatedCentroids(entregas, k);
  
  let clusters: Record<number, number[]> = {};
  
  // Max 10 iterations (extremely fast client-side converge)
  for (let iter = 0; iter < 10; iter++) {
    clusters = {};
    for (let i = 0; i < k; i++) clusters[i] = [];

    // Assign points to nearest centroid
    entregas.forEach((p, index) => {
      let nearestCluster = 0;
      let minDistSq = Infinity;

      centroids.forEach((c, cId) => {
        const d = Math.pow(p.latitude - c.lat, 2) + Math.pow(p.longitude - c.lng, 2);
        if (d < minDistSq) {
          minDistSq = d;
          nearestCluster = cId;
        }
      });
      clusters[nearestCluster].push(index);
    });

    // Update centroids
    for (let i = 0; i < k; i++) {
      const idxs = clusters[i];
      if (idxs.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        idxs.forEach(idx => {
          sumLat += entregas[idx].latitude;
          sumLng += entregas[idx].longitude;
        });
        centroids[i] = {
          lat: sumLat / idxs.length,
          lng: sumLng / idxs.length,
        };
      }
    }
  }

  // 2. Map back to Entregas and optimize each cluster with TSP starting from custom or default base
  const result: Record<number, Entrega[]> = {};
  Object.entries(clusters).forEach(([cId, idxs]) => {
    if (idxs.length === 0) return;
    const subList = idxs.map(idx => entregas[idx]);
    const optimized = optimizeTSP(baseLat, baseLng, subList);
    result[Number(cId)] = optimized;
  });

  return result;
}

function unrepeatedCentroids(entregas: Entrega[], k: number): { lat: number; lng: number }[] {
  const result: { lat: number; lng: number }[] = [];
  const step = Math.floor(entregas.length / k) || 1;
  for (let i = 0; i < k; i++) {
    const node = entregas[Math.min(i * step, entregas.length - 1)];
    result.push({ lat: node.latitude, lng: node.longitude });
  }
  return result;
}

/**
 * Calculates approximate travel distance on streets in KM between two coordinates
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generates street-aligned simulation coordinates for map paths.
 * Recreates typical street grid-like corners between two geolocations.
 */
export function generateStreetGeometry(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): [number, number][] {
  const midLat = p1.lat;
  const midLng = p2.lng; // Manhattan-style layout corner to simulate real roads
  return [
    [p1.lat, p1.lng],
    [midLat, midLng],
    [p2.lat, p2.lng]
  ];
}
