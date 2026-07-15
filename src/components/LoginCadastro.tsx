import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { PlanosSaaS, PLANOS_PADRAO } from '../types';
import { Shield, Key, Truck, Building, FileText, CheckCircle, Download, HelpCircle } from 'lucide-react';

interface LoginCadastroProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginCadastro({ onLoginSuccess }: LoginCadastroProps) {
  const [isCadastro, setIsCadastro] = useState(false);
  
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
              onClick={() => { setIsCadastro(false); setCadastroSucesso(null); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all border-b-2 ${
                !isCadastro 
                  ? 'text-violet-400 border-violet-500 bg-slate-900/30' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Acessar Painel (Login)
            </button>
            <button
              onClick={() => { setIsCadastro(true); setCadastroSucesso(null); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all border-b-2 ${
                isCadastro 
                  ? 'text-violet-400 border-violet-500 bg-slate-900/30' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Auto-cadastro de Cliente (Self-Service)
            </button>
          </div>

          <div className="p-8">
            
            {/* LOGIN FORM */}
            {!isCadastro ? (
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

                {/* Demo Accounts Panel */}
                <div className="mt-8 border-t border-slate-800/60 pt-6">
                  <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs font-semibold">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <span>Acesso Rápido de Demonstração (Demo)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
                    <button 
                      onClick={() => { setLoginEmail('ceo@logusq.com.br'); setLoginSenha('LogusQ@Master2026'); }}
                      className="bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-left transition-colors"
                    >
                      <div className="text-violet-400 font-bold">1. CEO MASTER</div>
                      <div className="text-slate-400 text-[10px]">ceo@logusq.com.br</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Admin Geral</div>
                    </button>
                    <button 
                      onClick={() => { setLoginEmail('rodrigo@translog.com.br'); setLoginSenha('DemoClient@123'); }}
                      className="bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-left transition-colors"
                    >
                      <div className="text-blue-400 font-bold">2. GESTOR CLIENTE</div>
                      <div className="text-slate-400 text-[10px]">rodrigo@translog.com.br</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">TransLog BH</div>
                    </button>
                    <button 
                      onClick={() => { setLoginEmail('anaclara.cs@logusq.com.br'); setLoginSenha('LogusQ@Colab2026'); }}
                      className="bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-left transition-colors"
                    >
                      <div className="text-emerald-400 font-bold">3. COLABORADOR</div>
                      <div className="text-slate-400 text-[10px]">anaclara.cs@logusq.com.br</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">CS / RH Interno</div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              
              /* SELF-SERVICE REGISTRATION */
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
