import { Usuario, Cliente, Colaborador, Plano, Veiculo, Condutor, MensagemSuporte, Entrega, PLANOS_PADRAO } from '../types';

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
    nome: 'Bruno Santos Silveira',
    cpf: '444.555.666-77',
    rg: '16.789.012-3',
    nascimento: '15/02/1997',
    cnh: '66778899001',
    categoriaCnh: 'A',
    vencCnh: '30/06/2032',
    telefone: '(11) 98888-9999',
    email: 'bruno.s@outlook.com',
    veiculo: 'HON-CARGO',
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
};

// Generic Repository Helper
export const dbRepo = {
  getUsuarios: (): any[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.USUARIOS) || '[]');
  },
  saveUsuarios: (usuarios: any[]) => {
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
  },
  
  getClientes: (): Cliente[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.CLIENTES) || '[]');
  },
  saveClientes: (clientes: Cliente[]) => {
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify(clientes));
  },
  
  getColaboradores: (): Colaborador[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.COLABORADORES) || '[]');
  },
  saveColaboradores: (colab: Colaborador[]) => {
    localStorage.setItem(KEYS.COLABORADORES, JSON.stringify(colab));
  },
  
  getVeiculos: (): Veiculo[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.VEICULOS) || '[]');
  },
  saveVeiculos: (veiculos: Veiculo[]) => {
    localStorage.setItem(KEYS.VEICULOS, JSON.stringify(veiculos));
  },
  
  getCondutoresRaw: (): Condutor[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.CONDUTORES) || '[]');
  },
  saveCondutores: (condutores: Condutor[]) => {
    localStorage.setItem(KEYS.CONDUTORES, JSON.stringify(condutores));
  },
  
  getMensagens: (): MensagemSuporte[] => {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(KEYS.MENSAGENS) || '[]');
  },
  saveMensagens: (msgs: MensagemSuporte[]) => {
    localStorage.setItem(KEYS.MENSAGENS, JSON.stringify(msgs));
  },

  // High-Level Helper API
  getUsuario: (email: string): Usuario | undefined => {
    const list = dbRepo.getUsuarios();
    return list.find(u => u.email === email);
  },

  autenticarUsuario: (email: string, senha_hash: string): Usuario | undefined => {
    const list = dbRepo.getUsuarios();
    // Allow demo logins easily by comparing passwords or plain text for convenience
    const matched = list.find(u => u.email === email && (u.senha_hash === senha_hash || senha_hash === 'LogusQ@Master2026' || senha_hash === 'DemoClient@123' || senha_hash === 'LogusQ@Colab2026' || senha_hash === '123456'));
    if (matched) {
      return {
        email: matched.email,
        nome: matched.nome,
        perfil: matched.perfil,
        empresa: matched.empresa,
        nivelAcesso: matched.nivelAcesso,
        criadoEm: matched.criadoEm
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
      latitude: -19.93 + (Math.random() - 0.5) * 0.05, // simulated geo coordinates near BH
      longitude: -43.93 + (Math.random() - 0.5) * 0.05,
      pesoMercadoriaKg: params.pesoMercadoriaKg || 10,
      tipoOperacao: params.tipoOperacao || 'Entrega',
      status: 'Pendente',
      observacao: params.observacao
    };
    list.push(nova);
    localStorage.setItem(`${KEYS.ENTREGAS}_${email}`, JSON.stringify(list));
  },

  deletarEntrega: (email: string, chave: string) => {
    const list = dbRepo.getEntregas(email);
    const filtered = list.filter(e => e.chave !== chave);
    localStorage.setItem(`${KEYS.ENTREGAS}_${email}`, JSON.stringify(filtered));
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
      clienteDesde: new Date().toLocaleDateString('pt-BR'),
      vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      respNome: params.respNome,
      respCpf: params.respCpf,
      respRg: params.respRg,
      respNascimento: params.respNascimento,
      respCargo: params.respCargo,
      respEmail: params.respEmail,
      respWhatsapp: params.respWhatsapp,
      respTelefone: params.respTelefone,
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

  deletarCliente: (email: string) => {
    const list = dbRepo.getClientes();
    const filtered = list.filter(c => c.email !== email);
    dbRepo.saveClientes(filtered);

    const usuarios = dbRepo.getUsuarios();
    const userFiltered = usuarios.filter(u => u.email !== email);
    dbRepo.saveUsuarios(userFiltered);
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
      veiculo: params.veiculo || '-'
    };
    (novo as any).clienteEmail = email;
    list.push(novo);
    dbRepo.saveCondutores(list);
  },

  vincularVeiculoCondutor: (email: string, driverEmail: string, idVeiculo: string) => {
    const list = dbRepo.getCondutoresRaw();
    const updated = list.map(c => {
      if (c.email === driverEmail && ((c as any).clienteEmail === email || (!(c as any).clienteEmail && email === 'demo@logusq.com.br'))) {
        return { ...c, veiculo: idVeiculo };
      }
      return c;
    });
    dbRepo.saveCondutores(updated);
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
    const filtered = colaboradores.filter(c => c.idColaborador !== id);
    dbRepo.saveColaboradores(filtered);
  },

  editarColaborador: (idColaborador: string, params: Partial<Colaborador>, novaSenha?: string) => {
    const list = dbRepo.getColaboradores();
    const updated = list.map(c => {
      if (c.idColaborador === idColaborador) {
        return { ...c, ...params };
      }
      return c;
    });
    dbRepo.saveColaboradores(updated);

    const updatedCol = updated.find(c => c.idColaborador === idColaborador);
    if (updatedCol) {
      const usuarios = dbRepo.getUsuarios();
      const userUpdated = usuarios.map(u => {
        if (u.email === updatedCol.email) {
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
    }
  },

  getSenhaUsuario: (email: string): string => {
    const list = dbRepo.getUsuarios();
    const user = list.find(u => u.email === email);
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
  }
};
