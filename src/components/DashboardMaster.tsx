import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { Cliente, Colaborador, PlanosSaaS, PLANOS_PADRAO } from '../types';
import LogusQLogo from './LogusQLogo';
import { 
  Users, UserPlus, Layers, DollarSign, Award, Settings, 
  Trash2, UserCheck, Edit3, Check, Search, Download, Plus, Play, Info, FileText,
  ShieldCheck, Filter, ShieldAlert, AlertTriangle, Eye, RefreshCw, Lock, Key
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardMasterProps {
  userEmail: string;
  onLogout: () => void;
  colabAccessLevel?: string; // Optional if logged in as collaborator
}

export default function DashboardMaster({ userEmail, onLogout, colabAccessLevel }: DashboardMasterProps) {
  const isColab = !!colabAccessLevel;
  const normalizedAccess = colabAccessLevel?.toUpperCase() || '';
  const isTotalAccess = !isColab || normalizedAccess === 'TOTAL' || normalizedAccess === 'ACESSO TOTAL';

  const [activeTab, setActiveTab] = useState(() => {
    if (isColab) {
      if (normalizedAccess === 'RH') return 'rh';
      if (normalizedAccess === 'FINANCEIRO') return 'financeiro';
    }
    return 'clientes_base';
  });

  // Global State Refresh Helper
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [pwdChangeError, setPwdChangeError] = useState('');
  const [pwdChangeSuccess, setPwdChangeSuccess] = useState('');

  // Lists
  const clientes = dbRepo.getTodosClientes();
  const colaboradores = dbRepo.getTodosColaboradores();
  const planos = dbRepo.getPlanos();
  const masters = dbRepo.getTodosMasters();
  const activeOperator = dbRepo.getUsuarios().find(u => u.email === userEmail) || colaboradores.find(c => c.email === userEmail) || { nome: 'Operador LogusQ', email: userEmail };

  // Selected Client for Management
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>(
    clientes[0]?.email || ''
  );
  const selectedClient = clientes.find(c => c.email === selectedClientEmail);

  React.useEffect(() => {
    const handleSyncComplete = () => {
      triggerRefresh();
    };
    window.addEventListener('logusq_sync_complete', handleSyncComplete);
    return () => {
      window.removeEventListener('logusq_sync_complete', handleSyncComplete);
    };
  }, []);

  // --- FORM STATES ---
  // --- FORM STATES ---
  // Modal toggle for detailed client editing
  const [isClientEditModalOpen, setIsClientEditModalOpen] = useState(false);

  // Client Edit Form detailed states
  const [upEmpresa, setUpEmpresa] = useState('');
  const [upCnpj, setUpCnpj] = useState('');
  const [upTelFixo, setUpTelFixo] = useState('');
  const [upWhatsapp, setUpWhatsapp] = useState('');
  const [upTipoUnidade, setUpTipoUnidade] = useState<'Matriz' | 'Filial'>('Matriz');
  
  const [upCep, setUpCep] = useState('');
  const [upEndereco, setUpEndereco] = useState('');
  const [upNumero, setUpNumero] = useState('');
  const [upComplemento, setUpComplemento] = useState('');
  const [upBairro, setUpBairro] = useState('');
  const [upCidade, setUpCidade] = useState('');
  const [upEstado, setUpEstado] = useState('');

  const [upRespNome, setUpRespNome] = useState('');
  const [upRespCargo, setUpRespCargo] = useState('');
  const [upRespCpf, setUpRespCpf] = useState('');
  const [upRespRg, setUpRespRg] = useState('');
  const [upRespNascimento, setUpRespNascimento] = useState('');
  const [upRespEmail, setUpRespEmail] = useState('');
  const [upRespWhatsapp, setUpRespWhatsapp] = useState('');
  const [upRespTelefone, setUpRespTelefone] = useState('');

  const [upRespCep, setUpRespCep] = useState('');
  const [upRespEndereco, setUpRespEndereco] = useState('');
  const [upRespNumero, setUpRespNumero] = useState('');
  const [upRespBairro, setUpRespBairro] = useState('');
  const [upRespCidade, setUpRespCidade] = useState('');
  const [upRespEstado, setUpRespEstado] = useState('');

  const [upEmail, setUpEmail] = useState('');
  const [upSenha, setUpSenha] = useState('');
  const [upPlano, setUpPlano] = useState<keyof PlanosSaaS>('POC');
  const [upStatus, setUpStatus] = useState<'Ativo' | 'Bloqueado'>('Ativo');
  const [upVencimento, setUpVencimento] = useState('');
  const [upClienteDesde, setUpClienteDesde] = useState('');

  // Set edit values when selection changes
  React.useEffect(() => {
    if (selectedClient) {
      setUpEmpresa(selectedClient.empresa || '');
      setUpCnpj(selectedClient.cnpj || '');
      setUpTelFixo(selectedClient.telefoneFixo || '');
      setUpWhatsapp(selectedClient.whatsapp || '');
      setUpTipoUnidade(selectedClient.tipoUnidade || 'Matriz');
      
      setUpCep(selectedClient.cep || '');
      setUpEndereco(selectedClient.endereco || '');
      setUpNumero(selectedClient.numero || '');
      setUpComplemento(selectedClient.complemento || '');
      setUpBairro(selectedClient.bairro || '');
      setUpCidade(selectedClient.cidade || '');
      setUpEstado(selectedClient.estado || '');

      setUpRespNome(selectedClient.respNome || '');
      setUpRespCargo(selectedClient.respCargo || '');
      setUpRespCpf(selectedClient.respCpf || '');
      setUpRespRg(selectedClient.respRg || '');
      setUpRespNascimento(selectedClient.respNascimento || '');
      setUpRespEmail(selectedClient.respEmail || '');
      setUpRespWhatsapp(selectedClient.respWhatsapp || '');
      setUpRespTelefone(selectedClient.respTelefone || '');

      setUpRespCep((selectedClient as any).respCep || selectedClient.cep || '');
      setUpRespEndereco((selectedClient as any).respEndereco || selectedClient.endereco || '');
      setUpRespNumero((selectedClient as any).respNumero || selectedClient.numero || '');
      setUpRespBairro((selectedClient as any).respBairro || selectedClient.bairro || '');
      setUpRespCidade((selectedClient as any).respCidade || selectedClient.cidade || '');
      setUpRespEstado((selectedClient as any).respEstado || selectedClient.estado || '');

      setUpEmail(selectedClient.email || '');
      setUpSenha('');
      setUpPlano(selectedClient.plano as keyof PlanosSaaS);
      setUpStatus(selectedClient.status as any);
      setUpVencimento(selectedClient.vencimento || '');
      setUpClienteDesde(selectedClient.clienteDesde || '');
    }
  }, [selectedClientEmail, refreshKey]);

  // Colaborador Create/Edit Form
  const [editingColabId, setEditingColabId] = useState<string | null>(null);
  const [cNome, setCNome] = useState('');
  const [cCpf, setCCpf] = useState('');
  const [cTel, setCTel] = useState('');
  const [cRegime, setCRegime] = useState<string>('CLT');
  const [cCargo, setCCargo] = useState('Analista de CS');
  const [cEmail, setCEmail] = useState('');
  const [cSenha, setCSenha] = useState('ColabLogusQ@123');
  const [cAccess, setCAccess] = useState<'TOTAL' | 'RH' | 'Financeiro'>('RH');
  
  // Auditoria States
  const [searchTermAuditoria, setSearchTermAuditoria] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);
  
  // Colaborador Address & Additional details
  const [cRg, setCRg] = useState('');
  const [cCep, setCCep] = useState('');
  const [cEndereco, setCEndereco] = useState('');
  const [cNumero, setCNumero] = useState('');
  const [cComplemento, setCComplemento] = useState('');
  const [cBairro, setCBairro] = useState('');
  const [cCidade, setCCidade] = useState('');
  const [cEstado, setCEstado] = useState('');

  // Plan Create/Edit Form
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planVal, setPlanVal] = useState(350);
  const [planMaxV, setPlanMaxV] = useState(15);

  // Client Manual Registration Form (SaaS Direct) detailed states
  const [regEmpresa, setRegEmpresa] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regTelFixo, setRegTelFixo] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regTipoUnidade, setRegTipoUnidade] = useState<'Matriz' | 'Filial'>('Matriz');
  
  const [regCep, setRegCep] = useState('');
  const [regEndereco, setRegEndereco] = useState('');
  const [regNumero, setRegNumero] = useState('');
  const [regComplemento, setRegComplemento] = useState('');
  const [regBairro, setRegBairro] = useState('');
  const [regCidade, setRegCidade] = useState('');
  const [regEstado, setRegEstado] = useState('');

  const [regRespNome, setRegRespNome] = useState('');
  const [regRespCargo, setRegRespCargo] = useState('');
  const [regRespCpf, setRegRespCpf] = useState('');
  const [regRespRg, setRegRespRg] = useState('');
  const [regRespNascimento, setRegRespNascimento] = useState('');
  const [regRespEmail, setRegRespEmail] = useState('');
  const [regRespWhatsapp, setRegRespWhatsapp] = useState('');
  const [regRespTelefone, setRegRespTelefone] = useState('');

  const [regRespCep, setRegRespCep] = useState('');
  const [regRespEndereco, setRegRespEndereco] = useState('');
  const [regRespNumero, setRegRespNumero] = useState('');
  const [regRespBairro, setRegRespBairro] = useState('');
  const [regRespCidade, setRegRespCidade] = useState('');
  const [regRespEstado, setRegRespEstado] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('AlfaLogQ@2026');
  const [regPlano, setRegPlano] = useState<keyof PlanosSaaS>('POC');
  const [regClienteDesde, setRegClienteDesde] = useState(() => new Date().toLocaleDateString('pt-BR'));

  // Search filter
  const [clientSearch, setClientSearch] = useState('');

  // Modals for selected client
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

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
  // CEP Auto-lookup via ViaCEP API
  const handleCepLookup = async (
    cepValue: string, 
    setCepState: (val: string) => void,
    setAddress: (val: string) => void,
    setBairro: (val: string) => void,
    setCidade: (val: string) => void,
    setEstado: (val: string) => void
  ) => {
    const cleanCep = cepValue.replace(/\D/g, '').slice(0, 8);
    setCepState(cleanCep);
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (!data.erro) {
            setAddress(data.logradouro || '');
            setBairro(data.bairro || '');
            setCidade(data.localidade || '');
            setEstado(data.uf || '');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    dbRepo.editarCliente(selectedClient.email, {
      empresa: upEmpresa,
      cnpj: upCnpj,
      telefoneFixo: upTelFixo,
      whatsapp: upWhatsapp,
      tipoUnidade: upTipoUnidade,
      
      cep: upCep,
      endereco: upEndereco,
      numero: upNumero,
      complemento: upComplemento,
      bairro: upBairro,
      cidade: upCidade,
      estado: upEstado,

      respNome: upRespNome,
      respCargo: upRespCargo,
      respCpf: upRespCpf,
      respRg: upRespRg,
      respNascimento: upRespNascimento,
      respEmail: upRespEmail,
      respWhatsapp: upRespWhatsapp,
      respTelefone: upRespTelefone,

      respCep: upRespCep,
      respEndereco: upRespEndereco,
      respNumero: upRespNumero,
      respBairro: upRespBairro,
      respCidade: upRespCidade,
      respEstado: upRespEstado,

      email: upEmail,
      plano: upPlano,
      valorPlano: PLANOS_PADRAO[upPlano].valor,
      status: upStatus,
      vencimento: upVencimento,
      clienteDesde: upClienteDesde
    }, upSenha);

    setIsClientEditModalOpen(false);
    triggerRefresh();
    alert('Cadastro do cliente atualizado com sucesso!');
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
    const updateObj: any = { status: novoStatus };
    if (novoStatus === 'Ativo') {
      updateObj.pagamentoConfirmado = true;
    }
    dbRepo.editarCliente(email, updateObj);
    triggerRefresh();
  };

  const handleCreateColaborador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNome || !cCpf || !cEmail) {
      alert('Por favor, preencha Nome, CPF e E-mail!');
      return;
    }

    if (cSenha && !cSenha.startsWith('$2')) {
      const pwdErr = (() => {
        if (cSenha.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
        if (!/[A-Z]/.test(cSenha)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
        if (!/[a-z]/.test(cSenha)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
        if (!/[0-9]/.test(cSenha)) return 'A senha deve conter pelo menos um número (0-9).';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(cSenha)) return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).';
        return null;
      })();
      if (pwdErr) {
        alert(`Senha do Colaborador Fraca: ${pwdErr}`);
        return;
      }
    }

    if (editingColabId) {
      // Edit mode
      dbRepo.editarColaborador(editingColabId, {
        nome: cNome,
        cpf: cCpf,
        rg: cRg,
        telefone: cTel,
        email: cEmail,
        cargo: cCargo,
        nivelAcesso: cAccess as any,
        cep: cCep,
        endereco: cEndereco,
        numero: cNumero,
        complemento: cComplemento,
        bairro: cBairro,
        cidade: cCidade,
        estado: cEstado
      }, cSenha);
      dbRepo.registrarLog(
        userEmail,
        activeOperator.nome,
        'Atualização de Colaborador',
        `Atualizou as informações cadastrais e permissões do colaborador "${cNome}" (${cEmail}).`,
        'RH',
        'Sucesso',
        JSON.stringify({ idColaborador: editingColabId, nome: cNome, cargo: cCargo, nivelAcesso: cAccess })
      );
      setEditingColabId(null);
      alert('Cadastro do colaborador atualizado com sucesso!');
    } else {
      // Create mode
      dbRepo.cadastrarColaborador({
        nome: cNome,
        cpf: cCpf,
        rg: cRg,
        telefone: cTel,
        regime: cRegime,
        cargo: cCargo,
        email: cEmail,
        senhaProvisoria: cSenha,
        nivelAcesso: cAccess,
        cep: cCep,
        endereco: cEndereco,
        numero: cNumero,
        complemento: cComplemento,
        bairro: cBairro,
        cidade: cCidade,
        estado: cEstado
      });
      dbRepo.registrarLog(
        userEmail,
        activeOperator.nome,
        'Cadastro de Colaborador',
        `Cadastrou o novo colaborador interno "${cNome}" (${cEmail}) sob o regime ${cRegime}.`,
        'RH',
        'Sucesso',
        JSON.stringify({ nome: cNome, cargo: cCargo, nivelAcesso: cAccess, regime: cRegime })
      );
      alert('Colaborador cadastrado com sucesso!');
    }

    // Reset fields
    setCNome('');
    setCCpf('');
    setCRg('');
    setCTel('');
    setCEmail('');
    setCSenha('ColabLogusQ@123');
    setCCargo('Analista de CS');
    setCAccess('RH');
    setCCep('');
    setCEndereco('');
    setCNumero('');
    setCComplemento('');
    setCBairro('');
    setCCidade('');
    setCEstado('');

    triggerRefresh();
  };

  const handleStartEditColab = (col: Colaborador) => {
    setEditingColabId(col.idColaborador);
    setCNome(col.nome);
    setCCpf(col.cpf || '');
    setCRg(col.rg || '');
    setCTel(col.telefone || '');
    setCRegime(col.regime || 'CLT');
    setCEmail(col.email);
    setCCargo(col.cargo);
    setCAccess(col.nivelAcesso as any);
    setCSenha('');
    setCCep(col.cep || '');
    setCEndereco(col.endereco || '');
    setCNumero(col.numero || '');
    setCComplemento(col.complemento || '');
    setCBairro(col.bairro || '');
    setCCidade(col.cidade || '');
    setCEstado(col.estado || '');
  };

  const handleCancelEditColab = () => {
    setEditingColabId(null);
    setCNome('');
    setCCpf('');
    setCRg('');
    setCTel('');
    setCEmail('');
    setCSenha('ColabLogusQ@123');
    setCCargo('Analista de CS');
    setCAccess('RH');
    setCCep('');
    setCEndereco('');
    setCNumero('');
    setCComplemento('');
    setCBairro('');
    setCCidade('');
    setCEstado('');
  };

  const handleDeleteColaborador = (id: string) => {
    const colab = colaboradores.find(c => c.idColaborador === id);
    const colabName = colab ? colab.nome : id;
    const colabEmail = colab ? colab.email : '';
    if (confirm('Tem certeza de que deseja demitir/remover este colaborador?')) {
      dbRepo.deletarColaborador(id);
      dbRepo.registrarLog(
        userEmail,
        activeOperator.nome,
        'Exclusão de Colaborador',
        `Removeu/demitiu o colaborador interno "${colabName}" (${colabEmail}) da base de recursos humanos.`,
        'RH',
        'Sucesso',
        JSON.stringify({ idColaborador: id, nome: colabName, email: colabEmail })
      );
      triggerRefresh();
    }
  };

  const handleCreateClientManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmpresa || !regCnpj || !regEmail || !regSenha) {
      alert('Preencha os campos obrigatórios (Razão Social, CNPJ, E-mail e Senha)!');
      return;
    }
    const pwdErr = (() => {
      if (regSenha.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
      if (!/[A-Z]/.test(regSenha)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
      if (!/[a-z]/.test(regSenha)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
      if (!/[0-9]/.test(regSenha)) return 'A senha deve conter pelo menos um número (0-9).';
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(regSenha)) return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).';
      return null;
    })();
    if (pwdErr) {
      alert(`Senha Provisória Fraca: ${pwdErr}`);
      return;
    }
    try {
      dbRepo.cadastrarClienteAuto({
        nomeEmpresa: regEmpresa,
        cnpj: regCnpj,
        email: regEmail,
        telFixo: regTelFixo,
        whatsapp: regWhatsapp,
        tipoUnidade: regTipoUnidade,
        
        cep: regCep,
        endereco: regEndereco,
        numero: regNumero,
        complemento: regComplemento,
        bairro: regBairro,
        cidade: regCidade,
        estado: regEstado,

        respNome: regRespNome || 'Gestor Responsável',
        respCpf: regRespCpf,
        respRg: regRespRg,
        respNascimento: regRespNascimento,
        respCargo: regRespCargo || 'Diretor',
        respEmail: regRespEmail || regEmail,
        respWhatsapp: regRespWhatsapp,
        respTelefone: regRespTelefone,

        respCep: regRespCep || regCep,
        respEndereco: regRespEndereco || regEndereco,
        respNumero: regRespNumero || regNumero,
        respBairro: regRespBairro || regBairro,
        respCidade: regRespCidade || regCidade,
        respEstado: regRespEstado || regEstado,

        senhaProvisoria: regSenha,
        plano: regPlano,
        clienteDesde: regClienteDesde
      });

      dbRepo.registrarLog(
        userEmail,
        activeOperator.nome,
        'Cadastro de Cliente',
        `Ativou manualmente o cliente corporativo "${regEmpresa}" (CNPJ: ${regCnpj}) no Plano ${regPlano}.`,
        'Clientes',
        'Sucesso',
        JSON.stringify({ empresa: regEmpresa, cnpj: regCnpj, email: regEmail, plano: regPlano })
      );

      // Clear states
      setRegEmpresa('');
      setRegCnpj('');
      setRegTelFixo('');
      setRegWhatsapp('');
      setRegCep('');
      setRegEndereco('');
      setRegNumero('');
      setRegComplemento('');
      setRegBairro('');
      setRegCidade('');
      setRegEstado('');
      setRegRespNome('');
      setRegRespCargo('');
      setRegRespCpf('');
      setRegRespRg('');
      setRegRespNascimento('');
      setRegRespEmail('');
      setRegRespWhatsapp('');
      setRegRespTelefone('');
      setRegRespCep('');
      setRegRespEndereco('');
      setRegRespNumero('');
      setRegRespBairro('');
      setRegRespCidade('');
      setRegRespEstado('');
      setRegEmail('');
      setRegSenha('AlfaLogQ@2026');
      setRegClienteDesde(new Date().toLocaleDateString('pt-BR'));
      
      triggerRefresh();
      alert('Novo cliente ativado com sucesso!');
      setActiveTab('clientes_base'); // Redirect to client base list
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

  // Compute monthly payment history dynamically for the selected client
  const getClientPaymentHistory = (client: Cliente) => {
    const history: {
      mesReferencia: string;
      vencimento: string;
      valor: number;
      plano: string;
      status: 'Pago' | 'Pendente';
      dataPagamento?: string;
    }[] = [];

    if (!client) return history;

    const [dayStr, monthStr, yearStr] = (client.clienteDesde || '14/05/2026').split('/');
    const startDay = parseInt(dayStr) || 14;
    const startMonth = parseInt(monthStr) || 5;
    const startYear = parseInt(yearStr) || 2026;

    const currentYear = 2026;
    const currentMonth = 7;

    let tempMonth = startMonth;
    let tempYear = startYear;

    while (tempYear < currentYear || (tempYear === currentYear && tempMonth <= currentMonth)) {
      const isCurrentMonth = tempMonth === currentMonth && tempYear === currentYear;
      const refStr = `${String(tempMonth).padStart(2, '0')}/${tempYear}`;
      const dueStr = `${String(startDay).padStart(2, '0')}/${String(tempMonth).padStart(2, '0')}/${tempYear}`;
      
      let payStatus: 'Pago' | 'Pendente' = 'Pago';
      let payDate: string | undefined = `${String(startDay).padStart(2, '0')}/${String(tempMonth).padStart(2, '0')}/${tempYear}`;

      if (isCurrentMonth) {
        payStatus = client.pagamentoConfirmado ? 'Pago' : 'Pendente';
        payDate = client.pagamentoConfirmado ? (client.dataUltimoPagamento || dueStr) : undefined;
      }

      history.push({
        mesReferencia: refStr,
        vencimento: dueStr,
        valor: client.valorPlano,
        plano: client.plano,
        status: payStatus,
        dataPagamento: payDate
      });

      tempMonth++;
      if (tempMonth > 12) {
        tempMonth = 1;
        tempYear++;
      }
    }

    return history.reverse();
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
          <div className="p-5 border-b border-slate-800">
            <LogusQLogo variant="badge" size="sm" />
            <p className="text-[10px] text-slate-400 mt-2.5 font-mono uppercase tracking-wider font-semibold truncate">
              {isColab ? `Colaborador: ${colabAccessLevel}` : 'Administrador Master'}
            </p>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            {isTotalAccess && (
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

            {(isTotalAccess || normalizedAccess === 'RH') && (
              <button
                onClick={() => setActiveTab('rh')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'rh' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" /> RH Interno
              </button>
            )}

            {isTotalAccess && (
              <button
                onClick={() => setActiveTab('planos')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'planos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" /> Planos SaaS
              </button>
            )}

            {(isTotalAccess || normalizedAccess === 'FINANCEIRO') && (
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

            {isTotalAccess && (
              <button
                onClick={() => setActiveTab('auditoria')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  activeTab === 'auditoria' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Auditoria de Ações
              </button>
            )}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 text-xs space-y-2">
          <div className="text-[10px] text-slate-500 font-mono truncate">
            User: {userEmail}
          </div>
          <button
            onClick={() => {
              setNewPasswordValue('');
              setConfirmPasswordValue('');
              setPwdChangeError('');
              setPwdChangeSuccess('');
              setShowPasswordChangeModal(true);
            }}
            className="w-full bg-violet-950/30 hover:bg-violet-900/40 border border-violet-900/30 text-violet-300 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-[11px]"
          >
            <Lock className="w-3.5 h-3.5 text-violet-400" /> Alterar Minha Senha
          </button>
          {isTotalAccess && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-red-950/30 hover:bg-red-900/40 border border-red-900/30 text-red-400 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" /> Limpar Dados Demo
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl shadow-violet-950/30">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
              <div className="bg-violet-500/10 p-2.5 rounded-full text-violet-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Redefinir Minha Senha</h3>
                <p className="text-[10px] text-slate-400">Altere a senha de acesso da sua conta master.</p>
              </div>
            </div>

            {pwdChangeError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {pwdChangeError}
              </div>
            )}

            {pwdChangeSuccess ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center font-semibold">
                  {pwdChangeSuccess}
                </div>
                <button
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Nova Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-xs transition-colors text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a nova senha"
                    value={confirmPasswordValue}
                    onChange={e => setConfirmPasswordValue(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-xs transition-colors text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPasswordChangeModal(false)}
                    className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setPwdChangeError('');
                      if (!newPasswordValue) {
                        setPwdChangeError('Por favor, informe a nova senha.');
                        return;
                      }
                      const pwdErr = (() => {
                        if (newPasswordValue.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
                        if (!/[A-Z]/.test(newPasswordValue)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
                        if (!/[a-z]/.test(newPasswordValue)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
                        if (!/[0-9]/.test(newPasswordValue)) return 'A senha deve conter pelo menos um número (0-9).';
                        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPasswordValue)) return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).';
                        return null;
                      })();
                      if (pwdErr) {
                        setPwdChangeError(`Senha fraca: ${pwdErr}`);
                        return;
                      }
                      if (newPasswordValue !== confirmPasswordValue) {
                        setPwdChangeError('As senhas digitadas não coincidem.');
                        return;
                      }
                      
                      const success = dbRepo.atualizarUsuarioSenha(userEmail, newPasswordValue);
                      if (success) {
                        setPwdChangeSuccess('Senha redefinida com sucesso! Use a nova senha no seu próximo login.');
                      } else {
                        setPwdChangeError('Erro ao atualizar a senha do usuário. Tente novamente.');
                      }
                    }}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Salvar Senha
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Wipe Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl shadow-red-950/30">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
              <div className="bg-red-500/10 p-2.5 rounded-full text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Atenção: Zerar Sistema</h3>
                <p className="text-[10px] text-slate-400">Esta ação é definitiva e irreversível.</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                Você está prestes a <span className="text-red-400 font-bold">limpar todas as informações de demonstração</span> do sistema LogusQ.
              </p>
              <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-400">
                Isso apagará permanentemente todos os clientes SaaS, frotas, motoristas cadastrados, rotas otimizadas e auditorias. Apenas sua conta <span className="text-violet-400 font-semibold">ceo@logusq.com.br</span> será preservada para que você possa iniciar os testes do zero.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  dbRepo.zerarBancoDados();
                  setShowResetConfirm(false);
                  onLogout();
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/20"
              >
                <Trash2 className="w-4 h-4" /> Sim, Zerar Tudo!
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <th className="px-4 py-3">Desde</th>
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
                            <td className="px-4 py-3 font-mono text-slate-400">{c.clienteDesde}</td>
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
                    <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
                      <div>
                        <h2 className="text-xs font-mono uppercase text-slate-500">Detalhes do Cadastro</h2>
                        <div className="text-sm font-extrabold text-white mt-1">{selectedClient.empresa}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{selectedClient.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        selectedClient.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {selectedClient.status}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-slate-850 pb-2">
                        <div>
                          <span className="text-slate-500 block">CNPJ:</span>
                          <span className="text-white font-mono">{selectedClient.cnpj || 'Não cadastrado'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Telefone:</span>
                          <span className="text-white">{selectedClient.telefoneFixo || selectedClient.whatsapp || 'Não cadastrado'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] border-b border-slate-850 pb-2">
                        <div>
                          <span className="text-slate-500 block">Plano:</span>
                          <span className="text-violet-400 font-bold">{selectedClient.plano}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Cliente Desde:</span>
                          <span className="text-white font-mono">{selectedClient.clienteDesde || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Vencimento:</span>
                          <span className="text-white font-mono">{selectedClient.vencimento}</span>
                        </div>
                      </div>

                      <div className="border-b border-slate-850 pb-2">
                        <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Responsável</span>
                        <div className="text-white font-semibold">{selectedClient.respNome || 'Não cadastrado'}</div>
                        <div className="text-slate-400 text-[11px]">{selectedClient.respCargo} | {selectedClient.respEmail}</div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Endereço da Sede</span>
                        <div className="text-slate-300 text-[11px] leading-relaxed">
                          {selectedClient.endereco}, {selectedClient.numero}
                          {selectedClient.complemento && ` - ${selectedClient.complemento}`}
                          <br />
                          {selectedClient.bairro} - {selectedClient.cidade}/{selectedClient.estado}
                          <br />
                          CEP: {selectedClient.cep}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/60 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setIsFinanceModalOpen(true)}
                          className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-emerald-850/30"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Financeiro
                        </button>
                        <button
                          onClick={() => setIsContractModalOpen(true)}
                          className="bg-violet-950/40 hover:bg-violet-900/40 text-violet-400 font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-violet-850/30"
                        >
                          <FileText className="w-3.5 h-3.5" /> Contrato PDF
                        </button>
                      </div>

                      <button
                        onClick={() => setIsClientEditModalOpen(true)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700/50"
                      >
                        <Edit3 className="w-4 h-4" /> Editar Cadastro Completo
                      </button>
                       <button
                        onClick={() => {
                          if (confirm(`Aviso Crítico: Deseja realmente excluir permanentemente o cliente ${selectedClient.empresa}?\nIsso removerá todos os dados, veículos, e usuários vinculados de forma irreversível!`)) {
                            dbRepo.deletarCliente(selectedClient.email, userEmail, activeOperator.nome);
                            triggerRefresh();
                            alert('Cliente excluído com sucesso.');
                          }
                        }}
                        className="w-full bg-red-950/40 hover:bg-red-900/30 text-red-400 font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-red-900/50"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir Cliente do Sistema
                      </button>
                    </div>
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
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Ficha de Ativação de Novo Cliente SaaS</h1>
              <p className="text-xs text-slate-400">Insira todos os dados cadastrais da empresa e do responsável para ativação imediata.</p>
            </div>

            <form onSubmit={handleCreateClientManual} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl max-w-4xl mx-auto">
              {/* SECTION 1: DADOS DA EMPRESA */}
              <div className="space-y-4">
                <h2 className="text-xs font-mono uppercase text-violet-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 🏢 Dados da Empresa (Sede)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Razão Social / Nome da Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="EX: Farmácia Alfa Varejo e Distribuição Ltda"
                      value={regEmpresa}
                      onChange={e => setRegEmpresa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CNPJ *</label>
                    <input
                      type="text"
                      required
                      placeholder="45.678.901/0001-23"
                      value={regCnpj}
                      onChange={e => setRegCnpj(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Tipo de Unidade *</label>
                    <select
                      value={regTipoUnidade}
                      onChange={e => setRegTipoUnidade(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="Matriz">Matriz</option>
                      <option value="Filial">Filial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Telefone Fixo</label>
                    <input
                      type="text"
                      placeholder="(31) 3222-1010"
                      value={regTelFixo}
                      onChange={e => setRegTelFixo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">WhatsApp com DDD</label>
                    <input
                      type="text"
                      placeholder="(31) 98765-4321"
                      value={regWhatsapp}
                      onChange={e => setRegWhatsapp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                </div>

                {/* Sede Address */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CEP Sede</label>
                    <input
                      type="text"
                      placeholder="30180-001"
                      value={regCep}
                      onChange={e => handleCepLookup(e.target.value, setRegCep, setRegEndereco, setRegBairro, setRegCidade, setRegEstado)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Rua/Avenida Sede</label>
                    <input
                      type="text"
                      placeholder="Avenida Amazonas"
                      value={regEndereco}
                      onChange={e => setRegEndereco(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número Sede</label>
                    <input
                      type="text"
                      placeholder="1500"
                      value={regNumero}
                      onChange={e => setRegNumero(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Complemento</label>
                    <input
                      type="text"
                      placeholder="Ex: Sala 402"
                      value={regComplemento}
                      onChange={e => setRegComplemento(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Bairro Sede</label>
                    <input
                      type="text"
                      placeholder="Centro"
                      value={regBairro}
                      onChange={e => setRegBairro(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cidade Sede</label>
                    <input
                      type="text"
                      placeholder="Belo Horizonte"
                      value={regCidade}
                      onChange={e => setRegCidade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado Sede</label>
                    <input
                      type="text"
                      placeholder="MG"
                      value={regEstado}
                      onChange={e => setRegEstado(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: RESPONSÁVEL PELO CONTRATO */}
              <div className="space-y-4">
                <h2 className="text-xs font-mono uppercase text-violet-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> 👤 Responsável pelo Contrato
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Carlos Eduardo Mendes"
                      value={regRespNome}
                      onChange={e => setRegRespNome(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cargo / Posição</label>
                    <input
                      type="text"
                      placeholder="Gerente de Operações Logísticas"
                      value={regRespCargo}
                      onChange={e => setRegRespCargo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nascimento (DD/MM/AAAA)</label>
                    <input
                      type="text"
                      placeholder="15/08/1985"
                      value={regRespNascimento}
                      onChange={e => setRegRespNascimento(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CPF do Responsável</label>
                    <input
                      type="text"
                      placeholder="123.456.789-00"
                      value={regRespCpf}
                      onChange={e => setRegRespCpf(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">RG do Responsável</label>
                    <input
                      type="text"
                      placeholder="MG-12.345.678"
                      value={regRespRg}
                      onChange={e => setRegRespRg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail do Responsável</label>
                    <input
                      type="email"
                      placeholder="carlos.mendes@farmaciaalfa.com.br"
                      value={regRespEmail}
                      onChange={e => setRegRespEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">WhatsApp Responsável</label>
                    <input
                      type="text"
                      placeholder="(31) 98765-4321"
                      value={regRespWhatsapp}
                      onChange={e => setRegRespWhatsapp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Fixo Responsável</label>
                    <input
                      type="text"
                      placeholder="(31) 3222-1011"
                      value={regRespTelefone}
                      onChange={e => setRegRespTelefone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>
                </div>

                {/* Endereço do Responsável */}
                <div className="pt-2">
                  <span className="block text-[11px] text-slate-400 font-bold mb-3">Endereço do Responsável:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegRespCep(regCep);
                      setRegRespEndereco(regEndereco);
                      setRegRespNumero(regNumero);
                      setRegRespBairro(regBairro);
                      setRegRespCidade(regCidade);
                      setRegRespEstado(regEstado);
                    }}
                    className="bg-slate-850 hover:bg-slate-800 text-[10px] text-violet-400 font-semibold px-2.5 py-1 rounded mb-3 transition-colors"
                  >
                    Copiar Endereço da Sede
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CEP do Responsável</label>
                      <input
                        type="text"
                        placeholder="30140-071"
                        value={regRespCep}
                        onChange={e => handleCepLookup(e.target.value, setRegRespCep, setRegRespEndereco, setRegRespBairro, setRegRespCidade, setRegRespEstado)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Rua/Avenida</label>
                      <input
                        type="text"
                        placeholder="Rua Aimorés"
                        value={regRespEndereco}
                        onChange={e => setRegRespEndereco(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número</label>
                      <input
                        type="text"
                        placeholder="250"
                        value={regRespNumero}
                        onChange={e => setRegRespNumero(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Bairro</label>
                      <input
                        type="text"
                        placeholder="Funcionários"
                        value={regRespBairro}
                        onChange={e => setRegRespBairro(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cidade</label>
                      <input
                        type="text"
                        placeholder="Belo Horizonte"
                        value={regRespCidade}
                        onChange={e => setRegRespCidade(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado</label>
                      <input
                        type="text"
                        placeholder="MG"
                        value={regRespEstado}
                        onChange={e => setRegRespEstado(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ACESSO AO SISTEMA E CONTRATO */}
              <div className="space-y-4">
                <h2 className="text-xs font-mono uppercase text-violet-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                  <Award className="w-4 h-4" /> 🔑 Acesso ao Sistema & Contrato
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail de Login *</label>
                    <input
                      type="email"
                      required
                      placeholder="carlos.mendes@farmaciaalfa.com.br"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Defina uma Senha de Acesso *</label>
                    <input
                      type="text"
                      required
                      placeholder="AlfaLogQ@2026"
                      value={regSenha}
                      onChange={e => setRegSenha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Plano Escolhido *</label>
                    <select
                      value={regPlano}
                      onChange={e => setRegPlano(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    >
                      {(Object.keys(PLANOS_PADRAO) as Array<keyof PlanosSaaS>).map(k => (
                        <option key={k} value={k}>{k} - R$ {PLANOS_PADRAO[k].valor}/mês</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cliente Desde (Data de Início) *</label>
                    <input
                      type="text"
                      required
                      value={regClienteDesde}
                      onChange={e => setRegClienteDesde(e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-6 rounded-lg text-xs transition-all shadow-lg shadow-violet-900/20"
                  >
                    Ativar Cliente e Gerar ID Único
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: RH INTERNO */}
        {activeTab === 'rh' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-extrabold text-white">Recursos Humanos Internos</h1>
                <p className="text-xs text-slate-400">Controle a equipe LogusQ, gerencie regimes de contratação, endereços e níveis de acesso.</p>
              </div>
              {editingColabId && (
                <button
                  onClick={() => {
                    setEditingColabId(null);
                    setCNome('');
                    setCCpf('');
                    setCRg('');
                    setCCargo('');
                    setCEmail('');
                    setCSenha('');
                    setCRegime('CLT');
                    setCTel('');
                    setCAccess('TOTAL');
                    setCCep('');
                    setCEndereco('');
                    setCNumero('');
                    setCComplemento('');
                    setCBairro('');
                    setCCidade('');
                    setCEstado('');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold py-2 px-4 rounded-xl transition-colors"
                >
                  Modo Novo Cadastro
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Register/Edit Employee */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit shadow-xl space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  {editingColabId ? 'Editar Cadastro de Colaborador' : 'Cadastrar Colaborador'}
                </h2>
                <form onSubmit={handleCreateColaborador} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ana Maria Mendes"
                      value={cNome}
                      onChange={e => setCNome(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CPF *</label>
                      <input
                        type="text"
                        required
                        placeholder="123.456.789-10"
                        value={cCpf}
                        onChange={e => setCCpf(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">RG</label>
                      <input
                        type="text"
                        placeholder="MG-12.345.678"
                        value={cRg}
                        onChange={e => setCRg(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cargo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Suporte Técnico"
                        value={cCargo}
                        onChange={e => setCCargo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Telefone *</label>
                      <input
                        type="text"
                        required
                        placeholder="(31) 98888-8888"
                        value={cTel}
                        onChange={e => setCTel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Regime *</label>
                      <select
                        value={cRegime}
                        onChange={e => setCRegime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="CLT">CLT</option>
                        <option value="PJ">PJ</option>
                        <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                        <option value="Estágio">Estágio</option>
                        <option value="Trainee">Trainee</option>
                        <option value="Temporário">Temporário</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nível de Acesso *</label>
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
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail (Login) *</label>
                    <input
                      type="email"
                      required
                      placeholder="ana@logusq.com"
                      value={cEmail}
                      onChange={e => setCEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                      {editingColabId ? 'Senha de Acesso (Editável)' : 'Senha de Acesso *'}
                    </label>
                    <input
                      type="text"
                      required={!editingColabId}
                      placeholder={editingColabId ? "•••••••• (Deixe em branco para manter a atual)" : "Defina a senha"}
                      value={cSenha}
                      onChange={e => setCSenha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Endereço do Colaborador */}
                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Endereço Residencial:</span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[9px] text-slate-500 mb-0.5">CEP</label>
                        <input
                          type="text"
                          placeholder="30000-000"
                          value={cCep}
                          onChange={e => handleCepLookup(e.target.value, setCCep, setCEndereco, setCBairro, setCCidade, setCEstado)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] text-slate-500 mb-0.5">Rua/Av</label>
                        <input
                          type="text"
                          placeholder="Rua das Flores"
                          value={cEndereco}
                          onChange={e => setCEndereco(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 mb-0.5">Nº</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cNumero}
                          onChange={e => setCNumero(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] text-slate-500 mb-0.5">Complemento</label>
                        <input
                          type="text"
                          placeholder="Ap 402"
                          value={cComplemento}
                          onChange={e => setCComplemento(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[9px] text-slate-500 mb-0.5">Bairro</label>
                        <input
                          type="text"
                          placeholder="Centro"
                          value={cBairro}
                          onChange={e => setCBairro(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] text-slate-500 mb-0.5">Cidade</label>
                        <input
                          type="text"
                          placeholder="BH"
                          value={cCidade}
                          onChange={e => setCCidade(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] text-slate-500 mb-0.5">UF</label>
                        <input
                          type="text"
                          placeholder="MG"
                          value={cEstado}
                          onChange={e => setCEstado(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {editingColabId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingColabId(null);
                          setCNome('');
                          setCCpf('');
                          setCRg('');
                          setCCargo('');
                          setCEmail('');
                          setCSenha('');
                          setCRegime('CLT');
                          setCTel('');
                          setCAccess('TOTAL');
                          setCCep('');
                          setCEndereco('');
                          setCNumero('');
                          setCComplemento('');
                          setCBairro('');
                          setCCidade('');
                          setCEstado('');
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      {editingColabId ? 'Salvar Alterações' : 'Ativar Colaborador'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Employee Cards list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colaboradores.map(col => {
                    const colSenha = dbRepo.getSenhaUsuario(col.email);
                    return (
                      <div 
                        key={col.idColaborador} 
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-violet-500/50 transition-colors"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-mono font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full uppercase">
                                {col.nivelAcesso}
                              </span>
                              <h3 className="font-bold text-white text-sm mt-1.5">{col.nome}</h3>
                              <p className="text-xs text-slate-400">{col.cargo} • <span className="font-semibold text-violet-300">{col.regime}</span></p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingColabId(col.idColaborador);
                                  setCNome(col.nome);
                                  setCCpf(col.cpf);
                                  setCRg(col.rg || '');
                                  setCCargo(col.cargo);
                                  setCEmail(col.email);
                                  setCSenha('');
                                  setCRegime(col.regime);
                                  setCTel(col.telefone);
                                  setCAccess(col.nivelAcesso);
                                  setCCep(col.cep || '');
                                  setCEndereco(col.endereco || '');
                                  setCNumero(col.numero || '');
                                  setCComplemento(col.complemento || '');
                                  setCBairro(col.bairro || '');
                                  setCCidade(col.cidade || '');
                                  setCEstado(col.estado || '');
                                }}
                                title="Editar Cadastro"
                                className="text-slate-500 hover:text-violet-400 transition-colors p-1 bg-slate-800/50 rounded"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteColaborador(col.idColaborador)}
                                title="Excluir Colaborador"
                                className="text-slate-500 hover:text-red-400 transition-colors p-1 bg-slate-800/50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/50 pt-2.5">
                            <div>E-mail: <span className="text-slate-200">{col.email}</span></div>
                            <div>Telefone: <span className="text-slate-200">{col.telefone}</span></div>
                            <div>CPF: <span className="text-slate-300">{col.cpf}</span></div>
                            {col.rg && <div>RG: <span className="text-slate-300">{col.rg}</span></div>}
                            <div>
                              Senha:{" "}
                              <span className="text-yellow-400/80 font-bold">
                                {colSenha && colSenha.startsWith('$2') ? '••••••••' : (colSenha || 'N/A')}
                              </span>
                            </div>
                          </div>

                          {/* Address block inside card */}
                          <div className="mt-2 text-[10px] text-slate-500 leading-relaxed bg-slate-950/30 p-2 rounded-lg border border-slate-850">
                            <span className="block font-mono uppercase text-[9px] text-slate-500 mb-0.5">Endereço Residencial:</span>
                            {col.endereco ? (
                              <>
                                {col.endereco}, {col.numero} {col.complemento && `(${col.complemento})`}
                                <br />
                                {col.bairro} - {col.cidade}/{col.estado}
                              </>
                            ) : (
                              <span className="text-slate-600 italic">Não informado</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 border-t border-slate-800/60 pt-2.5 flex justify-between text-[10px] text-slate-500">
                          <span>Admitido em: {col.dataAdmissao}</span>
                          <span className="text-emerald-500 font-bold">Ativo</span>
                        </div>
                      </div>
                    );
                  })}
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
              <p className="text-xs text-slate-400">Nesta aba estão listados os administradores da plataforma e os colaboradores internos do RH.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-4xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-400">
                  <thead className="text-[10px] uppercase font-mono bg-slate-950/50 text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Membro / Cargo</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Nível Acesso</th>
                      <th className="px-4 py-3">Departamento</th>
                      <th className="px-4 py-3">Início / Criação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      ...masters.map(m => ({
                        nome: m.nome,
                        email: m.email,
                        cargo: 'Sócio / Diretor Master',
                        departamento: 'Diretoria Executiva',
                        nivelAcesso: 'TOTAL',
                        criadoEm: m.criadoEm || '14/05/2026'
                      })),
                      ...colaboradores.map(c => ({
                        nome: c.nome,
                        email: c.email,
                        cargo: c.cargo,
                        departamento: 'RH Interno & Operações',
                        nivelAcesso: c.nivelAcesso || 'Total',
                        criadoEm: c.dataAdmissao || '14/05/2026'
                      }))
                    ].map((member, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{member.nome}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{member.cargo}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">{member.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                            member.nivelAcesso.toUpperCase() === 'TOTAL' ? 'bg-violet-500/10 text-violet-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {member.nivelAcesso}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{member.departamento}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{member.criadoEm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AUDITORIA DE AÇÕES */}
        {activeTab === 'auditoria' && isTotalAccess && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-400" /> Painel de Auditoria e Segurança
                </h1>
                <p className="text-xs text-slate-400 font-medium">Histórico de ações críticas efetuadas pelos administradores e colaboradores da LogusQ.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm('Aviso Crítico: Deseja realmente esvaziar todo o registro de auditoria?\nEsta ação é irreversível e apagará o histórico atual.')) {
                      dbRepo.limparLogs();
                      dbRepo.registrarLog(
                        userEmail,
                        activeOperator.nome,
                        'Limpeza de Auditoria',
                        'Esvaziou todos os registros do histórico de auditoria do sistema.',
                        'Geral',
                        'Sucesso'
                      );
                      setSelectedAuditLog(null);
                      triggerRefresh();
                      alert('Histórico de auditoria limpo com sucesso!');
                    }
                  }}
                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico
                </button>
                <button
                  onClick={() => {
                    setSearchTermAuditoria('');
                    setFilterOperator('');
                    setFilterModule('');
                    setSelectedAuditLog(null);
                    triggerRefresh();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resetar Filtros
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            {(() => {
              const allLogs = dbRepo.getLogs();
              const totalActions = allLogs.length;
              const uniqueOperators = new Set(allLogs.map(l => l.operadorEmail)).size;
              const criticalDeletions = allLogs.filter(l => l.acao.includes('Exclusão') || l.acao.includes('Excluir')).length;
              const clientChanges = allLogs.filter(l => l.modulo === 'Clientes').length;
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Ações Registradas</span>
                    <span className="text-xl font-extrabold text-white font-mono">{totalActions}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Operadores Ativos</span>
                    <span className="text-xl font-extrabold text-white font-mono">{uniqueOperators}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold text-red-400">Exclusões Críticas</span>
                    <span className="text-xl font-extrabold text-red-400 font-mono">{criticalDeletions}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Ações Módulo Clientes</span>
                    <span className="text-xl font-extrabold text-violet-400 font-mono">{clientChanges}</span>
                  </div>
                </div>
              );
            })()}

            {/* Main Filters Toolbar */}
            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 font-bold">
                <Filter className="w-3.5 h-3.5 text-violet-400" /> Filtrar Registros
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Term */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por ação, operador ou palavra-chave..."
                    value={searchTermAuditoria}
                    onChange={e => setSearchTermAuditoria(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Operator Filter */}
                <div>
                  <select
                    value={filterOperator}
                    onChange={e => setFilterOperator(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Todos os Operadores</option>
                    {Array.from(new Set(dbRepo.getLogs().map(l => l.operadorEmail).filter(Boolean))).map(email => {
                      const name = dbRepo.getLogs().find(l => l.operadorEmail === email)?.operadorNome || email;
                      return (
                        <option key={email} value={email}>
                          {name} ({email})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Module Filter */}
                <div>
                  <select
                    value={filterModule}
                    onChange={e => setFilterModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Todos os Módulos</option>
                    <option value="Clientes">Clientes</option>
                    <option value="RH">Recursos Humanos (RH)</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Split List & View Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Timeline List */}
              <div className="lg:col-span-7 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const rawLogs = dbRepo.getLogs();
                  const filteredLogs = rawLogs.filter(log => {
                    const matchSearch = 
                      (log.acao || '').toLowerCase().includes(searchTermAuditoria.toLowerCase()) ||
                      (log.descricao || '').toLowerCase().includes(searchTermAuditoria.toLowerCase()) ||
                      (log.operadorNome || '').toLowerCase().includes(searchTermAuditoria.toLowerCase()) ||
                      (log.operadorEmail || '').toLowerCase().includes(searchTermAuditoria.toLowerCase());
                    const matchOperator = !filterOperator || log.operadorEmail === filterOperator;
                    const matchModule = !filterModule || log.modulo === filterModule;
                    return matchSearch && matchOperator && matchModule;
                  });

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="bg-slate-900/30 border border-slate-800/80 border-dashed rounded-xl p-8 text-center space-y-2">
                        <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-500">Nenhum registro de auditoria atende aos filtros atuais.</p>
                      </div>
                    );
                  }

                  return filteredLogs.map(log => {
                    const isSelected = selectedAuditLog?.id === log.id;
                    const isCritical = log.acao.includes('Exclusão') || log.acao.includes('Limpeza');
                    
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedAuditLog(log)}
                        className={`border rounded-xl p-4 cursor-pointer transition-all text-left space-y-2.5 relative overflow-hidden ${
                          isSelected 
                            ? 'bg-violet-950/20 border-violet-500/80 ring-1 ring-violet-500/50' 
                            : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {isCritical && (
                          <div className="absolute top-0 right-0 w-1 bg-red-500 h-full" />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide font-semibold">
                              {log.modulo} • {log.dataHora}
                            </span>
                            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                              {log.acao}
                              {isCritical && (
                                <span className="bg-red-500/10 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                                  Crítico
                                </span>
                              )}
                            </h3>
                          </div>
                          
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            log.status === 'Sucesso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {log.descricao}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-violet-400 border border-slate-700/60 font-mono">
                              {log.operadorNome[0]}
                            </div>
                            <span className="font-medium text-slate-200 truncate">{log.operadorNome}</span>
                            <span className="text-slate-500 text-[9px] truncate">({log.operadorEmail})</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[9px] uppercase shrink-0">
                            {log.operadorCargo || 'Operador'}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Right Column: Inspector Details View */}
              <div className="lg:col-span-5">
                {selectedAuditLog ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Inspecionar Ação</span>
                        <h2 className="text-xs font-extrabold text-white uppercase tracking-wider mt-0.5">Detalhes da Auditoria</h2>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                        {selectedAuditLog.id}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Log details grid */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Informações de Contexto:</span>
                        <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800/50 space-y-2.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Operador:</span>
                            <span className="text-slate-200 font-semibold">{selectedAuditLog.operadorNome}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">E-mail:</span>
                            <span className="text-slate-200 font-mono">{selectedAuditLog.operadorEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cargo:</span>
                            <span className="text-slate-400 font-mono uppercase text-[10px]">{selectedAuditLog.operadorCargo || 'N/D'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Data & Hora:</span>
                            <span className="text-slate-200 font-mono">{selectedAuditLog.dataHora}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Módulo Afetado:</span>
                            <span className="text-violet-400 font-bold">{selectedAuditLog.modulo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Operação Executada:</span>
                            <span className="text-white font-medium">{selectedAuditLog.acao}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Relatório Descritivo:</span>
                        <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 leading-relaxed">
                          {selectedAuditLog.descricao}
                        </div>
                      </div>

                      {/* Raw Details / JSON payload payload */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Dados Técnicos Estruturados (JSON):</span>
                        {selectedAuditLog.detalhes ? (() => {
                          let displayStr = '';
                          try {
                            if (typeof selectedAuditLog.detalhes === 'object') {
                              displayStr = JSON.stringify(selectedAuditLog.detalhes, null, 2);
                            } else {
                              displayStr = JSON.stringify(JSON.parse(selectedAuditLog.detalhes), null, 2);
                            }
                          } catch (e) {
                            displayStr = String(selectedAuditLog.detalhes);
                          }
                          return (
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-[10px] text-violet-300 overflow-x-auto max-h-[160px]">
                              <pre className="whitespace-pre-wrap">{displayStr}</pre>
                            </div>
                          );
                        })() : (
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-center font-mono text-[10px] text-slate-600">
                            Nenhum payload adicional anexado a este registro.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/20 border border-slate-800/80 border-dashed rounded-xl p-8 text-center space-y-3 max-w-sm mx-auto h-[320px] flex flex-col items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-slate-700 animate-pulse" />
                    <div>
                      <p className="text-xs text-slate-300 font-bold">Inspetor de Histórico</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Selecione qualquer registro de ação na linha do tempo para verificar dados de payload, metadados, cargos e escopos técnicos.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDIÇÃO DE CLIENTE */}
        {isClientEditModalOpen && selectedClient && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-white">Editar Ficha Cadastral do Cliente</h3>
                  <p className="text-xs text-slate-400">Altere dados corporativos, responsável, endereço, contrato e senhas.</p>
                </div>
                <button 
                  onClick={() => setIsClientEditModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleUpdateClient} className="p-6 space-y-6 overflow-y-auto">
                {/* SECTION 1: DADOS DA EMPRESA */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-violet-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> 🏢 Dados da Empresa (Sede)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Razão Social *</label>
                      <input
                        type="text"
                        required
                        value={upEmpresa}
                        onChange={e => setUpEmpresa(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CNPJ *</label>
                      <input
                        type="text"
                        required
                        value={upCnpj}
                        onChange={e => setUpCnpj(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Tipo de Unidade *</label>
                      <select
                        value={upTipoUnidade}
                        onChange={e => setUpTipoUnidade(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-white"
                      >
                        <option value="Matriz">Matriz</option>
                        <option value="Filial">Filial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Telefone Fixo</label>
                      <input
                        type="text"
                        value={upTelFixo}
                        onChange={e => setUpTelFixo(e.target.value)}
                        placeholder="(31) 3222-1010"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">WhatsApp com DDD</label>
                      <input
                        type="text"
                        value={upWhatsapp}
                        onChange={e => setUpWhatsapp(e.target.value)}
                        placeholder="(31) 98765-4321"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Endereço Sede */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CEP Sede</label>
                      <input
                        type="text"
                        value={upCep}
                        onChange={e => handleCepLookup(e.target.value, setUpCep, setUpEndereco, setUpBairro, setUpCidade, setUpEstado)}
                        placeholder="30180-001"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Rua/Avenida Sede</label>
                      <input
                        type="text"
                        value={upEndereco}
                        onChange={e => setUpEndereco(e.target.value)}
                        placeholder="Avenida Amazonas"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número Sede</label>
                      <input
                        type="text"
                        value={upNumero}
                        onChange={e => setUpNumero(e.target.value)}
                        placeholder="1500"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Complemento</label>
                      <input
                        type="text"
                        value={upComplemento}
                        onChange={e => setUpComplemento(e.target.value)}
                        placeholder="Ex: Sala 402"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Bairro Sede</label>
                      <input
                        type="text"
                        value={upBairro}
                        onChange={e => setUpBairro(e.target.value)}
                        placeholder="Centro"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cidade Sede</label>
                      <input
                        type="text"
                        value={upCidade}
                        onChange={e => setUpCidade(e.target.value)}
                        placeholder="Belo Horizonte"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado Sede</label>
                      <input
                        type="text"
                        value={upEstado}
                        onChange={e => setUpEstado(e.target.value)}
                        placeholder="MG"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: RESPONSÁVEL PELO CONTRATO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-violet-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> 👤 Responsável pelo Contrato
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={upRespNome}
                        onChange={e => setUpRespNome(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cargo / Posição</label>
                      <input
                        type="text"
                        value={upRespCargo}
                        onChange={e => setUpRespCargo(e.target.value)}
                        placeholder="Gerente de Operações"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nascimento (DD/MM/AAAA)</label>
                      <input
                        type="text"
                        value={upRespNascimento}
                        onChange={e => setUpRespNascimento(e.target.value)}
                        placeholder="15/08/1985"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CPF do Responsável</label>
                      <input
                        type="text"
                        value={upRespCpf}
                        onChange={e => setUpRespCpf(e.target.value)}
                        placeholder="123.456.789-00"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">RG do Responsável</label>
                      <input
                        type="text"
                        value={upRespRg}
                        onChange={e => setUpRespRg(e.target.value)}
                        placeholder="MG-12.345.678"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail de Contato</label>
                      <input
                        type="email"
                        value={upRespEmail}
                        onChange={e => setUpRespEmail(e.target.value)}
                        placeholder="carlos.mendes@empresa.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">WhatsApp Responsável</label>
                      <input
                        type="text"
                        value={upRespWhatsapp}
                        onChange={e => setUpRespWhatsapp(e.target.value)}
                        placeholder="(31) 98765-4321"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Fixo Responsável</label>
                      <input
                        type="text"
                        value={upRespTelefone}
                        onChange={e => setUpRespTelefone(e.target.value)}
                        placeholder="(31) 3222-1011"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Endereço do Responsável */}
                  <div className="pt-2">
                    <span className="block text-[11px] text-slate-400 font-bold mb-3">Endereço do Responsável:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUpRespCep(upCep);
                        setUpRespEndereco(upEndereco);
                        setUpRespNumero(upNumero);
                        setUpRespBairro(upBairro);
                        setUpRespCidade(upCidade);
                        setUpRespEstado(upEstado);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-[10px] text-violet-400 font-semibold px-2.5 py-1 rounded mb-3 transition-colors"
                    >
                      Copiar Endereço da Empresa
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CEP do Responsável</label>
                        <input
                          type="text"
                          value={upRespCep}
                          onChange={e => handleCepLookup(e.target.value, setUpRespCep, setUpRespEndereco, setUpRespBairro, setUpRespCidade, setUpRespEstado)}
                          placeholder="30140-071"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Rua/Avenida</label>
                        <input
                          type="text"
                          value={upRespEndereco}
                          onChange={e => setUpRespEndereco(e.target.value)}
                          placeholder="Rua Aimorés"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número</label>
                        <input
                          type="text"
                          value={upRespNumero}
                          onChange={e => setUpRespNumero(e.target.value)}
                          placeholder="250"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Bairro</label>
                        <input
                          type="text"
                          value={upRespBairro}
                          onChange={e => setUpRespBairro(e.target.value)}
                          placeholder="Funcionários"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cidade</label>
                        <input
                          type="text"
                          value={upRespCidade}
                          onChange={e => setUpRespCidade(e.target.value)}
                          placeholder="Belo Horizonte"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado</label>
                        <input
                          type="text"
                          value={upRespEstado}
                          onChange={e => setUpRespEstado(e.target.value)}
                          placeholder="MG"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: CREDENCIAIS DE ACESSO E CONTRATO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-violet-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                    <Award className="w-4 h-4" /> 🔑 Acesso ao Sistema & Contrato
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail de Login (Apenas Visualização)</label>
                      <input
                        type="email"
                        disabled
                        value={upEmail}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Senha de Acesso (Editável)</label>
                      <input
                        type="text"
                        value={upSenha}
                        onChange={e => setUpSenha(e.target.value)}
                        placeholder="•••••••• (Deixe em branco para manter a atual)"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Plano Contratual *</label>
                      <select
                        value={upPlano}
                        onChange={e => setUpPlano(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-white"
                      >
                        {(Object.keys(PLANOS_PADRAO) as Array<keyof PlanosSaaS>).map(k => (
                          <option key={k} value={k}>{k} - R$ {PLANOS_PADRAO[k].valor}/mês</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Status de Acesso *</label>
                      <select
                        value={upStatus}
                        onChange={e => setUpStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-white"
                      >
                        <option value="Ativo">Ativo (Acesso Liberado)</option>
                        <option value="Bloqueado">Bloqueado (Acesso Bloqueado)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cliente Desde *</label>
                      <input
                        type="text"
                        required
                        value={upClienteDesde}
                        onChange={e => setUpClienteDesde(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Vencimento da Mensalidade *</label>
                      <input
                        type="text"
                        required
                        value={upVencimento}
                        onChange={e => setUpVencimento(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Panel */}
                <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsClientEditModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition-colors"
                  >
                    Descartar Alterações
                  </button>
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-violet-900/10"
                  >
                    Salvar Ficha Cadastral
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isFinanceModalOpen && selectedClient && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" /> Histórico Financeiro LogusQ
                  </h3>
                  <p className="text-xs text-slate-400">Controle de faturas, valores de planos e datas de pagamento para {selectedClient.empresa}.</p>
                </div>
                <button 
                  onClick={() => setIsFinanceModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs"
                >
                  Fechar
                </button>
              </div>

              {/* Top Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Plano Atual</span>
                  <span className="text-sm font-bold text-violet-400">{selectedClient.plano}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Valor Mensal</span>
                  <span className="text-sm font-bold text-white">R$ {selectedClient.valorPlano.toLocaleString('pt-BR')}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Status da Assinatura</span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded uppercase inline-block mt-0.5 ${
                    selectedClient.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>{selectedClient.status}</span>
                </div>
              </div>

              {/* History Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs text-left text-slate-400">
                    <thead className="text-[10px] uppercase font-mono bg-slate-900/50 text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Referência</th>
                        <th className="px-4 py-2.5">Plano</th>
                        <th className="px-4 py-2.5">Valor</th>
                        <th className="px-4 py-2.5">Vencimento</th>
                        <th className="px-4 py-2.5">Data Pagamento</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {getClientPaymentHistory(selectedClient).map((h, i) => (
                        <tr key={i} className="hover:bg-slate-900/20">
                          <td className="px-4 py-2.5 font-bold text-white">{h.mesReferencia}</td>
                          <td className="px-4 py-2.5 text-slate-400">{h.plano}</td>
                          <td className="px-4 py-2.5 text-white font-mono">R$ {h.valor.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono">{h.vencimento}</td>
                          <td className="px-4 py-2.5 text-slate-300 font-mono">{h.dataPagamento || '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              h.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>{h.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {h.status === 'Pendente' && (
                              <button
                                onClick={() => {
                                  handleConfirmPayment(selectedClient.email);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded text-[10px] transition-colors"
                              >
                                Dar Baixa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {isContractModalOpen && selectedClient && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-400" /> Contrato de Adesão SaaS LogusQ (PDF)
                  </h3>
                  <p className="text-xs text-slate-400">Contrato gerado automaticamente em formato padrão e pronto para impressão ou exportação.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const printContents = document.getElementById('printable-contract')?.innerHTML;
                      if (printContents) {
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>Contrato LogusQ - ${selectedClient.empresa}</title>
                                <style>
                                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; font-size: 14px; }
                                  h1 { text-align: center; font-size: 18px; text-transform: uppercase; margin-bottom: 30px; }
                                  h2 { font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 25px; }
                                  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                  table td { border: 1px solid #ddd; padding: 8px; }
                                  @media print {
                                    .no-print { display: none; }
                                  }
                                </style>
                              </head>
                              <body>
                                ${printContents}
                                <script>
                                  window.onload = function() { window.print(); window.close(); }
                                </script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Imprimir / Salvar PDF
                  </button>
                  <button 
                    onClick={() => setIsContractModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Contract document layout */}
              <div className="overflow-y-auto flex-1 bg-white text-slate-900 p-8 rounded-xl border border-slate-300 shadow-inner font-serif" id="printable-contract">
                <div className="max-w-3xl mx-auto space-y-6 text-xs text-justify leading-relaxed">
                  <div className="text-center space-y-2 pb-4 border-b border-slate-200">
                    <div className="font-sans font-extrabold text-xl tracking-wider text-slate-800">LOGUS<span className="text-violet-600">Q</span> TECNOLOGIA</div>
                    <div className="text-[9px] font-sans uppercase tracking-widest text-slate-500">Sistemas Inteligentes de Roteirização Científica</div>
                  </div>

                  <h1 className="text-center font-sans font-extrabold text-xs uppercase tracking-wide text-slate-950">
                    INSTRUMENTO PARTICULAR DE CONTRATO DE LICENCIAMENTO DE SOFTWARE E PRESTAÇÃO DE SERVIÇOS DE LOGÍSTICA SAAS
                  </h1>

                  <div>
                    <p>Por este instrumento particular de contrato, de um lado:</p>
                    <p className="mt-2 pl-4 border-l-2 border-slate-300">
                      <strong>LICENCIANTE:</strong> LOGUSQ TECNOLOGIA LTDA, pessoa jurídica de direito privado, com CNPJ (Aguardando CNPJ definitivo), com sede na Avenida do Contorno, nº 4500, Savassi, Belo Horizonte - MG, neste ato representada na forma de seus atos constitutivos; e
                    </p>
                    <p className="mt-2 pl-4 border-l-2 border-slate-300">
                      <strong>LICENCIADA:</strong> {selectedClient.empresa}, inscrita no CNPJ sob o nº {selectedClient.cnpj || 'CONTRATO-GERADO'}, sediada em {selectedClient.endereco}, nº {selectedClient.numero} {selectedClient.complemento && `(${selectedClient.complemento})`}, {selectedClient.bairro}, {selectedClient.cidade}/{selectedClient.estado}, representada neste ato por seu gestor responsável legal, <strong>{selectedClient.respNome}</strong>, portador do CPF nº {selectedClient.respCpf || 'Sob consulta'}.
                    </p>
                    <p className="mt-2">As partes acima qualificadas têm, entre si, justo e contratado o quanto segue nas seguintes cláusulas e condições:</p>
                  </div>

                  <div>
                    <h2 className="font-sans font-bold text-[11px] text-slate-800 uppercase mt-4">CLÁUSULA PRIMEIRA – DO OBJETO E ESPECIFICAÇÃO DO PLANO</h2>
                    <p className="mt-1">
                      1.1 Constitui objeto do presente instrumento o licenciamento temporário de uso, de forma não exclusiva e intransferível, do Software LOGUSQ - Sistema de Roteirização Inteligente K-Means & TSP, além do suporte técnico associado à sua operação.
                    </p>
                    <p className="mt-1">
                      1.2 A LICENCIADA optou pela contratação do plano especificado abaixo, cujos limites operacionais devem ser rigorosamente respeitados:
                    </p>
                    <table className="w-full border border-slate-300 mt-2 font-sans text-[10px]">
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 bg-slate-100 p-2 font-bold w-40">Identificador da Conta:</td>
                          <td className="border border-slate-300 p-2">{selectedClient.idCliente}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 bg-slate-100 p-2 font-bold">Plano SaaS Contratado:</td>
                          <td className="border border-slate-300 p-2 font-bold text-violet-700">{selectedClient.plano}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 bg-slate-100 p-2 font-bold">Valor da Mensalidade:</td>
                          <td className="border border-slate-300 p-2 font-bold">R$ {selectedClient.valorPlano.toLocaleString('pt-BR')} (Mensais)</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 bg-slate-100 p-2 font-bold">Frota Máxima Permitida:</td>
                          <td className="border border-slate-300 p-2">Até {PLANOS_PADRAO[selectedClient.plano as keyof PlanosSaaS]?.max_veiculos || 5} Veículos Simultâneos</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 bg-slate-100 p-2 font-bold">Vigência Inicial (Início):</td>
                          <td className="border border-slate-300 p-2 font-mono">{selectedClient.clienteDesde || '14/07/2026'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h2 className="font-sans font-bold text-[11px] text-slate-800 uppercase mt-4">CLÁUSULA SEGUNDA – DOS VALORES, FORMA DE COBRANÇA E REAJUSTES</h2>
                    <p className="mt-1">
                      2.1 Pelo licenciamento e serviços prestados, a LICENCIADA pagará à LICENCIANTE o valor mensal do plano contratado, vencendo todo dia <strong>{selectedClient.vencimento?.split('/')[0] || '10'}</strong> de cada mês, através de boleto bancário ou transferência PIX homologada.
                    </p>
                    <p className="mt-1">
                      2.2 O atraso superior a 10 (dez) dias ensejará o bloqueio temporário do acesso aos servidores de roteirização LogusQ, sem prejuízo da incidência de juros de mora de 1% ao mês e multa compensatória de 2%.
                    </p>
                    <p className="mt-1">
                      2.3 Os valores pactuados serão reajustados anualmente com base na variação positiva do IPCA/IBGE acumulado no período, ou outro indexador oficial que venha a substituí-lo.
                    </p>
                  </div>

                  <div>
                    <h2 className="font-sans font-bold text-[11px] text-slate-800 uppercase mt-4">CLÁUSULA TERCEIRA – DA SEGURANÇA DA INFORMAÇÃO E LGPD</h2>
                    <p className="mt-1">
                      3.1 A LICENCIANTE compromete-se a manter em sigilo absoluto todos os dados de frota, coordenadas de clientes de entrega, faturamento e informações pessoais inseridas pela LICENCIADA no software, em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
                    </p>
                    <p className="mt-1">
                      3.2 Todas as conexões de tráfego de dados com as APIs de otimização LogusQ utilizam criptografia SSL SHA-256 bits de padrão militar, sendo as bases hospedadas em datacenters redundantes com conformidade de segurança Tier III.
                    </p>
                  </div>

                  <div>
                    <h2 className="font-sans font-bold text-[11px] text-slate-800 uppercase mt-4">CLÁUSULA QUARTA – DA RESCISÃO E VIGÊNCIA</h2>
                    <p className="mt-1">
                      4.1 O presente contrato vigora por prazo indeterminado. Qualquer das partes poderá rescindir a prestação de serviços a qualquer momento, mediante envio de notificação por escrito com antecedência mínima de 30 (trinta) dias, desde que não existam débitos pendentes de pagamento.
                    </p>
                  </div>

                  <p className="mt-6 text-center">Belo Horizonte, {selectedClient.clienteDesde || '14 de Julho de 2026'}.</p>

                  <div className="signature-row pt-8 flex justify-between gap-12 font-sans text-[10px] mt-8">
                    <div className="w-1/2 border-t border-slate-400 text-center pt-2">
                      <strong>LOGUSQ TECNOLOGIA LTDA</strong><br />Representante Legal (Licenciante)
                    </div>
                    <div className="w-1/2 border-t border-slate-400 text-center pt-2">
                      <strong>{selectedClient.empresa}</strong><br />Representante Legal: {selectedClient.respNome}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
