export type PerfilUsuario = 'MASTER' | 'CLIENT' | 'CLIENTE' | 'COLABORADOR' | 'MOTORISTA';

export interface Usuario {
  email: string;
  nome: string;
  perfil: PerfilUsuario;
  empresa?: string;
  veiculo?: string;
  nivelAcesso?: string; // e.g., 'TOTAL', 'LIMITADO'
  criadoEm: string;
}

export interface RegistroPagamento {
  id: string;
  mesReferencia: string;
  vencimento: string;
  valor: number;
  plano: string;
  status: 'Pago' | 'Pendente';
  dataPagamento?: string;
  metodo?: string;
}

export interface Cliente {
  idCliente: string;
  email: string;
  empresa: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  telefoneFixo?: string;
  whatsapp?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  tipoUnidade?: 'Matriz' | 'Filial';
  cdLatitude?: number;
  cdLongitude?: number;
  plano: 'POC' | 'Start' | 'Pro' | 'Enterprise';
  valorPlano: number;
  status: 'Ativo' | 'Bloqueado' | 'Cancelado';
  clienteDesde: string;
  vencimento: string;
  obs?: string;
  respNome: string;
  respCpf?: string;
  respRg?: string;
  respNascimento?: string;
  respCargo?: string;
  respEmail?: string;
  respWhatsapp?: string;
  respTelefone?: string;
  respCep?: string;
  respEndereco?: string;
  respNumero?: string;
  respBairro?: string;
  respCidade?: string;
  respEstado?: string;
  pagamentoConfirmado: boolean;
  dataUltimoPagamento?: string;
  historicoPagamentos?: RegistroPagamento[];
}

export interface Colaborador {
  idColaborador: string;
  nome: string;
  cargo: string;
  telefone?: string;
  whatsapp?: string;
  email: string;
  dataAdmissao: string;
  status: 'Ativo' | 'Inativo';
  cpf?: string;
  rg?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  nivelAcesso: string;
  acessoSistema: boolean;
  regime?: 'CLT' | 'PJ' | 'Jovem Aprendiz' | 'Estágio' | 'Trainee' | 'Temporário';
  salarioBase?: number;
}

export interface AuditLog {
  id: string;
  dataHora: string;
  operadorEmail: string;
  operadorNome: string;
  operadorCargo?: string;
  acao: string;
  descricao: string;
  modulo: 'Clientes' | 'RH' | 'Financeiro' | 'Geral';
  status: 'Sucesso' | 'Erro';
  detalhes?: string;
}

export interface Plano {
  nome: string;
  descricao: string;
  valor: number;
  maxVeiculos: number;
}

export type TipoVeiculo = 'Carro Leve' | 'Picape 4x4' | 'Van' | 'Caminhão Pesado' | 'Motocicleta';
export type TipoCombustivel = 'Gasolina' | 'Etanol' | 'Flex' | 'Diesel' | 'Elétrico' | 'GNV';

export interface Veiculo {
  id: string;
  idVeiculo: string;
  placa: string;
  modelo: string;
  fabricante: string;
  anoFabricacao: string;
  anoModelo: string;
  cor: string;
  renavam?: string;
  chassi?: string;
  tipo: TipoVeiculo;
  tipoCombustivel?: TipoCombustivel;
  capacidadeKg: number;
  status: 'Disponivel' | 'Manutencao' | 'Inativo';
  defeito?: string;
  dataInatividade?: string;
  dataCadastro: string;
  dataEntradaManutencao?: string;
  dataRetornoManutencao?: string;
  observacao?: string;
}

export interface Condutor {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  nascimento?: string;
  cnh: string;
  categoriaCnh: string;
  vencCnh: string;
  telefone: string;
  email: string;
  veiculo: string; // ID of the vehicle assigned
  placaVeiculo?: string; // PLACA DO VEICULO VINCULADO
  senha?: string;
  status?: 'Ativo' | 'Afastado' | 'Férias' | 'Licença' | 'Desligado' | 'Inativo';
}

export interface Entrega {
  id: string;
  chave: string;
  cliente: string;
  endereco: string;
  enderecoColeta?: string;
  pontoReferencia?: string;
  telefone?: string;
  whatsapp?: string;
  notaFiscal?: string;
  fotoComprovante?: string;
  dataEntregue?: string;
  latitude: number;
  longitude: number;
  pesoMercadoriaKg: number;
  tipoOperacao: 'Entrega' | 'Coleta';
  status: 'Pendente' | 'Entregue' | 'Cancelado';
  observacao?: string;
  motoristaNome?: string;
  tempoInicioAtendimento?: string;
  tempoFimAtendimento?: string;
  duracaoAtendimentoMinutos?: number;
}

export interface RotaAtiva {
  id: string;
  idVeiculo: string;
  dadosRota: string; // JSON string of points
  statusRota: 'ativa' | 'concluida' | 'cancelada';
  criadoEm: string;
}

export interface MensagemSuporte {
  id: string;
  nome: string;
  email: string;
  mensagem: string;
  respondido: boolean;
  dataEnvio: string;
}

export type PlanosSaaS = 'POC' | 'Start' | 'Pro' | 'Enterprise';

export const PLANOS_PADRAO: Record<PlanosSaaS, { descricao: string; valor: number; max_veiculos: number }> = {
  POC: { descricao: 'Até 5 veículos - validação gratuita', valor: 0, max_veiculos: 5 },
  Start: { descricao: 'Até 15 veículos + roterização básica', valor: 499, max_veiculos: 15 },
  Pro: { descricao: 'Até 40 veículos + injeção contínua + suporte', valor: 999, max_veiculos: 40 },
  Enterprise: { descricao: 'Ilimitado + API + suporte dedicado 24h', valor: 1799, max_veiculos: 9999 },
};
