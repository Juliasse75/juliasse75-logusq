import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  optimizeTSP,
  clusterAndOptimize,
  geocodeAddress,
  DEFAULT_BASE
} from '../src/utils/routingEngine';
import { Entrega, Veiculo } from '../src/types';

describe('routingEngine — Algoritmo de Roteirização e Agrupamento', () => {
  it('calcula a distância Haversine corretamente entre duas coordenadas reais', () => {
    // Rio das Ostras (-22.5269, -41.9481) até Macaé (-22.3708, -41.7869) ~ 24km a 26km
    const dist = haversineDistance(-22.5269, -41.9481, -22.3708, -41.7869);
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeLessThan(30);
  });

  it('retorna 0 para a distância entre o mesmo ponto', () => {
    const dist = haversineDistance(-22.9068, -43.1729, -22.9068, -43.1729);
    expect(dist).toBeCloseTo(0, 5);
  });

  it('ordena uma rota TSP priorizando pontos mais próximos', () => {
    const base = { lat: -22.9000, lng: -43.1000 };
    const pontos: Entrega[] = [
      { id: '1', chave: 'NF-1', cliente: 'Longe', endereco: 'A', latitude: -22.9900, longitude: -43.1900, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: '2', chave: 'NF-2', cliente: 'Perto', endereco: 'B', latitude: -22.9050, longitude: -43.1050, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
    ];

    const rotaOtimizada = optimizeTSP(base.lat, base.lng, pontos);
    expect(rotaOtimizada[0].id).toBe('2'); // Deve visitar o perto primeiro
    expect(rotaOtimizada[1].id).toBe('1'); // Depois o longe
  });

  it('a rota otimizada por TSP não possui distância maior que uma ordem aleatória ou pior caso', () => {
    const base = { lat: -22.9000, lng: -43.1000 };
    const pontos: Entrega[] = [
      { id: '1', chave: 'NF-1', cliente: 'A', endereco: 'Rua A', latitude: -22.9100, longitude: -43.1100, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: '2', chave: 'NF-2', cliente: 'B', endereco: 'Rua B', latitude: -22.9500, longitude: -43.1500, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: '3', chave: 'NF-3', cliente: 'C', endereco: 'Rua C', latitude: -22.9120, longitude: -43.1120, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
    ];

    const otimizada = optimizeTSP(base.lat, base.lng, pontos);
    
    let distOtimizada = 0;
    let curr = base;
    for (const p of otimizada) {
      distOtimizada += haversineDistance(curr.lat, curr.lng, p.latitude, p.longitude);
      curr = { lat: p.latitude, lng: p.longitude };
    }

    // Pior ordem manual: base -> B (longe) -> C (perto) -> A (perto)
    const piorOrdem = [pontos[1], pontos[2], pontos[0]];
    let distPior = 0;
    curr = base;
    for (const p of piorOrdem) {
      distPior += haversineDistance(curr.lat, curr.lng, p.latitude, p.longitude);
      curr = { lat: p.latitude, lng: p.longitude };
    }

    expect(distOtimizada).toBeLessThanOrEqual(distPior);
  });

  it('agrupa entregas em clusters usando spatial K-Means++', () => {
    const numVeiculos = 2;
    const entregas: Entrega[] = [
      { id: '1', chave: '1', cliente: 'C1', endereco: 'E1', latitude: -22.9, longitude: -43.1, pesoMercadoriaKg: 30, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: '2', chave: '2', cliente: 'C2', endereco: 'E2', latitude: -22.9, longitude: -43.1, pesoMercadoriaKg: 30, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: '3', chave: '3', cliente: 'C3', endereco: 'E3', latitude: -22.9, longitude: -43.1, pesoMercadoriaKg: 30, tipoOperacao: 'Entrega', status: 'Pendente' }
    ];

    const resultado = clusterAndOptimize(entregas, numVeiculos, DEFAULT_BASE.latitude, DEFAULT_BASE.longitude);
    const clusterKeys = Object.keys(resultado);

    expect(clusterKeys.length).toBeGreaterThan(0);
    expect(clusterKeys.length).toBeLessThanOrEqual(numVeiculos);
  });

  it('não mistura entregas geograficamente distantes no mesmo veículo quando há mais de um veículo disponível', () => {
    const numVeiculos = 2;

    // Grupo do Norte (~ -22.80) e Grupo do Sul (~ -23.10)
    const entregas: Entrega[] = [
      { id: 'n1', chave: 'n1', cliente: 'Norte 1', endereco: 'N1', latitude: -22.8000, longitude: -43.2000, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: 'n2', chave: 'n2', cliente: 'Norte 2', endereco: 'N2', latitude: -22.8050, longitude: -43.2050, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: 's1', chave: 's1', cliente: 'Sul 1', endereco: 'S1', latitude: -23.1000, longitude: -43.3000, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' },
      { id: 's2', chave: 's2', cliente: 'Sul 2', endereco: 'S2', latitude: -23.1050, longitude: -43.3050, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' }
    ];

    const resultado = clusterAndOptimize(entregas, numVeiculos, DEFAULT_BASE.latitude, DEFAULT_BASE.longitude);
    const clusters = Object.values(resultado);
    
    expect(clusters.length).toBe(2);
    
    // Verifica se n1 e n2 estão juntos em um veículo e s1 e s2 estão em outro
    const list1 = clusters[0].map(p => p.id);
    const list2 = clusters[1].map(p => p.id);

    const norteJuntos = (list1.includes('n1') && list1.includes('n2')) || (list2.includes('n1') && list2.includes('n2'));
    const sulJuntos = (list1.includes('s1') && list1.includes('s2')) || (list2.includes('s1') && list2.includes('s2'));

    expect(norteJuntos).toBe(true);
    expect(sulJuntos).toBe(true);
  });

  it('garante que nenhuma entrega seja perdida após o processo de roteirização', () => {
    const numVeiculos = 2;

    const entregas: Entrega[] = Array.from({ length: 10 }, (_, i) => ({
      id: `ent-${i}`,
      chave: `NF-${i}`,
      cliente: `Cliente ${i}`,
      endereco: `Rua ${i}`,
      latitude: -22.9000 + (i * 0.01),
      longitude: -43.1000 + (i * 0.01),
      pesoMercadoriaKg: 15,
      tipoOperacao: 'Entrega',
      status: 'Pendente'
    }));

    const resultado = clusterAndOptimize(entregas, numVeiculos, DEFAULT_BASE.latitude, DEFAULT_BASE.longitude);
    const totalEntregasAlocadas = Object.values(resultado).reduce((acc, path) => acc + path.length, 0);

    expect(totalEntregasAlocadas).toBe(10);
  });

  it('retorna objeto vazio se não houver entregas ou não houver veículos disponíveis', () => {
    expect(clusterAndOptimize([], 2, DEFAULT_BASE.latitude, DEFAULT_BASE.longitude)).toEqual({});
    expect(clusterAndOptimize([{ id: '1', chave: '1', cliente: 'C', endereco: 'E', latitude: -22.9, longitude: -43.1, pesoMercadoriaKg: 10, tipoOperacao: 'Entrega', status: 'Pendente' }], 0, DEFAULT_BASE.latitude, DEFAULT_BASE.longitude)).toEqual({});
  });

  it('nunca cria mais rotas do que veículos disponíveis na frota', () => {
    const numVeiculos = 1;

    const entregas: Entrega[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ent-${i}`,
      chave: `NF-${i}`,
      cliente: `Cliente ${i}`,
      endereco: `Rua ${i}`,
      latitude: -22.9000 + (i * 0.01),
      longitude: -43.1000 + (i * 0.01),
      pesoMercadoriaKg: 10,
      tipoOperacao: 'Entrega',
      status: 'Pendente'
    }));

    const resultado = clusterAndOptimize(entregas, numVeiculos, DEFAULT_BASE.latitude, DEFAULT_BASE.longitude);
    expect(Object.keys(resultado).length).toBeLessThanOrEqual(numVeiculos);
  });

  it('a geocodificação offline localiza endereços conhecidos na região', () => {
    const resultMacaé = geocodeAddress('Macaé, RJ', { lat: DEFAULT_BASE.latitude, lng: DEFAULT_BASE.longitude });
    expect(resultMacaé.lat).toBeDefined();
    expect(resultMacaé.lng).toBeDefined();
    expect(typeof resultMacaé.lat).toBe('number');
  });

  it('a geocodificação offline fornece fallback geográfico seguro próximo à base para endereços desconhecidos', () => {
    const base = { lat: -22.5000, lng: -41.9000 };
    const resultUnk = geocodeAddress('Endereço Desconhecido XPTO 9999', base);
    
    // Deve estar a uma distância razoável (< 50km) da base
    const dist = haversineDistance(base.lat, base.lng, resultUnk.lat, resultUnk.lng);
    expect(dist).toBeLessThan(50);
  });
});
