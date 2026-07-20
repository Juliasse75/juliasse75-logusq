import { Usuario, Cliente, Colaborador, Plano, Veiculo, Condutor, MensagemSuporte, Entrega, PLANOS_PADRAO, AuditLog } from '../types';

// Seed Plans
export const PLANOS: Plano[] = [
  { nome: 'POC', descricao: 'Até 5 veículos - validação gratuita', valor: 0, maxVeiculos: 5 },
  { nome: 'Start', descricao: 'Até 15 veículos + roterização básica', valor: 499, maxVeiculos: 15 },
  { nome: 'Pro', descricao: 'Até 40 veículos + injeção contínua + suporte', valor: 999, maxVeiculos: 40 },
  { nome: 'Enterprise', descricao: 'Ilimitado + API + suporte dedicado 24h', valor: 1799, maxVeiculos: 9999 },
];

// Local Storage Keys
const KEYS = {
  USUARIOS: 'logusq_usuarios',
  CLIENTES: 'logusq_clientes',
  COLABORADORES: 'logusq_colaboradores',
  VEICULOS: 'logusq_veiculos',
  CONDUTORES: 'logusq_condutores',
  MENSAGENS: 'logusq_mensagens',
  ENTREGAS: 'logusq_entregas',
  AUDITORIA: 'logusq_auditoria',
};

// Seed Users
const SEED_USUARIOS = [
  {
    email: 'ceo@logusq.com.br',
    nome: 'Cosme Juliasse',
    perfil: 'MASTER' as const,
    nivelAcesso: 'TOTAL',
    criadoEm: '14/07/2025',
    senha_hash: '123456', // Simple auth for prototype ease
  },
  {
    email: 'demo@logusq.com.br',
    nome: 'Rodrigo Medeiros',
    perfil: 'CLIENT' as const,
    empresa: 'LogiVelo Express S.A.',
    nivelAcesso: 'TOTAL',
    criadoEm: '14/07/2025',
    senha_hash: '123456',
  },
  {
    email: 'carlosjose@logusq.com.br',
    nome: 'Carlos José',
    perfil: 'COLABORADOR' as const,
    nivelAcesso: 'TOTAL',
    criadoEm: '10/07/2026',
    senha_hash: '123456',
  },
  {
    email: 'motorista@logusq.com.br',
    nome: 'Carlos Alberto (Motorista)',
    perfil: 'MOTORISTA' as const,
    empresa: 'LogiVelo Express S.A.',
    nivelAcesso: 'PARCIAL',
    criadoEm: '15/07/2026',
    senha_hash: '123456',
  }
];

// Seed Clients (SaaS)
const SEED_CLIENTES: Cliente[] = [
  {
    idCliente: 'LOGUS-CLI-250101',
    email: 'demo@logusq.com.br',
    empresa: 'LogiVelo Express S.A.',
    cnpj: '12.345.678/0001-99',
    telefoneFixo: '(11) 3456-7890',
    whatsapp: '(11) 98765-4321',
    cep: '01311-200',
    endereco: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Andar 12',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    tipoUnidade: 'Matriz',
    plano: 'Pro',
    valorPlano: 999,
    status: 'Ativo',
    clienteDesde: '01/01/2025',
    vencimento: '14/08/2026',
    respNome: 'Rodrigo Medeiros',
    respCargo: 'Diretor de Logística',
    respEmail: 'rodrigo@logivelo.com',
    pagamentoConfirmado: true,
  },
  {
    idCliente: 'LOGUS-CLI-250312',
    email: 'gerente@rapidobh.com',
    empresa: 'Rapidão BH Entregas LTDA',
    cnpj: '98.765.432/0001-11',
    telefoneFixo: '(31) 2511-9000',
    whatsapp: '(31) 99123-4567',
    cep: '30110-002',
    endereco: 'Avenida do Contorno',
    numero: '4500',
    bairro: 'Funcionários',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    tipoUnidade: 'Matriz',
    plano: 'Start',
    valorPlano: 499,
    status: 'Ativo',
    clienteDesde: '12/03/2025',
    vencimento: '10/08/2026',
    respNome: 'Carlos Eduardo',
    respCargo: 'Gerente Geral',
    respEmail: 'carlos@rapidobh.com',
    pagamentoConfirmado: true,
  },
  {
    idCliente: 'LOGUS-CLI-250620',
    email: 'admin@quanticalog.com',
    empresa: 'Quantum Logística Integrada',
    cnpj: '45.123.890/0001-22',
    telefoneFixo: '(21) 4004-1212',
    whatsapp: '(21) 97712-3456',
    cep: '20040-002',
    endereco: 'Avenida Rio Branco',
    numero: '115',
    complemento: 'Sala 601',
    bairro: 'Centro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    tipoUnidade: 'Matriz',
    plano: 'Enterprise',
    valorPlano: 1799,
    status: 'Ativo',
    clienteDesde: '20/06/2025',
    vencimento: '20/08/2026',
    respNome: 'Flávia Soares',
    respCargo: 'CEO',
    respEmail: 'flavia@quanticalog.com',
    pagamentoConfirmado: false, // Pending next payment
  },
  {
    idCliente: 'LOGUS-CLI-250702',
    email: 'bloqueado@inadimplente.com',
    empresa: 'Express Sul Transportes',
    cnpj: '33.222.111/0001-00',
    telefoneFixo: '(51) 3211-1234',
    whatsapp: '(51) 98888-7777',
    cep: '90010-001',
    endereco: 'Rua dos Andradas',
    numero: '500',
    bairro: 'Centro Histórico',
    cidade: 'Porto Alegre',
    estado: 'RS',
    tipoUnidade: 'Filial',
    plano: 'POC',
    valorPlano: 0,
    status: 'Bloqueado',
    clienteDesde: '02/07/2025',
    vencimento: '02/08/2025',
    respNome: 'Arthur Mendes',
    respCargo: 'Supervisor de Operações',
    respEmail: 'arthur@expressul.com',
    pagamentoConfirmado: false,
  }
];

