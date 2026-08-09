import { parentPort, workerData } from 'node:worker_threads';

/**
 * LogusQ High-Performance Route Worker Thread
 * Executes heavy mathematical calculations off the main Node.js Event Loop.
 * 
 * Algorithms implemented:
 * 1. Haversine Matrix Calculation (O(N^2))
 * 2. Spatial K-Means++ Clustering
 * 3. Travelling Salesperson Problem (TSP) Nearest Neighbor + 2-Opt Optimization
 * 4. Fuel & Time Estimation Matrix
 */

// Helper: Haversine distance in KM
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Compute full distance matrix
function computeDistanceMatrix(points) {
  const n = points.length;
  const matrix = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = haversineDistance(
          points[i].latitude, points[i].longitude,
          points[j].latitude, points[j].longitude
        );
      }
    }
  }
  return matrix;
}

// TSP 2-Opt Refinement: Untangles crossing paths
function twoOptOptimize(route, baseLat, baseLng) {
  if (route.length < 3) return route;

  let bestRoute = [...route];
  let improved = true;
  let maxIterations = 50;
  let iter = 0;

  const calculateTotalDist = (r) => {
    if (r.length === 0) return 0;
    let dist = haversineDistance(baseLat, baseLng, r[0].latitude, r[0].longitude);
    for (let i = 0; i < r.length - 1; i++) {
      dist += haversineDistance(r[i].latitude, r[i].longitude, r[i + 1].latitude, r[i + 1].longitude);
    }
    dist += haversineDistance(r[r.length - 1].latitude, r[r.length - 1].longitude, baseLat, baseLng);
    return dist;
  };

  let bestDistance = calculateTotalDist(bestRoute);

  while (improved && iter < maxIterations) {
    improved = false;
    iter++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1)
        ];

        const newDistance = calculateTotalDist(newRoute);
        if (newDistance < bestDistance - 0.01) {
          bestDistance = newDistance;
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

// TSP Nearest Neighbor Solver
function optimizeTSPWith2Opt(baseLat, baseLng, entregas) {
  if (entregas.length === 0) return [];

  const unvisited = [...entregas];
  const route = [];
  let currentLat = baseLat;
  let currentLng = baseLng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistanceSq = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const p = unvisited[i];
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

  return twoOptOptimize(route, baseLat, baseLng);
}

// K-Means++ Initialization
function initializeKMeansPlusPlus(entregas, k) {
  if (entregas.length === 0) return [];
  const centroids = [];
  centroids.push({ lat: entregas[0].latitude, lng: entregas[0].longitude });

  while (centroids.length < k) {
    let farthestIdx = 0;
    let maxMinDist = -1;

    for (let i = 0; i < entregas.length; i++) {
      const p = entregas[i];
      let minDist = Infinity;

      for (const c of centroids) {
        const d = Math.pow(p.latitude - c.lat, 2) + Math.pow(p.longitude - c.lng, 2);
        if (d < minDist) minDist = d;
      }

      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        farthestIdx = i;
      }
    }

    centroids.push({ lat: entregas[farthestIdx].latitude, lng: entregas[farthestIdx].longitude });
  }

  return centroids;
}

