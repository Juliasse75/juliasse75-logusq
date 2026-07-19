import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies with a generous size limit
app.use(express.json({ limit: '15mb' }));

// Initialize Supabase Client if credentials are provided
const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.supabase_url_logusq_project || 
                    process.env.SUPABASE_URL_LOGUSQ_PROJECT ||
                    'https://qybdhrbynmmjceeuqrns.supabase.co';

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 
                        process.env.supabase_api_logusq_projetc || 
                        process.env.SUPABASE_API_LOGUSQ_PROJETC ||
                        process.env.supabase_api_logusq_project ||
                        process.env.SUPABASE_API_LOGUSQ_PROJECT ||
                        'sb_publishable_Em8MHqSzsNUHu4GiH6FJwQ_vU2YPs3G';

let supabase = null;

console.log('--- DETECÇÃO DE AMBIENTE SUPABASE ---');
console.log('Todas as chaves de ambiente disponíveis:', Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase') || k.toLowerCase().includes('logusq')));
if (process.env.SUPABASE_URL) console.log('✅ SUPABASE_URL carregada.');
if (process.env.supabase_url_logusq_project) console.log('✅ supabase_url_logusq_project carregada.');
if (process.env.SUPABASE_URL_LOGUSQ_PROJECT) console.log('✅ SUPABASE_URL_LOGUSQ_PROJECT carregada.');

if (process.env.SUPABASE_ANON_KEY) console.log('✅ SUPABASE_ANON_KEY carregada.');
if (process.env.supabase_api_logusq_projetc) console.log('✅ supabase_api_logusq_projetc carregada.');
if (process.env.SUPABASE_API_LOGUSQ_PROJETC) console.log('✅ SUPABASE_API_LOGUSQ_PROJETC carregada.');
if (process.env.supabase_api_logusq_project) console.log('✅ supabase_api_logusq_project carregada.');
if (process.env.SUPABASE_API_LOGUSQ_PROJECT) console.log('✅ SUPABASE_API_LOGUSQ_PROJECT carregada.');
console.log('------------------------------------');

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('🔌 LOGUSQ DATABASE: Conectado com sucesso ao Supabase!');
  } catch (err) {
    console.error('❌ LOGUSQ DATABASE: Erro ao conectar ao Supabase:', err);
  }
} else {
  console.warn('⚠️ LOGUSQ DATABASE: Chaves do Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) não estão configuradas.');
  console.warn('👉 O sistema operará em modo OFFLINE/FALLBACK com sincronização local integrada.');
}

// Initialize Google GenAI for Smart Romaneio Parsing
let ai = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn('⚠️ GEMINI: GEMINI_API_KEY não foi configurada. O importador inteligente usará fallback local.');
}

// =========================================================================
// HELPER FUNCTIONS & MIDDLEWARES
// =========================================================================

// Strong Password Validation Rule (Item 6)
function validateStrongPassword(password) {
  if (password.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
  if (!/[a-z]/.test(password)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).';
  return null;
}

// Automatic Block/Subscription Check (Item 5)
async function checkClientBlocked(email) {
  if (!supabase) return false; // offline bypass
  
  try {
    // Check if the user is associated with a blocked/unpaid client
    const { data: userRecord } = await supabase
      .from('usuarios')
      .select('perfil, email, empresa')
      .eq('email', email)
      .single();

    if (!userRecord) return false;

    // If the user is a client, check their status directly
    if (userRecord.perfil === 'CLIENTE') {
      const { data: clientRecord } = await supabase
        .from('clientes')
        .select('status, pagamento_confirmado')
        .eq('email', email)
        .single();
        
      if (clientRecord) {
        if (clientRecord.status === 'Bloqueado' || !clientRecord.pagamento_confirmado) {
          return true; // blocked!
        }
      }
    }
    
    // If the user is a motorista, find their associated client's status
    if (userRecord.perfil === 'MOTORISTA') {
      const { data: driverRecord } = await supabase
        .from('condutores')
        .select('cliente_email')
        .eq('email', email)
        .single();

      if (driverRecord && driverRecord.cliente_email) {
        const { data: clientRecord } = await supabase
          .from('clientes')
          .select('status, pagamento_confirmado')
          .eq('email', driverRecord.cliente_email)
          .single();
          
        if (clientRecord && (clientRecord.status === 'Bloqueado' || !clientRecord.pagamento_confirmado)) {
          return true; // blocked!
        }
      }
    }
  } catch (err) {
    console.error('Erro ao validar status da assinatura:', err);
  }
  return false;
}

// =========================================================================
// REAL WORLD MAPPING APIS (GEOCODING & STREET ROUTING)
// =========================================================================

// Nominatim Free Geocoding API Proxy (Item 4)
app.get('/api/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Falta o termo de busca (parâmetro "q").' });
    }

    console.log(`🔍 Nominatim: Geocodificando endereço real: "${q}"`);
    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LogusQ-Logistics-Platform (contact: cosmejuliasse@gmail.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim retornou status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
      return res.json(result);
    }

    res.status(404).json({ error: 'Endereço real não encontrado no OpenStreetMap.' });
  } catch (error) {
    console.error('❌ Erro no proxy de geocodificação Nominatim:', error);
    res.status(500).json({ error: 'Erro de conexão com o serviço de geocodificação gratuita.' });
  }
});

