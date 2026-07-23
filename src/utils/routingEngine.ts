import { Entrega } from '../types';

// Coordinates for Brazil's logistics hubs (default base is Belo Horizonte / Savassi)
export const DEFAULT_BASE = {
  nome: 'Centro de Distribuição Central LogusQ (Savassi)',
  latitude: -19.9388,
  longitude: -43.9386,
  cidade: 'Belo Horizonte',
  estado: 'MG',
};

// Simple Geocoder Database for high-fidelity offline lookup
const GEOCODE_DB: Record<string, { lat: number; lng: number }> = {
  // Espírito Santo (ES) - Sede / Hub Serra (Civit II / BR-101)
  '29168-000': { lat: -20.1385, lng: -40.2920 },
  '29168': { lat: -20.1385, lng: -40.2920 },
  'civit ii': { lat: -20.1385, lng: -40.2920 },
  'civit 2': { lat: -20.1385, lng: -40.2920 },
  'civit': { lat: -20.1385, lng: -40.2920 },
  'rodovia br-101 norte, 1250': { lat: -20.1385, lng: -40.2920 },
  'br-101 norte, 1250': { lat: -20.1385, lng: -40.2920 },
  'rodovia br-101 norte': { lat: -20.1385, lng: -40.2920 },
  'br-101 norte': { lat: -20.1385, lng: -40.2920 },
  'galpão logístico 3': { lat: -20.1385, lng: -40.2920 },
  'parque industrial, civit': { lat: -20.1385, lng: -40.2920 },
  'vitoria': { lat: -20.3155, lng: -40.3128 },
  'vitória': { lat: -20.3155, lng: -40.3128 },
  'enseada do suá': { lat: -20.3142, lng: -40.2922 },
  'praia do canto': { lat: -20.3015, lng: -40.2911 },
  'jardim da penha': { lat: -20.2882, lng: -40.2988 },
  'jardim camburi': { lat: -20.2685, lng: -40.2721 },
  'vila velha': { lat: -20.3297, lng: -40.2925 },
  'praia da costa': { lat: -20.3340, lng: -40.2850 },
  'itaparica': { lat: -20.3550, lng: -40.3020 },
  'serra': { lat: -20.1385, lng: -40.2920 },
  'laranjeiras': { lat: -20.1980, lng: -40.2520 },
  'carapina': { lat: -20.2220, lng: -40.2750 },
  'cariacica': { lat: -20.2639, lng: -40.4165 },
  'campo grande es': { lat: -20.2910, lng: -40.3850 },
  'linhares': { lat: -19.3911, lng: -40.0722 },
  'cachoeiro de itapemirim': { lat: -20.8489, lng: -41.1128 },
  'colatina': { lat: -19.5389, lng: -40.6300 },
  'guarapari': { lat: -20.6667, lng: -40.4975 },
  'são mateus': { lat: -18.7161, lng: -39.8589 },
  'aracruz': { lat: -19.8203, lng: -40.2733 },
  'espírito santo': { lat: -20.1385, lng: -40.2920 },
  'espirito santo': { lat: -20.1385, lng: -40.2920 },

  // Rio de Janeiro - High specificity Bonsucesso / Av. Brasil Hub
  '21040-360': { lat: -22.8610, lng: -43.2535 },
  '21040': { lat: -22.8610, lng: -43.2535 },
  'avenida brasil, 7500': { lat: -22.8610, lng: -43.2535 },
  'avenida brasil 7500': { lat: -22.8610, lng: -43.2535 },
  'av brasil 7500': { lat: -22.8610, lng: -43.2535 },
  'av. brasil 7500': { lat: -22.8610, lng: -43.2535 },
  'galpão b - setor de cargas': { lat: -22.8610, lng: -43.2535 },
  'setor de cargas': { lat: -22.8610, lng: -43.2535 },
  'bonsucesso': { lat: -22.8610, lng: -43.2535 },
  'avenida brasil': { lat: -22.8650, lng: -43.2500 },
  'av. brasil': { lat: -22.8650, lng: -43.2500 },
  'av brasil': { lat: -22.8650, lng: -43.2500 },
  'ramos': { lat: -22.8520, lng: -43.2580 },
  'penha': { lat: -22.8420, lng: -43.2780 },
  'caju': { lat: -22.8850, lng: -43.2180 },
  'copacabana': { lat: -22.9714, lng: -43.1826 },
  'centro rj': { lat: -22.9068, lng: -43.1729 },
  'barra da tijuca': { lat: -23.0016, lng: -43.3444 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },

  // Minas Gerais
  'savassi': { lat: -19.9388, lng: -43.9386 },
  'funcionários': { lat: -19.9322, lng: -43.9298 },
  'lourdes': { lat: -19.9285, lng: -43.9442 },
  'centro bh': { lat: -19.9191, lng: -43.9386 },
  'pampulha': { lat: -19.8519, lng: -43.9749 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'uberlândia': { lat: -18.9186, lng: -48.2772 },
  'juiz de fora': { lat: -21.7642, lng: -43.3496 },

  // São Paulo
  'paulista': { lat: -23.5614, lng: -46.6559 },
  'bela vista': { lat: -23.5619, lng: -46.6433 },
  'pinheiros': { lat: -23.5668, lng: -46.7032 },
  'centro sp': { lat: -23.5489, lng: -46.6388 },
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  'campinas': { lat: -22.9099, lng: -47.0626 },
  'santos': { lat: -23.9608, lng: -46.3331 },

  // Outros Estados / Capitais
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'florianópolis': { lat: -27.5954, lng: -48.5480 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'brasília': { lat: -15.7975, lng: -47.8919 },
  'goiânia': { lat: -16.6869, lng: -49.2648 },
  'salvador': { lat: -12.9777, lng: -38.5016 },
  'recife': { lat: -8.0476, lng: -34.8770 },
  'fortaleza': { lat: -3.7319, lng: -38.5267 },
  'manaus': { lat: -3.1190, lng: -60.0217 },
  'belém': { lat: -1.4558, lng: -48.4902 },
};

/**
 * Normalizes and geocodes an address.
 * Uses a local database lookup first, with a smart coordinate generator for fallbacks
 * to guarantee that all points appear on the map beautifully without relying on external APIs.
 */
export function geocodeAddress(
  endereco: string,
  fallbackBaseCoords?: { lat: number; lng: number }
): { lat: number; lng: number } {
  const clean = endereco.toLowerCase().trim();
  if (!clean || clean === '-') {
    const base = fallbackBaseCoords || { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude };
    return { lat: base.lat, lng: base.lng };
  }

  // Sort entries by key length descending so longer/more specific keys match first!
  const sortedEntries = Object.entries(GEOCODE_DB).sort((a, b) => b[0].length - a[0].length);

  // Exact or partial lookup
  for (const [key, coords] of sortedEntries) {
    if (clean.includes(key)) {
      // Add a tiny random jitter so multiple deliveries in the same area don't stack exactly
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.003,
        lng: coords.lng + (Math.random() - 0.5) * 0.003,
      };
    }
  }

  // Smarter Fallback: Detect correct general region based on state codes or city keywords using STRICT word boundaries
  let baseLat = fallbackBaseCoords ? fallbackBaseCoords.lat : DEFAULT_BASE.latitude;
  let baseLng = fallbackBaseCoords ? fallbackBaseCoords.lng : DEFAULT_BASE.longitude;

  if (
    /\b(es|espírito santo|espirito santo|vitoria|vitória|vila velha|serra|cariacica|linhares|colatina|guarapari|cachoeiro|são mateus|sao mateus|aracruz)\b/i.test(clean)
  ) {
    baseLat = -20.3155;
    baseLng = -40.3128; // Vitória / ES
  } else if (
    /\b(rj|rio de janeiro|copacabana|niterói|niteroi|duque de caxias|caxias|nova iguaçu|nova iguacu|são gonçalo|sao goncalo|petrópolis|petropolis|campos dos goytacazes|macaé|macae|volta redonda|belford roxo|são joão de meriti|sao joao de meriti|itaboraí|itaborai|magé|mage|resende|friburgo|cabo frio|angra dos reis|maricá|marica|teresópolis|teresopolis|mesquita|nilópolis|nilopolis)\b/i.test(clean)
  ) {
    baseLat = -22.9068;
    baseLng = -43.1729; // Rio de Janeiro / RJ
  } else if (
    /\b(sp|são paulo|sao paulo|paulista|campinas|santos|guarulhos|são bernardo|sao bernardo|santo andré|santo andre|osasco|sorocaba|ribeirão preto|ribeirao preto|são josé dos campos|sao jose dos campos)\b/i.test(clean)
  ) {
    baseLat = -23.5505;
    baseLng = -46.6333; // São Paulo / SP
  } else if (
    /\b(mg|minas gerais|belo horizonte|pampulha|savassi|lourdes|uberlândia|uberlandia|juiz de fora|contagem|betim|montes claros)\b/i.test(clean)
  ) {
    baseLat = -19.9167;
    baseLng = -43.9345; // Belo Horizonte / MG
  } else if (
    /\b(pr|paraná|parana|curitiba|londrina|maringá|maringa|ponta grossa|foz do iguaçu|foz do iguacu)\b/i.test(clean)
  ) {
    baseLat = -25.4284;
    baseLng = -49.2733; // Curitiba / PR
  } else if (
    /\b(sc|santa catarina|florianópolis|florianopolis|joinville|blumenau|chapecó|chapeco)\b/i.test(clean)
  ) {
    baseLat = -27.5954;
    baseLng = -48.5480; // Florianópolis / SC
  } else if (
    /\b(rs|rio grande do sul|porto alegre|caxias do sul|pelotas|canoas)\b/i.test(clean)
  ) {
    baseLat = -30.0346;
    baseLng = -51.2177; // Porto Alegre / RS
  } else if (
    /\b(df|go|goiás|goias|brasília|brasilia|goiânia|goiania|aparecida de goiânia)\b/i.test(clean)
  ) {
    baseLat = -15.7975;
    baseLng = -47.8919; // DF / GO
  } else if (
    /\b(ba|bahia|salvador|feira de santana|vitória da conquista|vitoria da conquista)\b/i.test(clean)
  ) {
    baseLat = -12.9777;
    baseLng = -38.5016; // Salvador / BA
  } else if (
    /\b(pe|pernambuco|recife|olinda|jaboatão|jaboatao|caruaru)\b/i.test(clean)
  ) {
    baseLat = -8.0476;
    baseLng = -34.8770; // Recife / PE
  } else if (
    /\b(ce|ceará|ceara|fortaleza|caucaia|juazeiro do norte)\b/i.test(clean)
  ) {
    baseLat = -3.7319;
    baseLng = -38.5267; // Fortaleza / CE
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((hash & 0xff) / 255 - 0.5) * 0.08;
  const lngOffset = (((hash >> 8) & 0xff) / 255 - 0.5) * 0.08;

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
