import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { Veiculo, Condutor, Entrega, PlanosSaaS, TipoVeiculo } from '../types';
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
  const [activeTab, setActiveTab] = useState<'roteiro' | 'frota' | 'condutores' | 'custos'>('roteiro');
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
  const [vTipo, setVTipo] = useState<TipoVeiculo>('Van');
  const [vFab, setVFab] = useState('');
  const [vMod, setVMod] = useState('');
  const [vCor, setVCor] = useState('Branco');
  const [vAnoFabricacao, setVAnoFabricacao] = useState('2022');
  const [vAnoModelo, setVAnoModelo] = useState('2022');
  const [vCap, setVCap] = useState(650);
  const [vRenavam, setVRenavam] = useState('');
  const [vChassi, setVChassi] = useState('');
  const [vStatus, setVStatus] = useState<'Disponivel' | 'Manutencao' | 'Inativo'>('Disponivel');

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
  const [dRg, setDRg] = useState('');
  const [dNascimento, setDNascimento] = useState('14/05/1990');
  const [dTel, setDTel] = useState('');
  const [dCnh, setDCnh] = useState('');
  const [dCat, setDCat] = useState('B');
  const [dVencCnh, setDVencCnh] = useState('10/12/2035');
  const [dEmail, setDEmail] = useState('');
  const [dVeiculo, setDVeiculo] = useState('-');

  // --- VEHICLE BINDING ---
  const [bindDriver, setBindDriver] = useState('');
  const [bindVehicle, setBindVehicle] = useState('');

  // --- DELIVERY MANUAL CREATE / BULK ---
  const [delChave, setDelChave] = useState('');
  const [delCliente, setDelCliente] = useState('');
  const [delCep, setDelCep] = useState('');
  const [delEnd, setDelEnd] = useState('');
  const [delPeso, setDelPeso] = useState(15);
  const [delTipo, setDelTipo] = useState<'Entrega' | 'Coleta'>('Entrega');

  const handleDelCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '').slice(0, 8);
    setDelCep(cleanCep);
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (!data.erro) {
            const street = data.logradouro || '';
            const neighborhood = data.bairro || '';
            const city = data.localidade || '';
            const state = data.uf || '';
            
            let fullAddress = '';
            if (street) fullAddress += street;
            if (neighborhood) fullAddress += (fullAddress ? `, ${neighborhood}` : neighborhood);
            if (city) fullAddress += (fullAddress ? ` - ${city}` : city);
            if (state) fullAddress += (fullAddress ? `/${state}` : `/${state}`);
            
            setDelEnd(fullAddress);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

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
      anoFabricacao: vAnoFabricacao,
      anoModelo: vAnoModelo,
      cor: vCor,
      tipo: vTipo,
      capacidadeKg: vCap,
      renavam: vRenavam,
      chassi: vChassi,
      status: vStatus
    });
    setVId('');
    setVPlaca('');
    setVMod('');
    setVFab('');
    setVRenavam('');
    setVChassi('');
    triggerRefresh();
    alert('Veículo cadastrado com sucesso!');
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
      rg: dRg,
      nascimento: dNascimento,
      telefone: dTel,
      cnh: dCnh,
      categoriaCnh: dCat,
      vencCnh: dVencCnh,
      email: dEmail,
      veiculo: dVeiculo
    });
    setDNome('');
    setDCpf('');
    setDRg('');
    setDEmail('');
    setDTel('');
    setDCnh('');
    triggerRefresh();
    alert('Motorista cadastrado com sucesso!');
  };

  const handleBindDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindDriver || !bindVehicle) return;
    dbRepo.vincularVeiculoCondutor(userEmail, bindDriver, bindVehicle);
    triggerRefresh();
    alert('Vínculo atualizado com sucesso!');
  };

  // --- CSV BULK EXCEL IMPORTS & SPREADSHEETS ---
  const downloadModeloVeiculosCsv = () => {
    const csvContent = "ID Interno,Placa,Fabricante,Modelo,Tipo Veiculo,Capacidade (KG),Ano Fabricacao,Ano Modelo,Cor,Renavam,Chassi\n" +
      "VEIC-101,ABC-1234,Volvo,FH 540,Caminhão Pesado,25000,2021,2022,Branco,12345678901,9ASDFGHJKL1234567\n" +
      "VEIC-102,XYZ-9876,Fiat,Fiorino Endurance,Van,650,2020,2021,Prata,98765432109,8ZXCVBNMQWERTYUIO";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_frota.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadModeloMotoristasCsv = () => {
    const csvContent = "Nome Completo,CPF,RG,Telefone,Email,Data Nascimento,CNH,Categoria CNH,Vencimento CNH,Numero Frota\n" +
      "Carlos Alberto da Silva,111.222.333-44,MG-12.345.678,(31) 98888-7777,carlos.silva@empresa.com.br,12/03/1985,12345678910,D,10/12/2030,VEIC-101\n" +
      "Marcos Vinicius de Souza,555.665.777-88,SP-98.765.432,(11) 97777-6666,marcos.souza@empresa.com.br,25/08/1992,98765432101,B,15/06/2031,VEIC-102";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_motoristas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportVeiculosCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          alert('O arquivo parece estar vazio ou sem dados.');
          return;
        }

        let importCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue;

          const idInterno = cols[0];
          const placa = cols[1];
          const fab = cols[2] || '';
          const mod = cols[3] || '';
          const tipoStr = cols[4] || 'Van';
          const cap = parseInt(cols[5]) || 500;
          const anoF = cols[6] || '2022';
          const anoM = cols[7] || cols[6] || '2022';
          const cor = cols[8] || 'Branco';
          const renavam = cols[9] || '';
          const chassi = cols[10] || '';

          let tipo: TipoVeiculo = 'Van';
          if (tipoStr.toLowerCase().includes('caminhão') || tipoStr.toLowerCase().includes('caminhao')) {
            tipo = 'Caminhão Pesado';
          } else if (tipoStr.toLowerCase().includes('picape')) {
            tipo = 'Picape 4x4';
          } else if (tipoStr.toLowerCase().includes('carro') || tipoStr.toLowerCase().includes('leve')) {
            tipo = 'Carro Leve';
          } else if (tipoStr.toLowerCase().includes('moto')) {
            tipo = 'Motocicleta';
          }

          dbRepo.cadastrarVeiculo(userEmail, {
            idVeiculo: idInterno,
            placa,
            modelo: mod,
            fabricante: fab,
            anoFabricacao: anoF,
            anoModelo: anoM,
            cor,
            tipo,
            capacidadeKg: cap,
            renavam,
            chassi,
            status: 'Disponivel'
          });
          importCount++;
        }

        triggerRefresh();
        alert(`Sucesso! Foram importados ${importCount} veículos para sua frota.`);
      } catch (err) {
        alert('Erro ao processar o arquivo de importação. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportMotoristasCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          alert('O arquivo parece estar vazio ou sem dados.');
          return;
        }

        let importCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue;

          const nome = cols[0];
          const cpf = cols[1];
          const rg = cols[2] || '';
          const tel = cols[3] || '';
          const email = cols[4];
          const nascimento = cols[5] || '';
          const cnh = cols[6] || '';
          const cat = cols[7] || 'B';
          const venc = cols[8] || '10/12/2030';
          const numFrota = cols[9] || '-';

          dbRepo.cadastrarCondutor(userEmail, {
            nome,
            cpf,
            rg,
            nascimento,
            telefone: tel,
            email,
            cnh,
            categoriaCnh: cat,
            vencCnh: venc,
            veiculo: numFrota
          });
          importCount++;
        }

        triggerRefresh();
        alert(`Sucesso! Foram importados ${importCount} condutores e vinculados à frota correspondente.`);
      } catch (err) {
        alert('Erro ao processar o arquivo de importação. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
    setDelCep('');
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
              <Truck className="w-4 h-4" /> Gestão de Frota
            </button>
            <button
              onClick={() => setActiveTab('condutores')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'condutores' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Gestão de Condutores
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
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">CEP</label>
                        <input
                          type="text"
                          placeholder="30000-000"
                          value={delCep}
                          onChange={e => handleDelCepLookup(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="col-span-2">
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

        {/* TAB 2: GESTÃO DE FROTA */}
        {activeTab === 'frota' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Gestão Avançada de Frota</h1>
                <p className="text-xs text-slate-400">Cadastre veículos individualmente ou realize importação em massa via planilha CSV.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={downloadModeloVeiculosCsv}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" /> Baixar Planilha Modelo
                </button>
                <label className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 flex items-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar em Massa (CSV)</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportVeiculosCsv}
                  />
                </label>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Add vehicle form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Novo Veículo</h3>
                  <form onSubmit={handleAddVeiculo} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">ID Interno / Nº Frota</label>
                        <input
                          type="text" required placeholder="VEIC-101" value={vId} onChange={e => setVId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Placa</label>
                        <input
                          type="text" required placeholder="ABC-1234" value={vPlaca} onChange={e => setVPlaca(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Fabricante</label>
                        <input
                          type="text" placeholder="Volvo / Mercedes" value={vFab} onChange={e => setVFab(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Modelo</label>
                        <input
                          type="text" placeholder="FH 540 / Fiorino" value={vMod} onChange={e => setVMod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Tipo Modal</label>
                        <select
                          value={vTipo} onChange={e => setVTipo(e.target.value as TipoVeiculo)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Caminhão Pesado">Caminhão Pesado</option>
                          <option value="Van">Van / Fiorino</option>
                          <option value="Picape 4x4">Picape 4x4</option>
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

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ano Fabricação</label>
                        <input
                          type="text" placeholder="2021" value={vAnoFabricacao} onChange={e => setVAnoFabricacao(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ano Modelo</label>
                        <input
                          type="text" placeholder="2022" value={vAnoModelo} onChange={e => setVAnoModelo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Cor</label>
                        <input
                          type="text" placeholder="Branco" value={vCor} onChange={e => setVCor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Status Inicial</label>
                        <select
                          value={vStatus} onChange={e => setVStatus(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Disponivel">Disponível</option>
                          <option value="Manutencao">Em Manutenção</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">RENAVAM</label>
                        <input
                          type="text" placeholder="12345678901" value={vRenavam} onChange={e => setVRenavam(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Chassi</label>
                        <input
                          type="text" placeholder="9ASDF..." value={vChassi} onChange={e => setVChassi(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors mt-2">
                      Salvar Veículo na Frota
                    </button>
                  </form>
                </div>

                {/* Edit status section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Editar Veículo Existente</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Selecione o Veículo</label>
                      <select
                        value={selectedVeiculoEdit}
                        onChange={e => setSelectedVeiculoEdit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Escolha um Veículo --</option>
                        {frota.map(v => (
                          <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo} ({v.placa})</option>
                        ))}
                      </select>
                    </div>

                    {veicSel && (
                      <form onSubmit={handleUpdateVeiculo} className="space-y-2 pt-2 border-t border-slate-800/60">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Placa</label>
                            <input
                              type="text" value={evPlaca} onChange={e => setEvPlaca(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Capacidade (KG)</label>
                            <input
                              type="number" value={evCap} onChange={e => setEvCap(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Status Operacional</label>
                          <select
                            value={evStatus} onChange={e => setEvStatus(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="Disponivel">Disponível</option>
                            <option value="Manutencao">Em Manutenção</option>
                            <option value="Inativo">Inativo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Observações / Defeito</label>
                          <textarea
                            value={evObs} onChange={e => setEvObs(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white h-12 resize-none"
                            placeholder="Descreva problemas mecânicos..."
                          />
                        </div>
                        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-bold py-1.5 rounded transition-colors">
                          Confirmar Atualizações
                        </button>
                      </form>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: List (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base de Veículos Ativa ({frota.length})</h3>
                    <div className="text-[10px] text-slate-500 font-mono">Unidade: Matriz</div>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-xs text-left text-slate-400">
                      <thead className="text-[10px] uppercase font-mono bg-slate-950/50 text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Nº Frota / Placa</th>
                          <th className="px-4 py-3">Especificações</th>
                          <th className="px-4 py-3">Tipo / Capacidade</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3">Documentação</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {frota.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono text-xs">
                              Nenhum veículo cadastrado na frota. Baixe o modelo e importe acima!
                            </td>
                          </tr>
                        ) : (
                          frota.map(v => {
                            const driverName = condutores.find(c => c.veiculo === v.idVeiculo)?.nome || 'Sem motorista alocado';
                            return (
                              <tr key={v.idVeiculo} className="hover:bg-slate-800/10">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-white text-xs">{v.idVeiculo}</div>
                                  <div className="text-[10px] font-mono text-violet-400 bg-violet-400/5 px-1.5 py-0.5 rounded w-fit mt-0.5">{v.placa}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-300">{v.fabricante} {v.modelo}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ano: {v.anoFabricacao}/{v.anoModelo} • Cor: {v.cor}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">Motorista: <span className="text-white">{driverName}</span></div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-slate-300">{v.tipo}</div>
                                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{v.capacidadeKg.toLocaleString('pt-BR')} kg úteis</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                    v.status === 'Disponivel' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    v.status === 'Manutencao' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {v.status === 'Disponivel' ? 'Disponível' : v.status === 'Manutencao' ? 'Manutenção' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-[10px] font-mono text-slate-500">RENAVAM: <span className="text-slate-300">{v.renavam || '-'}</span></div>
                                  <div className="text-[10px] font-mono text-slate-500">Chassi: <span className="text-slate-300 truncate inline-block max-w-[100px]">{v.chassi || '-'}</span></div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remover veículo ${v.idVeiculo} da frota?`)) {
                                        dbRepo.deletarVeiculo(userEmail, v.idVeiculo);
                                        triggerRefresh();
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                                    title="Remover veículo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2.5: GESTÃO DE CONDUTORES */}
        {activeTab === 'condutores' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Gestão de Motoristas Habilitados</h1>
                <p className="text-xs text-slate-400">Gerencie a documentação de CNH, valide vencimentos e atribua rotas de forma simplificada.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={downloadModeloMotoristasCsv}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" /> Baixar Planilha Modelo
                </button>
                <label className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 flex items-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar em Massa (CSV)</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportMotoristasCsv}
                  />
                </label>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form & Bind (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Add driver form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Novo Motorista</h3>
                  <form onSubmit={handleAddCondutor} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Nome Completo</label>
                      <input
                        type="text" required placeholder="Carlos Alberto da Silva" value={dNome} onChange={e => setDNome(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">CPF</label>
                        <input
                          type="text" required placeholder="111.222.333-44" value={dCpf} onChange={e => setDCpf(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">RG</label>
                        <input
                          type="text" placeholder="MG-12.345.678" value={dRg} onChange={e => setDRg(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Telefone de Contato</label>
                        <input
                          type="text" required placeholder="(31) 98888-7777" value={dTel} onChange={e => setDTel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Data Nascimento</label>
                        <input
                          type="text" required placeholder="12/03/1985" value={dNascimento} onChange={e => setDNascimento(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">E-mail corporativo / Login</label>
                      <input
                        type="email" required placeholder="carlos.silva@empresa.com.br" value={dEmail} onChange={e => setDEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Nº Registro CNH</label>
                        <input
                          type="text" required placeholder="12345678910" value={dCnh} onChange={e => setDCnh(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Categoria</label>
                        <select
                          value={dCat} onChange={e => setDCat(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="AB">AB</option>
                          <option value="AC">AC</option>
                          <option value="AD">AD</option>
                          <option value="AE">AE</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Vencimento CNH</label>
                        <input
                          type="text" required placeholder="10/12/2030" value={dVencCnh} onChange={e => setDVencCnh(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Veículo Inicial</label>
                        <select
                          value={dVeiculo} onChange={e => setDVeiculo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="-">Nenhum (Disponível)</option>
                          {frota.map(v => (
                            <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors mt-2">
                      Cadastrar Motorista
                    </button>
                  </form>
                </div>

                {/* Quick Vehicle Allocator Binder */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Vincular Motorista a Veículo</h3>
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
                        <option value="-">-- Nenhum (Liberar Motorista) --</option>
                        {frota.map(v => <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo} ({v.placa})</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                      Efetuar Vínculo Operacional
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: List of drivers (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base de Motoristas Habilitados ({condutores.length})</h3>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-full font-mono font-bold uppercase animate-pulse">● todos ativos</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {condutores.length === 0 ? (
                      <div className="col-span-2 text-center text-slate-500 py-12 font-mono text-xs">
                        Nenhum motorista cadastrado ainda. Use o formulário ou faça importação em massa via CSV!
                      </div>
                    ) : (
                      condutores.map(c => {
                        // Check CNH status
                        const isExpired = () => {
                          try {
                            const [day, month, year] = c.vencCnh.split('/').map(Number);
                            const expiry = new Date(year, month - 1, day);
                            return expiry < new Date();
                          } catch (e) {
                            return false;
                          }
                        };
                        const expired = isExpired();

                        return (
                          <div key={c.email} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-colors">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-white text-sm">{c.nome}</h4>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">CPF: {c.cpf} {c.rg ? `• RG: ${c.rg}` : ''}</div>
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  expired ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'
                                }`}>
                                  Cat {c.categoriaCnh}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-900/60 pt-3">
                                <div>Telefone: <span className="text-slate-200 font-sans">{c.telefone}</span></div>
                                <div>Nascimento: <span className="text-slate-200">{c.nascimento || '-'}</span></div>
                                <div className="col-span-2 truncate">E-mail: <span className="text-slate-200 font-sans">{c.email}</span></div>
                                <div className="col-span-2">
                                  Vencimento CNH: <span className={expired ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                    {c.vencCnh} {expired && '(Vencida!)'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center">
                              <div className="text-xs">
                                <span className="text-slate-500 text-[10px] uppercase font-mono block">Veículo Alocado:</span>
                                <span className={`font-semibold ${c.veiculo !== '-' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {c.veiculo !== '-' ? `Frota ID: ${c.veiculo}` : 'Disponível'}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover motorista ${c.nome} do sistema?`)) {
                                    dbRepo.deletarCondutor(userEmail, c.email);
                                    triggerRefresh();
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                                title="Deletar motorista"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
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