// OSRM Street-Aligned Driving Routing API Proxy
app.get('/api/route', async (req, res) => {
  try {
    const { coords } = req.query; // format: lng1,lat1;lng2,lat2;lng3,lat3...
    if (!coords) {
      return res.status(400).json({ error: 'Coordenadas não informadas.' });
    }

    console.log(`🗺️ OSRM: Traçando rota real pelas ruas para coordenadas: ${coords.substring(0, 50)}...`);

    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM retornou status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Erro no proxy de roteamento OSRM:', error);
    res.status(500).json({ error: 'Erro de conexão com o servidor de rotas reais.' });
  }
});

// =========================================================================
// SECURE USER AUTHENTICATION & SECURITY ENDPOINTS (Items 1, 3, 5, 6)
// =========================================================================

// Endpoint de Registro Seguro
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha, perfil, empresa, veiculo, cnpj, plano, respNome, cpf, rg, nascimento, telefone, cnh, categoriaCnh, vencCnh, clienteEmail } = req.body;
  
  // 1. Validação de senha forte (Item 6)
  const pwdErr = validateStrongPassword(senha);
  if (pwdErr) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: pwdErr });
  }

  if (!supabase) {
    return res.status(503).json({ 
      error: 'DATABASE_OFFLINE', 
      message: 'Não é possível registrar novos usuários. O banco de dados em nuvem (Supabase) não está configurado.' 
    });
  }

  try {
    // 2. Verificar duplicidade de e-mail
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'EMAIL_ALREADY_EXISTS', message: 'Este endereço de e-mail de acesso já está cadastrado no LogusQ.' });
    }

    // 3. Hash da senha de forma segura com Bcryptjs (Item 3)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(senha, salt);

    // 4. Inserir usuário
    const { error: userErr } = await supabase
      .from('usuarios')
      .insert({
        email,
        nome,
        perfil,
        empresa: empresa || null,
        veiculo: veiculo || null,
        nivel_acesso: perfil === 'MASTER' ? 'TOTAL' : 'PARCIAL',
        senha_hash: hashedPassword
      });

    if (userErr) throw userErr;

    // 5. Inserir tabela secundária caso necessário
    if (perfil === 'CLIENTE') {
      const { error: cliErr } = await supabase
        .from('clientes')
        .insert({
          id_cliente: `LOGUS-CLI-${Date.now().toString().slice(-6)}`,
          email,
          empresa,
          cnpj: cnpj || null,
          plano: plano || 'Start',
          status: 'Ativo',
          valor_plano: plano === 'Pro' ? 297.00 : (plano === 'Enterprise' ? 890.00 : 97.00),
          pagamento_confirmado: true,
          resp_nome: respNome || nome
        });
      if (cliErr) throw cliErr;
    } else if (perfil === 'MOTORISTA') {
      const { error: drvErr } = await supabase
        .from('condutores')
        .insert({
          id: `LOGUS-MOT-${Date.now().toString().slice(-6)}`,
          nome,
          cpf: cpf || `CPF-${Math.floor(Math.random() * 100000)}`,
          rg: rg || '',
          nascimento: nascimento || '',
          telefone: telefone || '',
          email,
          cnh: cnh || `CNH-${Math.floor(Math.random() * 100000)}`,
          categoria_cnh: categoriaCnh || 'B',
          venc_cnh: vencCnh || '01/01/2030',
          veiculo: veiculo || '',
          status: 'Ativo',
          cliente_email: clienteEmail || 'demo@logusq.com.br'
        });
      if (drvErr) throw drvErr;
    }

    res.json({ success: true, message: 'Conta criada com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar usuário no Supabase:', err);
    res.status(500).json({ error: 'DATABASE_ERROR', message: err.message || 'Erro de banco de dados ao salvar a conta.' });
  }
});

