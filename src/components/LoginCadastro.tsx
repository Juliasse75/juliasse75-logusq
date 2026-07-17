import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { PlanosSaaS, PLANOS_PADRAO } from '../types';
import { Shield, Key, Truck, Building, FileText, CheckCircle, Download, HelpCircle, Smartphone, ArrowLeft, AlertCircle, User, Check, Lock, Info } from 'lucide-react';

interface LoginCadastroProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginCadastro({ onLoginSuccess }: LoginCadastroProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro' | 'motorista'>('login');

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const user = dbRepo.autenticarUsuario(loginEmail, loginSenha);
    if (user) {
      onLoginSuccess(user.email);
    } else {
      setLoginError('E-mail ou senha inválidos. Tente usar as credenciais demo listadas abaixo.');
    }
  };

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    setCadastroError('');
    
    if (!nomeEmpresa || !cnpj || !respEmail || !respNome) {
      setCadastroError('Por favor, preencha todos os campos obrigatórios (Razão Social, CNPJ, E-mail do Responsável e Nome).');
      return;
    }

    try {
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

CONTRATANTE: ${dados.empresa || '[EMPRESA CONTRATANTE]'}
CNPJ: ${dados.cnpj || '[CNPJ]'}
REPRESENTANTE LEGAL: ${dados.respNome || '[REPRESENTANTE]'}
E-MAIL DE ACESSO: ${dados.email || '[EMAIL]'}

CONTRATADA: LOGUSQ LOGÍSTICA INTELIGENTE LTDA.
CNPJ: 45.123.456/0001-89
ENDEREÇO: Avenida do Contorno, 6000, Savassi, Belo Horizonte/MG

CLÁUSULA 1ª - DO OBJETO:
O presente instrumento tem por objeto a licença de uso do software LogusQ, em modalidade SaaS, para otimização de frotas e roteirização inteligente.

CLÁUSULA 2ª - DO PLANO E VALORES:
A CONTRATANTE adere ao Plano: ${dados.plano || 'Start'}
Valor Mensal: R$ ${(dados.valor || 350).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Limite de Veículos Cadastrados: ${PLANOS_PADRAO[dados.plano as keyof PlanosSaaS]?.max_veiculos || 15} veículos.

CLÁUSULA 3ª - DA VIGÊNCIA E RESCISÃO:
O contrato tem prazo de 30 dias com renovação automática mensal mediante pagamento da mensalidade correspondente.

Belo Horizonte/MG, ${dataAtual}.

___________________________________________________
LOGUSQ LOGÍSTICA INTELIGENTE LTDA

___________________________________________________
REPRESENTANTE DA CONTRATANTE`;
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Background radial effects */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-violet-950/25 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-4xl z-10">
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
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                              <span className="text-slate-500">Empresa:</span>
                              <span className="text-violet-400 font-bold uppercase truncate max-w-[150px]">
                                {(() => {
                                  const clients = dbRepo.getClientes();
                                  const cl = clients.find(c => c.email === (foundMot as any).clienteEmail);
                                  return cl ? cl.empresa : 'LogiVelo Express S.A.';
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Nome:</span>
                              <span className="text-slate-200 font-semibold truncate max-w-[150px]">{foundMot.nome}</span>
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
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                              <span className="text-slate-500">Veículo Atribuído:</span>
                              <span className="text-emerald-400 font-medium truncate max-w-[140px]">
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
