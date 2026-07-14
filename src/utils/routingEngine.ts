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
  // Belo Horizonte
  'savassi': { lat: -19.9388, lng: -43.9386 },
  'funcionários': { lat: -19.9322, lng: -43.9298 },
  'lourdes': { lat: -19.9285, lng: -43.9442 },
  'centro': { lat: -19.9191, lng: -43.9386 },
  'pampulha': { lat: -19.8519, lng: -43.9749 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  // São Paulo
  'paulista': { lat: -23.5614, lng: -46.6559 },
  'bela vista': { lat: -23.5619, lng: -46.6433 },
  'pinheiros': { lat: -23.5668, lng: -46.7032 },
  'centro sp': { lat: -23.5489, lng: -46.6388 },
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  // Rio de Janeiro
  'copacabana': { lat: -22.9714, lng: -43.1826 },
  'centro rj': { lat: -22.9068, lng: -43.1729 },
  'barra da tijuca': { lat: -23.0016, lng: -43.3444 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
};

/**
 * Normalizes and geocodes an address.
 * Uses a local database lookup first, with a smart coordinate generator for fallbacks
 * to guarantee that all points appear on the map beautifully without relying on external APIs.
 */
export function geocodeAddress(endereco: string): { lat: number; lng: number } {
  const clean = endereco.toLowerCase().trim();
  if (!clean || clean === '-') {
    return { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude };
  }

  // Exact or partial lookup
  for (const [key, coords] of Object.entries(GEOCODE_DB)) {
    if (clean.includes(key)) {
      // Add a tiny random jitter so multiple deliveries in the same area don't stack exactly
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.005,
        lng: coords.lng + (Math.random() - 0.5) * 0.005,
      };
    }
  }

  // Fallback: Generate coordinates based on a simple string hash within the Belo Horizonte area
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((hash & 0xff) / 255 - 0.5) * 0.05;
  const lngOffset = (((hash >> 8) & 0xff) / 255 - 0.5) * 0.05;

  return {
    lat: DEFAULT_BASE.latitude + latOffset,
    lng: DEFAULT_BASE.longitude + lngOffset,
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
export function clusterAndOptimize(entregas: Entrega[], numVeiculos: number): Record<number, Entrega[]> {
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

  // 2. Map back to Entregas and optimize each cluster with TSP starting from default base
  const result: Record<number, Entrega[]> = {};
  Object.entries(clusters).forEach(([cId, idxs]) => {
    if (idxs.length === 0) return;
    const subList = idxs.map(idx => entregas[idx]);
    const optimized = optimizeTSP(DEFAULT_BASE.latitude, DEFAULT_BASE.longitude, subList);
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