// Endpoint de Login Seguro com Validação de Bloqueio/Vencimento
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;

  // Verificação de Bypass Isolado (Item 1)
  const masterBypass = process.env.MASTER_PASSWORD;
  
  if (!supabase) {
    return res.status(503).json({ 
      error: 'DATABASE_OFFLINE', 
      message: 'Banco de dados em nuvem (Supabase) não configurado ou inacessível. O sistema está em modo de produção estrito e requer conexão direta.' 
    });
  }

  try {
    // 1. Buscar usuário
    const { data: user, error: userErr } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (userErr || !user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Usuário ou senha incorretos.' });
    }

    // 2. Verificar Bloqueio ou Licença Vencida (Item 5)
    const isBlocked = await checkClientBlocked(email);
    if (isBlocked) {
      return res.status(403).json({ 
        error: 'ACCOUNT_BLOCKED', 
        message: 'Acesso suspenso: Esta conta empresarial está suspensa ou com pagamentos de assinatura pendentes. Entre em contato com a administração financeira do LogusQ para regularização.' 
      });
    }

    // 3. Validar Senha de forma segura (Hash comparison) ou Bypass Isolado Seguro
    let passwordMatched = false;
    
    if (masterBypass && senha === masterBypass) {
      console.log(`🛡️ BYPASS: Login de suporte autorizado via Master Password para: ${email}`);
      passwordMatched = true;
    } else {
      passwordMatched = bcrypt.compareSync(senha, user.senha_hash);
    }

    if (!passwordMatched) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Usuário ou senha incorretos.' });
    }

    // Retorna dados do usuário autenticado de forma profissional
    res.json({
      success: true,
      user: {
        email: user.email,
        nome: user.nome,
        perfil: user.perfil,
        empresa: user.empresa,
        veiculo: user.veiculo,
        nivelAcesso: user.nivel_acesso,
        criadoEm: user.criado_em
      }
    });

  } catch (err) {
    console.error('Erro ao autenticar usuário no Supabase:', err);
    res.status(500).json({ error: 'DATABASE_ERROR', message: 'Erro inesperado no servidor de autenticação.' });
  }
});

// Endpoint para Alteração Segura de Senha
app.post('/api/auth/change-password', async (req, res) => {
  const { email, novaSenha } = req.body;

  // 1. Validar força da senha nova (Item 6)
  const pwdErr = validateStrongPassword(novaSenha);
  if (pwdErr) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: pwdErr });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'DATABASE_OFFLINE', message: 'Redefinição de senha indisponível sem conexão com o banco de dados.' });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(novaSenha, salt);

    const { error } = await supabase
      .from('usuarios')
      .update({ senha_hash: hashed })
      .eq('email', email);

    if (error) throw error;
    res.json({ success: true, message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ error: 'DATABASE_ERROR', message: 'Não foi possível salvar a nova senha.' });
  }
});

// =========================================================================
// OFFLINE-FIRST REAL-TIME SYNCHRONIZATION ENDPOINTS
// =========================================================================

