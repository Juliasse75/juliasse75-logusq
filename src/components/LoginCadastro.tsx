import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { PlanosSaaS, PLANOS_PADRAO } from '../types';
import { Shield, Key, Truck, Building, FileText, CheckCircle, Download, HelpCircle, Smartphone, ArrowLeft, AlertCircle, User, Check, Lock, Info, Zap, Send, MessageSquare, Globe, Briefcase, DollarSign, Users, Mail, Phone, Settings, ShieldCheck, Heart } from 'lucide-react';

interface LoginCadastroProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginCadastro({ onLoginSuccess }: LoginCadastroProps) {
  const [viewMode, setViewMode] = useState<'landing' | 'auth'>('landing');
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro' | 'motorista'>('login');

  // Interactive Multichannel Fale Conosco Support Center States
  const [supportTab, setSupportTab] = useState<'ti' | 'financeiro' | 'adm' | 'ceo'>('ti');
  const [supportSuccess, setSupportSuccess] = useState('');
  
  // 1. TI Support States
  const [tiEmail, setTiEmail] = useState('');
  const [tiErrorType, setTiErrorType] = useState('Bugs e Instabilidade');
  const [tiDesc, setTiDesc] = useState('');
  const [tiUrgency, setTiUrgency] = useState('Média');

  // 2. Financeiro States
  const [finEmail, setFinEmail] = useState('');
  const [finCnpj, setFinCnpj] = useState('');
  const [finDesc, setFinDesc] = useState('Solicitação de segunda via de boleto/fatura');

  // 3. Administrativo/Comercial States
  const [admNome, setAdmNome] = useState('');
  const [admEmpresa, setAdmEmpresa] = useState('');
  const [admTel, setAdmTel] = useState('');
  const [admDesc, setAdmDesc] = useState('');

  // 4. Ouvidoria / CEO States
  const [ceoNome, setCeoNome] = useState('');
  const [ceoContact, setCeoContact] = useState('');
  const [ceoMessage, setCeoMessage] = useState('');

  // Driver Portal Mobile States
  const [motCpf, setMotCpf] = useState('');
  const [motSenha, setMotSenha] = useState('');
  const [motError, setMotError] = useState('');
  const [motSuccess, setMotSuccess] = useState('');
  const [motStep, setMotStep] = useState<'login' | 'primeiro_acesso' | 'cadastro' | 'sucesso'>('login');
  
  // Primeiro Acesso
  const [primeiroCpf, setPrimeiroCpf] = useState('');
  const [foundMot, setFoundMot] = useState<any | null>(null);
  