// Seed Internal Employees
const SEED_COLABORADORES: Colaborador[] = [
  {
    idColaborador: 'LOGUS-RH-2501',
    nome: 'Ana Clara Neves',
    cargo: 'Gerente de Customer Success',
    telefone: '(11) 98111-2222',
    whatsapp: '(11) 98111-2222',
    email: 'anaclara@logusq.com.br',
    dataAdmissao: '15/01/2025',
    status: 'Ativo',
    nivelAcesso: 'Total',
    acessoSistema: true,
  },
  {
    idColaborador: 'LOGUS-RH-2502',
    nome: 'Carlos Henrique Souza',
    cargo: 'Analista de Infraestrutura e Roteamento',
    telefone: '(11) 97333-4444',
    whatsapp: '(11) 97333-4444',
    email: 'carlosh@logusq.com.br',
    dataAdmissao: '01/02/2025',
    status: 'Ativo',
    nivelAcesso: 'Visualizar',
    acessoSistema: true,
  },
  {
    idColaborador: 'LOGUS-RH-2503',
    nome: 'Carlos José',
    cargo: 'Gerente LogusQ',
    telefone: '(11) 99888-7777',
    whatsapp: '(11) 99888-7777',
    email: 'carlosjose@logusq.com.br',
    dataAdmissao: '10/07/2026',
    status: 'Ativo',
    nivelAcesso: 'Total',
    acessoSistema: true,
    regime: 'CLT',
  }
];

// Seed Audit Logs
const SEED_AUDITORIA: AuditLog[] = [
  {
    id: 'AUD-001',
    dataHora: '14/07/2026 10:15:30',
    operadorEmail: 'carlosjose@logusq.com.br',
    operadorNome: 'Carlos José',
    operadorCargo: 'Gerente LogusQ',
    acao: 'Exclusão de Cliente',
    descricao: 'Excluiu o cliente "Farmácia Alfa S.A." (CNPJ: 12.876.543/0001-99) do banco de dados.',
    modulo: 'Clientes',
    status: 'Sucesso',
    detalhes: '{"idCliente": "LOGUS-CLI-90123", "empresa": "Farmácia Alfa S.A."}'
  },
  {
    id: 'AUD-002',
    dataHora: '14/07/2026 10:17:12',
    operadorEmail: 'carlosjose@logusq.com.br',
    operadorNome: 'Carlos José',
    operadorCargo: 'Gerente LogusQ',
    acao: 'Exclusão de Cliente',
    descricao: 'Excluiu o cliente "Supermercado do Bairro LTDA" (CNPJ: 45.987.123/0001-44) do banco de dados.',
    modulo: 'Clientes',
    status: 'Sucesso',
    detalhes: '{"idCliente": "LOGUS-CLI-90124", "empresa": "Supermercado do Bairro LTDA"}'
  },
  {
    id: 'AUD-003',
    dataHora: '14/07/2026 10:19:45',
    operadorEmail: 'carlosjose@logusq.com.br',
    operadorNome: 'Carlos José',
    operadorCargo: 'Gerente LogusQ',
    acao: 'Exclusão de Cliente',
    descricao: 'Excluiu o cliente "Padaria Central de BH" (CNPJ: 33.111.222/0001-33) do banco de dados.',
    modulo: 'Clientes',
    status: 'Sucesso',
    detalhes: '{"idCliente": "LOGUS-CLI-90125", "empresa": "Padaria Central de BH"}'
  },
  {
    id: 'AUD-004',
    dataHora: '15/07/2026 08:30:00',
    operadorEmail: 'anaclara@logusq.com.br',
    operadorNome: 'Ana Clara Neves',
    operadorCargo: 'Gerente de Customer Success',
    acao: 'Cadastro de Colaborador',
    descricao: 'Cadastrou o novo colaborador interno "Pedro Henrique Martins" (E-mail: pedro@logusq.com.br).',
    modulo: 'RH',
    status: 'Sucesso',
    detalhes: '{"nome": "Pedro Henrique Martins", "cargo": "Analista Júnior"}'
  },
  {
    id: 'AUD-005',
    dataHora: '15/07/2026 09:45:10',
    operadorEmail: 'carlosh@logusq.com.br',
    operadorNome: 'Carlos Henrique Souza',
    operadorCargo: 'Analista de Infraestrutura e Roteamento',
    acao: 'Visualização de Frota',
    descricao: 'Visualizou e exportou dados de frota de veículos cadastrados da Quantum Logística Integrada.',
    modulo: 'Geral',
    status: 'Sucesso'
  },
  {
    id: 'AUD-006',
    dataHora: '15/07/2026 11:20:00',
    operadorEmail: 'ceo@logusq.com.br',
    operadorNome: 'Cosme Juliasse',
    operadorCargo: 'CEO Master',
    acao: 'Alteração de Plano',
    descricao: 'Alterou as tarifas e limites do Plano Pro de R$ 999 para R$ 1099 mensais.',
    modulo: 'Financeiro',
    status: 'Sucesso'
  }
];

// Seed Vehicles (For demo client)
const SEED_VEICULOS: Veiculo[] = [
  {
    id: 'V-101',
    idVeiculo: 'VW-11180',
    placa: 'PVG-4H89',
    modelo: 'Delivery 11.180',
    fabricante: 'Volkswagen',
    anoFabricacao: '2022',
    anoModelo: '2023',
    cor: 'Branco',
    tipo: 'Caminhão Pesado',
    capacidadeKg: 5500,
    status: 'Disponivel',
    dataCadastro: '15/01/2025',
    observacao: 'Revisado recentemente. Equipado com baú refrigerado.',
  },
  {
    id: 'V-102',
    idVeiculo: 'REN-MASTER',
    placa: 'QUT-9A45',
    modelo: 'Master Furgão L3H2',
    fabricante: 'Renault',
    anoFabricacao: '2021',
    anoModelo: '2021',
    cor: 'Prata',
    tipo: 'Van',
    capacidadeKg: 1520,
    status: 'Disponivel',
    dataCadastro: '15/01/2025',
  },
  {
    id: 'V-103',
    idVeiculo: 'FIAT-FIORINO',
    placa: 'RJK-1E23',
    modelo: 'Fiorino Endurance 1.4',
    fabricante: 'Fiat',
    anoFabricacao: '2023',
    anoModelo: '2024',
    cor: 'Branco',
    tipo: 'Carro Leve',
    capacidadeKg: 650,
    status: 'Disponivel',
    dataCadastro: '16/01/2025',
  },
  {
    id: 'V-104',
    idVeiculo: 'HON-CARGO',
    placa: 'SHN-5B71',
    modelo: 'CG 160 Cargo',
    fabricante: 'Honda',
    anoFabricacao: '2022',
    anoModelo: '2022',
    cor: 'Vermelho',
    tipo: 'Motocicleta',
    capacidadeKg: 120,
    status: 'Disponivel',
    dataCadastro: '18/01/2025',
  },
  {
    id: 'V-105',
    idVeiculo: 'VOL-FH540',
    placa: 'OPX-8C12',
    modelo: 'FH 540 Globetrotter',
    fabricante: 'Volvo',
    anoFabricacao: '2020',
    anoModelo: '2021',
    cor: 'Azul',
    tipo: 'Caminhão Pesado',
    capacidadeKg: 15000,
    status: 'Manutencao',
    defeito: 'Problema na injeção eletrônica.',
    dataEntradaManutencao: '12/07/2026',
    dataRetornoManutencao: '18/07/2026',
    dataCadastro: '20/02/2025',
  }
];

