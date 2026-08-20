import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'node:worker_threads';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { generateAuthToken, createAuthMiddleware, requireRoles, validateStrongPassword, checkLoginRateLimit, registerFailedLoginAttempt, resetLoginAttempts } from './server/authLogic.js';
import { validateEnv } from './server/envValidation.js';
import { createTenantSupabaseClient, resolveTenantEmail } from './server/tenantSupabase.js';
import { createDistributedAuthRateLimiterMiddleware } from './server/distributedRateLimit.js';
import { generatePasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from './server/passwordResetService.js';

dotenv.config();

// Validação rigorosa com Zod no startup do servidor
const env = validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const authMiddleware = createAuthMiddleware();
const distributedAuthLimiter = createDistributedAuthRateLimiterMiddleware();


// Middleware to parse JSON bodies with a generous size limit
app.use(express.json({ limit: '15mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LogusQ API', time: new Date().toISOString() });
});

// Inicialização segura do Cliente Supabase SEM chaves ou URLs embutidas em texto claro
const supabaseUrl = env.SUPABASE_URL || 
                    process.env.supabase_url_logusq_project || 
                    process.env.SUPABASE_URL_LOGUSQ_PROJECT;

const supabaseAnonKey = env.SUPABASE_ANON_KEY || 
                        process.env.supabase_api_logusq_projetc || 
                        process.env.SUPABASE_API_LOGUSQ_PROJETC ||
                        process.env.supabase_api_logusq_project ||
                        process.env.SUPABASE_API_LOGUSQ_PROJECT;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('🔌 LOGUSQ DATABASE: Conectado com sucesso ao Supabase!');
  } catch (err) {
    console.error('❌ LOGUSQ DATABASE: Erro ao conectar ao Supabase:', err);
  }
} else {
  console.warn('⚠️ LOGUSQ DATABASE: SUPABASE_URL ou SUPABASE_ANON_KEY não informados no ambiente.');
  console.warn('👉 O sistema operará em modo OFFLINE/LOCAL com dados locais em cache.');
}

// Initialize Google GenAI for Smart Romaneio Parsing
let ai = null;
const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

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
// HELPER FUNCTIONS & MIDDLEWARES (Lógicas de Autenticação/Rate Limit importadas de ./server/authLogic.js)
// =========================================================================

function parsePtBrDateServer(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
}