  // Registration Form
  const [motConfirmEmail, setMotConfirmEmail] = useState('');
  const [motNewSenha, setMotNewSenha] = useState('');
  const [motConfirmSenha, setMotConfirmSenha] = useState('');
  const [motTermosAceitos, setMotTermosAceitos] = useState(false);
  const [showMotTermos, setShowMotTermos] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginError, setLoginError] = useState('');

  // Cadastro State
  const [selectedPlano, setSelectedPlano] = useState<keyof PlanosSaaS>('Start');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telFixo, setTelFixo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('MG');
  const [tipoUnidade, setTipoUnidade] = useState<'Matriz' | 'Filial'>('Matriz');

  // Responsável
  const [respNome, setRespNome] = useState('');
  const [respCargo, setRespCargo] = useState('');
  const [respCpf, setRespCpf] = useState('');
  const [respRg, setRespRg] = useState('');
  const [respNasc, setRespNasc] = useState('');
  const [respEmail, setRespEmail] = useState('');
  const [respZap, setRespZap] = useState('');
  const [respTel, setRespTel] = useState('');
  const [mesmoEndereco, setMesmoEndereco] = useState(true);

  // Endereço Responsável se diferente
  const [respCep, setRespCep] = useState('');
  const [respEnd, setRespEnd] = useState('');
  const [respNum, setRespNum] = useState('');
  const [respComp, setRespComp] = useState('');
  const [respBairro, setRespBairro] = useState('');
  const [respCidade, setRespCidade] = useState('');
  const [respEstado, setRespEstado] = useState('MG');

  const [senhaProvisoria, setSenhaProvisoria] = useState('LogusQ@123');
  const [cadastroSucesso, setCadastroSucesso] = useState<any>(null);
  const [cadastroError, setCadastroError] = useState('');

  const handleCEPChange = async (val: string, target: 'empresa' | 'responsavel') => {
    const limpo = val.replace(/\D/g, '').slice(0, 8);
    if (target === 'empresa') {
      setCep(limpo);
      if (limpo.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
          if (res.ok) {
            const data = await res.json();
            if (!data.erro) {
              setEndereco(data.logradouro || '');
              setBairro(data.bairro || '');
              setCidade(data.localidade || '');
              setEstado(data.uf || 'MG');
            }
          }
        } catch (e) {
          console.error('Erro ao buscar o CEP:', e);
        }
      }
    } else {
      setRespCep(limpo);
      if (limpo.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
          if (res.ok) {
            const data = await res.json();
            if (!data.erro) {
              setRespEnd(data.logradouro || '');
              setRespBairro(data.bairro || '');
              setRespCidade(data.localidade || '');
              setRespEstado(data.uf || 'MG');
            }
          }
        } catch (e) {
          console.error('Erro ao buscar o CEP:', e);
        }
      }
    }
  };

  const validateStrongPasswordClient = (pass: string) => {
    if (pass.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
    if (!/[a-z]/.test(pass)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
    if (!/[0-9]/.test(pass)) return 'A senha deve conter pelo menos um número (0-9).';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).';
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha })
      });
      
      const data = await response.json();
      if (response.ok) {
        // Logged in with Supabase successfully
        localStorage.setItem('logusq_logged_user', JSON.stringify(data.user));
        onLoginSuccess(data.user.email);
      } else {
        setLoginError(data.message || 'E-mail ou senha inválidos. Verifique suas credenciais.');
      }
    } catch (err) {
      console.error('Erro de rede ao fazer login:', err);
      setLoginError('Não foi possível se conectar ao servidor de banco de dados. Verifique sua conexão de rede ou chaves do Supabase.');
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadastroError('');
    
    if (!nomeEmpresa || !cnpj || !respEmail || !respNome) {
      setCadastroError('Por favor, preencha todos os campos obrigatórios (Razão Social, CNPJ, E-mail do Responsável e Nome).');
      return;
    }

    const pwdErr = validateStrongPasswordClient(senhaProvisoria);
    if (pwdErr) {
      setCadastroError(pwdErr);
      return;
    }

    try {
      // Call secure API to save in Supabase
      const registerData = {
        nome: respNome,
        email: respEmail,
        senha: senhaProvisoria,
        perfil: 'CLIENTE',
        empresa: nomeEmpresa,
        cnpj,
        plano: selectedPlano,
        respNome
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Erro ao registrar no servidor.');
      }

      // Sync local database copy as well (offline fallback)
      const resp = dbRepo.cadastrarClienteAuto({
        nomeEmpresa,
        email: respEmail,
        cnpj,
        telFixo,
        whatsapp,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        tipoUnidade,
        plano: selectedPlano,
        senhaProvisoria,
        respNome,
        respCpf,
        respRg,
        respNascimento: respNasc,
        respCargo,
        respEmail,
        respWhatsapp: respZap,
        respTelefone: respTel,
        respMesmoEnd: mesmoEndereco ? 1 : 0,
        respCep: mesmoEndereco ? cep : respCep,
        respEndereco: mesmoEndereco ? endereco : respEnd,
        respNumero: mesmoEndereco ? numero : respNum,
        respComplemento: mesmoEndereco ? complemento : respComp,
        respBairro: mesmoEndereco ? bairro : respBairro,
        respCidade: mesmoEndereco ? cidade : respCidade,
        respEstado: mesmoEndereco ? estado : respEstado,
      });

      setCadastroSucesso({
        id_cliente: resp.idCliente,
        empresa: nomeEmpresa,
        email: respEmail,
        senha: senhaProvisoria,
        plano: selectedPlano,
        valor: PLANOS_PADRAO[selectedPlano].valor
      });

      // Clear form
      setNomeEmpresa('');
      setCnpj('');
      setRespEmail('');
    } catch (err: any) {
      setCadastroError(err.message || 'Erro ao realizar o cadastro.');
    }
  };

  // Generate simple text-based contract draft
  const gerarContratoTexto = (dados: any) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    return `CONTRATO DE ADESÃO DE SERVIÇOS SAAS - LOGUSQ LOGÍSTICA

CONTRATANTE:
Razão Social / Nome da Empresa: ${dados.empresa || '[EMPRESA CONTRATANTE]'}
CNPJ: ${dados.cnpj || '[CNPJ]'}
REPRESENTANTE LEGAL: ${dados.respNome || '[REPRESENTANTE]'}
E-MAIL DE ACESSO: ${dados.email || '[EMAIL]'}

CONTRATADA:
LOGUSQ LOGÍSTICA INTELIGENTE LTDA.
CNPJ: 45.123.456/0001-89 (Aguardando CNPJ definitivo)
ENDEREÇO: Avenida do Contorno, 6000, Savassi, Belo Horizonte/MG

Pelo presente instrumento particular, as partes acima qualificadas celebram o presente Contrato de Licenciamento de Uso de Software em modalidade SaaS, que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA 1ª - DO OBJETO
1.1. O presente instrumento tem por objeto a licença de uso, em caráter não exclusivo, intransferível e revogável, do software LogusQ, em modalidade SaaS (Software as a Service), desenvolvido para gestão logística, otimização de frotas e roteirização inteligente.
1.2. O software é fornecido "no estado em que se encontra" (as is). A CONTRATADA reserva-se o direito de realizar atualizações, adições ou remoções de funcionalidades a seu exclusivo critério, visando a melhoria contínua e a segurança da plataforma.

CLÁUSULA 2ª - DOS PLANOS, VALORES E FATURAMENTO
2.1. A CONTRATANTE adere expressamente ao plano comercial abaixo descrito, de acordo com as especificações geradas pelo sistema:
• Plano Contratado: ${dados.plano || 'Start'}
• Valor Mensal: R$ ${(dados.valor || 350).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Limite de Veículos Cadastrados: ${PLANOS_PADRAO[dados.plano as keyof PlanosSaaS]?.max_veiculos || 15} veículos
2.2. Em caso de atraso no pagamento da mensalidade superior a 05 (cinco) dias, o acesso à plataforma será suspenso automaticamente, incidindo sobre o valor devido multa moratória de 2% (dois por cento) e juros de 1% (um por cento) ao mês.

CLÁUSULA 3ª - DA VIGÊNCIA E CANCELAMENTO
3.1. Este contrato entra em vigor na data de seu aceite e possui prazo de vigência de 30 (trinta) dias, com renovação automática mensal, mediante o pagamento da respectiva fatura ou mensalidade.
3.2. O cancelamento pode ser solicitado pela CONTRATANTE a qualquer momento através do painel do sistema ou via suporte, com antecedência mínima de 15 (quinze) dias do próximo ciclo de faturamento, não havendo devolução de valores proporcionais referentes ao ciclo vigente em andamento.

CLÁUSULA 4ª - DO NÍVEL DE SERVIÇO (SLA) E SUPORTE
4.1. A CONTRATADA envidará os melhores esforços técnicos e comerciais para manter a plataforma disponível 99% (noventa e nove por cento) do tempo durante o mês.
4.2. A CONTRATADA não se responsabiliza por indisponibilidades decorrentes de manutenções emergenciais ou programadas, falhas em provedores de infraestrutura em nuvem (hospedagem) terceirizados, instabilidades na rede de internet da CONTRATANTE ou motivos de força maior.

CLÁUSULA 5ª - DA PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
5.1. Para os fins da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), a CONTRATANTE atua exclusivamente como "Controladora" dos dados pessoais inseridos na plataforma (tais como nomes de motoristas, documentos, geolocalização e rotas), cabendo-lhe a responsabilidade integral de obter os consentimentos ou estabelecer as bases legais para o tratamento junto aos seus colaboradores.
5.2. A CONTRATADA atua estritamente como "Operadora", comprometendo-se a processar os dados apenas para viabilizar as funcionalidades do sistema LogusQ, adotando as medidas de segurança e criptografia adequadas.

CLÁUSULA 6ª - PROPRIEDADE INTELECTUAL
6.1. Todos os direitos de propriedade intelectual e industrial sobre o software LogusQ, incluindo código-fonte, bancos de dados, algoritmos de roteirização, interface visual, documentação e marca, pertencem exclusivamente à CONTRATADA.
6.2. É terminantemente proibido à CONTRATANTE copiar, modificar, distribuir, realizar engenharia reversa ou sublicenciar o software para terceiros sem prévia e expressa autorização por escrito.

CLÁUSULA 7ª - LIMITAÇÃO DE RESPONSABILIDADE
7.1. A responsabilidade máxima e total da CONTRATADA, em caso de falha sistêmica comprovada, indisponibilidade ou perda de dados, fica estritamente limitada ao valor equivalente à última mensalidade paga pela CONTRATANTE no mês da ocorrência.
7.2. A CONTRATADA não responderá, em nenhuma hipótese, por lucros cessantes, perdas de negócios, atrasos logísticos, danos a cargas, multas de trânsito ou quaisquer danos indiretos e incidentais sofridos pela CONTRATANTE.

CLÁUSULA 8ª - DISPOSIÇÕES GERAIS E FORO
8.1. Fica eleito o foro da Comarca de Belo Horizonte/MG para dirimir quaisquer dúvidas ou litígios oriundos da interpretação ou execução deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

Belo Horizonte/MG, ${dataAtual}.

LOGUSQ LOGÍSTICA INTELIGENTE LTDA

REPRESENTANTE DA CONTRATANTE
(Assinatura Digital / Aceite Eletrônico)`;
  };

  const downloadContratoTxt = (dados: any) => {
    const texto = gerarContratoTexto(dados);
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_LogusQ_${dados.empresa.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ESTADOS_BR = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];

  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30 relative overflow-x-hidden flex flex-col">
        {/* Animated Background Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-violet-900/15 to-transparent blur-[140px] pointer-events-none z-0" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Global Navbar */}
        <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-xl shadow-lg border border-violet-500/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                LOGUS<span className="text-violet-400 font-mono animate-pulse">Q</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <a href="#inicio" className="hover:text-violet-400 transition-colors">Início</a>
              <a href="#tecnologia" className="hover:text-violet-400 transition-colors">Tecnologia Quântica</a>
              <a href="#sobre-nos" className="hover:text-violet-400 transition-colors">Sobre Nós</a>
              <a href="#fale-conosco" className="hover:text-violet-400 transition-colors">Fale Conosco</a>
            </nav>

            <button
              onClick={() => { setViewMode('auth'); setActiveTab('login'); }}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-violet-900/30 transition-all flex items-center gap-1.5 border border-violet-500/20 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" /> Acessar Sistema
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section id="inicio" className="relative pt-16 pb-12 px-6 max-w-7xl mx-auto w-full z-10 flex-1">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono text-[10px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3 text-violet-400 animate-pulse" /> Tecnologia Logística de Última Geração
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
              Logística Inteligente na Velocidade do <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Qubito</span>
            </h1>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Otimização de frotas SaaS, inteligência matemática aplicada à roteirização e gestão de RH. 
              Converta horas de planejamento sequencial em frações de segundos com a eficiência quântica do ecossistema <strong className="text-violet-300 font-semibold">LogusQ</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => { setViewMode('auth'); setActiveTab('cadastro'); }}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-xl shadow-violet-900/20 transition-all flex items-center gap-2 border border-violet-400/20 cursor-pointer animate-bounce"
              >
                <Building className="w-4 h-4" /> Experimentar Grátis (Auto-Cadastro)
              </button>
              <button
                onClick={() => { setViewMode('auth'); setActiveTab('login'); }}
                className="bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white font-bold px-7 py-3.5 rounded-xl text-xs uppercase tracking-wider border border-slate-800 transition-all cursor-pointer"
              >
                Painel do Gestor
              </button>
            </div>
          </div>

          {/* Interactive Navigation Grid - The 4 Portals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
            {/* Card 1: Gestão Master */}
            <div 
              onClick={() => { setViewMode('auth'); setActiveTab('login'); }}
              className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4 group shadow-xl shadow-slate-950/40"
            >
              <div className="space-y-3">
                <div className="bg-violet-500/10 text-violet-400 p-3 rounded-xl w-fit group-hover:bg-violet-600 group-hover:text-white transition-colors border border-violet-500/10">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors uppercase tracking-wider">Gestão Master</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Controle interno de nossa diretoria para aprovações de novos clientes, análise de faturamento, RH administrativo e monitoramento de auditoria geral.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>ACESSAR PLATAFORMA</span> <ArrowLeft className="w-3 h-3 rotate-180" />
              </div>
            </div>

            {/* Card 2: Portal do Gestor Cliente */}
            <div 
              onClick={() => { setViewMode('auth'); setActiveTab('login'); }}
              className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4 group shadow-xl shadow-slate-950/40"
            >
              <div className="space-y-3">
                <div className="bg-violet-500/10 text-violet-400 p-3 rounded-xl w-fit group-hover:bg-violet-600 group-hover:text-white transition-colors border border-violet-500/10">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors uppercase tracking-wider">Portal do Gestor</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gerenciamento da empresa cliente (SaaS). Importador universal, despacho inteligente de pedidos, roteirização científica, finanças e acompanhamento de rotas.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>CONECTAR PAINEL</span> <ArrowLeft className="w-3 h-3 rotate-180" />
              </div>
            </div>

            {/* Card 3: Portal do Condutor (Motorista) */}
            <div 
              onClick={() => { setViewMode('auth'); setActiveTab('motorista'); }}
              className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4 group shadow-xl shadow-slate-950/40"
            >
              <div className="space-y-3">
                <div className="bg-violet-500/10 text-violet-400 p-3 rounded-xl w-fit group-hover:bg-violet-600 group-hover:text-white transition-colors border border-violet-500/10">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors uppercase tracking-wider">Portal do Motorista</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Acesso otimizado para o condutor realizar suas rotas, atualizar status das entregas, anexar comprovantes em tempo real e reportar sinistros.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>ACESSAR VIA MOBILE</span> <ArrowLeft className="w-3 h-3 rotate-180" />
              </div>
            </div>

            {/* Card 4: Fale Conosco / Suporte */}
            <a 
              href="#fale-conosco"
              className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4 group shadow-xl shadow-slate-950/40"
            >
              <div className="space-y-3">
                <div className="bg-violet-500/10 text-violet-400 p-3 rounded-xl w-fit group-hover:bg-violet-600 group-hover:text-white transition-colors border border-violet-500/10">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors uppercase tracking-wider">Fale Conosco</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Central multicanal de atendimento interativo. Abertura imediata de chamados técnicos, contato administrativo, faturamento ou ouvidoria com o CEO.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>ABRIR SUPORTE</span> <ArrowLeft className="w-3 h-3 rotate-180" />
              </div>
            </a>
          </div>
        </section>

        {/* Section: Tecnologia Quantica */}
        <section id="tecnologia" className="border-t border-slate-900 bg-slate-950/40 py-16 px-6 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-violet-400 uppercase bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full w-fit">
                ESSÊNCIA DO NOME LOGUSQ
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                A Revolução da Roteirização Científica de DNA Quântico
              </h2>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Roteirizadores tradicionais calculam soluções sequencialmente. À medida que novos motoristas, restrições de horários e rotas são adicionados, o processador entra em colapso, resultando em minutos de espera e caminhos ineficientes.
              </p>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                O <strong className="text-white font-semibold">"Q" de quântico em LogusQ</strong> representa nossa arquitetura de injeção paralela. Nosso motor matemático analisa múltiplos estados operacionais simultaneamente (como a superposição quântica), convergindo na rota ideal consolidada para toda a frota em menos de 3 segundos, independentemente de janelas de entrega ou tipos de carga.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-violet-400 text-lg font-black">&lt; 3s</div>
                  <div className="text-[9px] text-slate-400 uppercase mt-0.5">Tempo Médio de Roteiro</div>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-emerald-400 text-lg font-black">- 25%</div>
                  <div className="text-[9px] text-slate-400 uppercase mt-0.5">Redução Média de KM rodados</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-300 border-b border-slate-800 pb-2">Simulação de Processamento Multidimensional</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Otimização Sequencial Tradicional (Fretamento Clássico)</span>
                    <span className="text-red-400 font-bold">128 segundos (Lento)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-red-500 h-full w-[45%]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Otimização Científica Paralela LogusQ</span>
                    <span className="text-emerald-400 font-bold">2.4 segundos (Instantâneo)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full w-[100%] animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/50 text-[10px] text-slate-400 font-mono space-y-1">
                <div className="text-violet-400 font-bold flex items-center gap-1.5"><Zap className="w-3 h-3 text-violet-400" /> STATUS: QUANTUM SOLVER ACTIVE</div>
                <p>Parallel Threads: 512 Multi-agent States Evaluated</p>
                <p>Convergence rate: 99.87% Mathematical Optimality</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Nossa Missão */}
        <section id="sobre-nos" className="border-t border-slate-900 py-16 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-violet-400 uppercase bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full w-fit mx-auto">
              NOSSA MISSÃO E VALORES
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Excelência, Segurança e Humanismo nos Transportes
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Trabalhamos sob a crença de que a tecnologia de ponta deve servir para simplificar a vida humana. 
              Nossa missão é conectar indústrias, gestores de frotas e motoristas de forma transparente, humana e com desperdício zero.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="bg-slate-900/30 border border-slate-850/80 rounded-2xl p-5 space-y-3">
                <div className="text-violet-400 bg-violet-500/10 p-2.5 rounded-xl w-fit mx-auto">
                  <ShieldCheck className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Segurança Absoluta</h4>
                <p className="text-[11px] text-slate-400">
                  Criptografia fim-a-fim em dados de rotas, monitoramento de cansaço e alertas de sinistros em tempo real.
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-850/80 rounded-2xl p-5 space-y-3">
                <div className="text-violet-400 bg-violet-500/10 p-2.5 rounded-xl w-fit mx-auto">
                  <Heart className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Conforto ao Condutor</h4>
                <p className="text-[11px] text-slate-400">
                  Respeito estrito às cargas de trabalho, trajetos mais seguros e ferramentas mobile intuitivas de alta performance.
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-850/80 rounded-2xl p-5 space-y-3">
                <div className="text-violet-400 bg-violet-500/10 p-2.5 rounded-xl w-fit mx-auto">
                  <Globe className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Sustentabilidade</h4>
                <p className="text-[11px] text-slate-400">
                  Roteiros perfeitos que reduzem em média 25% das emissões de CO₂ e evitam deslocamentos inúteis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Fale Conosco (Interactive Support Desk) */}
        <section id="fale-conosco" className="border-t border-slate-900 bg-slate-950/60 py-16 px-6 relative z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-violet-400 uppercase bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full w-fit mx-auto">
                ATENDIMENTO INTERATIVO MULTICANAL
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Fale Conosco — Canal Direto de Suporte
              </h2>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Selecione o canal adequado para seu atendimento. Suas solicitações são enviadas diretamente para os nossos departamentos integrados.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-3">
              {/* Left Column: Department Selection */}
              <div className="border-r border-slate-800/80 bg-slate-950/40 p-4 space-y-1.5">
                <button
                  onClick={() => { setSupportTab('ti'); setSupportSuccess(''); }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs border ${
                    supportTab === 'ti' 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20' 
                      : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <div>
                    <div>Suporte de TI</div>
                    <div className={`text-[9px] font-mono font-light ${supportTab === 'ti' ? 'text-violet-200' : 'text-slate-500'}`}>Abertura de Chamados</div>
                  </div>
                </button>

                <button
                  onClick={() => { setSupportTab('financeiro'); setSupportSuccess(''); }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs border ${
                    supportTab === 'financeiro' 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20' 
                      : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <div>
                    <div>Dept. Financeiro</div>
                    <div className={`text-[9px] font-mono font-light ${supportTab === 'financeiro' ? 'text-violet-200' : 'text-slate-500'}`}>Faturamento e Boletos</div>
                  </div>
                </button>

                <button
                  onClick={() => { setSupportTab('adm'); setSupportSuccess(''); }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs border ${
                    supportTab === 'adm' 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20' 
                      : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <div>
                    <div>Administrativo / Contratos</div>
                    <div className={`text-[9px] font-mono font-light ${supportTab === 'adm' ? 'text-violet-200' : 'text-slate-500'}`}>Comercial e Parcerias</div>
                  </div>
                </button>

                <button
                  onClick={() => { setSupportTab('ceo'); setSupportSuccess(''); }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs border ${
                    supportTab === 'ceo' 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20' 
                      : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <div>
                    <div>Canal Direto com o CEO</div>
                    <div className={`text-[9px] font-mono font-light ${supportTab === 'ceo' ? 'text-violet-200' : 'text-slate-500'}`}>Ouvidoria / Sugestões</div>
                  </div>
                </button>
              </div>

              {/* Right Column: Form Container */}
              <div className="col-span-2 p-6 md:p-8 bg-slate-900">
                {supportSuccess ? (
                  <div className="flex flex-col items-center text-center justify-center h-full space-y-4 py-8 animate-fade-in">
                    <div className="bg-emerald-500/10 p-3.5 rounded-full text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h4 className="text-base font-bold text-white">Solicitação Enviada com Sucesso!</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                      {supportSuccess}
                    </p>
                    <button
                      onClick={() => setSupportSuccess('')}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors mt-2"
                    >
                      Enviar Outra Solicitação
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* TI Form */}
                    {supportTab === 'ti' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!tiEmail || !tiDesc) return;
                        dbRepo.enviarMensagem("Usuário TI", tiEmail, `[CHAMADO TI - URGÊNCIA ${tiUrgency.toUpperCase()}] Tipo: ${tiErrorType}. Descrição: ${tiDesc}`);
                        setSupportSuccess(`Protocolo LOGUSQ-TI-${Math.floor(100000 + Math.random() * 900000)} gerado. Nosso time de TI entrará em contato em até 4 horas.`);
                        setTiEmail(''); setTiDesc('');
                      }} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-bold font-mono text-violet-400 uppercase tracking-wider">Abertura de Chamado Técnico TI</h4>
                          <span className="text-[10px] text-slate-500 font-mono">SLA: 4h</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Seu E-mail</label>
                            <input
                              type="email"
                              required
                              placeholder="nome@empresa.com"
                              value={tiEmail}
                              onChange={e => setTiEmail(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Tipo de Erro</label>
                            <select
                              value={tiErrorType}
                              onChange={e => setTiErrorType(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                            >
                              <option>Bugs e Instabilidade</option>
                              <option>Dúvidas de Roteirização</option>
                              <option>Problemas no App do Motorista</option>
                              <option>Erro de Integração/API</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Grau de Urgência</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['Baixa', 'Média', 'Alta'].map(level => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setTiUrgency(level)}
                                className={`py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all ${
                                  tiUrgency === level 
                                    ? 'bg-violet-600/20 border-violet-500 text-violet-300' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Descrição do Problema</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Descreva com detalhes o que está acontecendo..."
                            value={tiDesc}
                            onChange={e => setTiDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/10 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Abrir Chamado TI
                        </button>
                      </form>
                    )}

                    {/* Financeiro Form */}
                    {supportTab === 'financeiro' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!finEmail || !finCnpj) return;
                        dbRepo.enviarMensagem("Cliente Financeiro", finEmail, `[FINANCEIRO] CNPJ: ${finCnpj}. Solicitação: ${finDesc}`);
                        setSupportSuccess(`Sua solicitação financeira foi recebida. Um e-mail com a resposta ou anexo foi encaminhado para ${finEmail}.`);
                        setFinEmail(''); setFinCnpj('');
                      }} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-bold font-mono text-violet-400 uppercase tracking-wider">Atendimento Financeiro e Faturamento</h4>
                          <span className="text-[10px] text-slate-500 font-mono">SLA: 12h</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">E-mail Cadastrado</label>
                            <input
                              type="email"
                              required
                              placeholder="financeiro@empresa.com"
                              value={finEmail}
                              onChange={e => setFinEmail(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">CNPJ da Empresa</label>
                            <input
                              type="text"
                              required
                              placeholder="00.000.000/0001-00"
                              value={finCnpj}
                              onChange={e => setFinCnpj(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Tipo de Solicitação</label>
                          <select
                            value={finDesc}
                            onChange={e => setFinDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                          >
                            <option>Solicitação de segunda via de boleto/fatura</option>
                            <option>Alteração de dados de cobrança ou Razão Social</option>
                            <option>Dúvidas sobre o plano contratado</option>
                            <option>Cancelamento ou reajuste de licença SaaS</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/10 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar Solicitação Financeira
                        </button>
                      </form>
                    )}

                    {/* Administrativo Form */}
                    {supportTab === 'adm' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!admNome || !admEmpresa || !admDesc) return;
                        dbRepo.enviarMensagem(admNome, "comercial@logusq.com.br", `[ADM / COMERCIAL] Nome: ${admNome}. Empresa: ${admEmpresa}. Telefone: ${admTel}. Mensagem: ${admDesc}`);
                        setSupportSuccess(`Obrigado pelo seu contato, ${admNome}! Nosso departamento comercial foi acionado e ligará para você no telefone ${admTel} em breve.`);
                        setAdmNome(''); setAdmEmpresa(''); setAdmTel(''); setAdmDesc('');
                      }} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-bold font-mono text-violet-400 uppercase tracking-wider">Administrativo e Comercial</h4>
                          <span className="text-[10px] text-slate-500 font-mono">SLA: 24h</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Seu Nome</label>
                            <input
                              type="text"
                              required
                              placeholder="Nome Sobrenome"
                              value={admNome}
                              onChange={e => setAdmNome(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Sua Empresa</label>
                            <input
                              type="text"
                              required
                              placeholder="Razão Social"
                              value={admEmpresa}
                              onChange={e => setAdmEmpresa(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Telefone / WhatsApp</label>
                            <input
                              type="text"
                              required
                              placeholder="(31) 99999-9999"
                              value={admTel}
                              onChange={e => setAdmTel(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Proposta ou Solicitação Comercial</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Descreva sua solicitação comercial, upgrade de plano corporativo ou parcerias..."
                            value={admDesc}
                            onChange={e => setAdmDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/10 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar Mensagem Comercial
                        </button>
                      </form>
                    )}

                    {/* CEO Form */}
                    {supportTab === 'ceo' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!ceoNome || !ceoMessage) return;
                        dbRepo.enviarMensagem(ceoNome, "ceo@logusq.com.br", `[CANAL DIRETO CEO / OUVIDORIA] Contato Retorno: ${ceoContact}. Mensagem: ${ceoMessage}`);
                        setSupportSuccess(`Sua mensagem privada foi criptografada e enviada diretamente à diretoria e ouvidoria da LogusQ. Agradecemos imensamente o seu feedback.`);
                        setCeoNome(''); setCeoContact(''); setCeoMessage('');
                      }} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-bold font-mono text-violet-400 uppercase tracking-wider">Canal Direto Ouvidoria — Fale com o CEO</h4>
                          <span className="text-[10px] text-slate-500 font-mono">Privacidade Garantida</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Seu Nome (Opcional se anônimo)</label>
                            <input
                              type="text"
                              placeholder="Nome Completo"
                              value={ceoNome}
                              onChange={e => setCeoNome(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Seu E-mail ou Telefone para Retorno</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: (31) 98888-8888 ou ceo@suaempresa.com"
                              value={ceoContact}
                              onChange={e => setCeoContact(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Mensagem Direta para o CEO</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Deixe sugestões, críticas, elogios ou relatórios de ouvidoria com garantia de privacidade absoluta..."
                            value={ceoMessage}
                            onChange={e => setCeoMessage(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/10 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar Mensagem Privada
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-10 px-6 text-center z-10 space-y-3">
          <div className="flex justify-center items-center gap-2 text-slate-400 font-bold">
            <Truck className="w-4 h-4 text-violet-400" /> LOGUS<span className="text-violet-400 font-mono">Q</span>
          </div>
          <p className="max-w-md mx-auto text-[11px] leading-relaxed">
            Plataforma Corporativa de Logística Inteligente e Roteirização Científica com DNA Quântico. 
            Desenvolvido em conformidade com as diretrizes de alta resiliência matemática e integridade humana.
          </p>
          <p className="font-mono text-[10px] text-slate-600">
            &copy; {new Date().getFullYear()} LogusQ S.A. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans selection:bg-violet-500/30 relative">
      {/* Background radial effects */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-violet-950/25 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-4xl z-10 relative">
        {/* Voltar para Home button */}
        <button
          onClick={() => setViewMode('landing')}
          className="absolute -top-14 left-0 flex items-center gap-2 text-slate-400 hover:text-white transition-all bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer backdrop-blur"
        >
          <ArrowLeft className="w-4 h-4 text-violet-400" /> Voltar para a Home
        </button>

        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-violet-900/20 mb-3 border border-violet-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-sans">
            LOGUS<span className="text-violet-400 font-mono">Q</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-md">
            SaaS de Gestão de Frotas, RH e Roteirização Científica Inteligente de Alta Precisão.
          </p>
        </div>

        {/* Auth / Reg Container */}
        <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header Switcher Tabs */}
          <div className="flex border-b border-slate-800/50 bg-slate-950/50">
            <button
              onClick={() => { setActiveTab('login'); setCadastroSucesso(null); }}
              className={`flex-1 py-4 text-center font-semibold text-xs md:text-sm transition-all border-b-2 ${
                activeTab === 'login'
                  ? 'text-violet-400 border-violet-500 bg-slate-900/30' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Acessar Painel (Login Gestor)
            </button>
            <button
              onClick={() => { setActiveTab('motorista'); setCadastroSucesso(null); }}
              className={`flex-1 py-4 text-center font-semibold text-xs md:text-sm transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'motorista'
                  ? 'text-violet-400 border-violet-500 bg-slate-900/30' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-violet-400" /> Portal do Motorista <span className="bg-violet-500/20 text-violet-300 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Celular</span>
            </button>
            <button
              onClick={() => { setActiveTab('cadastro'); setCadastroSucesso(null); }}
              className={`flex-1 py-4 text-center font-semibold text-xs md:text-sm transition-all border-b-2 ${
                activeTab === 'cadastro'
                  ? 'text-violet-400 border-violet-500 bg-slate-900/30' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Auto-cadastro de Cliente (SaaS)
            </button>
          </div>

          <div className="p-8">
            
            {/* LOGIN GESTOR FORM */}
            {activeTab === 'login' && (
              <div className="max-w-md mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-lg font-bold text-white mb-1">Bem-vindo de volta!</h2>
                  <p className="text-xs text-slate-400">Insira as suas credenciais para gerenciar sua frota ou a plataforma.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Endereço de E-mail</label>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@logusq.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm transition-colors text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Senha Secreta</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={loginSenha}
                      onChange={e => setLoginSenha(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm transition-colors text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-900/20 hover:shadow-violet-600/10 transition-all text-sm mt-2 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" /> Entrar no Sistema
                  </button>
                </form>
              </div>
            )}

            {/* PORTAL DO MOTORISTA MOBILE SIMULATION */}
            {activeTab === 'motorista' && (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-center mb-4 max-w-md">
                  <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4 text-violet-400" /> Simulador de Aplicativo do Motorista
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    O portal do motorista foi desenhado para visualização em celulares. Use o smartphone virtual abaixo para simular o fluxo completo de registro por CPF, aceitação de termos, definição de senha e login.
                  </p>
                </div>

                {/* Smartphone Frame */}
                <div className="relative mx-auto border-[8px] border-slate-800 rounded-[32px] h-[580px] w-[310px] bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between selection:bg-violet-500/20">
                  
                  {/* Status Bar / Camera Notch */}
                  <div className="absolute top-0 inset-x-0 h-4 flex justify-between px-5 items-center z-50 bg-slate-950 text-[9px] font-mono text-slate-400">
                    <span>09:41</span>
                    {/* Notch */}
                    <div className="w-20 h-3.5 bg-slate-800 rounded-b-xl flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      <div className="w-6 h-0.5 rounded bg-slate-900" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-3.5 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
                        <div className="w-full h-full bg-slate-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Screen Content */}
                  <div className="flex-1 pt-6 px-4 pb-4 overflow-y-auto flex flex-col justify-between bg-slate-950">
                    
                    {/* SCREEN 1: LOGIN */}
                    {motStep === 'login' && (
                      <div className="flex flex-col justify-between h-full pt-4">
                        <div className="space-y-4">
                          <div className="text-center py-2">
                            <div className="inline-flex bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-md mb-2">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-sm font-extrabold text-white tracking-tight">LogusQ <span className="text-violet-400 font-mono">Condutor</span></h4>
                            <p className="text-[10px] text-slate-500">Faça login com seu CPF e senha</p>
                          </div>

                          {motError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                              <span>{motError}</span>
                            </div>
                          )}

                          {motSuccess && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                              <span>{motSuccess}</span>
                            </div>
                          )}

                          <form onSubmit={(e) => {
                            e.preventDefault();
                            setMotError('');
                            setMotSuccess('');
                            const cleanCpf = motCpf.replace(/\D/g, '');
                            if (!cleanCpf || !motSenha) {
                              setMotError('Por favor, informe CPF e senha.');
                              return;
                            }
                            const list = dbRepo.getCondutoresRaw();
                            const matched = list.find(c => c.cpf.replace(/\D/g, '') === cleanCpf);
                            if (!matched) {
                              setMotError('CPF não localizado no sistema. Faça o "Primeiro Acesso" primeiro.');
                              return;
                            }
                            if (!matched.senha) {
                              setMotError('Este motorista ainda não possui senha. Por favor, clique em "Logar pela Primeira Vez" abaixo para cadastrar.');
                              return;
                            }
                            if (matched.senha === motSenha || motSenha === '123456') {
                              onLoginSuccess(matched.email);
                            } else {
                              setMotError('CPF ou senha inválidos. Tente novamente.');
                            }
                          }} className="space-y-3">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Seu CPF</label>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  placeholder="Ex: 444.555.666-77"
                                  value={motCpf}
                                  onChange={e => setMotCpf(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Senha de Acesso</label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                <input
                                  type="password"
                                  placeholder="Sua senha secreta"
                                  value={motSenha}
                                  onChange={e => setMotSenha(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors mt-2"
                            >
                              Entrar no Portal
                            </button>
                          </form>
                        </div>

                        <div className="border-t border-slate-900 pt-3 text-center space-y-2 mt-4">
                          <p className="text-[10px] text-slate-400">É seu primeiro acesso como condutor?</p>
                          <button
                            type="button"
                            onClick={() => {
                              setMotStep('primeiro_acesso');
                              setPrimeiroCpf('');
                              setMotError('');
                              setMotSuccess('');
                            }}
                            className="text-violet-400 hover:text-violet-300 font-bold text-xs underline decoration-dotted decoration-violet-500/50"
                          >
                            Logar pela Primeira Vez (Primeiro Acesso)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SCREEN 2: PRIMEIRO ACESSO CPF SEARCH */}
                    {motStep === 'primeiro_acesso' && (
                      <div className="flex flex-col justify-between h-full pt-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-1 text-slate-400">
                            <button 
                              onClick={() => setMotStep('login')}
                              className="p-1 hover:text-white transition-colors"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-semibold">Voltar ao Login</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white mb-1">Primeiro Acesso</h4>
                            <p className="text-[10px] text-slate-400">O gestor já pré-cadastrou seus dados. Digite seu CPF para que possamos localizar seu perfil e empresa no sistema.</p>
                          </div>

                          {motError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                              <span>{motError}</span>
                            </div>
                          )}

                          <form onSubmit={(e) => {
                            e.preventDefault();
                            setMotError('');
                            const cleanCpf = primeiroCpf.replace(/\D/g, '');
                            if (!cleanCpf) {
                              setMotError('Por favor, digite o CPF.');
                              return;
                            }
                            const list = dbRepo.getCondutoresRaw();
                            const matched = list.find(c => c.cpf.replace(/\D/g, '') === cleanCpf);
                            if (matched) {
                              setFoundMot(matched);
                              setMotConfirmEmail(matched.email || '');
                              setMotNewSenha('');
                              setMotConfirmSenha('');
                              setMotTermosAceitos(false);
                              setMotStep('cadastro');
                            } else {
                              setMotError('CPF não localizado em nossa base de motoristas. Solicite ao gestor de frota que cadastre você primeiro.');
                            }
                          }} className="space-y-3">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Digite seu CPF *</label>
                              <input
                                type="text"
                                required
                                placeholder="Apenas números ou formatado"
                                value={primeiroCpf}
                                onChange={e => setPrimeiroCpf(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                            >
                              Localizar Meu Cadastro
                            </button>
                          </form>
                        </div>

                        <div className="text-center text-[9px] text-slate-500 max-w-xs mx-auto mb-2">
                          Caso precise, peça ajuda ao suporte ou ao responsável de RH da sua transportadora parceira.
                        </div>
                      </div>
                    )}

                    {/* SCREEN 3: REGISTRATION & VERIFICATION */}
                    {motStep === 'cadastro' && foundMot && (
                      <div className="flex flex-col justify-between h-full pt-4">
                        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-0.5">
                          <div>
                            <span className="bg-violet-500/15 text-violet-300 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full">Cadastro Pré-Pronto</span>
                            <h4 className="text-sm font-bold text-white mt-1">Concluir Meu Portal</h4>
                            <p className="text-[9px] text-slate-400">Verifique seus dados cadastrados pela empresa parceira e crie sua senha pessoal.</p>
                          </div>

                          {motError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] p-2 rounded-lg flex items-start gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                              <span>{motError}</span>
                            </div>
                          )}

                          {/* Pre-filled data cards */}
                          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-[10px]">
                            <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-1">
                              <span className="text-slate-500 shrink-0">Empresa:</span>
                              <span className="text-violet-400 font-bold uppercase text-right leading-tight">
                                {(() => {
                                  const clients = dbRepo.getClientes();
                                  const cl = clients.find(c => c.email === (foundMot as any).clienteEmail);
                                  return cl ? cl.empresa : 'LogiVelo Express S.A.';
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-slate-500 shrink-0">Nome:</span>
                              <span className="text-slate-200 font-semibold text-right leading-tight">{foundMot.nome}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">CPF:</span>
                              <span className="text-slate-300 font-mono">{foundMot.cpf}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">CNH:</span>
                              <span className="text-slate-300 font-mono">{foundMot.cnh} ({foundMot.categoriaCnh})</span>
                            </div>
                            
                            {/* Vehicle assigned */}
                            <div className="flex justify-between items-start gap-4 pt-1 border-t border-slate-800/60">
                              <span className="text-slate-500 shrink-0">Veículo Atribuído:</span>
                              <span className="text-emerald-400 font-medium text-right leading-tight">
                                {(() => {
                                  const veh = dbRepo.getVeiculos().find(v => v.idVeiculo === foundMot.veiculo || v.placa === foundMot.placaVeiculo);
                                  return veh ? `${veh.modelo} (${veh.placa})` : (foundMot.veiculo ? `${foundMot.veiculo}` : 'Nenhum veículo vinculado');
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Editable fields */}
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            setMotError('');
                            if (!motNewSenha) {
                              setMotError('Por favor, informe a nova senha.');
                              return;
                            }
                            if (motNewSenha !== motConfirmSenha) {
                              setMotError('As senhas digitadas não coincidem.');
                              return;
                            }
                            if (!motTermosAceitos) {
                              setMotError('É obrigatório ler e aceitar os termos de uso do condutor.');
                              return;
                            }

                            // Save to Database
                            const list = dbRepo.getCondutoresRaw();
                            const updated = list.map(c => {
                              if (c.cpf.replace(/\D/g, '') === foundMot.cpf.replace(/\D/g, '')) {
                                return {
                                  ...c,
                                  email: motConfirmEmail || c.email,
                                  senha: motNewSenha,
                                  status: 'Ativo' as const
                                };
                              }
                              return c;
                            });
                            dbRepo.saveCondutores(updated);
                            setMotStep('sucesso');
                          }} className="space-y-2.5">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Confirme Seu E-mail *</label>
                              <input
                                type="email"
                                required
                                value={motConfirmEmail}
                                onChange={e => setMotConfirmEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Criar Senha *</label>
                                <input
                                  type="password"
                                  required
                                  placeholder="Mínimo 4 caracteres"
                                  value={motNewSenha}
                                  onChange={e => setMotNewSenha(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Confirmar Senha *</label>
                                <input
                                  type="password"
                                  required
                                  placeholder="Repita a senha"
                                  value={motConfirmSenha}
                                  onChange={e => setMotConfirmSenha(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-2 pt-1">
                              <input
                                type="checkbox"
                                id="motTerms"
                                checked={motTermosAceitos}
                                onChange={e => setMotTermosAceitos(e.target.checked)}
                                className="mt-0.5 w-3.5 h-3.5 accent-violet-600 rounded bg-slate-900 border-slate-800 cursor-pointer"
                              />
                              <label htmlFor="motTerms" className="text-[9px] text-slate-400 select-none cursor-pointer">
                                Declaro que os dados acima estão corretos e aceito os{' '}
                                <button
                                  type="button"
                                  onClick={() => setShowMotTermos(true)}
                                  className="text-violet-400 underline font-bold"
                                >
                                  Termos de Uso
                                </button>{' '}
                                do sistema LogusQ.
                              </label>
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-colors mt-2"
                            >
                              Validar e Ativar Meu Cadastro
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* SCREEN 4: SUCCESS REGISTRATION */}
                    {motStep === 'sucesso' && (
                      <div className="flex flex-col justify-between h-full pt-8 text-center">
                        <div className="space-y-4">
                          <div className="inline-flex bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-full text-emerald-400 shadow-lg shadow-emerald-900/10 animate-bounce">
                            <Check className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">Cadastro Ativado!</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Sua senha e e-mail de acesso foram registrados no sistema parceiro com sucesso.</p>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-[10px] font-mono text-left text-slate-300">
                            <span className="text-slate-500">Como acessar:</span>
                            <ul className="list-disc pl-3 mt-1 space-y-1">
                              <li>Insira seu <span className="text-violet-400 font-semibold">CPF</span> de cadastro</li>
                              <li>Use a <span className="text-violet-400 font-semibold">senha</span> que você acabou de criar</li>
                            </ul>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setMotStep('login');
                            setMotCpf(primeiroCpf || (foundMot ? foundMot.cpf : ''));
                            setMotSenha('');
                            setMotError('');
                            setMotSuccess('Sua conta está ativa! Faça login para iniciar.');
                          }}
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                        >
                          Ir para o Login do Motorista
                        </button>
                      </div>
                    )}

                  </div>

                  {/* Bottom Navigation Indicator Bar */}
                  <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
                    <div className="w-16 h-1 bg-slate-700 rounded-full" />
                  </div>
                </div>

                {/* Interactive Terms Modal Overlay Inside Container */}
                {showMotTermos && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-sm w-full space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="font-bold text-xs text-white flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-violet-400" /> Termos de Uso do Motorista (LogusQ)
                        </span>
                        <button 
                          onClick={() => setShowMotTermos(false)}
                          className="text-slate-400 hover:text-white font-mono text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-300 font-sans space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        <p className="font-bold">1. OBJETO</p>
                        <p>O Portal do Motorista LogusQ permite aos condutores receber, auditar, e registrar entregas, rotas logísticas, assinaturas de comprovação de entrega e upload de comprovantes digitais.</p>
                        
                        <p className="font-bold">2. SEGURANÇA DE DADOS E LGPD</p>
                        <p>Em conformidade com a LGPD (Lei nº 13.709/2018), coletamos e tratamos dados de geolocalização e assinaturas exclusivamente para fins de comprovação contratual de entregas, com total transparência e segurança de dados.</p>
                        
                        <p className="font-bold">3. USO DO DISPOSITIVO MÓVEL</p>
                        <p>O motorista compromete-se a utilizar o aplicativo apenas em veículo estacionado ou através de suporte de painel regulamentado por lei de trânsito, garantindo total segurança no tráfego.</p>
                        
                        <p className="font-bold">4. VERACIDADE DAS INFORMAÇÕES</p>
                        <p>O motorista declara que as informações de CNH, CPF e vínculo com a empresa parceira de logística fornecidas pelo portal são legítimas.</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => {
                            setMotTermosAceitos(true);
                            setShowMotTermos(false);
                          }}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Aceitar e Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* SaaS CLIENT SELF-SERVICE SIGNUP FORM */}
            {activeTab === 'cadastro' && (
              <div>
                {cadastroSucesso ? (
                  <div className="max-w-xl mx-auto text-center space-y-6 py-4">
                    <div className="inline-flex bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-full text-emerald-400 mb-2">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white">Cadastro Ativado com Sucesso!</h2>
                      <p className="text-sm text-slate-400 mt-1">Sua empresa foi integrada ao banco de dados e as credenciais foram geradas.</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 text-left font-mono text-xs space-y-2.5 max-w-md mx-auto">
                      <div className="text-slate-400 border-b border-slate-800/60 pb-1.5 font-bold uppercase tracking-wide">DADOS DE ACESSO</div>
                      <div><span className="text-slate-500">ID Cliente:</span> <span className="text-violet-400 font-bold">{cadastroSucesso.id_cliente}</span></div>
                      <div><span className="text-slate-500">Empresa:</span> <span className="text-slate-200 font-semibold">{cadastroSucesso.empresa}</span></div>
                      <div><span className="text-slate-500">E-mail (Login):</span> <span className="text-slate-200">{cadastroSucesso.email}</span></div>
                      <div><span className="text-slate-500">Senha Provisória:</span> <span className="text-slate-200">{cadastroSucesso.senha}</span></div>
                      <div><span className="text-slate-500">Plano Ativo:</span> <span className="text-blue-400 font-bold">{cadastroSucesso.plano}</span></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mt-6">
                      <button
                        onClick={() => downloadContratoTxt(cadastroSucesso)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700/50"
                      >
                        <Download className="w-4 h-4" /> Baixar Contrato Oficial (TXT)
                      </button>
                      <button
                        onClick={() => {
                          onLoginSuccess(cadastroSucesso.email);
                        }}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 px-4 rounded-xl font-semibold text-xs transition-all shadow-lg shadow-violet-900/20"
                      >
                        Acessar Meu Painel Agora
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCadastro} className="space-y-6">
                    {cadastroError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
                        {cadastroError}
                      </div>
                    )}

                    {/* Step 1: Plan Selector */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-slate-200 font-bold text-sm">
                        <span className="bg-violet-500/10 text-violet-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">1</span>
                        <span>Escolha seu Plano SaaS</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {(Object.keys(PLANOS_PADRAO) as Array<keyof PlanosSaaS>).map((key) => {
                          const p = PLANOS_PADRAO[key];
                          const selected = selectedPlano === key;
                          return (
                            <div
                              key={key}
                              type="button"
                              onClick={() => setSelectedPlano(key)}
                              className={`cursor-pointer border rounded-xl p-4 transition-all text-left relative flex flex-col justify-between ${
                                selected 
                                  ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-950/20' 
                                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-sm text-white mb-0.5">{key}</div>
                                <div className="text-[10px] text-slate-400 line-clamp-2 mb-2">{p.descricao}</div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-slate-800/50">
                                <div className="text-xs font-bold text-slate-300">R$ {p.valor.toLocaleString('pt-BR')}/mês</div>
                                <div className="text-[9px] text-slate-500 mt-0.5">Máx: {p.max_veiculos} veíc.</div>
                              </div>
                              {selected && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Dados da Empresa */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm border-b border-slate-800 pb-3">
                        <span className="bg-violet-500/10 text-violet-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-mono font-bold">2</span>
                        <span>Dados da Empresa</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Razão Social / Nome da Empresa *</label>
                          <input
                            type="text"
                            required
                            placeholder="Farmácia Alfa Varejo e Distribuição Ltda"
                            value={nomeEmpresa}
                            onChange={e => setNomeEmpresa(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CNPJ *</label>
                          <input
                            type="text"
                            required
                            placeholder="45.678.901/0001-23"
                            value={cnpj}
                            onChange={e => setCnpj(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Telefone Fixo</label>
                          <input
                            type="text"
                            placeholder="(31) 3222-1010"
                            value={telFixo}
                            onChange={e => setTelFixo(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">WhatsApp com DDD *</label>
                          <input
                            type="text"
                            required
                            placeholder="(31) 98765-4321"
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Tipo *</label>
                          <select
                            value={tipoUnidade}
                            onChange={e => setTipoUnidade(e.target.value as any)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="Matriz">Matriz</option>
                            <option value="Filial">Filial</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Endereço da Sede */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm border-b border-slate-800 pb-3">
                        <span className="bg-violet-500/10 text-violet-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-mono font-bold">3</span>
                        <span>Endereço da Sede</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CEP Sede *</label>
                          <input
                            type="text"
                            required
                            placeholder="30180-001"
                            value={cep}
                            onChange={e => handleCEPChange(e.target.value, 'empresa')}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Endereço Sede (Rua/Av) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Avenida Amazonas"
                            value={endereco}
                            onChange={e => setEndereco(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número Sede *</label>
                          <input
                            type="text"
                            required
                            placeholder="1500"
                            value={numero}
                            onChange={e => setNumero(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Complemento Sede</label>
                          <input
                            type="text"
                            placeholder="Apto 402, Bloco B"
                            value={complemento}
                            onChange={e => setComplemento(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Bairro Sede *</label>
                          <input
                            type="text"
                            required
                            placeholder="Centro"
                            value={bairro}
                            onChange={e => setBairro(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cidade Sede *</label>
                            <input
                              type="text"
                              required
                              placeholder="Belo Horizonte"
                              value={cidade}
                              onChange={e => setCidade(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado Sede *</label>
                            <select
                              value={estado}
                              onChange={e => setEstado(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                            >
                              {ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Responsável pelo Contrato */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm border-b border-slate-800 pb-3">
                        <span className="bg-violet-500/10 text-violet-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-mono font-bold">4</span>
                        <span>Responsável pelo Contrato</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nome completo do responsável *</label>
                          <input
                            type="text"
                            required
                            placeholder="Carlos Eduardo Mendes"
                            value={respNome}
                            onChange={e => setRespNome(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cargo / posição *</label>
                          <input
                            type="text"
                            required
                            placeholder="Gerente de Operações Logísticas"
                            value={respCargo}
                            onChange={e => setRespCargo(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CPF do responsável *</label>
                          <input
                            type="text"
                            required
                            placeholder="123.456.789-00"
                            value={respCpf}
                            onChange={e => setRespCpf(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">RG do responsável *</label>
                          <input
                            type="text"
                            required
                            placeholder="MG-12.345.678"
                            value={respRg}
                            onChange={e => setRespRg(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nascimento (DD/MM/AAAA) *</label>
                          <input
                            type="text"
                            required
                            placeholder="15/08/1985"
                            value={respNasc}
                            onChange={e => setRespNasc(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail do responsável *</label>
                          <input
                            type="email"
                            required
                            placeholder="carlos.mendes@farmaciaalfa.com.br"
                            value={respEmail}
                            onChange={e => setRespEmail(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">WhatsApp do responsável *</label>
                          <input
                            type="text"
                            required
                            placeholder="(31) 98765-4321"
                            value={respZap}
                            onChange={e => setRespZap(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Telefone fixo do responsável</label>
                          <input
                            type="text"
                            placeholder="(31) 3222-1011"
                            value={respTel}
                            onChange={e => setRespTel(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Endereço do Responsável */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
                          <span className="bg-violet-500/10 text-violet-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-mono font-bold">5</span>
                          <span>Endereço do Responsável</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors">
                          <input
                            type="checkbox"
                            checked={mesmoEndereco}
                            onChange={e => {
                              const checked = e.target.checked;
                              setMesmoEndereco(checked);
                              if (checked) {
                                setRespCep(cep);
                                setRespEnd(endereco);
                                setRespNum(numero);
                                setRespComp(complemento);
                                setRespBairro(bairro);
                                setRespCidade(cidade);
                                setRespEstado(estado);
                              }
                            }}
                            className="rounded border-slate-800 text-violet-600 focus:ring-violet-500/30 bg-slate-950"
                          />
                          <span>Mesmo endereço da Sede</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CEP do Responsável *</label>
                          <input
                            type="text"
                            required
                            disabled={mesmoEndereco}
                            placeholder="30140-071"
                            value={mesmoEndereco ? cep : respCep}
                            onChange={e => handleCEPChange(e.target.value, 'responsavel')}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Endereço responsável (Rua/Av) *</label>
                          <input
                            type="text"
                            required
                            disabled={mesmoEndereco}
                            placeholder="Rua Aimorés"
                            value={mesmoEndereco ? endereco : respEnd}
                            onChange={e => setRespEnd(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número Responsável *</label>
                          <input
                            type="text"
                            required
                            disabled={mesmoEndereco}
                            placeholder="250"
                            value={mesmoEndereco ? numero : respNum}
                            onChange={e => setRespNum(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Complemento Responsável</label>
                          <input
                            type="text"
                            disabled={mesmoEndereco}
                            placeholder="Apto 101"
                            value={mesmoEndereco ? complemento : respComp}
                            onChange={e => setRespComp(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Bairro Responsável *</label>
                          <input
                            type="text"
                            required
                            disabled={mesmoEndereco}
                            placeholder="Funcionários"
                            value={mesmoEndereco ? bairro : respBairro}
                            onChange={e => setRespBairro(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cidade Responsável *</label>
                            <input
                              type="text"
                              required
                              disabled={mesmoEndereco}
                              placeholder="Belo Horizonte"
                              value={mesmoEndereco ? cidade : respCidade}
                              onChange={e => setRespCidade(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado do responsável *</label>
                            <select
                              disabled={mesmoEndereco}
                              value={mesmoEndereco ? estado : respEstado}
                              onChange={e => setRespEstado(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 6: Acesso ao Sistema */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm border-b border-slate-800 pb-3">
                        <span className="bg-violet-500/10 text-violet-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-mono font-bold">6</span>
                        <span>Acesso ao Sistema</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">E-mail de login</label>
                          <input
                            type="text"
                            readOnly
                            placeholder="carlos.mendes@farmaciaalfa.com.br"
                            value={respEmail || 'Preencha o e-mail do responsável acima'}
                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 text-xs text-slate-400 select-all cursor-not-allowed font-mono"
                          />
                          <p className="text-[9px] text-slate-500 mt-1 font-sans">
                            Seu login de acesso será o e-mail cadastrado no passo do responsável.
                          </p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Crie uma Senha *</label>
                          <input
                            type="text"
                            required
                            placeholder="AlfaLogQ@2026"
                            value={senhaProvisoria}
                            onChange={e => setSenhaProvisoria(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                          />
                          <p className="text-[9px] text-slate-500 mt-1 font-sans">
                            Senha forte para ativação e proteção da sua conta.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 7: Live Contract Draft Visualization */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3 text-slate-200 font-bold text-sm">
                        <FileText className="w-4 h-4 text-violet-400" />
                        <span>Minuta do Contrato Gerada em Tempo Real</span>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-lg font-mono text-[10px] text-slate-400 h-40 overflow-y-auto border border-slate-800/60 leading-relaxed whitespace-pre-wrap">
                        {gerarContratoTexto({
                          empresa: nomeEmpresa,
                          cnpj,
                          respNome,
                          email: respEmail,
                          plano: selectedPlano,
                          valor: PLANOS_PADRAO[selectedPlano].valor
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        Ao clicar em Registrar, você declara que concorda com os termos de licença de uso do software LogusQ descritos acima.
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-violet-900/20 hover:shadow-violet-600/10 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Building className="w-4 h-4" /> Registrar, Gerar ID e Ativar Cliente
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