// Pull Sync: Carrega todos os dados do banco Supabase para hidratar o LocalStorage do cliente
app.get('/api/sync/pull', async (req, res) => {
  const { email, perfil } = req.query;

  if (!supabase) {
    return res.status(503).json({ error: 'DATABASE_OFFLINE', message: 'Sincronização de dados indisponível sem conexão com o banco de dados.' });
  }
  if (!email) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'E-mail do usuário é obrigatório.' });
  }

  try {
    console.log(`📥 SYNC PULL: Sincronizando dados para ${email} (${perfil})`);

    let payload = {
      usuarios: [],
      clientes: [],
      veiculos: [],
      condutores: [],
      entregas: [],
      auditoriaLogs: [],
      mensagensSuporte: [],
      rotasAtivas: {}
    };

    // 1. Clientes & Usuários (Se for master, pega todos, se for cliente pega o seu)
    if (perfil === 'MASTER') {
      const { data: users } = await supabase.from('usuarios').select('*');
      const { data: clients } = await supabase.from('clientes').select('*');
      const { data: logs } = await supabase.from('auditoria_logs').select('*').order('data_hora', { ascending: false });
      const { data: msgs } = await supabase.from('mensagens_suporte').select('*').order('criado_em', { ascending: false });
      
      payload.usuarios = users || [];
      payload.clientes = clients || [];
      payload.auditoriaLogs = logs || [];
      payload.mensagensSuporte = msgs || [];
    }

    // 2. Se for CLIENTE ou se puxarmos escopo específico, carregamos frotas, motoristas, entregas e rotas
    let queryEmail = email;
    if (perfil === 'MOTORISTA') {
      // Find associated client email
      const { data: driver } = await supabase.from('condutores').select('cliente_email').eq('email', email).single();
      if (driver) {
        queryEmail = driver.cliente_email;
      }
    }

    // Carrega veículos do cliente
    const { data: veiculos } = await supabase.from('veiculos').select('*').eq('cliente_email', queryEmail);
    payload.veiculos = (veiculos || []).map(v => ({
      idVeiculo: v.id_veiculo,
      placa: v.placa,
      modelo: v.modelo,
      fabricante: v.fabricante,
      anoFabricacao: v.ano_fabricacao,
      anoModelo: v.ano_modelo,
      cor: v.cor,
      tipo: v.tipo,
      capacidadeKg: v.capacidade_kg,
      status: v.status,
      defeito: v.defeito
    }));

    // Carrega condutores do cliente
    const { data: condutores } = await supabase.from('condutores').select('*').eq('cliente_email', queryEmail);
    payload.condutores = (condutores || []).map(c => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      rg: c.rg,
      nascimento: c.nascimento,
      telefone: c.telefone,
      email: c.email,
      cnh: c.cnh,
      categoriaCnh: c.categoria_cnh,
      vencCnh: c.venc_cnh,
      veiculo: c.veiculo,
      status: c.status,
      clienteEmail: c.cliente_email
    }));

    // Carrega entregas do cliente
    const { data: entregas } = await supabase.from('entregas').select('*').eq('cliente_email', queryEmail);
    payload.entregas = (entregas || []).map(e => ({
      id: e.id,
      chave: e.chave,
      cliente: e.cliente,
      endereco: e.endereco,
      enderecoColeta: e.endereco_coleta,
      pontoReferencia: e.ponto_referencia,
      telefone: e.telefone,
      whatsapp: e.whatsapp,
      notaFiscal: e.nota_fiscal,
      fotoComprovante: e.foto_comprovante,
      dataEntregue: e.data_entregue,
      latitude: parseFloat(e.latitude),
      longitude: parseFloat(e.longitude),
      pesoMercadoriaKg: e.peso_mercadoria_kg,
      tipoOperacao: e.tipo_operacao,
      status: e.status,
      observacao: e.observacao,
      motoristaNome: e.motorista_nome
    }));

    // Carrega rotas ativas
    const { data: activeRouteRecord } = await supabase
      .from('rotas_ativas')
      .select('rotas_json')
      .eq('cliente_email', queryEmail)
      .order('id', { ascending: false })
      .limit(1);

    if (activeRouteRecord && activeRouteRecord.length > 0) {
      payload.rotasAtivas = activeRouteRecord[0].rotas_json;
    }

    res.json({ success: true, mode: 'supabase', data: payload });
  } catch (err) {
    console.error('Erro na sincronização de download:', err);
    res.status(500).json({ error: 'SYNC_ERROR', message: 'Erro ao baixar dados do banco de dados.' });
  }
});

