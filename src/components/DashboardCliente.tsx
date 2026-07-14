import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { Veiculo, Condutor, Entrega, PlanosSaaS } from '../types';
import { 
  Truck, Users, MapPin, Calculator, Plus, Upload, Download, Play, 
  Map, CheckCircle, Trash2, Calendar, FileText, Clipboard, Settings, ShieldAlert
} from 'lucide-react';
import SimulatedMap from './SimulatedMap';
import { clusterAndOptimize, DEFAULT_BASE } from '../utils/routingEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardClienteProps {
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardCliente({ userEmail, onLogout }: DashboardClienteProps) {
  const [activeTab, setActiveTab] = useState<'frota' | 'roteiro' | 'custos'>('roteiro');
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Client info
  const clientData = dbRepo.getCliente(userEmail);
  const frota = dbRepo.getFrota(userEmail);
  const condutores = dbRepo.getCondutores(userEmail);
  const entregasPendentes = dbRepo.getEntregas(userEmail);

  // Active Routes State (persist in memory or local storage, or generated after optimize)
  const [activeRoutes, setActiveRoutes] = useState<Record<string, { driver: string; vehicle: string; path: Entrega[]; km: number; duration: number }>>({});
  const [mapRoutes, setMapRoutes] = useState<Record<number, Entrega[]>>({});

  // Form selections
  const [selectedVeiculoEdit, setSelectedVeiculoEdit] = useState<string>(frota[0]?.idVeiculo || '');
  const veicSel = frota.find(v => v.idVeiculo === selectedVeiculoEdit);

  // --- VEHICLE CREATE ---
  const [vId, setVId] = useState('');
  const [vPlaca, setVPlaca] = useState('');
  const [vTipo, setVTipo] = useState<'Caminhao' | 'Fiorino/Van' | 'Carro Leve' | 'Motocicleta'>('Fiorino/Van');
  const [vFab, setVFab] = useState('');
  const [vMod, setVMod] = useState('');
  const [vCor, setVCor] = useState('Branco');
  const [vAno, setVAno] = useState('2022');
  const [vCap, setVCap] = useState(650);

  // --- VEHICLE EDIT ---
  const [evPlaca, setEvPlaca] = useState('');
  const [evCap, setEvCap] = useState(650);
  const [evStatus, setEvStatus] = useState<'Disponivel' | 'Inativo' | 'Manutencao'>('Disponivel');
  const [evObs, setEvObs] = useState('');

  React.useEffect(() => {
    if (veicSel) {
      setEvPlaca(veicSel.placa);
      setEvCap(veicSel.capacidadeKg);
      setEvStatus(veicSel.status as any);
      setEvObs(veicSel.observacao || '');
    }
  }, [selectedVeiculoEdit, refreshKey]);

  // --- DRIVER CREATE ---
  const [dNome, setDNome] = useState('');
  const [dCpf, setDCpf] = useState('');
  const [dTel, setDTel] = useState('');
  const [dCnh, setDCnh] = useState('');
  const [dCat, setDCat] = useState('B');
  const [dVencCnh, setDVencCnh] = useState('10/12/2030');
  const [dEmail, setDEmail] = useState('');
  const [dVeiculo, setDVeiculo] = useState('-');

  // --- VEHICLE BINDING ---
  const [bindDriver, setBindDriver] = useState('');
  const [bindVehicle, setBindVehicle] = useState('');

  // --- DELIVERY MANUAL CREATE / BULK ---
  const [delChave, setDelChave] = useState('');
  const [delCliente, setDelCliente] = useState('');
  const [delEnd, setDelEnd] = useState('');
  const [delPeso, setDelPeso] = useState(15);
  const [delTipo, setDelTipo] = useState<'Entrega' | 'Coleta'>('Entrega');

  // --- COST CALCULATOR ---
  const [combustivelPreco, setCombustivelPreco] = useState(5.89);
  const [veiculoConsumo, setVeiculoConsumo] = useState(9.5); // km/l
  const [diariaMotorista, setDiariaMotorista] = useState(150.0);
  const [fatorManutencao, setFatorManutencao] = useState(0.12); // R$ per km

  // Calculations for costs
  const totalKmRoteado = (Object.values(activeRoutes) as any[]).reduce((sum, r) => sum + r.km, 0);
  const numRotas = Object.keys(activeRoutes).length;
  
  const custoCombustivel = veiculoConsumo > 0 ? (totalKmRoteado / veiculoConsumo) * combustivelPreco : 0;
  const custoMotoristas = numRotas * diariaMotorista;
  const custoManutencao = totalKmRoteado * fatorManutencao;
  const custoTotalEstimado = custoCombustivel + custoMotoristas + custoManutencao;

  const costChartData = [
    { name: 'Combustível', value: Math.round(custoCombustivel) },
    { name: 'Diária Motoristas', value: Math.round(custoMotoristas) },
    { name: 'Depreciação/Manut.', value: Math.round(custoManutencao) }
  ].filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

  // --- OPTIMIZATION SELECTIONS ---
  const [optVehicles, setOptVehicles] = useState<string[]>([]);

  // --- ACTIONS ---
  const handleAddVeiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vId || !vPlaca) return;
    dbRepo.cadastrarVeiculo(userEmail, {
      idVeiculo: vId,
      placa: vPlaca,
      modelo: vMod,
      fabricante: vFab,
      anoFabricacao: vAno,
      cor: vCor,
      tipo: vTipo,
      capacidadeKg: vCap
    });
    setVId('');
    setVPlaca('');
    setVMod('');
    setVFab('');
    triggerRefresh();
    alert('Veículo cadastrado!');
  };

  const handleUpdateVeiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculoEdit) return;
    dbRepo.editarVeiculo(userEmail, selectedVeiculoEdit, {
      placa: evPlaca,
      capacidadeKg: evCap,
      status: evStatus,
      observacao: evObs
    });
    triggerRefresh();
    alert('Veículo atualizado!');
  };

  const handleAddCondutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dNome || !dCpf || !dEmail) return;
    dbRepo.cadastrarCondutor(userEmail, {
      nome: dNome,
      cpf: dCpf,
      telefone: dTel,
      cnh: dCnh,
      categoriaCnh: dCat,
      vencCnh: dVencCnh,
      email: dEmail,
      veiculo: dVeiculo
    });
    setDNome('');
    setDCpf('');
    setDEmail('');
    triggerRefresh();
    alert('Motorista cadastrado!');
  };

  const handleBindDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindDriver || !bindVehicle) return;
    dbRepo.vincularVeiculoCondutor(userEmail, bindDriver, bindVehicle);
    triggerRefresh();
    alert('Vínculo atualizado com sucesso!');
  };

  const handleAddEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delChave || !delEnd) return;
    dbRepo.cadastrarEntrega(userEmail, {
      chave: delChave,
      cliente: delCliente || 'Cliente Final',
      endereco: delEnd,
      pesoMercadoriaKg: delPeso,
      tipoOperacao: delTipo
    });
    setDelChave('');
    setDelCliente('');
    setDelEnd('');
    triggerRefresh();
    alert('Ponto de entrega adicionado!');
  };

  const handleImportEntregasBulk = () => {
    // Generate bulk deliveries in BH
    const BH_POINTS = [
      { chave: 'ENT-201', cliente: 'Supermercado BH', endereco: 'Rua da Bahia, 1022 - Centro, Belo Horizonte - MG', peso: 120 },
      { chave: 'ENT-202', cliente: 'Drogaria Araujo', endereco: 'Avenida Getúlio Vargas, 1420 - Savassi, Belo Horizonte - MG', peso: 45 },
      { chave: 'ENT-203', cliente: 'Lojas Americanas', endereco: 'Avenida Afonso Pena, 3210 - Cruzeiro, Belo Horizonte - MG', peso: 210 },
      { chave: 'ENT-204', cliente: 'Restaurante Dona Lucinha', endereco: 'Rua Sergipe, 811 - Funcionários, Belo Horizonte - MG', peso: 60 },
      { chave: 'ENT-205', cliente: 'Academia Bodytech', endereco: 'Rua Pernambuco, 1055 - Savassi, Belo Horizonte - MG', peso: 15 },
    ];

    BH_POINTS.forEach(p => {
      dbRepo.cadastrarEntrega(userEmail, {
        chave: p.chave,
        cliente: p.cliente,
        endereco: p.endereco,
        pesoMercadoriaKg: p.peso,
        tipoOperacao: 'Entrega'
      });
    });
    triggerRefresh();
    alert('5 pontos de entrega demo BH importados com sucesso!');
  };

  const handleOptimize = () => {
    const selectedVehs = frota.filter(v => v.status === 'Disponivel');
    if (selectedVehs.length === 0) {
      alert('Nenhum veículo disponível na frota para roteirização!');
      return;
    }
    if (entregasPendentes.length === 0) {
      alert('Nenhuma entrega pendente para roteirizar. Adicione entregas na primeira aba.');
      return;
    }

    // Call routing engine K-Means + TSP Clustering
    const clusters = clusterAndOptimize(entregasPendentes, selectedVehs.length);

    // Map clusters to vehicles
    const routesObj: Record<string, { driver: string; vehicle: string; path: Entrega[]; km: number; duration: number }> = {};
    const mapRoutesObj: Record<number, Entrega[]> = {};

    Object.entries(clusters).forEach(([clusterId, points], idx) => {
      const v = selectedVehs[idx % selectedVehs.length];
      // Find driver for this vehicle
      const driver = condutores.find(c => c.veiculo === v.idVeiculo)?.nome || 'Motorista Eventual';
      
      // Calculate distances: simple simulated scale (each node average 2.5km)
      const distance = points.length * 3.2 + 4.0; 
      const duration = points.length * 15 + 30; // min

      routesObj[`ROTA-${idx + 1}`] = {
        driver,
        vehicle: `${v.modelo} (${v.placa})`,
        path: points,
        km: parseFloat(distance.toFixed(1)),
        duration: Math.round(duration)
      };

      mapRoutesObj[idx] = points;
    });

    setActiveRoutes(routesObj);
    setMapRoutes(mapRoutesObj);
    alert(`Otimização concluída! ${Object.keys(routesObj).length} rotas geradas de forma científica.`);
  };

  const downloadDriverRouteTxt = (routeId: string) => {
    const r = activeRoutes[routeId];
    if (!r) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    let content = `FOLHA DE ROTA OTIMIZADA LOGUSQ - ${routeId}
DATA: ${dataAtual}
VEÍCULO: ${r.vehicle}
CONDUTOR: ${r.driver}
------------------------------------------------------------
ESTIMATIVAS DE VIAGEM:
Distância Total: ${r.km} KM
Duração Estimada: ${Math.floor(r.duration / 60)}h ${r.duration % 60}min
Total de Paradas: ${r.path.length} clientes
------------------------------------------------------------
SELO DO CENTRO DE DISTRIBUIÇÃO:
Origem: Hub Savassi (Av. do Contorno, Belo Horizonte)
------------------------------------------------------------

INSTRUÇÕES DE NAVEGAÇÃO SEQUENCIADA:

[PARTIDA] CD Hub Savassi (Avenida do Contorno)
  -> Carregamento total da carga consolidada.

`;

    r.path.forEach((p, idx) => {
      content += `[PARADA ${idx + 1}] Cliente: ${p.cliente}
  Operação: ${p.tipoOperacao}
  Carga: ${p.pesoMercadoriaKg} kg
  Endereço: ${p.endereco}
  Chave NFe: ${p.chave}
  Status esperado: Recebimento imediato
  
`;
    });

    content += `[RETORNO] CD Hub Savassi (Avenida do Contorno)
  -> Descarregamento de canhotos, devoluções e prestação de contas.

------------------------------------------------------------
Assinatura do Motorista: _______________________________
Assinatura do Expedidor: _______________________________`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Folha_Rota_${routeId}_${r.driver.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCompleteRoute = (routeId: string) => {
    const r = activeRoutes[routeId];
    if (!r) return;
    
    // Mark entregas inside route as completed in localStorage
    r.path.forEach(p => {
      dbRepo.deletarEntrega(userEmail, p.chave);
    });

    const updated = { ...activeRoutes };
    delete updated[routeId];
    setActiveRoutes(updated);
    
    // also remove from map
    const newMapRoutes = { ...mapRoutes };
    // Find index of route
    const index = Object.keys(activeRoutes).indexOf(routeId);
    if (index !== -1) {
      delete newMapRoutes[index];
    }
    setMapRoutes(newMapRoutes);

    triggerRefresh();
    alert(`Rota ${routeId} concluída! Baixa realizada no sistema.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans selection:bg-violet-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              LOGUS<span className="text-violet-400 font-mono">Q</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
              {clientData?.empresa || 'Gestor de Frota'}
            </p>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('roteiro')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'roteiro' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" /> Roteirização Científica
            </button>
            <button
              onClick={() => setActiveTab('frota')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'frota' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" /> Frota e Condutores
            </button>
            <button
              onClick={() => setActiveTab('custos')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'custos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" /> Simulador de Custos
            </button>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 text-xs">
          <div className="text-[10px] text-slate-500 font-mono truncate mb-2">
            ID: {clientData?.idCliente || 'CLI-DEMO'}
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* TAB 1: ROTEIRIZACAO CIENTIFICA */}
        {activeTab === 'roteiro' && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Roteirização e Distribuição de Carga</h1>
                <p className="text-xs text-slate-400">Adicione pontos de entrega, agrupe em veículos via K-Means e otimize caminhos com TSP.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handleImportEntregasBulk}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700/50 transition-colors"
                >
                  Importar Demo BH
                </button>
                <button
                  onClick={handleOptimize}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Otimizar Rotas
                </button>
              </div>
            </div>

            {/* Split Screen Grid: Interactive Map + Left controllers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Input delivery & list pending (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Manual input */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Novo Ponto de Entrega</h3>
                  <form onSubmit={handleAddEntrega} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Chave / ID</label>
                        <input
                          type="text"
                          required
                          placeholder="EX: ENT-10"
                          value={delChave}
                          onChange={e => setDelChave(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Operação</label>
                        <select
                          value={delTipo}
                          onChange={e => setDelTipo(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Entrega">Entrega</option>
                          <option value="Coleta">Coleta</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Cliente / Destinatário</label>
                      <input
                        type="text"
                        placeholder="EX: Drogaria Savassi"
                        value={delCliente}
                        onChange={e => setDelCliente(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Endereço Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="EX: Av. Afonso Pena, 1500 - BH"
                        value={delEnd}
                        onChange={e => setDelEnd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Peso Carga (KG)</label>
                      <input
                        type="number"
                        value={delPeso}
                        onChange={e => setDelPeso(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-xs font-semibold transition-colors mt-2"
                    >
                      Adicionar Ponto
                    </button>
                  </form>
                </div>

                {/* Pending points list */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl max-h-[300px] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pontos Pendentes ({entregasPendentes.length})</h3>
                    {entregasPendentes.length > 0 && (
                      <button 
                        onClick={() => {
                          entregasPendentes.forEach(p => dbRepo.deletarEntrega(userEmail, p.chave));
                          triggerRefresh();
                        }}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Limpar todos
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {entregasPendentes.length === 0 ? (
                      <div className="text-[11px] text-slate-500 text-center py-4">Nenhum ponto de entrega cadastrado. Importe a demo acima!</div>
                    ) : (
                      entregasPendentes.map(ent => (
                        <div key={ent.chave} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg text-xs flex justify-between items-start">
                          <div className="space-y-0.5 pr-2">
                            <div className="font-bold text-slate-200">{ent.cliente}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">{ent.endereco}</div>
                            <div className="text-[9px] font-mono text-violet-400 font-semibold">{ent.chave} • {ent.pesoMercadoriaKg} kg</div>
                          </div>
                          <button 
                            onClick={() => { dbRepo.deletarEntrega(userEmail, ent.chave); triggerRefresh(); }}
                            className="text-slate-600 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Visual Simulated Map + Active Routes sheet (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* SVG MAP */}
                <SimulatedMap entregas={entregasPendentes} rotas={mapRoutes} />

                {/* Active Routes list */}
                {Object.keys(activeRoutes).length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rotas Ativas & Expedição</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeRoutes).map(([rId, r]: [string, any]) => (
                        <div key={rId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                                  {rId}
                                </span>
                                <h4 className="font-extrabold text-white text-xs mt-1.5">{r.driver}</h4>
                                <p className="text-[11px] text-slate-500">{r.vehicle}</p>
                              </div>
                              <button 
                                onClick={() => handleCompleteRoute(rId)}
                                className="text-[10px] font-bold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white px-2.5 py-1 rounded transition-colors"
                              >
                                Concluir Rota
                              </button>
                            </div>

                            <div className="mt-3 space-y-1 text-[11px] font-mono text-slate-400">
                              <div>Paradas: <span className="text-white font-bold">{r.path.length}</span></div>
                              <div>Distância: <span className="text-blue-400">{r.km} KM</span></div>
                              <div>Duração: <span className="text-slate-300">{Math.floor(r.duration / 60)}h {r.duration % 60}min</span></div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between">
                            <button
                              onClick={() => downloadDriverRouteTxt(rId)}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1.5 font-mono"
                            >
                              <Download className="w-3.5 h-3.5 text-violet-400" />
                              Baixar Folha de Rota (TXT)
                            </button>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider animate-pulse">● em trânsito</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: FROTA E CONDUTORES */}
        {activeTab === 'frota' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Gestão da Frota e Motoristas</h1>
              <p className="text-xs text-slate-400">Gerencie seus veículos, vincule motoristas e acompanhe registros de manutenção.</p>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Forms */}
              <div className="space-y-6">
                
                {/* Add vehicle form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Adicionar Veículo</h3>
                  <form onSubmit={handleAddVeiculo} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">ID Interno</label>
                        <input
                          type="text" required placeholder="VEIC-10" value={vId} onChange={e => setVId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Placa</label>
                        <input
                          type="text" required placeholder="ABC-1234" value={vPlaca} onChange={e => setVPlaca(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Fabricante</label>
                        <input
                          type="text" placeholder="Ford" value={vFab} onChange={e => setVFab(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Modelo</label>
                        <input
                          type="text" placeholder="Cargo 816" value={vMod} onChange={e => setVMod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Tipo Modal</label>
                        <select
                          value={vTipo} onChange={e => setVTipo(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Caminhao">Caminhão</option>
                          <option value="Fiorino/Van">Fiorino/Van</option>
                          <option value="Carro Leve">Carro Leve</option>
                          <option value="Motocicleta">Motocicleta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Capacidade (KG)</label>
                        <input
                          type="number" value={vCap} onChange={e => setVCap(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 rounded text-xs transition-colors mt-2">
                      Salvar Veículo
                    </button>
                  </form>
                </div>

                {/* Binder Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Vincular Motorista ao Veículo</h3>
                  <form onSubmit={handleBindDriver} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Motorista</label>
                      <select
                        value={bindDriver} onChange={e => setBindDriver(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Selecione o Motorista --</option>
                        {condutores.map(c => <option key={c.email} value={c.email}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Veículo Alocado</label>
                      <select
                        value={bindVehicle} onChange={e => setBindVehicle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Selecione o Veículo --</option>
                        <option value="-">-- Nenhum (Liberar Veículo) --</option>
                        {frota.map(v => <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-xs font-semibold transition-colors">
                      Efetuar Vínculo de Chave
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: Base Lists (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Vehicles list */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base de Veículos Ativa</h3>
                  
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-xs text-left text-slate-400">
                      <thead className="text-[10px] uppercase font-mono bg-slate-950/50 text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">ID / Placa</th>
                          <th className="px-4 py-3">Modelo</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Capacidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {frota.map(v => {
                          const driverName = condutores.find(c => c.veiculo === v.idVeiculo)?.nome || 'Sem motorista';
                          return (
                            <tr key={v.idVeiculo} className="hover:bg-slate-800/10">
                              <td className="px-4 py-3">
                                <div className="font-bold text-white">{v.idVeiculo}</div>
                                <div className="text-[10px] font-mono text-slate-500">{v.placa}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-300">{v.modelo}</div>
                                <div className="text-[10px] text-violet-400">{driverName}</div>
                              </td>
                              <td className="px-4 py-3">{v.tipo}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                  v.status === 'Disponivel' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {v.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-200">{v.capacidadeKg} kg</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Drivers list */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base de Motoristas Habilitados</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {condutores.map(c => (
                      <div key={c.email} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-xs">{c.nome}</h4>
                            <span className="text-[9px] font-mono font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded">
                              CNH: {c.categoriaCnh}
                            </span>
                          </div>
                          <div className="mt-2.5 space-y-1 text-[11px] font-mono text-slate-400">
                            <div>Telefone: <span className="text-slate-300">{c.telefone}</span></div>
                            <div>Login: <span className="text-slate-300 truncate inline-block max-w-[150px]">{c.email}</span></div>
                            <div>Alocação: <span className="text-blue-400 font-semibold">{c.veiculo !== '-' ? c.veiculo : 'Disponível'}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SIMULADOR DE CUSTOS */}
        {activeTab === 'custos' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Simulador Científico de Custos de Viagem</h1>
              <p className="text-xs text-slate-400">Estime despesas de combustível, diárias de motoristas e depreciação com precisão matemática.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Calculator Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 h-fit">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Parâmetros Operacionais</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Preço Combustível (R$/L)</label>
                    <input
                      type="number" step="0.01" value={combustivelPreco}
                      onChange={e => setCombustivelPreco(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Consumo Médio (KM/L)</label>
                    <input
                      type="number" step="0.1" value={veiculoConsumo}
                      onChange={e => setVeiculoConsumo(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Diária Média Motorista (R$)</label>
                    <input
                      type="number" value={diariaMotorista}
                      onChange={e => setDiariaMotorista(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Fator Depreciação/KM (R$)</label>
                    <input
                      type="number" step="0.01" value={fatorManutencao}
                      onChange={e => setFatorManutencao(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cost report and pie chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Relatório Consolidado de Custos</h3>
                  
                  {totalKmRoteado > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={costChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {costChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `R$ ${value}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 font-mono text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Distância Total:</span>
                          <span className="text-white font-bold">{totalKmRoteado} KM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Combustível:</span>
                          <span className="text-violet-400 font-bold">R$ {custoCombustivel.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Diária Motoristas:</span>
                          <span className="text-emerald-400 font-bold">R$ {custoMotoristas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manut./Depreciação:</span>
                          <span className="text-amber-400 font-bold">R$ {custoManutencao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 flex justify-between text-sm">
                          <span className="text-slate-300 font-bold">Custo Total:</span>
                          <span className="text-white font-extrabold text-base">R$ {custoTotalEstimado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-800 border-dashed rounded-xl p-8 text-center text-xs text-slate-500 py-12">
                      <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div>Não existem rotas ativas em trânsito.</div>
                      <div className="text-[10px] text-slate-600 mt-1">Gere rotas na aba de Roteirização Científica primeiro.</div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500">
                  Os valores calculados são estimativas aproximadas baseadas nos modais de frota ativos.
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