// Seed Drivers
const SEED_CONDUTORES: Condutor[] = [
  {
    id: 'D-201',
    nome: 'Reginaldo Ferreira',
    cpf: '111.222.333-44',
    rg: '12.345.678-9',
    nascimento: '12/08/1980',
    cnh: '99887766550',
    categoriaCnh: 'D',
    vencCnh: '15/09/2028',
    telefone: '(11) 99111-2222',
    email: 'reginaldo.f@gmail.com',
    veiculo: 'VW-11180',
  },
  {
    id: 'D-202',
    nome: 'Marcos Oliveira Bento',
    cpf: '222.333.444-55',
    rg: '14.567.890-1',
    nascimento: '24/05/1989',
    cnh: '11223344556',
    categoriaCnh: 'B',
    vencCnh: '20/12/2029',
    telefone: '(11) 99333-4444',
    email: 'marcos.ob@gmail.com',
    veiculo: 'REN-MASTER',
  },
  {
    id: 'D-203',
    nome: 'Cláudia Ribeiro da Costa',
    cpf: '333.444.555-66',
    rg: '15.678.901-2',
    nascimento: '03/11/1992',
    cnh: '55667788990',
    categoriaCnh: 'B',
    vencCnh: '08/04/2031',
    telefone: '(11) 99555-6666',
    email: 'claudia.ribeiro@hotmail.com',
    veiculo: 'FIAT-FIORINO',
  },
  {
    id: 'D-204',
    nome: 'Carlos Alberto (Motorista)',
    cpf: '444.555.666-77',
    rg: '16.789.012-3',
    nascimento: '15/10/1986',
    cnh: '66778899001',
    categoriaCnh: 'A',
    vencCnh: '20/05/2030',
    telefone: '(31) 98888-8888',
    email: 'motorista@logusq.com.br',
    veiculo: 'HON-CARGO',
  },
  {
    id: 'D-205',
    nome: 'Bruno Santos Silveira',
    cpf: '444.555.666-88',
    rg: '16.789.012-4',
    nascimento: '15/02/1997',
    cnh: '66778899002',
    categoriaCnh: 'A',
    vencCnh: '30/06/2032',
    telefone: '(11) 98888-9999',
    email: 'bruno.s@outlook.com',
    veiculo: '',
  }
];

// Seed Support Messages
const SEED_MENSAGENS: MensagemSuporte[] = [
  {
    id: 'MSG-001',
    nome: 'Carlos Mendes',
    email: 'carlos@rapidobh.com',
    mensagem: 'Olá, gostaria de saber se há suporte para roterização com restrição de horários (janela de tempo de entrega) na roterização quântica do plano Pro.',
    respondido: false,
    dataEnvio: '14/07/2026 09:30',
  },
  {
    id: 'MSG-002',
    nome: 'Sônia Abreu',
    email: 'sonia@mercadomail.com',
    mensagem: 'Como funciona o upgrade do plano Start para o Pro? O faturamento é proporcional aos dias restantes ou começa um novo ciclo?',
    respondido: true,
    dataEnvio: '13/07/2026 14:15',
  }
];

// Seed Helper: Checks and sets localStorage
export const initializeDatabase = () => {
  if (!localStorage.getItem(KEYS.USUARIOS)) {
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));
  }
  if (!localStorage.getItem(KEYS.CLIENTES)) {
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify(SEED_CLIENTES));
  }
  if (!localStorage.getItem(KEYS.COLABORADORES)) {
    localStorage.setItem(KEYS.COLABORADORES, JSON.stringify(SEED_COLABORADORES));
  }
  if (!localStorage.getItem(KEYS.VEICULOS)) {
    localStorage.setItem(KEYS.VEICULOS, JSON.stringify(SEED_VEICULOS));
  }
  if (!localStorage.getItem(KEYS.CONDUTORES)) {
    localStorage.setItem(KEYS.CONDUTORES, JSON.stringify(SEED_CONDUTORES));
  }
  if (!localStorage.getItem(KEYS.MENSAGENS)) {
    localStorage.setItem(KEYS.MENSAGENS, JSON.stringify(SEED_MENSAGENS));
  }
  if (!localStorage.getItem(KEYS.AUDITORIA)) {
    localStorage.setItem(KEYS.AUDITORIA, JSON.stringify(SEED_AUDITORIA));
  }
};

const getLoggedUserEmail = () => {
  return localStorage.getItem('logusq_session_email') || '';
};

const getLoggedUserPerfil = () => {
  const email = getLoggedUserEmail();
  if (!email) return '';
  const data = localStorage.getItem('logusq_logged_user');
  if (data) {
    try {
      const u = JSON.parse(data);
      return u.perfil || '';
    } catch(e) {}
  }
  return 'CLIENTE'; // default fallback
};

export const triggerPushSync = async (table: string, records: any[]) => {
  const email = getLoggedUserEmail();
  if (!email) return;
  const perfil = getLoggedUserPerfil();
  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, perfil, table, records })
    });
    if (!res.ok) console.warn('Erro ao sincronizar tabela ' + table + ' com o Supabase.');
  } catch(e) {
    console.warn('Conexão offline: sincronizando alterações localmente.');
  }
};