// Push Sync: Recebe atualizações em lote ou pontuais do cliente e sincroniza no Supabase
app.post('/api/sync/push', async (req, res) => {
  const { email, perfil, table, records } = req.body;

  if (!supabase) {
    return res.status(503).json({ error: 'DATABASE_OFFLINE', message: 'Envio de dados indisponível sem conexão com o banco de dados.' });
  }

  try {
    console.log(`📤 SYNC PUSH: Recebendo ${records?.length || 0} registros da tabela "${table}" de ${email}`);

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    let queryEmail = email;
    if (perfil === 'MOTORISTA') {
      const { data: driver } = await supabase.from('condutores').select('cliente_email').eq('email', email).single();
      if (driver) queryEmail = driver.cliente_email;
    }

    if (table === 'veiculos') {
      for (const v of records) {
        await supabase.from('veiculos').upsert({
          id_veiculo: v.idVeiculo,
          placa: v.placa,
          modelo: v.modelo,
          fabricante: v.fabricante || null,
          ano_fabricacao: v.anoFabricacao || null,
          ano_modelo: v.anoModelo || null,
          cor: v.cor || null,
          tipo: v.tipo,
          capacidade_kg: v.capacidadeKg,
          status: v.status || 'Disponivel',
          defeito: v.defeito || null,
          cliente_email: queryEmail
        });
      }
    } else if (table === 'condutores') {
      for (const c of records) {
        await supabase.from('condutores').upsert({
          id: c.id,
          nome: c.nome,
          cpf: c.cpf,
          rg: c.rg || null,
          nascimento: c.nascimento || null,
          telefone: c.telefone || null,
          email: c.email,
          cnh: c.cnh,
          categoria_cnh: c.categoriaCnh,
          venc_cnh: c.vencCnh,
          veiculo: c.veiculo || '',
          status: c.status || 'Ativo',
          cliente_email: queryEmail
        });
      }
    } else if (table === 'entregas') {
      for (const e of records) {
        await supabase.from('entregas').upsert({
          id: e.id,
          chave: e.chave,
          cliente: e.cliente,
          endereco: e.endereco,
          endereco_coleta: e.enderecoColeta || null,
          ponto_referencia: e.pontoReferencia || null,
          telefone: e.telefone || null,
          whatsapp: e.whatsapp || null,
          nota_fiscal: e.notaFiscal || null,
          foto_comprovante: e.fotoComprovante || null,
          data_entregue: e.dataEntregue || null,
          latitude: e.latitude,
          longitude: e.longitude,
          peso_mercadoria_kg: e.pesoMercadoriaKg || 10,
          tipo_operacao: e.tipoOperacao || 'Entrega',
          status: e.status || 'Pendente',
          observacao: e.observacao || null,
          motorista_nome: e.motoristaNome || null,
          cliente_email: queryEmail
        });
      }
    } else if (table === 'rotas_ativas') {
      // Rotas ativas é salva como um único documento JSON por cliente
      await supabase.from('rotas_ativas').upsert({
        cliente_email: queryEmail,
        rotas_json: records[0] // contains active routes map
      }, { onConflict: 'cliente_email' });
    } else if (table === 'auditoria_logs') {
      for (const log of records) {
        await supabase.from('auditoria_logs').upsert({
          id: log.id,
          operador_email: log.operadorEmail || email,
          acao: log.acao,
          descricao: log.descricao || '',
          modulo: log.modulo || 'Geral',
          status: log.status || 'Sucesso'
        });
      }
    } else if (table === 'mensagens_suporte') {
      for (const msg of records) {
        await supabase.from('mensagens_suporte').upsert({
          id: msg.id,
          nome: msg.nome,
          email: msg.email,
          mensagem: msg.mensagem,
          respondido: msg.respondido || false,
          data_envio: msg.dataEnvio
        });
      }
    } else if (table === 'clientes') {
      for (const cl of records) {
        await supabase.from('clientes').upsert({
          id_cliente: cl.idCliente,
          email: cl.email,
          empresa: cl.empresa,
          cnpj: cl.cnpj || null,
          plano: cl.plano || 'Start',
          status: cl.status || 'Ativo',
          valor_plano: cl.valorPlano || 97.00,
          pagamento_confirmado: cl.pagamentoConfirmado !== undefined ? cl.pagamentoConfirmado : true,
          resp_nome: cl.respNome
        });
      }
    }

    res.json({ success: true, count: records.length });
  } catch (err) {
    console.error('Erro ao sincronizar dados de upload:', err);
    res.status(500).json({ error: 'SYNC_ERROR', message: 'Erro ao salvar alterações no banco de dados.' });
  }
});