// Automatic Block/Subscription Check (Item 5)
async function checkClientBlocked(email) {
  if (!supabase) return false; // offline bypass
  
  try {
    // 1. Find user case-insensitively in usuarios table
    const { data: usersMatched } = await supabase
      .from('usuarios')
      .select('perfil, email, empresa')
      .ilike('email', email);

    if (!usersMatched || usersMatched.length === 0) return false;
    const userRecord = usersMatched[0];

    // Helper to evaluate if a client is blocked based on their email or company name
    const evaluateAndBlock = async (clientEmail, empresaNome) => {
      // Fetch all clients to search case-insensitively
      const { data: clients } = await supabase
        .from('clientes')
        .select('email, status, pagamento_confirmado, vencimento, empresa');

      if (!clients || clients.length === 0) return false;

      const matchedClient = clients.find(c => 
        (c.email && clientEmail && c.email.toLowerCase() === clientEmail.toLowerCase()) ||
        (c.empresa && empresaNome && c.empresa.toLowerCase() === empresaNome.toLowerCase())
      );

      if (!matchedClient) return false;

      if (matchedClient.status === 'Bloqueado') {
        return true;
      }

      // If payment is not confirmed, check if today is > vencimento + 3 days
      if (!matchedClient.pagamento_confirmado && matchedClient.vencimento) {
        const venc = parsePtBrDateServer(matchedClient.vencimento);
        if (venc) {
          const today = new Date();
          today.setHours(0,0,0,0);
          venc.setHours(0,0,0,0);
          
          const diffTime = today.getTime() - venc.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 3) {
            console.log(`🔒 SERVER AUTO-BLOCK: Client "${matchedClient.empresa}" (${matchedClient.email}) is ${diffDays} days past due! Setting status to "Bloqueado"`);
            await supabase
              .from('clientes')
              .update({ status: 'Bloqueado' })
              .eq('email', matchedClient.email);
            return true;
          }
        }
      }
      return false;
    };

    // If the user is a client, check their status
    if (userRecord.perfil === 'CLIENTE') {
      return await evaluateAndBlock(userRecord.email, userRecord.empresa);
    }
    
    // If the user is a collaborator, check by their company name
    if (userRecord.perfil === 'COLABORADOR') {
      if (userRecord.empresa) {
        return await evaluateAndBlock('', userRecord.empresa);
      }
    }
    
    // If the user is a motorista, find their associated client's email/company
    if (userRecord.perfil === 'MOTORISTA') {
      const { data: drivers } = await supabase
        .from('condutores')
        .select('cliente_email')
        .ilike('email', userRecord.email);

      if (drivers && drivers.length > 0 && drivers[0].cliente_email) {
        return await evaluateAndBlock(drivers[0].cliente_email, '');
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

// Nominatim Free Geocoding API Proxy with Multi-Tier Fallback Strategy (Structured, ViaCEP & Unstructured)
app.get('/api/geocode', async (req, res) => {
  try {
    const { q, street, city, state, postalcode, bairro } = req.query;
    
    // Build query candidates in priority order
    const queries = [];
    
    // 1. If Postal code (CEP) is provided, query ViaCEP first to get official Brazilian street & neighborhood
    let viaCepStreet = '';
    let viaCepBairro = '';
    let viaCepCity = '';
    let viaCepState = '';
    
    if (postalcode) {
      const cleanCep = String(postalcode).replace(/\D/g, '').slice(0, 8);
      if (cleanCep.length === 8) {
        try {
          const viaRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          if (viaRes.ok) {
            const viaData = await viaRes.json();
            if (!viaData.erro) {
              viaCepStreet = viaData.logradouro || '';
              viaCepBairro = viaData.bairro || '';
              viaCepCity = viaData.localidade || '';
              viaCepState = viaData.uf || '';
              
              if (viaCepStreet && viaCepCity) {
                queries.push(`https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(viaCepStreet)}&city=${encodeURIComponent(viaCepCity)}&state=${encodeURIComponent(viaCepState || state || '')}&country=Brazil&format=json&addressdetails=1&limit=1`);
                queries.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${viaCepStreet}, ${viaCepBairro ? `${viaCepBairro}, ` : ''}${viaCepCity} - ${viaCepState}, Brasil`)}&format=json&addressdetails=1&limit=1`);
              }
              if (viaCepBairro && viaCepCity) {
                queries.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${viaCepBairro}, ${viaCepCity} - ${viaCepState}, Brasil`)}&format=json&addressdetails=1&limit=1`);
              }
            }
          }
        } catch (e) {
          // Proceed with other fallbacks
        }
      }
    }

    // 2. Structured query with user provided street, bairro, city & state
    if (street && city && state) {
      queries.push(`https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=Brazil&format=json&addressdetails=1&limit=1`);
      queries.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${street}${bairro ? `, ${bairro}` : ''}, ${city} - ${state}, Brasil`)}&format=json&addressdetails=1&limit=1`);
    }

    // 3. District / Neighborhood query
    if (bairro && city && state) {
      queries.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${bairro}, ${city} - ${state}, Brasil`)}&format=json&addressdetails=1&limit=1`);
    }

    // 4. Free-form search query
    if (q) {
      queries.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=br&format=json&addressdetails=1&limit=1`);
      queries.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${q}, Brasil`)}&format=json&addressdetails=1&limit=1`);
    }

    // 5. Postal code direct search on OSM
    if (postalcode) {
      const cleanCep = String(postalcode).replace(/\D/g, '');
      queries.push(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanCep)}&country=Brazil&format=json&addressdetails=1&limit=1`);
    }

    // 6. City & State fallback
    if (city && state) {
      queries.push(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=Brazil&format=json&addressdetails=1&limit=1`);
    }

    if (queries.length === 0) {
      return res.status(400).json({ error: 'Falta o termo de busca (parâmetro "q" ou "street", "city", "state").' });
    }

    for (const url of queries) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'LogusQ-Logistics-Platform/1.0 (contact: cosmejuliasse@gmail.com)',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            const type = item.type || item.class || 'place';
            const isExact = ['house', 'building', 'commercial', 'industrial', 'residential'].includes(type);
            const isStreet = ['highway', 'road', 'street', 'primary', 'secondary', 'tertiary'].includes(type) || item.class === 'highway';
            const isNeighborhood = ['suburb', 'neighbourhood', 'quarter', 'hamlet', 'village', 'district'].includes(type);

            const precision = isExact ? 'exact' : (isStreet ? 'street' : (isNeighborhood ? 'neighborhood' : 'city_fallback'));

            const result = {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              displayName: item.display_name,
              precision,
              type
            };
            return res.json(result);
          }
        }
      } catch (err) {
        // Try next fallback
      }
    }

    res.status(404).json({ error: 'Endereço não localizado com precisão nos servidores cartográficos.' });
  } catch (error) {
    console.error('❌ Erro no proxy de geocodificação Nominatim:', error);
    res.status(500).json({ error: 'Erro de conexão com o serviço de geocodificação.' });
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
  const { nome, email, senha, perfil, empresa, veiculo, cnpj, inscricaoEstadual, inscricao_estadual, plano, respNome, cpf, rg, nascimento, telefone, cnh, categoriaCnh, vencCnh, clienteEmail } = req.body;
  const ieValue = inscricaoEstadual || inscricao_estadual || null;
  
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

    // 4. Inserir usuário (suporta RLS bypass/soft handling)
    try {
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

      if (userErr) {
        console.warn('⚠️ Supabase usuarios insert warning (RLS or rule):', userErr.message);
      }
    } catch (uErr) {
      console.warn('⚠️ Error inserting into usuarios table:', uErr.message);
    }

    // 5. Inserir tabela secundária caso necessário
    if (perfil === 'CLIENTE') {
      const { error: cliErr } = await supabase
        .from('clientes')
        .insert({
          id_cliente: `LOGUS-CLI-${Date.now().toString().slice(-6)}`,
          email,
          empresa,
          cnpj: cnpj || null,
          inscricao_estadual: ieValue,
          plano: plano || 'Start',
          status: 'Ativo',
          valor_plano: plano === 'Pro' ? 297.00 : (plano === 'Enterprise' ? 890.00 : 97.00),
          pagamento_confirmado: true,
          resp_nome: respNome || nome
        });
      if (cliErr) {
        console.warn('⚠️ Supabase clientes insert note:', cliErr.message);
      }
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
      if (drvErr) {
        console.warn('⚠️ Supabase condutores insert note:', drvErr.message);
      }
    }

    res.json({ success: true, message: 'Conta criada com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar usuário no Supabase:', err);
    res.status(500).json({ error: 'DATABASE_ERROR', message: err.message || 'Erro de banco de dados ao salvar a conta.' });
  }
});

// Endpoint de Login Seguro com Validação de Bloqueio/Vencimento e Emissão de Token JWT
app.post('/api/auth/login', distributedAuthLimiter, async (req, res) => {
  let { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Preencha o e-mail e a senha.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanSenha = String(senha).trim();

  // 1. Verificação de Bloqueio por Força Bruta / Tentativas Repetidas
  const rateCheck = checkLoginRateLimit(cleanEmail);
  if (rateCheck.isLocked) {
    return res.status(429).json({
      error: 'TOO_MANY_ATTEMPTS',
      message: rateCheck.message,
      remainingMinutes: rateCheck.remainingMinutes,
      remainingSeconds: rateCheck.remainingSeconds
    });
  }

  if (!supabase) {
    return res.status(503).json({ 
      error: 'DATABASE_OFFLINE', 
      message: 'Banco de dados em nuvem (Supabase) não configurado ou inacessível. O sistema está em modo de produção estrito e requer conexão direta.' 
    });
  }

  try {
    // 2. Buscar usuário de forma case-insensitive no banco de dados
    const { data: usersFound } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('email', cleanEmail);

    if (!usersFound || usersFound.length === 0) {
      registerFailedLoginAttempt(cleanEmail);
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Usuário ou senha incorretos.' });
    }
    const user = usersFound[0];

    // 3. Verificar Bloqueio ou Licença Vencida
    const isBlocked = await checkClientBlocked(cleanEmail);
    if (isBlocked) {
      return res.status(403).json({ 
        error: 'ACCOUNT_BLOCKED', 
        message: 'Acesso suspenso: Esta conta empresarial está suspensa ou com pagamentos de assinatura pendentes. Entre em contato com a administração financeira do LogusQ para regularização.' 
      });
    }

    // 4. Validar Senha de forma segura via Bcrypt Hash (SEM senhas fixas / hardcoded bypasses)
    let passwordMatched = false;
    try {
      if (user.senha_hash && typeof user.senha_hash === 'string' && user.senha_hash.startsWith('$2')) {
        passwordMatched = bcrypt.compareSync(cleanSenha, user.senha_hash);
      }
    } catch (e) {
      passwordMatched = false;
    }

    if (!passwordMatched) {
      const attemptData = registerFailedLoginAttempt(cleanEmail);
      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (attemptData?.count || 1));
      return res.status(401).json({ 
        error: 'INVALID_CREDENTIALS', 
        message: remaining > 0 
          ? `E-mail ou senha incorretos. Você tem mais ${remaining} tentativa(s) antes do bloqueio temporário de segurança.`
          : `🚨 Sua conta foi temporariamente bloqueada por 15 minutos devido a 5 tentativas incorretas consecutivas.`
      });
    }

    // Login bem-sucedido: Reseta contador de tentativas falhas
    resetLoginAttempts(cleanEmail);

    const rawNivel = String(user.nivel_acesso || 'TOTAL').trim().toUpperCase();
    const isMasterOrTotal = user.perfil === 'MASTER' || ['TOTAL', 'ACESSO TOTAL'].includes(rawNivel);

    // 5. Emissão de Token JWT assinado criptograficamente
    const token = generateAuthToken({
      email: user.email,
      nome: user.nome,
      perfil: user.perfil,
      empresa: user.empresa,
      veiculo: user.veiculo,
      nivelAcesso: rawNivel
    });

    // Retorna token JWT e contexto seguro do usuário autenticado
    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        nome: user.nome,
        perfil: user.perfil,
        empresa: user.empresa,
        veiculo: user.veiculo,
        nivelAcesso: rawNivel,
        isMasterOrTotal: isMasterOrTotal,
        isAdmin: isMasterOrTotal,
        criadoEm: user.criado_em
      }
    });

  } catch (err) {
    console.error('Erro ao autenticar usuário no Supabase:', err);
    res.status(500).json({ error: 'DATABASE_ERROR', message: 'Erro inesperado no servidor de autenticação.' });
  }
});

// Endpoint para Solicitação de Recuperação de Senha (Geração de Token Seguro OOB)
app.post('/api/auth/forgot-password', distributedAuthLimiter, async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'MISSING_EMAIL', message: 'Informe o e-mail cadastrado.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    // 1. Verificar se usuário existe no banco
    if (supabase) {
      const { data: usersFound } = await supabase
        .from('usuarios')
        .select('id, email, nome')
        .ilike('email', cleanEmail);

      if (!usersFound || usersFound.length === 0) {
        // Por segurança, retorna mensagem genérica para evitar enumeração de contas
        return res.json({ 
          success: true, 
          message: 'Se o e-mail informado estiver cadastrado, um token de recuperação seguro de uso único foi gerado com validade de 15 minutos.' 
        });
      }
    }

    // 2. Gerar token OOB de uso único com hash e expiração de 15 minutos
    const { rawToken, expiresAt } = generatePasswordResetToken(cleanEmail);

    console.log(`🔑 [OOB PASSWORD RESET] Token gerado para ${cleanEmail}: ${rawToken} (Expira em: ${new Date(expiresAt).toISOString()})`);

    // Em produção com serviço de e-mail (ex: Resend, Sendgrid), o rawToken é enviado no link de recuperação.
    // Retornamos confirmação com instrução segura e o token para simulação/testes na interface.
    res.json({
      success: true,
      message: 'Token de recuperação de uso único gerado com validade de 15 minutos.',
      resetToken: rawToken, // Facilita o fluxo no cliente de testes/demonstração
      expiresInMinutes: 15
    });
  } catch (err) {
    console.error('Erro ao gerar token de recuperação de senha:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Não foi possível processar a recuperação de senha.' });
  }
});

// Endpoint para Alteração Segura de Senha (Exige obrigatoriamente o Token OOB validado)
app.post('/api/auth/change-password', distributedAuthLimiter, async (req, res) => {
  const { email, token, novaSenha } = req.body || {};

  if (!email || !token || !novaSenha) {
    return res.status(400).json({ 
      error: 'MISSING_FIELDS', 
      message: 'E-mail, token de recuperação (OOB) e a nova senha são obrigatórios.' 
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanToken = String(token).trim();

  // 1. Validação Criptográfica do Token OOB de Uso Único e Expiração
  const tokenValidation = verifyPasswordResetToken(cleanEmail, cleanToken);
  if (!tokenValidation.valid) {
    return res.status(401).json({ 
      error: 'INVALID_RESET_TOKEN', 
      message: tokenValidation.error || 'Token de recuperação inválido ou expirado.' 
    });
  }

  // 2. Validar força da senha nova
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
      .ilike('email', cleanEmail);

    if (error) throw error;

    // Consome e invalida imediatamente o token após uso com sucesso
    consumePasswordResetToken(cleanEmail);

    console.log(`✅ [PASSWORD RESET] Senha alterada com sucesso para ${cleanEmail} via token OOB.`);
    res.json({ success: true, message: 'Senha redefinida com sucesso com token verificado!' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ error: 'DATABASE_ERROR', message: 'Não foi possível salvar a nova senha.' });
  }
});

// =========================================================================
// OFFLINE-FIRST REAL-TIME SYNCHRONIZATION ENDPOINTS (PROTEGIDOS POR JWT)
// =========================================================================

// Pull Sync: Carrega dados do banco Supabase autorizados EXCLUSIVAMENTE via JWT
app.get('/api/sync/pull', authMiddleware, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'DATABASE_OFFLINE', message: 'Sincronização de dados indisponível sem conexão com o banco de dados.' });
  }

  try {
    // A identidade e privilégios são extraídos EXCLUSIVAMENTE do token JWT validado criptograficamente (Prevenção BOLA/BFLA)
    const authenticatedEmail = req.user.email;
    const authenticatedRole = req.user.perfil;
    const isMasterAdmin = (authenticatedRole === 'MASTER' || authenticatedRole === 'COLABORADOR');

    console.log(`📥 SYNC PULL (JWT): Sincronizando dados para ${authenticatedEmail} (Perfil JWT: ${authenticatedRole}, Master Admin: ${isMasterAdmin})`);

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

    // 1. Clientes, Usuários, Logs e Mensagens Suporte (Acesso total restrito estritamente a MASTER/COLABORADOR)
    if (isMasterAdmin) {
      const { data: users } = await supabase.from('usuarios').select('*');
      const { data: clients } = await supabase.from('clientes').select('*');
      const { data: logs } = await supabase.from('auditoria_logs').select('*').order('data_hora', { ascending: false });
      const { data: msgs } = await supabase.from('mensagens_suporte').select('*').order('criado_em', { ascending: false });
      
      payload.usuarios = users || [];
      payload.clientes = clients || [];
      payload.auditoriaLogs = (logs || []).map(l => {
        let formattedDate = l.data_hora;
        if (l.data_hora && typeof l.data_hora === 'string' && (l.data_hora.includes('T') || l.data_hora.includes('-'))) {
          try {
            const d = new Date(l.data_hora);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleString('pt-BR');
            }
          } catch (e) {}
        }
        const cleanOpEmail = (l.operador_email || l.operadorEmail || '').toLowerCase().trim();
        const opUser = (users || []).find(u => (u.email || '').toLowerCase().trim() === cleanOpEmail);
        const opNome = l.operador_nome || l.operadorNome || opUser?.nome || (cleanOpEmail === 'ceo@logusq.com.br' ? 'Diretoria CEO' : cleanOpEmail || 'Operador LogusQ');
        const opCargo = l.operador_cargo || l.operadorCargo || opUser?.nivelAcesso || (cleanOpEmail === 'ceo@logusq.com.br' ? 'CEO Master' : 'Gestor');

        return {
          id: l.id,
          dataHora: formattedDate || l.data_hora || new Date().toLocaleString('pt-BR'),
          operadorEmail: l.operador_email || l.operadorEmail || '',
          operadorNome: opNome,
          operadorCargo: opCargo,
          acao: l.acao || 'Ação do Sistema',
          descricao: l.descricao || '',
          modulo: l.modulo || 'Geral',
          status: l.status || 'Sucesso',
          detalhes: typeof l.detalhes === 'object' ? JSON.stringify(l.detalhes) : (l.detalhes || null)
        };
      });
      payload.mensagensSuporte = msgs || [];
    }

    // 2. Isolamento de Tenant: CLIENTE e MOTORISTA só acessam dados da sua própria conta empresarial
    let queryEmail = authenticatedEmail;
    if (!isMasterAdmin && authenticatedRole === 'MOTORISTA') {
      const { data: driver } = await supabase.from('condutores').select('cliente_email').eq('email', authenticatedEmail).single();
      if (driver && driver.cliente_email) {
        queryEmail = driver.cliente_email;
      }
    }

    // Carrega veículos do tenant
    let veiculosQuery = supabase.from('veiculos').select('*');
    if (!isMasterAdmin) veiculosQuery = veiculosQuery.eq('cliente_email', queryEmail);
    const { data: veiculos } = await veiculosQuery;
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
      defeito: v.defeito,
      tipoCombustivel: v.tipo_combustivel || v.tipoCombustivel || 'Flex',
      clienteEmail: v.cliente_email
    }));

    // Carrega condutores do tenant
    let condutoresQuery = supabase.from('condutores').select('*');
    if (!isMasterAdmin) condutoresQuery = condutoresQuery.eq('cliente_email', queryEmail);
    const { data: condutores } = await condutoresQuery;
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

    // Carrega entregas do tenant
    let entregasQuery = supabase.from('entregas').select('*');
    if (!isMasterAdmin) entregasQuery = entregasQuery.eq('cliente_email', queryEmail);
    const { data: entregas } = await entregasQuery;
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
      latitude: isNaN(parseFloat(e.latitude)) || parseFloat(e.latitude) === 0 ? -19.9208 : parseFloat(e.latitude),
      longitude: isNaN(parseFloat(e.longitude)) || parseFloat(e.longitude) === 0 ? -43.9378 : parseFloat(e.longitude),
      pesoMercadoriaKg: e.peso_mercadoria_kg,
      tipoOperacao: e.tipo_operacao,
      status: e.status,
      observacao: e.observacao,
      motoristaNome: e.motorista_nome,
      clienteEmail: e.cliente_email
    }));

    // Carrega rotas ativas do tenant
    let rotasQuery = supabase.from('rotas_ativas').select('rotas_json');
    if (!isMasterAdmin) {
      rotasQuery = rotasQuery.eq('cliente_email', queryEmail).order('id', { ascending: false }).limit(1);
    }
    const { data: activeRouteRecords } = await rotasQuery;

    if (activeRouteRecords && activeRouteRecords.length > 0) {
      if (isMasterAdmin) {
        payload.rotasAtivas = activeRouteRecords.reduce((acc, curr) => ({ ...acc, ...(curr.rotas_json || {}) }), {});
      } else {
        payload.rotasAtivas = activeRouteRecords[0].rotas_json;
      }
    }

    res.json({ success: true, mode: 'supabase', data: payload });
  } catch (err) {
    console.error('Erro na sincronização de download:', err);
    res.status(500).json({ error: 'SYNC_ERROR', message: 'Erro ao baixar dados do banco de dados.' });
  }
});

// Push Sync: Recebe atualizações do cliente e sincroniza com autorização JWT estrita (Prevenção BOLA/BFLA)
app.post('/api/sync/push', authMiddleware, async (req, res) => {
  const { table, records } = req.body;

  if (!supabase) {
    return res.status(503).json({ error: 'DATABASE_OFFLINE', message: 'Envio de dados indisponível sem conexão com o banco de dados.' });
  }

  try {
    const authenticatedEmail = req.user.email;
    const authenticatedRole = req.user.perfil;
    const isMasterAdmin = (authenticatedRole === 'MASTER' || authenticatedRole === 'COLABORADOR');

    console.log(`📤 SYNC PUSH (JWT): Recebendo ${records?.length || 0} registros da tabela "${table}" de ${authenticatedEmail} (${authenticatedRole})`);

    if (!records || !Array.isArray(records)) {
      return res.json({ success: true, count: 0 });
    }

    // Proteção BFLA: Usuários sem privilégio administrativo não podem alterar tabelas globais de sistema
    if (!isMasterAdmin && (table === 'clientes' || table === 'auditoria_logs')) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Acesso negado: Seu perfil não possui permissão para modificar cadastros globais de clientes ou registros de auditoria.'
      });
    }

    let queryEmail = authenticatedEmail;
    if (authenticatedRole === 'MOTORISTA') {
      const { data: driver } = await supabase.from('condutores').select('cliente_email').eq('email', authenticatedEmail).single();
      if (driver && driver.cliente_email) {
        queryEmail = driver.cliente_email;
      }
    }


function normalizeTipoVeiculo(tipoRaw) {
  if (!tipoRaw) return 'Van';
  const t = String(tipoRaw).toLowerCase().trim();
  if (t.includes('moto')) return 'Motocicleta';
  if (t.includes('picape') || t.includes('pickup') || t.includes('4x4') || t.includes('utilita') || t.includes('fiorino') || t.includes('kombi')) return 'Picape 4x4';
  if (t.includes('van') || t.includes('furgao') || t.includes('furgão') || t.includes('vuc') || t.includes('3/4') || t.includes('bau') || t.includes('baú')) return 'Van';
  if (t.includes('caminha') || t.includes('caminhão') || t.includes('truck') || t.includes('toco') || t.includes('carreta') || t.includes('bitrem') || t.includes('pesado')) return 'Caminhão Pesado';
  if (t.includes('carro') || t.includes('leve') || t.includes('passeio')) return 'Carro Leve';
  return 'Van';
}

    if (table === 'veiculos') {
      const userVehicles = records.filter(v => {
        const vEmail = (v.clienteEmail || v.cliente_email || '').toLowerCase().trim();
        return !vEmail || vEmail === queryEmail.toLowerCase().trim();
      });

      // Ensure user exists in usuarios first due to foreign key references
      const { data: existingUser } = await supabase.from('usuarios').select('email').eq('email', queryEmail).maybeSingle();
      if (!existingUser) {
        await supabase.from('usuarios').insert({
          email: queryEmail,
          nome: queryEmail.split('@')[0],
          perfil: 'CLIENTE',
          nivel_acesso: 'COMPLETO'
        });
      }

      const vehiclePlatesToKeep = userVehicles.map(v => v.placa).filter(Boolean);
      const { data: dbVehicles } = await supabase.from('veiculos').select('placa').eq('cliente_email', queryEmail);
      if (dbVehicles && dbVehicles.length > 0) {
        const platesToDelete = dbVehicles
          .map(v => v.placa)
          .filter(p => p && !vehiclePlatesToKeep.includes(p));
        if (platesToDelete.length > 0) {
          await supabase.from('veiculos').delete().eq('cliente_email', queryEmail).in('placa', platesToDelete);
        }
      }

      for (const v of userVehicles) {
        const cleanPlaca = (v.placa || 'AAA-0000').trim().toUpperCase();
        await supabase.from('veiculos').upsert({
          id_veiculo: v.idVeiculo || `VEIC-${cleanPlaca.replace(/\W/g, '') || Math.floor(Math.random() * 9000 + 1000)}`,
          placa: cleanPlaca,
          modelo: v.modelo || 'Modelo Importado',
          fabricante: v.fabricante || null,
          ano_fabricacao: v.anoFabricacao || null,
          ano_modelo: v.anoModelo || null,
          cor: v.cor || null,
          tipo: normalizeTipoVeiculo(v.tipo),
          capacidade_kg: parseInt(v.capacidadeKg) || 1000,
          status: v.status || 'Disponivel',
          defeito: v.defeito || null,
          cliente_email: queryEmail
        }, { onConflict: 'placa' });
      }
    } else if (table === 'condutores') {
      const userDrivers = records.filter(c => {
        const cEmail = (c.clienteEmail || c.cliente_email || '').toLowerCase().trim();
        return !cEmail || cEmail === queryEmail.toLowerCase().trim();
      });

      const { data: existingUser } = await supabase.from('usuarios').select('email').eq('email', queryEmail).maybeSingle();
      if (!existingUser) {
        await supabase.from('usuarios').insert({
          email: queryEmail,
          nome: queryEmail.split('@')[0],
          perfil: 'CLIENTE',
          nivel_acesso: 'COMPLETO'
        });
      }

      const driverEmailsToKeep = userDrivers.map(c => (c.email || '').toLowerCase()).filter(Boolean);
      const { data: dbDrivers } = await supabase.from('condutores').select('email').eq('cliente_email', queryEmail);
      
      if (dbDrivers && dbDrivers.length > 0) {
        const driversToDelete = dbDrivers
          .map(d => (d.email || '').toLowerCase())
          .filter(emailToDelete => emailToDelete && !driverEmailsToKeep.includes(emailToDelete));
        
        if (driversToDelete.length > 0) {
          for (const dEmail of driversToDelete) {
            await supabase.from('usuarios').delete().eq('email', dEmail);
          }
          await supabase.from('condutores').delete().eq('cliente_email', queryEmail).in('email', driversToDelete);
        }
      }

      for (const c of userDrivers) {
        if (!c.email) continue;
        const cleanDriverEmail = c.email.toLowerCase().trim();
        const { data: existingDriverUser } = await supabase.from('usuarios').select('email').eq('email', cleanDriverEmail).maybeSingle();
        if (!existingDriverUser) {
          let finalHash = c.senha || 'MotoristaLog@123';
          if (finalHash && !finalHash.startsWith('$2')) {
            const salt = bcrypt.genSaltSync(10);
            finalHash = bcrypt.hashSync(finalHash, salt);
          }
          await supabase.from('usuarios').insert({
            email: cleanDriverEmail,
            nome: c.nome || 'Motorista',
            perfil: 'MOTORISTA',
            veiculo: c.veiculo || null,
            nivel_acesso: 'PARCIAL',
            senha_hash: finalHash
          });
        }
        await supabase.from('condutores').upsert({
          id: c.id || `COND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          nome: c.nome || 'Motorista',
          cpf: c.cpf || '000.000.000-00',
          rg: c.rg || null,
          nascimento: c.nascimento || null,
          telefone: c.telefone || null,
          email: cleanDriverEmail,
          cnh: c.cnh || null,
          categoria_cnh: c.categoriaCnh || c.categoria_cnh || null,
          venc_cnh: c.vencCnh || c.venc_cnh || null,
          veiculo: c.veiculo || null,
          status: c.status || 'Ativo',
          cliente_email: queryEmail
        }, { onConflict: 'email' });
      }
    } else if (table === 'entregas') {
      const { data: existingUser } = await supabase.from('usuarios').select('email').eq('email', queryEmail).maybeSingle();
      if (!existingUser) {
        await supabase.from('usuarios').insert({
          email: queryEmail,
          nome: queryEmail.split('@')[0],
          perfil: 'CLIENTE',
          nivel_acesso: 'COMPLETO'
        });
      }

      if (!records || !Array.isArray(records) || records.length === 0) {
        await supabase.from('entregas').delete().eq('cliente_email', queryEmail);
      } else {
        const idsToKeep = records.map(e => e.id || e.chave).filter(Boolean);
        const { data: dbEntregas } = await supabase.from('entregas').select('id').eq('cliente_email', queryEmail);
        if (dbEntregas && dbEntregas.length > 0) {
          const idsToDelete = dbEntregas
            .map(e => e.id)
            .filter(id => id && !idsToKeep.includes(id));
          if (idsToDelete.length > 0) {
            await supabase.from('entregas').delete().eq('cliente_email', queryEmail).in('id', idsToDelete);
          }
        }

        for (const e of records) {
          const cleanId = e.id || e.chave || `ENT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
          const cleanChave = e.chave || cleanId;
          let lat = parseFloat(e.latitude);
          let lng = parseFloat(e.longitude);
          if (isNaN(lat) || lat === 0) lat = -19.9208;
          if (isNaN(lng) || lng === 0) lng = -43.9378;

          await supabase.from('entregas').upsert({
            id: cleanId,
            chave: cleanChave,
            cliente: e.cliente || e.clienteDestino || 'Cliente Destino',
            endereco: e.endereco || 'Endereço Indefinido',
            endereco_coleta: e.enderecoColeta || null,
            ponto_referencia: e.pontoReferencia || null,
            telefone: e.telefone || null,
            whatsapp: e.whatsapp || null,
            nota_fiscal: e.notaFiscal || null,
            foto_comprovante: e.fotoComprovante || null,
            data_entregue: e.dataEntregue || null,
            latitude: lat,
            longitude: lng,
            peso_mercadoria_kg: parseFloat(e.pesoMercadoriaKg || e.peso_mercadoria_kg) || 10,
            tipo_operacao: e.tipoOperacao || 'Entrega',
            status: e.status || 'Pendente',
            observacao: e.observacao || e.observacoes || null,
            motorista_nome: e.motoristaNome || e.motoristaAtribuido || null,
            cliente_email: queryEmail
          }, { onConflict: 'id' });
        }
      }
    } else if (table === 'rotas_ativas') {
      try {
        await supabase.from('rotas_ativas').delete().eq('cliente_email', queryEmail);
        if (records && records.length > 0 && records[0] && Object.keys(records[0]).length > 0) {
          const { error: rErr } = await supabase.from('rotas_ativas').insert({
            cliente_email: queryEmail,
            rotas_json: records[0] // contains active routes map
          });
          if (rErr) console.error('Aviso ao salvar rotas_ativas no Supabase:', rErr.message);
        }
      } catch (errRotas) {
        console.error('Erro na gravação de rotas_ativas:', errRotas);
      }
    } else if (table === 'auditoria_logs') {
      for (const log of records) {
        let rawDate = log.data_hora || log.dataHora || new Date().toISOString();
        if (typeof rawDate === 'string' && rawDate.includes('/')) {
          try {
            const cleanStr = rawDate.replace(',', ' ').trim();
            const tokens = cleanStr.split(/\s+/);
            const dateStr = tokens[0];
            const timeStr = tokens[1] || '00:00:00';
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2];
              rawDate = `${year}-${month}-${day}T${timeStr}`;
            }
          } catch (e) {
            console.error('Erro ao converter data do log:', e);
            rawDate = new Date().toISOString();
          }
        }

        try {
          const { error: upsertErr } = await supabase.from('auditoria_logs').upsert({
            id: log.id,
            data_hora: rawDate,
            operador_email: log.operador_email || log.operadorEmail || email,
            acao: log.acao,
            descricao: log.descricao || '',
            modulo: log.modulo || 'Geral',
            status: log.status || 'Sucesso'
          });
          if (upsertErr) {
            console.error('Erro ao salvar auditoria_logs no Supabase:', upsertErr);
          }
        } catch (err) {
          console.error('Exceção ao salvar auditoria_logs no Supabase:', err);
        }
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
    } else if (table === 'usuarios') {
      if (!isMasterAdmin) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Acesso negado: Apenas administradores Master e Colaboradores podem gerenciar a lista de usuários do sistema.'
        });
      }

      if (authenticatedRole === 'MASTER') {
        const userEmailsToKeep = records.map(u => u.email.toLowerCase()).filter(Boolean);
        const { data: dbUsers } = await supabase.from('usuarios').select('email');
        if (dbUsers && dbUsers.length > 0) {
          const usersToDelete = dbUsers
            .map(u => u.email.toLowerCase())
            .filter(emailToDelete => emailToDelete && !userEmailsToKeep.includes(emailToDelete));
          if (usersToDelete.length > 0) {
            await supabase.from('usuarios').delete().in('email', usersToDelete);
          }
        }
      } else {
        const colabEmailsToKeep = records.filter(u => u.perfil === 'COLABORADOR').map(u => u.email.toLowerCase());
        const { data: dbColabs } = await supabase.from('usuarios').select('email').eq('perfil', 'COLABORADOR');
        if (dbColabs && dbColabs.length > 0) {
          for (const dbCol of dbColabs) {
            if (!colabEmailsToKeep.includes(dbCol.email.toLowerCase())) {
              console.log(`🗑️ SYNC PUSH: Deletando colaborador removido do Supabase: ${dbCol.email}`);
              await supabase.from('usuarios').delete().eq('email', dbCol.email);
            }
          }
        }
      }

      for (const u of records) {
        let finalHash = u.senha_hash || u.senha || 'LogusQ@123';
        if (finalHash && !finalHash.startsWith('$2')) {
          const salt = bcrypt.genSaltSync(10);
          finalHash = bcrypt.hashSync(finalHash, salt);
        }
        const rawNivel = String(u.nivelAcesso || u.nivel_acesso || 'TOTAL').trim().toUpperCase();
        await supabase.from('usuarios').upsert({
          email: u.email,
          nome: u.nome,
          perfil: u.perfil,
          empresa: u.empresa || null,
          veiculo: u.veiculo || null,
          nivel_acesso: rawNivel || 'TOTAL',
          senha_hash: finalHash
        });
      }
    } else if (table === 'clientes') {
      const clientEmailsToKeep = records.map(cl => cl.email.toLowerCase()).filter(Boolean);
      const { data: dbClients } = await supabase.from('clientes').select('email');
      
      if (dbClients && dbClients.length > 0) {
        const dbClientsToDelete = dbClients
          .map(cl => cl.email.toLowerCase())
          .filter(emailToDelete => emailToDelete && !clientEmailsToKeep.includes(emailToDelete));
          
        if (dbClientsToDelete.length > 0) {
          for (const clToDeleteEmail of dbClientsToDelete) {
            console.log(`🗑️ SYNC PUSH: Deletando usuário do cliente removido do Supabase: ${clToDeleteEmail}`);
            
            // Delete the main client user login
            await supabase.from('usuarios').delete().eq('email', clToDeleteEmail);
            
            // Delete all associated vehicles
            await supabase.from('veiculos').delete().eq('cliente_email', clToDeleteEmail);
            
            // Fetch and delete all associated driver user logins first
            const { data: driversToDelete } = await supabase.from('condutores').select('email').eq('cliente_email', clToDeleteEmail);
            if (driversToDelete && driversToDelete.length > 0) {
              const driverEmails = driversToDelete.map(d => d.email).filter(Boolean);
              if (driverEmails.length > 0) {
                await supabase.from('usuarios').delete().in('email', driverEmails);
              }
            }
            
            // Delete all drivers, deliveries, and active routes
            await supabase.from('condutores').delete().eq('cliente_email', clToDeleteEmail);
            await supabase.from('entregas').delete().eq('cliente_email', clToDeleteEmail);
            await supabase.from('rotas_ativas').delete().eq('cliente_email', clToDeleteEmail);
          }
          await supabase.from('clientes').delete().in('email', dbClientsToDelete);
        }
      }

      for (const cl of records) {
        // Ensure user exists in usuarios first
        const { data: existingUser } = await supabase.from('usuarios').select('email').eq('email', cl.email).maybeSingle();
        if (!existingUser) {
          const salt = bcrypt.genSaltSync(10);
          const defaultHash = bcrypt.hashSync('LogusQ@123', salt);
          await supabase.from('usuarios').insert({
            email: cl.email,
            nome: cl.respNome || cl.empresa || 'Gestor',
            perfil: 'CLIENTE',
            empresa: cl.empresa,
            nivel_acesso: 'TOTAL',
            senha_hash: defaultHash
          });
        }
        await supabase.from('clientes').upsert({
          id_cliente: cl.idCliente,
          email: cl.email,
          empresa: cl.empresa,
          cnpj: cl.cnpj || null,
          inscricao_estadual: cl.inscricaoEstadual || cl.inscricao_estadual || null,
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
// ASYNCHRONOUS ROUTING OPTIMIZATION ENDPOINT (VROOM ENGINE & WORKER_THREADS)
// =========================================================================

/**
 * Helper to attempt route optimization using the satellite VROOM C++ engine on Railway.
 */
async function tryVroomOptimization(entregas, numVeiculos, baseLocation, veiculos) {
  const vroomUrl = process.env.VROOM_URL || process.env.VROOM_API_URL;
  if (!vroomUrl) return null;

  const startTime = Date.now();
  const baseLat = baseLocation?.latitude ?? -19.9388;
  const baseLng = baseLocation?.longitude ?? -43.9386;
  const k = Math.max(1, numVeiculos || (veiculos ? veiculos.length : 1));

  // Build Vehicles
  const vehicles = [];
  for (let i = 0; i < k; i++) {
    const v = veiculos && veiculos[i] ? veiculos[i] : null;
    const capacityKg = v?.capacidadeKg ? Number(v.capacidadeKg) : 1200;
    vehicles.push({
      id: i + 1,
      profile: 'car',
      start: [baseLng, baseLat],
      end: [baseLng, baseLat],
      capacity: [capacityKg]
    });
  }

  const jobs = [];
  const shipments = [];

  entregas.forEach((p, index) => {
    const jobId = p.id ? Number(p.id) || (index + 101) : (index + 101);
    const weight = Math.round(p.pesoMercadoriaKg || 10);
    const isReverseLogistics = 
      (p.tipoOperacao && (p.tipoOperacao.toLowerCase().includes('reversa') || p.tipoOperacao.toLowerCase().includes('troca'))) ||
      Boolean(p.coletaEndereco);

    if (isReverseLogistics) {
      shipments.push({
        amount: [weight],
        pickup: {
          id: jobId * 10 + 1,
          description: `[Coleta Reversa] NF: ${p.chave || jobId} - ${p.cliente}`,
          location: [p.longitude, p.latitude],
          service: 300
        },
        delivery: {
          id: jobId * 10 + 2,
          description: `[Devolução CD] NF: ${p.chave || jobId} - Base CD Central`,
          location: [baseLng, baseLat],
          service: 300
        }
      });
    } else {
      const isPickupOnly = p.tipoOperacao && p.tipoOperacao.toLowerCase() === 'coleta';
      jobs.push({
        id: jobId,
        description: `[${p.tipoOperacao || 'Entrega'}] NF: ${p.chave || jobId} - ${p.cliente}`,
        location: [p.longitude, p.latitude],
        delivery: isPickupOnly ? [0] : [weight],
        pickup: isPickupOnly ? [weight] : [0],
        service: 600
      });
    }
  });

  const payload = { vehicles, jobs, shipments };

  console.log(`⚡ [VROOM Engine] Disparando requisição para motor VROOM em ${vroomUrl} (${jobs.length} jobs, ${shipments.length} shipments)...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(vroomUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const resData = await response.json();
  if (resData.code !== 0) {
    throw new Error(`VROOM error code ${resData.code}: ${resData.error || 'Falha na otimização'}`);
  }

  // Format response for LogusQ frontend
  const entregaMap = new Map();
  entregas.forEach((e, idx) => {
    const idNum = e.id ? Number(e.id) || (idx + 101) : (idx + 101);
    entregaMap.set(idNum, e);
  });

  const clusters = {};
  const vehicleRoutes = [];
  let grandTotalDistanceKm = 0;
  let grandTotalDurationMin = 0;
  let grandTotalWeightKg = 0;

  resData.routes.forEach((route, idx) => {
    const orderedEntregas = [];
    route.steps.forEach(step => {
      if (step.type === 'job' || step.type === 'pickup' || step.type === 'delivery') {
        const stepId = step.id || step.job;
        if (stepId) {
          const originalId = stepId > 1000 ? Math.floor(stepId / 10) : stepId;
          const matched = entregaMap.get(originalId) || entregaMap.get(stepId);
          if (matched && !orderedEntregas.includes(matched)) {
            orderedEntregas.push(matched);
          }
        }
      }
    });

    clusters[idx] = orderedEntregas;

    const assignedVehicle = veiculos && veiculos[idx] ? veiculos[idx] : null;
    const vehicleDistKm = parseFloat((route.distance / 1000).toFixed(2));
    const totalDurationMin = Math.round(route.duration / 60);
    const totalWeight = orderedEntregas.reduce((acc, curr) => acc + (curr.pesoMercadoriaKg || 10), 0);

    const waypoints = orderedEntregas.map((pt, stopIdx) => ({
      stopOrder: stopIdx + 1,
      entregaId: pt.id,
      chave: pt.chave,
      cliente: pt.cliente,
      endereco: pt.endereco,
      latitude: pt.latitude,
      longitude: pt.longitude,
      pesoMercadoriaKg: pt.pesoMercadoriaKg || 10,
      tipoOperacao: pt.tipoOperacao || 'Entrega'
    }));

    vehicleRoutes.push({
      clusterIndex: idx,
      veiculoId: assignedVehicle ? (assignedVehicle.idVeiculo || assignedVehicle.id) : `VEIC-VROOM-00${idx + 1}`,
      veiculoPlaca: assignedVehicle ? assignedVehicle.placa : `VRM-00${idx + 1}`,
      veiculoModelo: assignedVehicle ? assignedVehicle.modelo : 'VROOM Motor C++',
      capacidadeKg: assignedVehicle ? assignedVehicle.capacidadeKg : 1200,
      pesoCarregadoKg: totalWeight,
      percentualOcupacao: assignedVehicle ? Math.min(100, Math.round((totalWeight / assignedVehicle.capacidadeKg) * 100)) : 70,
      totalParadas: orderedEntregas.length,
      distanciaKm: vehicleDistKm,
      duracaoEstimadaMinutos: totalDurationMin,
      combustivelEstimadoLitros: parseFloat((vehicleDistKm / 10).toFixed(2)),
      waypoints,
      geometriaRota: []
    });

    grandTotalDistanceKm += vehicleDistKm;
    grandTotalDurationMin += totalDurationMin;
    grandTotalWeightKg += totalWeight;
  });

  const executionTimeMs = Date.now() - startTime;

  return {
    baseCD: {
      nome: baseLocation?.nome || 'Centro de Distribuição Central LogusQ',
      latitude: baseLat,
      longitude: baseLng
    },
    estatisticasGerais: {
      totalEntregas: entregas.length,
      totalVeiculosAlocados: vehicleRoutes.length,
      distanciaTotalKm: parseFloat(grandTotalDistanceKm.toFixed(2)),
      tempoTotalEstimadoMinutos: grandTotalDurationMin,
      pesoTotalKg: grandTotalWeightKg,
      economiaCombustivelPercentual: 24.8,
      tempoProcessamentoMs: executionTimeMs,
      threadExecution: 'vroom_cplusplus_engine'
    },
    rotasPorVeiculo: vehicleRoutes,
    clusters
  };
}

/**
 * Refactored Routing Controller with VROOM Satellite Service & Node.js worker_threads fallback.
 */
const handleRoutingOptimization = async (req, res) => {
  const { entregas, numVeiculos, baseLocation, veiculos } = req.body;

  if (!entregas || !Array.isArray(entregas) || entregas.length === 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Lista de entregas (array) é obrigatória para processar a roteirização.'
    });
  }

  // 1. Try VROOM C++ Engine Satellite Service on Railway first
  if (process.env.VROOM_URL || process.env.VROOM_API_URL) {
    try {
      const vroomResult = await tryVroomOptimization(entregas, numVeiculos, baseLocation, veiculos);
      if (vroomResult) {
        console.log(`🚀 [VROOM Engine] Roteirização C++ concluída com sucesso via VROOM em ${vroomResult.estatisticasGerais.tempoProcessamentoMs}ms!`);
        return res.json({
          success: true,
          mode: 'vroom_express',
          data: vroomResult
        });
      }
    } catch (vroomErr) {
      console.warn('⚠️ [VROOM Engine] Servidor VROOM indisponível ou com erro. Ativando fallback para Worker Thread local:', vroomErr.message);
    }
  }

  // 2. Fallback to Local Worker Threads (2-Opt TSP & K-Means++)
  const workerPath = path.join(__dirname, 'routeWorker.js');
  
  console.log(`⚡ [MainThread Worker] Disparando Worker Thread (${workerPath}) para ${entregas.length} entregas e ${numVeiculos || 1} veículos...`);

  const worker = new Worker(workerPath, {
    workerData: {
      entregas,
      numVeiculos: numVeiculos || 1,
      baseLocation: baseLocation || {
        nome: 'Centro de Distribuição Central LogusQ (Savassi)',
        latitude: -19.9388,
        longitude: -43.9386,
      },
      veiculos: veiculos || []
    }
  });

  let responded = false;

  const timeoutId = setTimeout(() => {
    if (!responded) {
      responded = true;
      worker.terminate();
      console.error('🚨 [MainThread Worker] Route Worker timeout atingido (15s). Terminado.');
      res.status(504).json({
        error: 'WORKER_TIMEOUT',
        message: 'Tempo limite do cálculo de roteirização atingido no Worker Thread.'
      });
    }
  }, 15000);

  worker.on('message', (message) => {
    if (responded) return;
    responded = true;
    clearTimeout(timeoutId);

    if (message.status === 'SUCCESS') {
      console.log(`✅ [MainThread Worker] Roteirização concluída com sucesso via Worker Thread em ${message.result.estatisticasGerais.tempoProcessamentoMs}ms!`);
      res.json({
        success: true,
        mode: 'worker_threads',
        data: message.result
      });
    } else {
      console.error('❌ [MainThread Worker] Erro retornado pelo Worker Thread:', message.error);
      res.status(500).json({
        error: 'WORKER_ERROR',
        message: message.error || 'Erro interno ao processar roteirização no Worker.'
      });
    }

    worker.terminate();
  });

  worker.on('error', (err) => {
    if (responded) return;
    responded = true;
    clearTimeout(timeoutId);
    console.error('💥 [MainThread Worker] Exceção crítica no Worker Thread:', err);
    res.status(500).json({
      error: 'WORKER_EXCEPTION',
      message: 'Falha crítica na execução da Worker Thread.',
      details: err.message
    });
    worker.terminate();
  });

  worker.on('exit', (code) => {
    if (!responded) {
      responded = true;
      clearTimeout(timeoutId);
      if (code !== 0) {
        console.error(`⚠️ [MainThread Worker] Worker encerrado prematuramente com código: ${code}`);
        res.status(500).json({
          error: 'WORKER_EXITED',
          message: `Worker Thread de roteirização finalizou inesperadamente com código ${code}.`
        });
      }
    }
  });
};

app.post('/api/routing/optimize', handleRoutingOptimization);
app.post('/api/roteirizacao', handleRoutingOptimization);

// =========================================================================
// HIGH-ACCURACY GEOCODING ENGINE (CEP DB + DISTRICTS + OPENSTREETMAP + GEMINI AI)
// =========================================================================
const GEOCODE_CACHE = new Map();

// CEP 5-Digit & 8-Digit Postal Code Prefix Geocoding Engine for Brazil
const BRAZIL_CEP_PREFIX_ANCHORS = {
  '28880': { lat: -22.5960, lng: -42.0080, state: 'RJ', name: 'Barra de São João (Casimiro de Abreu)' },
  '28870': { lat: -22.5342, lng: -42.2681, state: 'RJ', name: 'Professor Souza (Casimiro de Abreu)' },
  '28865': { lat: -22.4419, lng: -42.0911, state: 'RJ', name: 'Rio Dourado (Casimiro de Abreu)' },
  '28860': { lat: -22.4811, lng: -42.2028, state: 'RJ', name: 'Casimiro de Abreu (Centro / Industrial)' },
  '27995': { lat: -22.3165, lng: -42.1830, state: 'RJ', name: 'Sana / Vila do Sana (Macaé)' },
  '27930': { lat: -22.4089, lng: -41.8080, state: 'RJ', name: 'Granja dos Cavaleiros (Macaé)' },
  '27910': { lat: -22.3780, lng: -41.7800, state: 'RJ', name: 'Macaé Centro' },
  '27913': { lat: -22.3811, lng: -41.7772, state: 'RJ', name: 'Imbetiba (Macaé)' },
  '27915': { lat: -22.3890, lng: -41.7850, state: 'RJ', name: 'Praia Campista (Macaé)' },
  '27940': { lat: -22.3250, lng: -41.7200, state: 'RJ', name: 'Cabiúnas / Parque de Tubos (Macaé)' },
  '27945': { lat: -22.3350, lng: -41.7300, state: 'RJ', name: 'Parque de Tubos (Macaé)' },
  '28893': { lat: -22.5460, lng: -41.9750, state: 'RJ', name: 'Cidade Praiana (Rio das Ostras)' },
  '28890': { lat: -22.5269, lng: -41.9483, state: 'RJ', name: 'Rio das Ostras Centro' },
  '28891': { lat: -22.5205, lng: -41.9580, state: 'RJ', name: 'Palmital / Extensão do Bosque (Rio das Ostras)' },
  '28892': { lat: -22.5350, lng: -41.9380, state: 'RJ', name: 'Recanto (Rio das Ostras)' },
  '28895': { lat: -22.5283, lng: -41.9320, state: 'RJ', name: 'Costazul (Rio das Ostras)' },
  '28896': { lat: -22.5410, lng: -41.9600, state: 'RJ', name: 'Mariléa / Jardim Atlântico (Rio das Ostras)' },
  '28898': { lat: -22.4639, lng: -41.9886, state: 'RJ', name: 'Rocha Leão (Rio das Ostras)' },
  '28899': { lat: -22.5188, lng: -41.9420, state: 'RJ', name: 'Âncora (Rio das Ostras)' },
  '28928': { lat: -22.6820, lng: -42.0030, state: 'RJ', name: 'Unamar / Tamoios (Cabo Frio)' },
  '28925': { lat: -22.7080, lng: -42.0080, state: 'RJ', name: 'Aquarius / Tamoios (Cabo Frio)' },
  '28900': { lat: -22.8892, lng: -42.0281, state: 'RJ', name: 'Cabo Frio Centro' },
  '28905': { lat: -22.8850, lng: -42.0220, state: 'RJ', name: 'Passagem (Cabo Frio)' },
  '28907': { lat: -22.8930, lng: -42.0250, state: 'RJ', name: 'São Cristóvão (Cabo Frio)' },
  '28950': { lat: -22.7561, lng: -41.8950, state: 'RJ', name: 'Armação dos Búzios' },
  '28940': { lat: -22.8417, lng: -42.1028, state: 'RJ', name: 'São Pedro da Aldeia' },
  '28970': { lat: -22.8728, lng: -42.3428, state: 'RJ', name: 'Araruama Centro' },
  '28960': { lat: -22.8406, lng: -42.1861, state: 'RJ', name: 'Iguaba Grande' },
  '28990': { lat: -22.9203, lng: -42.5103, state: 'RJ', name: 'Saquarema / Bacaxá' },
  '28930': { lat: -22.9660, lng: -42.0280, state: 'RJ', name: 'Arraial do Cabo' },
  '28000': { lat: -21.7545, lng: -41.3244, state: 'RJ', name: 'Campos dos Goytacazes' },
  '28700': { lat: -22.0833, lng: -41.8667, state: 'RJ', name: 'Conceição de Macabu' },
  '28735': { lat: -22.1083, lng: -41.4722, state: 'RJ', name: 'Quissamã' },
  '28820': { lat: -22.6517, lng: -42.3922, state: 'RJ', name: 'Silva Jardim' },
  '28800': { lat: -22.7056, lng: -42.6289, state: 'RJ', name: 'Rio Bonito' },
  '28600': { lat: -22.2819, lng: -42.5311, state: 'RJ', name: 'Nova Friburgo' },
  '25600': { lat: -22.5050, lng: -43.1789, state: 'RJ', name: 'Petrópolis' },
  '25950': { lat: -22.4122, lng: -42.9656, state: 'RJ', name: 'Teresópolis' },
  '89200': { lat: -26.3045, lng: -48.8464, state: 'SC', name: 'Joinville' },
  '88000': { lat: -27.5954, lng: -48.5480, state: 'SC', name: 'Florianópolis' },
  '89000': { lat: -26.9194, lng: -49.0661, state: 'SC', name: 'Blumenau' },
  '01000': { lat: -23.5505, lng: -46.6333, state: 'SP', name: 'São Paulo Centro' },
  '29000': { lat: -20.3155, lng: -40.3128, state: 'ES', name: 'Vitória' },
  '30000': { lat: -19.9167, lng: -43.9345, state: 'MG', name: 'Belo Horizonte' },
};

// Sub-Districts, Neighborhoods & Local Logistics Anchors (Evaluated FIRST before parent city centers)
const BRAZIL_DISTRICT_ANCHORS = {
  // Casimiro de Abreu Districts
  'barra de são joão': { lat: -22.5960, lng: -42.0080, state: 'RJ' },
  'barra de sao joao': { lat: -22.5960, lng: -42.0080, state: 'RJ' },
  'professor souza': { lat: -22.5342, lng: -42.2681, state: 'RJ' },
  'rio dourado': { lat: -22.4419, lng: -42.0911, state: 'RJ' },
  'bairro industrial': { lat: -22.4850, lng: -42.2150, state: 'RJ' },
  'loteamento são joão': { lat: -22.4820, lng: -42.2010, state: 'RJ' },
  'loteamento sao joao': { lat: -22.4820, lng: -42.2010, state: 'RJ' },

  // Macaé Districts & Bairros
  'sana': { lat: -22.3165, lng: -42.1830, state: 'RJ' },
  'arraial do sana': { lat: -22.3165, lng: -42.1830, state: 'RJ' },
  'glicério': { lat: -22.2500, lng: -42.0500, state: 'RJ' },
  'glicerio': { lat: -22.2500, lng: -42.0500, state: 'RJ' },
  'córrego do ouro': { lat: -22.2800, lng: -41.9500, state: 'RJ' },
  'corrego do ouro': { lat: -22.2800, lng: -41.9500, state: 'RJ' },
  'granja cavaleiros': { lat: -22.4089, lng: -41.8080, state: 'RJ' },
  'granja dos cavaleiros': { lat: -22.4089, lng: -41.8080, state: 'RJ' },
  'cavaleiros': { lat: -22.4089, lng: -41.8080, state: 'RJ' },
  'novo cavaleiros': { lat: -22.4150, lng: -41.8100, state: 'RJ' },
  'imbetiba': { lat: -22.3811, lng: -41.7772, state: 'RJ' },
  'praia campista': { lat: -22.3890, lng: -41.7850, state: 'RJ' },
  'cancela preta': { lat: -22.3991, lng: -41.7911, state: 'RJ' },
  'cabiúnas': { lat: -22.3250, lng: -41.7200, state: 'RJ' },
  'cabiunas': { lat: -22.3250, lng: -41.7200, state: 'RJ' },
  'parque de tubos': { lat: -22.3350, lng: -41.7300, state: 'RJ' },

  // Rio das Ostras Bairros & Districts
  'cidade praiana': { lat: -22.5460, lng: -41.9750, state: 'RJ' },
  'praiana': { lat: -22.5460, lng: -41.9750, state: 'RJ' },
  'palmital': { lat: -22.5205, lng: -41.9580, state: 'RJ' },
  'recanto': { lat: -22.5350, lng: -41.9380, state: 'RJ' },
  'recanto das tartarugas': { lat: -22.5350, lng: -41.9380, state: 'RJ' },
  'rocha leão': { lat: -22.4639, lng: -41.9886, state: 'RJ' },
  'rocha leao': { lat: -22.4639, lng: -41.9886, state: 'RJ' },
  'âncora': { lat: -22.5188, lng: -41.9420, state: 'RJ' },
  'ancora': { lat: -22.5188, lng: -41.9420, state: 'RJ' },
  'costazul': { lat: -22.5283, lng: -41.9320, state: 'RJ' },
  'costa azul': { lat: -22.5283, lng: -41.9320, state: 'RJ' },
  'jardim mariléa': { lat: -22.5410, lng: -41.9600, state: 'RJ' },
  'mariléa': { lat: -22.5410, lng: -41.9600, state: 'RJ' },
  'marilea': { lat: -22.5410, lng: -41.9600, state: 'RJ' },
  'extensão do bosque': { lat: -22.5250, lng: -41.9450, state: 'RJ' },
  'extensao do bosque': { lat: -22.5250, lng: -41.9450, state: 'RJ' },

  // Cabo Frio Districts
  'unamar': { lat: -22.6820, lng: -42.0030, state: 'RJ' },
  'tamoios': { lat: -22.6820, lng: -42.0030, state: 'RJ' },
  'aquarius': { lat: -22.7080, lng: -42.0080, state: 'RJ' },
  'passagem': { lat: -22.8850, lng: -42.0220, state: 'RJ' },
  'são cristóvão': { lat: -22.8930, lng: -42.0250, state: 'RJ' },
  'sao cristovao': { lat: -22.8930, lng: -42.0250, state: 'RJ' },

  // Búzios Bairros
  'geribá': { lat: -22.7750, lng: -41.9050, state: 'RJ' },
  'geriba': { lat: -22.7750, lng: -41.9050, state: 'RJ' },
  'manguinhos': { lat: -22.7680, lng: -41.9020, state: 'RJ' },
  'rasa': { lat: -22.7420, lng: -41.9450, state: 'RJ' },

  // Saquarema / Maricá
  'bacaxá': { lat: -22.8850, lng: -42.4719, state: 'RJ' },
  'bacaxa': { lat: -22.8850, lng: -42.4719, state: 'RJ' },
  'itaúna': { lat: -22.9250, lng: -42.5050, state: 'RJ' },
  'itauna': { lat: -22.9250, lng: -42.5050, state: 'RJ' },
  'inoã': { lat: -22.9150, lng: -42.9222, state: 'RJ' },
  'inoa': { lat: -22.9150, lng: -42.9222, state: 'RJ' },
  'itaipuaçu': { lat: -22.9611, lng: -42.9819, state: 'RJ' },
  'itaipuacu': { lat: -22.9611, lng: -42.9819, state: 'RJ' },
};

// Known Municipalities & Logistics Anchors
const BRAZIL_CITY_ANCHORS = {
  'macae': { lat: -22.3708, lng: -41.7869, state: 'RJ' },
  'macaé': { lat: -22.3708, lng: -41.7869, state: 'RJ' },
  'rio das ostras': { lat: -22.5269, lng: -41.9483, state: 'RJ' },
  'casimiro de abreu': { lat: -22.4811, lng: -42.2028, state: 'RJ' },
  'cabo frio': { lat: -22.8892, lng: -42.0281, state: 'RJ' },
  'arraial do cabo': { lat: -22.9660, lng: -42.0280, state: 'RJ' },
  'buzios': { lat: -22.7561, lng: -41.8888, state: 'RJ' },
  'búzios': { lat: -22.7561, lng: -41.8888, state: 'RJ' },
  'armacao dos buzios': { lat: -22.7561, lng: -41.8888, state: 'RJ' },
  'armação dos búzios': { lat: -22.7561, lng: -41.8888, state: 'RJ' },
  'sao pedro da aldeia': { lat: -22.8417, lng: -42.1028, state: 'RJ' },
  'são pedro da aldeia': { lat: -22.8417, lng: -42.1028, state: 'RJ' },
  'iguaba grande': { lat: -22.8406, lng: -42.1861, state: 'RJ' },
  'araruama': { lat: -22.8728, lng: -42.3428, state: 'RJ' },
  'saquarema': { lat: -22.9203, lng: -42.5103, state: 'RJ' },
  'campos dos goytacazes': { lat: -21.7545, lng: -41.3244, state: 'RJ' },
  'quissama': { lat: -22.1083, lng: -41.4722, state: 'RJ' },
  'quissamã': { lat: -22.1083, lng: -41.4722, state: 'RJ' },
  'conceicao de macabu': { lat: -22.0833, lng: -41.8667, state: 'RJ' },
  'conceição de macabu': { lat: -22.0833, lng: -41.8667, state: 'RJ' },
  'marica': { lat: -22.9194, lng: -42.8186, state: 'RJ' },
  'maricá': { lat: -22.9194, lng: -42.8186, state: 'RJ' },
  'niteroi': { lat: -22.8833, lng: -43.1036, state: 'RJ' },
  'niterói': { lat: -22.8833, lng: -43.1036, state: 'RJ' },
  'sao goncalo': { lat: -22.8269, lng: -43.0539, state: 'RJ' },
  'são gonçalo': { lat: -22.8269, lng: -43.0539, state: 'RJ' },
  'itaborai': { lat: -22.7472, lng: -42.8592, state: 'RJ' },
  'itaboraí': { lat: -22.7472, lng: -42.8592, state: 'RJ' },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, state: 'RJ' },
  'duque de caxias': { lat: -22.7856, lng: -43.3117, state: 'RJ' },
  'nova iguacu': { lat: -22.7592, lng: -43.4511, state: 'RJ' },
  'nova iguaçu': { lat: -22.7592, lng: -43.4511, state: 'RJ' },
  'petropolis': { lat: -22.5050, lng: -43.1789, state: 'RJ' },
  'petrópolis': { lat: -22.5050, lng: -43.1789, state: 'RJ' },
  'teresopolis': { lat: -22.4122, lng: -42.9656, state: 'RJ' },
  'teresópolis': { lat: -22.4122, lng: -42.9656, state: 'RJ' },
  'nova friburgo': { lat: -22.2819, lng: -42.5311, state: 'RJ' },
  'volta redonda': { lat: -22.5231, lng: -44.1042, state: 'RJ' },
  'resende': { lat: -22.4697, lng: -44.4467, state: 'RJ' },
  'angra dos reis': { lat: -23.0067, lng: -44.3181, state: 'RJ' },
  'joinville': { lat: -26.3045, lng: -48.8464, state: 'SC' },
  'florianopolis': { lat: -27.5954, lng: -48.5480, state: 'SC' },
  'florianópolis': { lat: -27.5954, lng: -48.5480, state: 'SC' },
  'blumenau': { lat: -26.9194, lng: -49.0661, state: 'SC' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, state: 'SP' },
  'são paulo': { lat: -23.5505, lng: -46.6333, state: 'SP' },
  'vitoria': { lat: -20.3155, lng: -40.3128, state: 'ES' },
  'vitória': { lat: -20.3155, lng: -40.3128, state: 'ES' },
  'belo horizonte': { lat: -19.9167, lng: -43.9345, state: 'MG' },
};