// Generic Repository Helper
export const dbRepo = {
  getUsuarios: (): any[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.USUARIOS) || '[]');
  },
  saveUsuarios: (usuarios: any[]) => {
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
    triggerPushSync('usuarios', usuarios);
  },
  
  getClientes: (): Cliente[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.CLIENTES) || '[]');
  },
  saveClientes: (clientes: Cliente[]) => {
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify(clientes));
    triggerPushSync('clientes', clientes);
  },
  
  getColaboradores: (): Colaborador[] => {
    initializeDatabase();
    const colabs = JSON.parse(localStorage.getItem(KEYS.COLABORADORES) || '[]');
    const users = dbRepo.getUsuarios();
    
    // Merge any 'COLABORADOR' user from users that is missing from colabs
    const colabUsers = users.filter(u => u.perfil === 'COLABORADOR');
    let updated = false;
    
    // Filter out any local colaboradores that no longer exist in the main users list
    const filteredColabs = colabs.filter((c: any) => 
      colabUsers.some(u => u.email.toLowerCase() === c.email.toLowerCase())
    );
    if (filteredColabs.length !== colabs.length) {
      colabs.length = 0;
      colabs.push(...filteredColabs);
      updated = true;
    }
    
    colabUsers.forEach(u => {
      if (!colabs.some((c: any) => c.email === u.email)) {
        colabs.push({
          idColaborador: `LOGUS-RH-${Date.now().toString().slice(-4)}`,
          nome: u.nome,
          cargo: 'Analista LogusQ',
          email: u.email,
          telefone: '',
          dataAdmissao: new Date().toLocaleDateString('pt-BR'),
          status: 'Ativo',
          nivelAcesso: u.nivelAcesso || 'PARCIAL',
          acessoSistema: true,
        });
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem(KEYS.COLABORADORES, JSON.stringify(colabs));
    }
    return colabs;
  },
  saveColaboradores: (colab: Colaborador[]) => {
    localStorage.setItem(KEYS.COLABORADORES, JSON.stringify(colab));
    triggerPushSync('colaboradores', colab);
  },
  
  getVeiculos: (): Veiculo[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.VEICULOS) || '[]');
  },
  saveVeiculos: (veiculos: Veiculo[]) => {
    localStorage.setItem(KEYS.VEICULOS, JSON.stringify(veiculos));
    triggerPushSync('veiculos', veiculos);
  },
  
  getCondutoresRaw: (): Condutor[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.CONDUTORES) || '[]');
  },
  saveCondutores: (condutores: Condutor[]) => {
    localStorage.setItem(KEYS.CONDUTORES, JSON.stringify(condutores));
    triggerPushSync('condutores', condutores);
  },
  
  getMensagens: (): MensagemSuporte[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.MENSAGENS) || '[]');
  },
  saveMensagens: (msgs: MensagemSuporte[]) => {
    localStorage.setItem(KEYS.MENSAGENS, JSON.stringify(msgs));
  },
  enviarMensagem: (nome: string, email: string, mensagem: string): MensagemSuporte => {
    const list = dbRepo.getMensagens();
    const nova: MensagemSuporte = {
      id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
      nome,
      email,
      mensagem,
      respondido: false,
      dataEnvio: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    list.unshift(nova);
    dbRepo.saveMensagens(list);
    return nova;
  },

  zerarBancoDados: () => {
    // 1. Clean up all keys starting with logusq_ or logusq_entregas_ from localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('logusq_') || key.startsWith('logusq_entregas_'))) {
        localStorage.removeItem(key);
      }
    }
    
    // 2. Insert only the core CEO Master user so we can still log in
    const cleanUsuarios = [
      {
        email: 'ceo@logusq.com.br',
        nome: 'Cosme Juliasse',
        perfil: 'MASTER' as const,
        nivelAcesso: 'TOTAL',
        criadoEm: '17/07/2026',
        senha_hash: '123456',
      }
    ];
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(cleanUsuarios));
    
    // 3. Keep empty arrays for others so they are initialized clean
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify([]));
    localStorage.setItem(KEYS.COLABORADORES, JSON.stringify([]));
    localStorage.setItem(KEYS.VEICULOS, JSON.stringify([]));
    localStorage.setItem(KEYS.CONDUTORES, JSON.stringify([]));
    localStorage.setItem(KEYS.MENSAGENS, JSON.stringify([]));
    localStorage.setItem(KEYS.AUDITORIA, JSON.stringify([]));
  },

  // High-Level Helper API
  getUsuario: (email: string): Usuario | undefined => {
    // If we have a logged-in user cache from Supabase, prioritize it to ensure no fallback mismatches
    const cachedData = localStorage.getItem('logusq_logged_user');
    if (cachedData) {
      try {
        const u = JSON.parse(cachedData);
        if (u.email === email) {
          return {
            email: u.email,
            nome: u.nome,
            perfil: u.perfil === 'CLIENT' || u.perfil === 'CLIENTE' ? 'CLIENTE' : u.perfil,
            empresa: u.empresa,
            nivelAcesso: u.nivelAcesso || u.nivel_acesso || 'TOTAL',
            veiculo: u.veiculo,
            criadoEm: u.criadoEm || u.criado_em || '19/07/2026'
          };
        }
      } catch (e) {}
    }

    const list = dbRepo.getUsuarios();
    const user = list.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      return {
        email: user.email,
        nome: user.nome,
        perfil: user.perfil === 'CLIENT' ? 'CLIENTE' : user.perfil,
        empresa: user.empresa,
        nivelAcesso: user.nivelAcesso,
        criadoEm: user.criadoEm
      };
    }

    // Check drivers (Condutores)
    const drivers = dbRepo.getCondutoresRaw();
    const driver = drivers.find(c => c.email === email);
    if (driver) {
      const clients = dbRepo.getClientes();
      const client = clients.find(cl => cl.email === (driver as any).clienteEmail);
      return {
        email: driver.email,
        nome: driver.nome,
        perfil: 'MOTORISTA',
        empresa: client ? client.empresa : 'LogiVelo Express S.A.',
        nivelAcesso: 'PARCIAL',
        criadoEm: '16/07/2026'
      };
    }
    return undefined;
  },

  autenticarUsuario: (email: string, senha_hash: string): Usuario | undefined => {
    const list = dbRepo.getUsuarios();
    const matched = list.find(u => u.email === email && u.senha_hash === senha_hash);
    if (matched) {
      return {
        email: matched.email,
        nome: matched.nome,
        perfil: matched.perfil === 'CLIENT' ? 'CLIENTE' : matched.perfil,
        empresa: matched.empresa,
        nivelAcesso: matched.nivelAcesso,
        criadoEm: matched.criadoEm
      };
    }

    // Check drivers (Condutores)
    const drivers = dbRepo.getCondutoresRaw();
    const matchedDriver = drivers.find(c => c.email === email && (c.senha === senha_hash || (c as any).senha_hash === senha_hash));
    if (matchedDriver) {
      const clients = dbRepo.getClientes();
      const client = clients.find(cl => cl.email === (matchedDriver as any).clienteEmail);
      return {
        email: matchedDriver.email,
        nome: matchedDriver.nome,
        perfil: 'MOTORISTA',
        empresa: client ? client.empresa : 'LogiVelo Express S.A.',
        nivelAcesso: 'PARCIAL',
        criadoEm: '16/07/2026'
      };
    }
    return undefined;
  },

  getTodosClientes: (): Cliente[] => {
    return dbRepo.getClientes();
  },

  getTodosColaboradores: (): Colaborador[] => {
    return dbRepo.getColaboradores();
  },

  getTodosMasters: (): Usuario[] => {
    const list = dbRepo.getUsuarios();
    return list.filter(u => u.perfil === 'MASTER');
  },

  getCliente: (email: string): Cliente | undefined => {
    const list = dbRepo.getClientes();
    return list.find(c => c.email === email);
  },

  getFrota: (email: string): Veiculo[] => {
    const list = dbRepo.getVeiculos();
    // Support filtering by owner/email, default to demo company for seed vehicles
    return list.filter(v => (v as any).clienteEmail === email || (!(v as any).clienteEmail && email === 'demo@logusq.com.br'));
  },

  getCondutores: (email: string): Condutor[] => {
    const list = dbRepo.getCondutoresRaw();
    return list.filter(c => (c as any).clienteEmail === email || (!(c as any).clienteEmail && email === 'demo@logusq.com.br'));
  },

  getEntregas: (email: string): Entrega[] => {
    const data = localStorage.getItem(`${KEYS.ENTREGAS}_${email}`);
    return data ? JSON.parse(data) : [];
  },

  cadastrarEntrega: (email: string, params: Partial<Entrega>) => {
    const list = dbRepo.getEntregas(email);
    const nova: Entrega = {
      id: `ENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      chave: params.chave || '',
      cliente: params.cliente || '',
      endereco: params.endereco || '',
      enderecoColeta: params.enderecoColeta || '',
      pontoReferencia: params.pontoReferencia || '',
      telefone: params.telefone || '',
      whatsapp: params.whatsapp || '',
      notaFiscal: params.notaFiscal || '',
      fotoComprovante: params.fotoComprovante || '',
      dataEntregue: params.dataEntregue || '',
      latitude: params.latitude !== undefined ? params.latitude : -19.93 + (Math.random() - 0.5) * 0.05, // simulated/real coordinates near BH
      longitude: params.longitude !== undefined ? params.longitude : -43.93 + (Math.random() - 0.5) * 0.05,
      pesoMercadoriaKg: params.pesoMercadoriaKg || 10,
      tipoOperacao: params.tipoOperacao || 'Entrega',
      status: params.status || 'Pendente',
      observacao: params.observacao
    };
    list.push(nova);
    localStorage.setItem(`${KEYS.ENTREGAS}_${email}`, JSON.stringify(list));
    triggerPushSync('entregas', list);
  },

  deletarEntrega: (email: string, chave: string) => {
    const list = dbRepo.getEntregas(email);
    const filtered = list.filter(e => e.chave !== chave);
    localStorage.setItem(`${KEYS.ENTREGAS}_${email}`, JSON.stringify(filtered));
    triggerPushSync('entregas', filtered);
  },

  getRotasAtivas: (email: string): Record<string, any> => {
    const data = localStorage.getItem(`logusq_rotas_ativas_${email}`);
    return data ? JSON.parse(data) : {};
  },

  saveRotasAtivas: (email: string, rotas: Record<string, any>) => {
    localStorage.setItem(`logusq_rotas_ativas_${email}`, JSON.stringify(rotas));
    triggerPushSync('rotas_ativas', [rotas]);
  },

  atualizarEntregaStatus: (clientEmail: string, entregaId: string, status: 'Pendente' | 'Entregue' | 'Cancelado', fotoComprovante?: string, observacao?: string, motoristaNome?: string) => {
    const list = dbRepo.getEntregas(clientEmail);
    const updated = list.map(ent => {
      if (ent.id === entregaId || ent.chave === entregaId) {
        return {
          ...ent,
          status,
          fotoComprovante: fotoComprovante !== undefined ? fotoComprovante : ent.fotoComprovante,
          observacao: observacao !== undefined ? observacao : ent.observacao,
          motoristaNome: motoristaNome !== undefined ? motoristaNome : ent.motoristaNome,
          dataEntregue: status === 'Entregue' ? new Date().toLocaleString('pt-BR') : ent.dataEntregue
        };
      }
      return ent;
    });
    localStorage.setItem(`${KEYS.ENTREGAS}_${clientEmail}`, JSON.stringify(updated));
    triggerPushSync('entregas', updated);

    // Also update this delivery in active routes so the manager dashboard updates in real-time
    const rotas = dbRepo.getRotasAtivas(clientEmail);
    let rotasChanged = false;
    Object.keys(rotas).forEach(rId => {
      const route = rotas[rId];
      if (route.path) {
        route.path = route.path.map((ent: any) => {
          if (ent.id === entregaId || ent.chave === entregaId) {
            rotasChanged = true;
            return {
              ...ent,
              status,
              fotoComprovante: fotoComprovante !== undefined ? fotoComprovante : ent.fotoComprovante,
              observacao: observacao !== undefined ? observacao : ent.observacao,
              motoristaNome: motoristaNome !== undefined ? motoristaNome : ent.motoristaNome,
              dataEntregue: status === 'Entregue' ? new Date().toLocaleString('pt-BR') : ent.dataEntregue
            };
          }
          return ent;
        });
      }
    });
    if (rotasChanged) {
      dbRepo.saveRotasAtivas(clientEmail, rotas);
    }
  },

  saveServiceTimeHistory: (clientEmail: string, destinationName: string, minutes: number) => {
    try {
      const key = `logusq_service_history_${clientEmail}`;
      const saved = localStorage.getItem(key);
      const history = saved ? JSON.parse(saved) : {};
      const cleanName = destinationName.trim();
      if (!history[cleanName]) {
        history[cleanName] = [];
      }
      history[cleanName].push(minutes);
      if (history[cleanName].length > 10) {
        history[cleanName].shift();
      }
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
      console.error("Error saving service time history:", e);
    }
  },

  getAverageServiceTime: (clientEmail: string, destinationName: string): number => {
    try {
      const key = `logusq_service_history_${clientEmail}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const history = JSON.parse(saved);
        const cleanName = destinationName.trim();
        const records = history[cleanName];
        if (records && records.length > 0) {
          const sum = records.reduce((acc: number, val: number) => acc + val, 0);
          return Math.round(sum / records.length);
        }
      }
    } catch (e) {}
    return 15;
  },

  getServiceTimeHistory: (clientEmail: string): Record<string, number[]> => {
    try {
      const key = `logusq_service_history_${clientEmail}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {}
    return {};
  },

  atualizarEntregaTiming: (clientEmail: string, entregaId: string, params: { tempoInicioAtendimento?: string; tempoFimAtendimento?: string; duracaoAtendimentoMinutos?: number }) => {
    const list = dbRepo.getEntregas(clientEmail);
    const updated = list.map(ent => {
      if (ent.id === entregaId || ent.chave === entregaId) {
        if (params.duracaoAtendimentoMinutos && ent.cliente) {
          dbRepo.saveServiceTimeHistory(clientEmail, ent.cliente, params.duracaoAtendimentoMinutos);
        }
        return {
          ...ent,
          ...params
        };
      }
      return ent;
    });
    localStorage.setItem(`${KEYS.ENTREGAS}_${clientEmail}`, JSON.stringify(updated));

    // Also update in active routes
    const rotas = dbRepo.getRotasAtivas(clientEmail);
    let rotasChanged = false;
    Object.keys(rotas).forEach(rId => {
      const route = rotas[rId];
      if (route.path) {
        route.path = route.path.map((ent: any) => {
          if (ent.id === entregaId || ent.chave === entregaId) {
            rotasChanged = true;
            if (params.duracaoAtendimentoMinutos && ent.cliente) {
              dbRepo.saveServiceTimeHistory(clientEmail, ent.cliente, params.duracaoAtendimentoMinutos);
            }
            return {
              ...ent,
              ...params
            };
          }
          return ent;
        });
      }
    });
    if (rotasChanged) {
      dbRepo.saveRotasAtivas(clientEmail, rotas);
    }
  },

  atualizarCondutorSenha: (email: string, novaSenha: string): boolean => {
    const list = dbRepo.getCondutoresRaw();
    const condutorIdx = list.findIndex(c => c.email === email);
    if (condutorIdx !== -1) {
      list[condutorIdx].senha = novaSenha;
      dbRepo.saveCondutores(list);
      return true;
    }
    return false;
  },

  atualizarUsuarioSenha: (email: string, novaSenha: string): boolean => {
    const list = dbRepo.getUsuarios();
    const idx = list.findIndex(u => u.email === email);
    if (idx !== -1) {
      list[idx].senha_hash = novaSenha;
      dbRepo.saveUsuarios(list);
      return true;
    }
    return false;
  },

  cadastrarClienteAuto: (params: any): Cliente => {
    const clientes = dbRepo.getClientes();
    const usuarios = dbRepo.getUsuarios();

    if (usuarios.some(u => u.email === params.email)) {
      throw new Error('Este e-mail de acesso já está cadastrado no sistema.');
    }

    const novoId = `LOGUS-CLI-${Date.now().toString().slice(-6)}`;
    const novoCli: Cliente = {
      idCliente: novoId,
      email: params.email,
      empresa: params.nomeEmpresa,
      cnpj: params.cnpj,
      telefoneFixo: params.telFixo,
      whatsapp: params.whatsapp,
      cep: params.cep,
      endereco: params.endereco,
      numero: params.numero,
      complemento: params.complemento,
      bairro: params.bairro,
      cidade: params.cidade,
      estado: params.estado,
      tipoUnidade: params.tipoUnidade || 'Matriz',
      plano: params.plano || 'Start',
      valorPlano: PLANOS_PADRAO[params.plano as keyof typeof PLANOS_PADRAO]?.valor || 499,
      status: 'Ativo',
      clienteDesde: params.clienteDesde || new Date().toLocaleDateString('pt-BR'),
      vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      respNome: params.respNome,
      respCpf: params.respCpf,
      respRg: params.respRg,
      respNascimento: params.respNascimento,
      respCargo: params.respCargo,
      respEmail: params.respEmail,
      respWhatsapp: params.respWhatsapp,
      respTelefone: params.respTelefone,
      respCep: params.respCep,
      respEndereco: params.respEndereco,
      respNumero: params.respNumero,
      respBairro: params.respBairro,
      respCidade: params.respCidade,
      respEstado: params.respEstado,
      pagamentoConfirmado: true,
    };

    const novoUser = {
      email: params.email,
      nome: params.respNome,
      perfil: 'CLIENTE' as any,
      empresa: params.nomeEmpresa,
      nivelAcesso: 'TOTAL',
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      senha_hash: params.senhaProvisoria || 'LogusQ@123'
    };

    clientes.push(novoCli);
    usuarios.push(novoUser);

    dbRepo.saveClientes(clientes);
    dbRepo.saveUsuarios(usuarios);

    return novoCli;
  },

  editarCliente: (oldEmail: string, params: Partial<Cliente>, novaSenha?: string) => {
    const list = dbRepo.getClientes();
    const updated = list.map(c => {
      if (c.email === oldEmail) {
        return { ...c, ...params };
      }
      return c;
    });
    dbRepo.saveClientes(updated);

    // Update user credentials as well
    const usuarios = dbRepo.getUsuarios();
    const userUpdated = usuarios.map(u => {
      if (u.email === oldEmail) {
        const uCopy = { ...u };
        if (params.email) uCopy.email = params.email;
        if (novaSenha) uCopy.senha_hash = novaSenha;
        if (params.respNome) uCopy.nome = params.respNome;
        if (params.empresa) uCopy.empresa = params.empresa;
        return uCopy;
      }
      return u;
    });
    dbRepo.saveUsuarios(userUpdated);

    // Also update vehicles & drivers if the email changed
    if (params.email && params.email !== oldEmail) {
      const veiculos = dbRepo.getVeiculos();
      const veiculosUpdated = veiculos.map(v => {
        if ((v as any).clienteEmail === oldEmail) {
          return { ...v, clienteEmail: params.email };
        }
        return v;
      });
      dbRepo.saveVeiculos(veiculosUpdated);

      const condutores = dbRepo.getCondutoresRaw();
      const condutoresUpdated = condutores.map(c => {
        if ((c as any).clienteEmail === oldEmail) {
          return { ...c, clienteEmail: params.email };
        }
        return c;
      });
      dbRepo.saveCondutores(condutoresUpdated);
    }
  },

  deletarCliente: (email: string, operatorEmail?: string, operatorName?: string) => {
    const list = dbRepo.getClientes();
    const clientToDelete = list.find(c => c.email === email);
    const companyName = clientToDelete ? clientToDelete.empresa : email;
    const cnpj = clientToDelete ? clientToDelete.cnpj : 'N/D';

    const filtered = list.filter(c => c.email !== email);
    dbRepo.saveClientes(filtered);

    const usuarios = dbRepo.getUsuarios();
    const userFiltered = usuarios.filter(u => u.email !== email);
    dbRepo.saveUsuarios(userFiltered);

    if (operatorEmail) {
      dbRepo.registrarLog(
        operatorEmail,
        operatorName || 'Operador',
        'Exclusão de Cliente',
        `Excluiu o cliente "${companyName}" (CNPJ: ${cnpj}) do banco de dados de clientes.`,
        'Clientes',
        'Sucesso',
        JSON.stringify({ email, empresa: companyName })
      );
    }
  },

  cadastrarVeiculo: (email: string, params: Partial<Veiculo>) => {
    const list = dbRepo.getVeiculos();
    const novo: Veiculo = {
      id: `V-${Date.now()}`,
      idVeiculo: params.idVeiculo || '',
      placa: params.placa || '',
      modelo: params.modelo || '',
      fabricante: params.fabricante || '',
      anoFabricacao: params.anoFabricacao || '',
      anoModelo: params.anoFabricacao || '',
      cor: params.cor || 'Branco',
      tipo: params.tipo || 'Carro Leve',
      capacidadeKg: params.capacidadeKg || 500,
      status: 'Disponivel',
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
    };
    (novo as any).clienteEmail = email;
    list.push(novo);
    dbRepo.saveVeiculos(list);
  },

  editarVeiculo: (email: string, idVeiculo: string, params: Partial<Veiculo>) => {
    const list = dbRepo.getVeiculos();
    const updated = list.map(v => {
      if (v.idVeiculo === idVeiculo && ((v as any).clienteEmail === email || (!(v as any).clienteEmail && email === 'demo@logusq.com.br'))) {
        return { ...v, ...params };
      }
      return v;
    });
    dbRepo.saveVeiculos(updated);
  },

  cadastrarCondutor: (email: string, params: Partial<Condutor>) => {
    const list = dbRepo.getCondutoresRaw();
    const vehicles = dbRepo.getVeiculos().filter(v => 
      (v as any).clienteEmail === email || (!(v as any).clienteEmail && email === 'demo@logusq.com.br')
    );

    const findMatchingVehicle = (vInput: string) => {
      if (!vInput || vInput === '-') return null;
      const cleanInput = vInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Try exact ID match
      let match = vehicles.find(v => v.idVeiculo.trim().toUpperCase() === vInput.trim().toUpperCase());
      if (match) return match;
      
      // Try exact Placa match
      match = vehicles.find(v => v.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanInput);
      if (match) return match;
      
      // Try contains match
      match = vehicles.find(v => 
        v.idVeiculo.trim().toUpperCase().includes(vInput.trim().toUpperCase()) ||
        vInput.trim().toUpperCase().includes(v.idVeiculo.trim().toUpperCase())
      );
      if (match) return match;

      return null;
    };

    const inputVeiculo = params.veiculo || '';
    const inputPlaca = params.placaVeiculo || '';
    
    let finalVeiculo = inputVeiculo || '-';
    let finalPlaca = inputPlaca || '';
    
    const matched = findMatchingVehicle(inputVeiculo) || findMatchingVehicle(inputPlaca);
    if (matched) {
      finalVeiculo = matched.idVeiculo;
      finalPlaca = matched.placa;
    }

    const novo: Condutor = {
      id: `D-${Date.now()}`,
      nome: params.nome || '',
      cpf: params.cpf || '',
      rg: params.rg,
      nascimento: params.nascimento,
      cnh: params.cnh || '',
      categoriaCnh: params.categoriaCnh || 'B',
      vencCnh: params.vencCnh || '',
      telefone: params.telefone || '',
      email: params.email || '',
      veiculo: finalVeiculo,
      placaVeiculo: finalPlaca,
      senha: params.senha || '',
      status: params.status || 'Ativo'
    };
    (novo as any).clienteEmail = email;
    list.push(novo);
    dbRepo.saveCondutores(list);
  },

  editarCondutor: (email: string, condutorEmail: string, params: Partial<Condutor>) => {
    const list = dbRepo.getCondutoresRaw();
    const vehicles = dbRepo.getVeiculos().filter(v => 
      (v as any).clienteEmail === email || (!(v as any).clienteEmail && email === 'demo@logusq.com.br')
    );

    const findMatchingVehicle = (vInput: string) => {
      if (!vInput || vInput === '-') return null;
      const cleanInput = vInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      let match = vehicles.find(v => v.idVeiculo.trim().toUpperCase() === vInput.trim().toUpperCase());
      if (match) return match;
      
      match = vehicles.find(v => v.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanInput);
      if (match) return match;
      
      match = vehicles.find(v => 
        v.idVeiculo.trim().toUpperCase().includes(vInput.trim().toUpperCase()) ||
        vInput.trim().toUpperCase().includes(v.idVeiculo.trim().toUpperCase())
      );
      if (match) return match;

      return null;
    };

    const updated = list.map(c => {
      if (c.email === condutorEmail && ((c as any).clienteEmail === email || (!(c as any).clienteEmail && email === 'demo@logusq.com.br'))) {
        let finalVeiculo = params.veiculo !== undefined ? params.veiculo : c.veiculo;
        let finalPlaca = params.placaVeiculo !== undefined ? params.placaVeiculo : c.placaVeiculo;

        if (params.veiculo !== undefined || params.placaVeiculo !== undefined) {
          const inputVeiculo = params.veiculo || '';
          const inputPlaca = params.placaVeiculo || '';
          const matched = findMatchingVehicle(inputVeiculo) || findMatchingVehicle(inputPlaca);
          if (matched) {
            finalVeiculo = matched.idVeiculo;
            finalPlaca = matched.placa;
          } else {
            if (params.veiculo !== undefined) finalVeiculo = params.veiculo;
            if (params.placaVeiculo !== undefined) finalPlaca = params.placaVeiculo;
          }
        }

        return { 
          ...c, 
          ...params,
          veiculo: finalVeiculo,
          placaVeiculo: finalPlaca
        };
      }
      return c;
    });
    dbRepo.saveCondutores(updated);
  },

  vincularVeiculoCondutor: (email: string, driverEmail: string, idVeiculo: string) => {
    const list = dbRepo.getCondutoresRaw();
    const vehicles = dbRepo.getVeiculos().filter(v => 
      (v as any).clienteEmail === email || (!(v as any).clienteEmail && email === 'demo@logusq.com.br')
    );
    const matchedVeh = vehicles.find(v => v.idVeiculo === idVeiculo);
    const updated = list.map(c => {
      if (c.email === driverEmail && ((c as any).clienteEmail === email || (!(c as any).clienteEmail && email === 'demo@logusq.com.br'))) {
        return { 
          ...c, 
          veiculo: idVeiculo,
          placaVeiculo: matchedVeh ? matchedVeh.placa : ''
        };
      }
      return c;
    });
    dbRepo.saveCondutores(updated);
  },

  deletarVeiculo: (email: string, idVeiculo: string) => {
    const list = dbRepo.getVeiculos();
    const filtered = list.filter(v => !(v.idVeiculo === idVeiculo && ((v as any).clienteEmail === email || (!(v as any).clienteEmail && email === 'demo@logusq.com.br'))));
    dbRepo.saveVeiculos(filtered);
  },

  deletarCondutor: (email: string, condutorEmail: string) => {
    const list = dbRepo.getCondutoresRaw();
    const filtered = list.filter(c => !(c.email === condutorEmail && ((c as any).clienteEmail === email || (!(c as any).clienteEmail && email === 'demo@logusq.com.br'))));
    dbRepo.saveCondutores(filtered);
  },

  cadastrarColaborador: (params: any) => {
    const colaboradores = dbRepo.getColaboradores();
    const usuarios = dbRepo.getUsuarios();

    const novoId = `LOGUS-RH-${Date.now().toString().slice(-4)}`;
    const novoCol: Colaborador = {
      idColaborador: novoId,
      nome: params.nome,
      cargo: params.cargo || 'Analista LogusQ',
      telefone: params.telefone,
      email: params.email,
      cpf: params.cpf || '',
      rg: params.rg || '',
      regime: params.regime || 'CLT',
      cep: params.cep || '',
      endereco: params.endereco || '',
      numero: params.numero || '',
      complemento: params.complemento || '',
      bairro: params.bairro || '',
      cidade: params.cidade || '',
      estado: params.estado || '',
      dataAdmissao: new Date().toLocaleDateString('pt-BR'),
      status: 'Ativo',
      nivelAcesso: params.nivelAcesso || 'Total',
      acessoSistema: true,
    };

    const novoUser = {
      email: params.email,
      nome: params.nome,
      perfil: 'COLABORADOR' as any,
      nivelAcesso: params.nivelAcesso || 'TOTAL',
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      senha_hash: params.senhaProvisoria || 'ColabLogusQ@123'
    };

    colaboradores.push(novoCol);
    usuarios.push(novoUser);

    dbRepo.saveColaboradores(colaboradores);
    dbRepo.saveUsuarios(usuarios);
  },

  deletarColaborador: (id: string) => {
    const colaboradores = dbRepo.getColaboradores();
    const target = colaboradores.find(c => c.idColaborador === id);
    const filtered = colaboradores.filter(c => c.idColaborador !== id);
    dbRepo.saveColaboradores(filtered);

    if (target) {
      const usuarios = dbRepo.getUsuarios();
      const filteredUsers = usuarios.filter(u => u.email.toLowerCase() !== target.email.toLowerCase());
      dbRepo.saveUsuarios(filteredUsers);
    }
  },

  editarColaborador: (idColaborador: string, params: Partial<Colaborador>, novaSenha?: string) => {
    const list = dbRepo.getColaboradores();
    const oldCol = list.find(c => c.idColaborador === idColaborador);
    if (!oldCol) return;

    const oldEmail = oldCol.email;

    const updated = list.map(c => {
      if (c.idColaborador === idColaborador) {
        return { ...c, ...params };
      }
      return c;
    });
    dbRepo.saveColaboradores(updated);

    const usuarios = dbRepo.getUsuarios();
    const userUpdated = usuarios.map(u => {
      if (u.email.toLowerCase() === oldEmail.toLowerCase()) {
        const uCopy = { ...u };
        if (params.email) uCopy.email = params.email;
        if (novaSenha) uCopy.senha_hash = novaSenha;
        if (params.nome) uCopy.nome = params.nome;
        if (params.nivelAcesso) uCopy.nivelAcesso = params.nivelAcesso;
        return uCopy;
      }
      return u;
    });
    dbRepo.saveUsuarios(userUpdated);
  },

  getSenhaUsuario: (email: string): string => {
    const list = dbRepo.getUsuarios();
    const user = list.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? user.senha_hash : '';
  },

  salvarPlano: (nome: string, descricao: string, valor: number, maxVeiculos: number) => {
    // Save to list of plans in localStorage
    const planos = dbRepo.getPlanosList();
    const existingIdx = planos.findIndex(p => p.nome === nome);
    const novo = { nome, descricao, valor, maxVeiculos };
    if (existingIdx !== -1) {
      planos[existingIdx] = novo;
    } else {
      planos.push(novo);
    }
    localStorage.setItem('logusq_custom_planos', JSON.stringify(planos));
  },

  getPlanosList: (): Plano[] => {
    const custom = localStorage.getItem('logusq_custom_planos');
    if (custom) return JSON.parse(custom);
    return PLANOS;
  },

  getPlanos: (): Record<string, Plano> => {
    const list = dbRepo.getPlanosList();
    const map: Record<string, Plano> = {};
    list.forEach(p => {
      map[p.nome] = p;
    });
    return map;
  },

  getLogs: (): AuditLog[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.AUDITORIA) || '[]');
  },

  saveLogs: (logs: AuditLog[]) => {
    localStorage.setItem(KEYS.AUDITORIA, JSON.stringify(logs));
    triggerPushSync('auditoria_logs', logs);
  },

  registrarLog: (
    operadorEmail: string,
    operadorNome: string,
    acao: string,
    descricao: string,
    modulo: 'Clientes' | 'RH' | 'Financeiro' | 'Geral',
    status: 'Sucesso' | 'Erro' = 'Sucesso',
    detalhes?: string
  ) => {
    const logs = dbRepo.getLogs();
    const colaboradores = dbRepo.getColaboradores();
    const colab = colaboradores.find(c => c.email === operadorEmail);
    const cargo = colab ? colab.cargo : (operadorEmail === 'ceo@logusq.com.br' ? 'CEO Master' : 'Gestor Cliente');
    
    const novo: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dataHora: new Date().toLocaleString('pt-BR'),
      operadorEmail,
      operadorNome,
      operadorCargo: cargo,
      acao,
      descricao,
      modulo,
      status,
      detalhes
    };
    logs.unshift(novo);
    dbRepo.saveLogs(logs);
  },

  limparLogs: () => {
    dbRepo.saveLogs([]);
  }
};