// =========================================================================
// AI IMPORT PARSING WITH GEMINI 3.5 FLASH
// =========================================================================
app.post('/api/import/parse', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, type, rawText } = req.body;

    if (!ai) {
      return res.status(400).json({
        error: 'API_KEY_MISSING',
        message: 'A chave de API do Gemini não está configurada neste ambiente. Por favor, adicione GEMINI_API_KEY no arquivo .env para ativar o importador inteligente.'
      });
    }

    let contents = [];
    let typeInstructions = '';
    
    if (type === 'veiculos') {
      typeInstructions = `Você é um assistente de IA especialista em logística de frotas brasileiras. Extraia os veículos do documento. Retorne APENAS um array JSON contendo objetos com:
- "idVeiculo": identificador único interno ou placa
- "placa": placa formatada (ex: "ABC-1234" ou padrão Mercosul)
- "modelo": modelo (ex: "Fiorino", "Van")
- "fabricante": marca (ex: "Fiat")
- "anoFabricacao": string (ex: "2021")
- "anoModelo": string (ex: "2022")
- "cor": cor (ex: "Branco")
- "tipo": obrigatoriamente um destes: "Caminhão Pesado", "Van", "Picape 4x4", "Carro Leve", "Motocicleta"
- "capacidadeKg": número inteiro de capacidade em kg`;
    } else if (type === 'condutores') {
      typeInstructions = `Você é um assistente de IA especialista em escala de motoristas. Extraia os motoristas do documento. Retorne APENAS um array JSON contendo objetos com:
- "nome": nome completo
- "cpf": CPF formatado
- "rg": RG
- "nascimento": data de nascimento formatada
- "telefone": telefone
- "email": e-mail corporativo ou pessoal
- "cnh": número da CNH
- "categoriaCnh": categoria (A, B, C, D, E)
- "vencCnh": validade da CNH
- "veiculo": placa do veiculo atribuído se houver`;
    } else if (type === 'entregas') {
      typeInstructions = `Você é um assistente de IA especialista em roteirização logística. Extraia a lista de pontos de entrega/coleta do romaneio. Retorne APENAS um array JSON contendo objetos com:
- "chave": identificador de faturamento ou NF (ex: "NF-123")
- "cliente": nome do destinatário
- "endereco": endereço COMPLETO (rua, número, bairro, cidade, estado, cep). Tente extrair com a máxima precisão de detalhes.
- "pesoMercadoriaKg": peso bruto em kg (número, ex: 25. Padrão 15 se indisponível)
- "tipoOperacao": "Entrega" ou "Coleta"`;
    }

    const systemPrompt = `${typeInstructions}
Retorne estritamente um array JSON de objetos válidos, sem formatação markdown, sem tags \`\`\`json ou explicações. Apenas a estrutura JSON pura.`;

    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64
        }
      });
      contents.push(systemPrompt);
    } else if (rawText) {
      contents.push(`Texto colado pelo usuário:\n\n${rawText}\n\nInstrução:\n${systemPrompt}`);
    } else {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Nenhum arquivo ou texto fornecido.' });
    }

    console.log(`Chamando Gemini 3.5 Flash para analisar importação do tipo: ${type}...`);
    
    let response;
    let retries = 3;
    let delay = 1000;
    
    for (let i = 0; i < retries; i++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: contents,
          config: {
            responseMimeType: 'application/json'
          }
        });
        break;
      } catch (error) {
        const errorStr = (error.message || '').toString();
        const isTransient = 
          errorStr.includes('503') || 
          errorStr.includes('429') || 
          errorStr.includes('UNAVAILABLE') || 
          errorStr.includes('RESOURCE_EXHAUSTED') ||
          error.status === 503 || 
          error.status === 429;
          
        if (isTransient && i < retries - 1) {
          console.warn(`Gemini API retornou erro temporário. Tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }

    const responseText = response.text || '';
    let cleanedJson = responseText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedArray = JSON.parse(cleanedJson);
    res.json({ data: parsedArray });

  } catch (error) {
    console.error('Erro no parser inteligente Gemini:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message || 'Erro no servidor ao processar o documento.' });
  }
});

// =========================================================================
// VITE DEV SERVER & PRODUCTION ASSET SERVING
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Iniciando em modo de DESENVOLVIMENTO com middleware do Vite...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Iniciando em modo de PRODUÇÃO...');
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LogusQ Servidor Integrado rodando em http://localhost:${PORT}`);
  });
}

startServer();