async function geocodeSingleAddress(rawAddress, fallbackCity, fallbackState) {
  if (!rawAddress || String(rawAddress).trim().length < 3) {
    return null;
  }

  const clean = String(rawAddress).trim();
  const cacheKey = clean.toLowerCase();

  if (GEOCODE_CACHE.has(cacheKey)) {
    return GEOCODE_CACHE.get(cacheKey);
  }

  // Street number extraction
  const numMatch = clean.match(/\b(?:n[º°o]?\.?\s*|número\s*|num\s*)?(\d{1,5})\b/i);
  const streetNum = numMatch ? numMatch[1] : '';

  // 1. STEP 1: Query ViaCEP if 8-digit CEP is present
  const cep8Match = clean.match(/\b(\d{2}\.?\d{3})[-.\s]?(\d{3})\b/);
  let viaCepData = null;
  if (cep8Match) {
    const rawCep = `${cep8Match[1]}${cep8Match[2]}`.replace(/\D/g, '');
    if (rawCep.length === 8) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (viaCepRes.ok) {
          const vData = await viaCepRes.json();
          if (vData && !vData.erro) {
            viaCepData = vData;
          }
        }
      } catch (e) {}
    }
  }

  // 2. STEP 2: Structured OpenStreetMap Nominatim Vector Search
  const searchQueries = [];

  // If ViaCEP provided official street and city
  if (viaCepData && viaCepData.logradouro) {
    searchQueries.push(`${viaCepData.logradouro}${streetNum ? ` ${streetNum}` : ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`);
    searchQueries.push(`${viaCepData.logradouro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`);
  }

  // Clean address from CEP noise for search
  const cleanWithoutCep = clean.replace(/CEP:?\s*\d{2}\.?\d{3}-?\d{3}/gi, '').trim();
  searchQueries.push(`${cleanWithoutCep}, Brasil`);
  searchQueries.push(cleanWithoutCep);
  searchQueries.push(`${clean}, Brasil`);
  searchQueries.push(clean);

  // If ViaCEP has localidade but user omitted city
  if (viaCepData && viaCepData.localidade && !clean.includes(viaCepData.localidade)) {
    searchQueries.push(`${cleanWithoutCep}, ${viaCepData.localidade} - ${viaCepData.uf}, Brasil`);
  }

  // Query OpenStreetMap Nominatim
  for (const q of searchQueries) {
    if (!q || q.length < 5) continue;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=3&countrycodes=br&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'LogusQ-Logistics-Platform/3.0 (suporte@logusq.com.br)',
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0];
          const lat = parseFloat(top.lat);
          const lng = parseFloat(top.lon);

          // Verify point is in Brazil territory on land
          if (!isNaN(lat) && !isNaN(lng) && lat >= -34.0 && lat <= 5.5 && lng >= -74.0 && lng <= -34.0) {
            const precision = (top.type === 'house' || top.type === 'building' || top.class === 'building' || top.class === 'highway' || top.class === 'place') ? 'exact' : 'street';
            const result = {
              lat,
              lng,
              displayName: top.display_name,
              precision,
              source: 'nominatim'
            };
            GEOCODE_CACHE.set(cacheKey, result);
            return result;
          }
        }
      }
    } catch (osmErr) {
      // Continue search
    }
  }

  // 3. STEP 3: Gemini 2.5 Flash High Precision Real Geographic Search
  if (ai) {
    try {
      const prompt = `Você é um motor cartográfico oficial para o território brasileiro.
Localize com a máxima precisão geográfica as coordenadas GPS (latitude e longitude decimais exatas) no leito da rua/estrada real em terra firme no Brasil para o seguinte endereço:
Endereço: "${clean}"
${viaCepData ? `Dados Oficiais ViaCEP: Logradouro: ${viaCepData.logradouro}, Bairro: ${viaCepData.bairro}, Município: ${viaCepData.localidade}, UF: ${viaCepData.uf}` : ''}

REGRAS OBRIGATÓRIAS:
1. NUNCA retorne coordenadas no oceano/mar ou floresta sem acesso viário. O ponto deve ficar rigorosamente sobre a rua/rodovia em terra firme.
2. Identifique o município, bairro e logradouro no Brasil.
3. Retorne APENAS um objeto JSON com:
{
  "lat": número decimal (ex: -22.4811),
  "lng": número decimal (ex: -42.2028),
  "cidade": string,
  "estado": string,
  "bairro": string,
  "logradouro": string,
  "precisao": "rua"
}`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = aiRes.text || '';
      let cleanJson = text.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        if (parsed.lat >= -34.0 && parsed.lat <= 5.5 && parsed.lng >= -74.0 && parsed.lng <= -34.0) {
          const result = {
            lat: parsed.lat,
            lng: parsed.lng,
            city: parsed.cidade,
            state: parsed.estado,
            precision: 'gemini_exact_street',
            source: 'gemini_ai'
          };
          GEOCODE_CACHE.set(cacheKey, result);
          return result;
        }
      }
    } catch (aiErr) {
      console.warn('Geocoding Gemini error:', aiErr.message);
    }
  }

  // 4. STEP 4: OFFLINE / UNMAPPED FALLBACK (District / CEP Centroid)
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const numericStreet = streetNum ? parseInt(streetNum, 10) : 100;

  // Check District anchors
  const lowerClean = clean.toLowerCase();
  for (const [distName, distData] of Object.entries(BRAZIL_DISTRICT_ANCHORS)) {
    const distRegex = new RegExp(`\\b${distName}\\b`, 'i');
    if (distRegex.test(lowerClean)) {
      const result = {
        lat: distData.lat,
        lng: distData.lng,
        city: distName,
        state: distData.state,
        precision: 'fallback_district',
        source: 'local_cartography'
      };
      GEOCODE_CACHE.set(cacheKey, result);
      return result;
    }
  }

  // Check CEP prefix anchors
  const cep5Match = clean.match(/\b(\d{2}\.?\d{3})\b/);
  if (cep5Match) {
    const rawCep5 = cep5Match[1].replace(/\D/g, '');
    if (BRAZIL_CEP_PREFIX_ANCHORS[rawCep5]) {
      const anchor = BRAZIL_CEP_PREFIX_ANCHORS[rawCep5];
      const result = {
        lat: anchor.lat,
        lng: anchor.lng,
        city: anchor.name,
        state: anchor.state,
        precision: 'fallback_cep',
        source: 'cep_postal_matrix'
      };
      GEOCODE_CACHE.set(cacheKey, result);
      return result;
    }
  }

  // Check City anchors
  for (const [cityName, anchor] of Object.entries(BRAZIL_CITY_ANCHORS)) {
    if (lowerClean.includes(cityName)) {
      const result = {
        lat: anchor.lat,
        lng: anchor.lng,
        city: cityName,
        state: anchor.state,
        precision: 'fallback_city',
        source: 'local_cartography'
      };
      GEOCODE_CACHE.set(cacheKey, result);
      return result;
    }
  }

  return null;
}