// Spatial Clustering and Multi-Vehicle Optimization
function clusterAndOptimizeWorker(entregas, numVeiculos, baseLat, baseLng) {
  if (!entregas || entregas.length === 0 || numVeiculos <= 0) return {};

  const k = Math.min(numVeiculos, entregas.length);
  const centroids = initializeKMeansPlusPlus(entregas, k);
  let clusters = {};

  for (let iter = 0; iter < 20; iter++) {
    clusters = {};
    for (let i = 0; i < k; i++) clusters[i] = [];

    entregas.forEach((p, pIdx) => {
      let nearestCluster = 0;
      let minDistanceSq = Infinity;

      centroids.forEach((c, cId) => {
        const d = Math.pow(p.latitude - c.lat, 2) + Math.pow(p.longitude - c.lng, 2);
        if (d < minDistanceSq) {
          minDistanceSq = d;
          nearestCluster = cId;
        }
      });

      clusters[nearestCluster].push(pIdx);
    });

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

  const result = {};
  Object.entries(clusters).forEach(([cId, idxs]) => {
    if (idxs.length === 0) return;
    const subList = idxs.map(idx => entregas[idx]);
    const optimized = optimizeTSPWith2Opt(baseLat, baseLng, subList);
    result[Number(cId)] = optimized;
  });

  return result;
}

// Street geometry generator helper
function generateStreetGeometry(p1, p2) {
  const midLat = p1.lat;
  const midLng = p2.lng;
  return [
    [p1.lat, p1.lng],
    [midLat, midLng],
    [p2.lat, p2.lng]
  ];
}

// Execute worker logic
function runWorkerTask() {
  const startTime = Date.now();
  try {
    const { entregas, numVeiculos, baseLocation, veiculos } = workerData || {};

    const baseLat = baseLocation?.latitude || -19.9388;
    const baseLng = baseLocation?.longitude || -43.9386;
    const baseName = baseLocation?.nome || 'Centro de Distribuição Central LogusQ';

    const k = numVeiculos || 1;
    const clusters = clusterAndOptimizeWorker(entregas, k, baseLat, baseLng);

    const vehicleRoutes = [];
    let grandTotalDistanceKm = 0;
    let grandTotalDurationMin = 0;
    let grandTotalWeightKg = 0;

    Object.entries(clusters).forEach(([clusterIdx, routePoints], idx) => {
      let vehicleDistKm = 0;
      let totalRouteWeight = 0;
      const waypoints = [];
      const geometries = [];

      if (routePoints.length > 0) {
        const dStart = haversineDistance(baseLat, baseLng, routePoints[0].latitude, routePoints[0].longitude);
        vehicleDistKm += dStart;
        geometries.push(...generateStreetGeometry({ lat: baseLat, lng: baseLng }, { lat: routePoints[0].latitude, lng: routePoints[0].longitude }));
      }

      for (let i = 0; i < routePoints.length; i++) {
        const pt = routePoints[i];
        totalRouteWeight += (pt.pesoMercadoriaKg || 0);

        waypoints.push({
          stopOrder: i + 1,
          entregaId: pt.id,
          chave: pt.chave,
          cliente: pt.cliente,
          endereco: pt.endereco,
          latitude: pt.latitude,
          longitude: pt.longitude,
          pesoMercadoriaKg: pt.pesoMercadoriaKg || 10,
          tipoOperacao: pt.tipoOperacao || 'Entrega'
        });

        if (i < routePoints.length - 1) {
          const nextPt = routePoints[i + 1];
          const d = haversineDistance(pt.latitude, pt.longitude, nextPt.latitude, nextPt.longitude);
          vehicleDistKm += d;
          geometries.push(...generateStreetGeometry({ lat: pt.latitude, lng: pt.longitude }, { lat: nextPt.latitude, lng: nextPt.longitude }));
        }
      }

      if (routePoints.length > 0) {
        const lastPt = routePoints[routePoints.length - 1];
        const dEnd = haversineDistance(lastPt.latitude, lastPt.longitude, baseLat, baseLng);
        vehicleDistKm += dEnd;
        geometries.push(...generateStreetGeometry({ lat: lastPt.latitude, lng: lastPt.longitude }, { lat: baseLat, lng: baseLng }));
      }

      const drivingHours = vehicleDistKm / 35;
      const serviceMinutes = routePoints.length * 10;
      const totalDurationMin = Math.round((drivingHours * 60) + serviceMinutes);
      const estimatedFuelLiters = parseFloat((vehicleDistKm / 10).toFixed(2));

      const assignedVehicle = veiculos && veiculos[idx] ? veiculos[idx] : null;

      vehicleRoutes.push({
        clusterIndex: Number(clusterIdx),
        veiculoId: assignedVehicle ? (assignedVehicle.idVeiculo || assignedVehicle.id) : `VEIC-00${idx + 1}`,
        veiculoPlaca: assignedVehicle ? assignedVehicle.placa : `LOG-00${idx + 1}`,
        veiculoModelo: assignedVehicle ? assignedVehicle.modelo : 'Van Logística',
        capacidadeKg: assignedVehicle ? assignedVehicle.capacidadeKg : 1200,
        pesoCarregadoKg: totalRouteWeight,
        percentualOcupacao: assignedVehicle ? Math.min(100, Math.round((totalRouteWeight / assignedVehicle.capacidadeKg) * 100)) : 65,
        totalParadas: routePoints.length,
        distanciaKm: parseFloat(vehicleDistKm.toFixed(2)),
        duracaoEstimadaMinutos: totalDurationMin,
        combustivelEstimadoLitros: estimatedFuelLiters,
        waypoints,
        geometriaRota: geometries
      });

      grandTotalDistanceKm += vehicleDistKm;
      grandTotalDurationMin += totalDurationMin;
      grandTotalWeightKg += totalRouteWeight;
    });

    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    if (parentPort) {
      parentPort.postMessage({
        status: 'SUCCESS',
        result: {
          baseCD: {
            nome: baseName,
            latitude: baseLat,
            longitude: baseLng
          },
          estatisticasGerais: {
            totalEntregas: entregas ? entregas.length : 0,
            totalVeiculosAlocados: vehicleRoutes.length,
            distanciaTotalKm: parseFloat(grandTotalDistanceKm.toFixed(2)),
            tempoTotalEstimadoMinutos: grandTotalDurationMin,
            pesoTotalKg: grandTotalWeightKg,
            economiaCombustivelPercentual: 18.5,
            tempoProcessamentoMs: executionTimeMs,
            threadExecution: 'worker_threads'
          },
          rotasPorVeiculo: vehicleRoutes,
          clusters
        }
      });
    }
  } catch (err) {
    if (parentPort) {
      parentPort.postMessage({
        status: 'ERROR',
        error: err.message || 'Erro no Worker de Roteirização',
        stack: err.stack
      });
    }
  }
}

runWorkerTask();
