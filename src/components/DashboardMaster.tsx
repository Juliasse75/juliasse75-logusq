import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { Cliente, Colaborador, PlanosSaaS, PLANOS_PADRAO } from '../types';
import { 
  Users, UserPlus, Layers, DollarSign, Award, Settings, 
  Trash2, UserCheck, Edit3, Check, Search, Download, Plus, Play, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardMasterProps {
  userEmail: string;
  onLogout: () => void;
  colabAccessLevel?: string; // Optional if logged in as collaborator
}

export default function DashboardMaster({ userEmail, onLogout, colabAccessLevel }: DashboardMasterProps) {
  const [activeTab, setActiveTab] = useState(() => {
    if (colabAccessLevel === 'RH') return 'rh';
    if (colabAccessLevel === 'Financeiro') return 'financeiro';
    return 'clientes_base';
  });

  const isColab = !!colabAccessLevel;

  // Global State Refresh Helper
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Lists
  const clientes = dbRepo.getTodosClientes();
  const colaboradores = dbRepo.getTodosColaboradores();
  const planos = dbRepo.getPlanos();
  const masters = dbRepo.getTodosMasters();

  // Selected Client for Management
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>(
    clientes[0]?.email || ''
  );
  const selectedClient = clientes.find(c => c.email === selectedClientEmail);

  // --- FORM STATES ---
  // Client Edit Form
  const [upEmpresa, setUpEmpresa] = useState('');
  const [upCnpj, setUpCnpj] = useState('');
  const [upPlano, setUpPlano] = useState<keyof PlanosSaaS>('Start');
  const [upStatus, setUpStatus] = useState<'Ativo' | 'Bloqueado'>('Ativo');
  const [upVencimento, setUpVencimento] = useState('');

  // Set edit values when selection changes
  React.useEffect(() => {
    if (selectedClient) {
      setUpEmpresa(selectedClient.empresa);
      setUpCnpj(selectedClient.cnpj);
      setUpPlano(selectedClient.plano as keyof PlanosSaaS);
      setUpStatus(selectedClient.status as any);
      setUpVencimento(selectedClient.vencimento);
    }
  }, [selectedClientEmail, refreshKey]);

  // Colaborador Create Form
  const [cNome, setCNome] = useState('');
  const [cCpf, setCCpf] = useState('');
  const [cTel, setCTel] = useState('');
  const [cRegime, setCRegime] = useState<'CLT' | 'PJ'>('CLT');
  const [cCargo, setCCargo] = useState('Analista de CS');
  const [cEmail, setCEmail] = useState('');
  const [cSenha, setCSenha] = useState('ColabLogusQ@123');
  const [cAccess, setCAccess] = useState<'TOTAL' | 'RH' | 'Financeiro'>('RH');

  // Plan Create/Edit Form
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planVal, setPlanVal] = useState(350);
  const [planMaxV, setPlanMaxV] = useState(15);

  // Client Manual Registration Form (SaaS Direct)
  const [regEmpresa, setRegEmpresa] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPlano, setRegPlano] = useState<keyof PlanosSaaS>('Start');

  // Search filter
  const [clientSearch, setClientSearch] = useState('');

  // --- FINANCE METRICS ---
  const activeCount = clientes.filter(c => c.status === 'Ativo').length;
  const totalMRR = clientes
    .filter(c => c.status === 'Ativo')
    .reduce((sum, c) => sum + c.valorPlano, 0);
  const totalARR = totalMRR * 12;
  const avgTicket = activeCount > 0 ? totalMRR / activeCount : 0;

  // Simulated metrics based on typical SaaS logic
  const churnRate = 0.025; // 2.5%
  const ltv = churnRate > 0 ? avgTicket / churnRate : 0;
  const cacRatio = 3.5; // CAC ratio

  // --- GROWTH SIMULATOR ---
  const [simPoc, setSimPoc] = useState(3);
  const [simStart, setSimStart] = useState(12);
  const [simPro, setSimPro] = useState(5);
  const [simEnt, setSimEnt] = useState(2);
  const [simChurn, setSimChurn] = useState(3.0); // 3%

  const simMRR = 
    (simPoc * PLANOS_PADRAO.POC.valor) +
    (simStart * PLANOS_PADRAO.Start.valor) +
    (simPro * PLANOS_PADRAO.Pro.valor) +
    (simEnt * PLANOS_PADRAO.Enterprise.valor);
  
  const simARR = simMRR * 12;
  const simAvgTicket = (simPoc + simStart + simPro + simEnt) > 0 
    ? simMRR / (simPoc + simStart + simPro + simEnt) 
    : 0;
  const simLTV = (simChurn / 100) > 0 ? simAvgTicket / (simChurn / 100) : 0;

  // Chart Data (6 Months projections)
  const chartData = [
    { name: 'Mês 1', MRR: totalMRR, Projetado: totalMRR },
    { name: 'Mês 2', MRR: totalMRR, Projetado: totalMRR * 1.08 },
    { name: 'Mês 3', MRR: totalMRR, Projetado: totalMRR * 1.15 },
    { name: 'Mês 4', MRR: totalMRR, Projetado: totalMRR * 1.22 },
    { name: 'Mês 5', MRR: totalMRR, Projetado: totalMRR * 1.32 },
    { name: 'Mês 6', MRR: totalMRR, Projetado: totalMRR * 1.45 },
  ];

  // --- ACTIONS ---
  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    dbRepo.editarCliente(selectedClient.email, {
      empresa: upEmpresa,
      cnpj: upCnpj,
      plano: upPlano,
      valorPlano: PLANOS_PADRAO[upPlano].valor,
      status: upStatus,
      vencimento: upVencimento
    });
    triggerRefresh();
    alert('Cadastro atualizado com sucesso!');
  };

  const handleConfirmPayment = (email: string) => {
    const cli = clientes.find(c => c.email === email);
    if (!cli) return;
    
    // Increment vencimento by 30 days
    const parts = cli.vencimento.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day);
      date.setDate(date.getDate() + 30);
      
      const nextVenc = date.toLocaleDateString('pt-BR');
      dbRepo.editarCliente(email, {
        pagamentoConfirmado: true,
        vencimento: nextVenc,
        status: 'Ativo'
      });
      triggerRefresh();
      alert(`Baixa financeira realizada! Novo vencimento: ${nextVenc}`);
    }
  };

  const handleToggleAcesso = (email: string) => {
    const cli = clientes.find(c => c.email === email);
    if (!cli) return;
    const novoStatus = cli.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
    dbRepo.editarCliente(email, { status: novoStatus });
    triggerRefresh();
  };

  const handleCreateColaborador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNome || !cCpf || !cEmail) {
      alert('Por favor, preencha Nome, CPF e E-mail!');
      return;
    }
    dbRepo.cadastrarColaborador({
      nome: cNome,
      cpf: cCpf,
      telefone: cTel,
      regime: cRegime,
      cargo: cCargo,
      email: cEmail,
      senhaProvisoria: cSenha,
      nivelAcesso: cAccess
    });
    setCNome('');
    setCCpf('');
    setCEmail('');
    triggerRefresh();
    alert('Colaborador cadastrado com sucesso!');
  };

  const handleDeleteColaborador = (id: string) => {
    if (confirm('Tem certeza de que deseja demitir/remover este colaborador?')) {
      dbRepo.deletarColaborador(id);
      triggerRefresh();
    }
  };

  const handleCreateClientManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmpresa || !regCnpj || !regEmail) {
      alert('Preencha os campos obrigatórios!');
      return;
    }
    try {
      dbRepo.cadastrarClienteAuto({
        nomeEmpresa: regEmpresa,
        cnpj: regCnpj,
        email: regEmail,
        plano: regPlano,
        telFixo: '',
        whatsapp: '',
        cep: '30110017',
        endereco: 'Avenida do Contorno',
        numero: '1000',
        complemento: '',
        bairro: 'Savassi',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        tipoUnidade: 'Matriz',
        senhaProvisoria: 'LogusQ@123',
        respNome: 'Gestor Responsável',
        respCpf: '111.222.333-44',
        respRg: 'MG-12345',
        respNascimento: '01/01/1990',
        respCargo: 'Diretor',
        respEmail: regEmail,
        respWhatsapp: '',
        respTelefone: '',
        respMesmoEnd: 1,
        respCep: '30110017',
        respEndereco: 'Avenida do Contorno',
        respNumero: '1000',
        respComplemento: '',
        respBairro: 'Savassi',
        respCidade: 'Belo Horizonte',
        respEstado: 'MG'
      });
      setRegEmpresa('');
      setRegCnpj('');
      setRegEmail('');
      triggerRefresh();
      alert('Novo cliente ativado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar cliente.');
    }
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) return;
    dbRepo.salvarPlano(planName, planDesc, planVal, planMaxV);
    setPlanName('');
    setPlanDesc('');
    triggerRefresh();
    alert('Plano salvo com sucesso!');
  };

  const exportClientesCSV = () => {
    const headers = 'ID,Empresa,CNPJ,Plano,Status,Desde,Vencimento\n';
    const rows = clientes.map(c => 
      `"${c.idCliente}","${c.empresa}","${c.cnpj}","${c.plano}","${c.status}","${c.clienteDesde}","${c.vencimento}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientes_logusq.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter clients based on search
  const filteredClientes = clientes.filter(c => 
    c.empresa.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.cnpj.includes(clientSearch) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

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
              {isColab ? `Colaborador: ${colabAccessLevel}` : 'Administrador Master'}
            </p>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            {(!isColab || colabAccessLevel === 'TOTAL') && (
              <>
                <button
                  onClick={() => setActiveTab('clientes_base')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                    activeTab === 'clientes_base' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" /> Base de Clientes
                </button>
                <button
                  onClick={() => setActiveTab('cadastrar_cliente')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                    activeTab === 'cadastrar_cliente' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" /> Cadastrar Cliente
                </button>
              </>
            )}

            {(!isColab || colabAccessLevel === 'TOTAL' || colabAccessLevel === 'RH') && (
              <button
                onClick={() => setActiveTab('rh')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'rh' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" /> RH Interno
              </button>
            )}

            {(!isColab || colabAccessLevel === 'TOTAL') && (
              <button
                onClick={() => setActiveTab('planos')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'planos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" /> Planos SaaS
              </button>
            )}

            {(!isColab || colabAccessLevel === 'TOTAL' || colabAccessLevel === 'Financeiro') && (
              <button
                onClick={() => setActiveTab('financeiro')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'financeiro' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Financeiro e Métricas
              </button>
            )}

            {!isColab && (
              <button
                onClick={() => setActiveTab('masters')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'masters' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" /> Equipe Master
              </button>
            )}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 text-xs">
          <div className="text-[10px] text-slate-500 font-mono truncate mb-2">
            User: {userEmail}
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
        
        {/* TAB 1: CLIENTES BASE */}
        {activeTab === 'clientes_base' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Base de Clientes SaaS</h1>
                <p className="text-xs text-slate-400">Pesquise, edite cadastros, confirme faturas e gerencie acessos.</p>
              </div>
              <button
                onClick={exportClientesCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700/50 transition-colors"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
            </div>

            {/* Filters */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filtrar por nome de empresa, CNPJ ou email..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600"
              />
            </div>

            {/* Main grid table & Selected manager form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Client List */}
              <div className="lg:col-span-2 space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-400">
                      <thead className="text-[10px] uppercase font-mono bg-slate-950/50 text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">ID / Empresa</th>
                          <th className="px-4 py-3">Plano</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Vencimento</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredClientes.map(c => (
                          <tr 
                            key={c.email}
                            onClick={() => setSelectedClientEmail(c.email)}
                            className={`hover:bg-slate-800/25 cursor-pointer transition-colors ${
                              selectedClientEmail === c.email ? 'bg-violet-950/10' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="font-bold text-white text-xs">{c.empresa}</div>
                              <div className="text-[10px] text-slate-500">{c.cnpj}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-blue-400">{c.plano}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                c.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">{c.vencimento}</td>
                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleConfirmPayment(c.email)}
                                  title="Confirmar Pagamento Mensal"
                                  className="p-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleAcesso(c.email)}
                                  title="Bloquear/Desbloquear"
                                  className={`p-1 rounded transition-colors ${
                                    c.status === 'Ativo' ? 'bg-red-950/30 text-red-400 hover:bg-red-900/20' : 'bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/20'
                                  }`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Manage Form */}
              <div className="space-y-4">
                {selectedClient ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                    <div className="border-b border-slate-800 pb-3">
                      <h2 className="text-xs font-mono uppercase text-slate-400">Detalhes do Cadastro</h2>
                      <div className="text-sm font-extrabold text-white mt-1">{selectedClient.empresa}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{selectedClient.email}</div>
                    </div>

                    <form onSubmit={handleUpdateClient} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Razão Social</label>
                        <input
                          type="text"
                          required
                          value={upEmpresa}
                          onChange={e => setUpEmpresa(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">CNPJ</label>
                        <input
                          type="text"
                          required
                          value={upCnpj}
                          onChange={e => setUpCnpj(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Plano Ativo</label>
                          <select
                            value={upPlano}
                            onChange={e => setUpPlano(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            {(Object.keys(PLANOS_PADRAO) as Array<keyof PlanosSaaS>).map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Vencimento</label>
                          <input
                            type="text"
                            required
                            value={upVencimento}
                            onChange={e => setUpVencimento(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 border-dashed rounded-xl p-6 text-center text-xs text-slate-500">
                    Selecione um cliente para gerenciar.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: CADASTRAR CLIENTE (SaaS Manual Direct) */}
        {activeTab === 'cadastrar_cliente' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Cadastrar Novo Cliente SaaS</h1>
              <p className="text-xs text-slate-400">Ativação manual de clientes e geração imediata de ID único.</p>
            </div>

            <form onSubmit={handleCreateClientManual} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Razão Social / Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="EX: TransBH Express"
                  value={regEmpresa}
                  onChange={e => setRegEmpresa(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">CNPJ *</label>
                <input
                  type="text"
                  required
                  placeholder="99.999.999/0001-99"
                  value={regCnpj}
                  onChange={e => setRegCnpj(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">E-mail Corporativo (Login) *</label>
                <input
                  type="email"
                  required
                  placeholder="gestor@empresa.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Plano Contratado *</label>
                <select
                  value={regPlano}
                  onChange={e => setRegPlano(e.target.value as any)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2.5 text-xs text-white"
                >
                  {(Object.keys(PLANOS_PADRAO) as Array<keyof PlanosSaaS>).map(k => (
                    <option key={k} value={k}>{k} - R$ {PLANOS_PADRAO[k].valor}/mês</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg text-xs"
              >
                Gerar ID e Ativar Cliente de Forma Expressa
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: RH INTERNO */}
        {activeTab === 'rh' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Recursos Humanos Internos</h1>
              <p className="text-xs text-slate-400">Controle a equipe LogusQ, gerencie regimes de contratação e níveis de acesso.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Register New Employee */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit shadow-xl">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-400" /> Cadastrar Colaborador
                </h2>
                <form onSubmit={handleCreateColaborador} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ana Maria"
                      value={cNome}
                      onChange={e => setCNome(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CPF</label>
                    <input
                      type="text"
                      required
                      placeholder="123.456.789-10"
                      value={cCpf}
                      onChange={e => setCCpf(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Regime</label>
                      <select
                        value={cRegime}
                        onChange={e => setCRegime(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="CLT">CLT</option>
                        <option value="PJ">PJ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Telefone</label>
                      <input
                        type="text"
                        placeholder="31 98888-8888"
                        value={cTel}
                        onChange={e => setCTel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail (Login)</label>
                    <input
                      type="email"
                      required
                      placeholder="ana@logusq.com"
                      value={cEmail}
                      onChange={e => setCEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Acesso do Painel</label>
                    <select
                      value={cAccess}
                      onChange={e => setCAccess(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="TOTAL">Acesso Total</option>
                      <option value="RH">Painel RH Apenas</option>
                      <option value="Financeiro">Painel Financeiro Apenas</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 rounded-lg text-xs mt-3 transition-colors"
                  >
                    Ativar Cadastro do Colaborador
                  </button>
                </form>
              </div>

              {/* Right Column: Employee Cards list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colaboradores.map(col => (
                    <div 
                      key={col.idColaborador} 
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full uppercase">
                              {col.nivelAcesso}
                            </span>
                            <h3 className="font-bold text-white text-sm mt-1.5">{col.nome}</h3>
                            <p className="text-xs text-slate-400">{col.cargo}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteColaborador(col.idColaborador)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 space-y-1 text-[11px] font-mono text-slate-400">
                          <div>E-mail: <span className="text-slate-300">{col.email}</span></div>
                          <div>CPF: <span className="text-slate-300">{col.cpf}</span></div>
                          <div>Acesso: <span className="text-emerald-400 font-bold">{col.nivelAcesso}</span></div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-800/60 pt-3 flex justify-between text-[10px] text-slate-500">
                        <span>Admitido em: {col.dataAdmissao}</span>
                        <span className="text-emerald-500 font-bold">Ativo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: PLANOS SAAS */}
        {activeTab === 'planos' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Planos LogusQ SaaS</h1>
              <p className="text-xs text-slate-400">Edite limites de veículos por plano ou configure valores de assinatura mensal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Plan Creation / Edit Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl h-fit">
                <h2 className="text-sm font-bold text-white mb-4">Adicionar / Editar Plano</h2>
                <form onSubmit={handleSavePlan} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nome do Plano</label>
                    <input
                      type="text"
                      required
                      placeholder="EX: Pro Plus"
                      value={planName}
                      onChange={e => setPlanName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Descrição Comercial</label>
                    <input
                      type="text"
                      placeholder="Descrição rápida do plano"
                      value={planDesc}
                      onChange={e => setPlanDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Valor Mensal (R$)</label>
                      <input
                        type="number"
                        required
                        value={planVal}
                        onChange={e => setPlanVal(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Máx. Veículos</label>
                      <input
                        type="number"
                        required
                        value={planMaxV}
                        onChange={e => setPlanMaxV(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 rounded-lg text-xs mt-3 transition-colors"
                  >
                    Salvar Configurações de Plano
                  </button>
                </form>
              </div>

              {/* Plans Table view */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(planos).map(([pName, details]: any) => (
                    <div 
                      key={pName}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="font-extrabold text-white text-base">{pName}</h3>
                        <p className="text-xs text-slate-400 mt-1">{details.descricao}</p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800/60 flex justify-between items-center text-xs font-mono">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Valor Assinatura</div>
                          <div className="text-white font-extrabold">R$ {details.valor.toLocaleString('pt-BR')}/mês</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase">Frota Máxima</div>
                          <div className="text-blue-400 font-bold">{details.max_veiculos} Veículos</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: FINANCEIRO E METRICAS */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Métricas Financeiras LogusQ (SaaS)</h1>
              <p className="text-xs text-slate-400">Acompanhe MRR, ARR, LTV e projete o crescimento da receita recorrente da plataforma.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Mensal Recorrente (MRR)</div>
                <div className="text-xl font-extrabold text-violet-400 mt-1">R$ {totalMRR.toLocaleString('pt-BR')}</div>
                <div className="text-[9px] text-emerald-400 mt-1">▲ 12% Mês anterior</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Anual Recorrente (ARR)</div>
                <div className="text-xl font-extrabold text-white mt-1">R$ {totalARR.toLocaleString('pt-BR')}</div>
                <div className="text-[9px] text-slate-500 mt-1">Fator Projeção ×12</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Clientes Ativos</div>
                <div className="text-xl font-extrabold text-white mt-1">{activeCount}</div>
                <div className="text-[9px] text-slate-500 mt-1">De {clientes.length} cadastrados</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Ticket Médio ARPU</div>
                <div className="text-xl font-extrabold text-white mt-1">R$ {avgTicket.toLocaleString('pt-BR')}</div>
                <div className="text-[9px] text-slate-500 mt-1">Média ponderada</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Lifetime Value (LTV)</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">R$ {ltv.toLocaleString('pt-BR')}</div>
                <div className="text-[9px] text-slate-500 mt-1">Churn {churnRate*100}% base</div>
              </div>
            </div>

            {/* Recharts chart and growth simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Projection chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <h2 className="text-sm font-bold text-white mb-4">Projeção da Receita Recorrente (6 Meses)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="MRR" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Projetado" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interactive SaaS Growth Simulator */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Simulador de Escala SaaS</h2>
                  <p className="text-xs text-slate-400">Arraste os sliders para projetar receitas de escala.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Assinaturas POC (R$ 0)</span>
                      <span className="text-white font-bold">{simPoc}</span>
                    </div>
                    <input 
                      type="range" min="0" max="50" value={simPoc} 
                      onChange={e => setSimPoc(parseInt(e.target.value))}
                      className="w-full accent-violet-500" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Assinaturas Start (R$ 350)</span>
                      <span className="text-white font-bold">{simStart}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={simStart} 
                      onChange={e => setSimStart(parseInt(e.target.value))}
                      className="w-full accent-violet-500" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Assinaturas Pro (R$ 800)</span>
                      <span className="text-white font-bold">{simPro}</span>
                    </div>
                    <input 
                      type="range" min="0" max="50" value={simPro} 
                      onChange={e => setSimPro(parseInt(e.target.value))}
                      className="w-full accent-violet-500" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Assinaturas Enterprise (R$ 2.500)</span>
                      <span className="text-white font-bold">{simEnt}</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" value={simEnt} 
                      onChange={e => setSimEnt(parseInt(e.target.value))}
                      className="w-full accent-violet-500" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Churn Mensal (%)</span>
                      <span className="text-white font-bold">{simChurn}%</span>
                    </div>
                    <input 
                      type="range" min="1" max="15" step="0.5" value={simChurn} 
                      onChange={e => setSimChurn(parseFloat(e.target.value))}
                      className="w-full accent-violet-500" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/60 bg-slate-950/20 rounded-lg p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">MRR Simulado:</span>
                    <span className="text-violet-400 font-extrabold">R$ {simMRR.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ARR Simulado:</span>
                    <span className="text-white font-semibold">R$ {simARR.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">LTV Projetado:</span>
                    <span className="text-emerald-400 font-semibold">R$ {Math.round(simLTV).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: EQUIPE MASTER */}
        {activeTab === 'masters' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Equipe Master LogusQ</h1>
              <p className="text-xs text-slate-400">Nesta aba estão listados os administradores da plataforma.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-400">
                  <thead className="text-[10px] uppercase font-mono bg-slate-950/50 text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Nível Acesso</th>
                      <th className="px-4 py-3">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {masters.map(m => (
                      <tr key={m.email} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-bold text-white">{m.nome}</td>
                        <td className="px-4 py-3 font-mono">{m.email}</td>
                        <td className="px-4 py-3 text-violet-400 font-bold uppercase">{m.perfil}</td>
                        <td className="px-4 py-3 text-slate-500">{m.criadoEm || '14/07/2026'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