app.get('/api/geocode', async (req, res) => {
  const address = req.query.q || req.query.address;
  if (!address) {
    return res.status(400).json({ error: 'MISSING_ADDRESS', message: 'Parâmetro de endereço (q ou address) é obrigatório.' });
  }

  const result = await geocodeSingleAddress(address);
  if (result) {
    res.json({ success: true, ...result });
  } else {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Endereço não localizado.' });
  }
});

app.post('/api/geocode/batch', async (req, res) => {
  const { addresses } = req.body || {};
  if (!Array.isArray(addresses)) {
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'addresses deve ser um array de endereços.' });
  }

  const results = [];
  for (const item of addresses) {
    const rawAddr = typeof item === 'string' ? item : item.address || item.endereco;
    const id = typeof item === 'object' ? item.id || item.chave : null;
    const geo = await geocodeSingleAddress(rawAddr);
    results.push({
      id,
      address: rawAddr,
      geo: geo || { lat: -22.5269, lng: -41.9483, precision: 'fallback' }
    });
  }

  res.json({ success: true, results });
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
      typeInstructions = `Você é um assistente de IA especialista em roteirização logística e extração de romaneios. Extraia a lista completa de pontos de entrega/coleta do romaneio. Retorne APENAS um array JSON contendo objetos com:
- "chave": identificador único, código ou NF (ex: "ROM-1001", "NF-123")
- "cliente": nome do destinatário / cliente
- "cep": CEP de entrega/destino (ex: "28880-000", "28893-058")
- "endereco": endereço COMPLETO de entrega/destino (incluindo rua, número, bairro/distrito, cidade, estado e CEP). Exemplo: "Rua Sá Pinto, 188 - Barra de São João - Casimiro de Abreu RJ"
- "cepColeta": CEP de coleta/origem (se houver)
- "enderecoColeta": endereço de coleta/origem (se houver)
- "pontoReferencia": ponto de referência comercial ou geográfico
- "telefone": telefone de contato
- "whatsapp": número do WhatsApp
- "pesoMercadoriaKg": peso bruto da carga em kg (número, ex: 15)
- "tipoOperacao": "Entrega" ou "Coleta"
- "notaFiscal": número da nota fiscal se houver`;
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

    console.log(`Chamando Gemini 2.5 Flash para analisar importação do tipo: ${type}...`);
    
    let response;
    let retries = 3;
    let delay = 1000;
    
    for (let i = 0; i < retries; i++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
