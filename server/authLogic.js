// =========================================================================
// LÓGICA DE AUTENTICAÇÃO E SEGURANÇA — extraída do server.js para poder
// ser testada isoladamente (sem precisar subir o servidor Express/Vite).
// server.js importa e usa estas mesmas funções — o comportamento é idêntico,
// só o local onde o código mora mudou.
// =========================================================================

import jwt from 'jsonwebtoken';

/**
 * Chave secreta padrão de fallback para ambientes de desenvolvimento / teste.
 * Em produção, sempre configure a variável de ambiente JWT_SECRET.
 */
export const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'logusq-enterprise-jwt-super-secret-key-2026-production';

/**
 * Gera um token JWT assinado criptograficamente contendo as reivindicações do usuário (claims).
 * NUNCA inclua senhas ou dados sensíveis dentro do payload do JWT.
 */
export function generateAuthToken(user, secret = DEFAULT_JWT_SECRET, expiresIn = '24h') {
  if (!user || !user.email) {
    throw new Error('Payload inválido para geração de token JWT.');
  }

  const payload = {
    email: String(user.email).toLowerCase().trim(),
    nome: user.nome || '',
    perfil: String(user.perfil || 'CLIENTE').toUpperCase().trim(),
    nivelAcesso: String(user.nivelAcesso || user.nivel_acesso || 'TOTAL').toUpperCase().trim(),
    empresa: user.empresa || null,
    veiculo: user.veiculo || null,
    idCliente: user.idCliente || user.id_cliente || null
  };

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Valida a assinatura e expiração de um token JWT.
 * Retorna o payload decodificado se válido, ou lança um erro caso expirado/inválido/adulterado.
 */
export function verifyAuthToken(token, secret = DEFAULT_JWT_SECRET) {
  if (!token) {
    throw new Error('Token de autenticação não fornecido.');
  }
  return jwt.verify(token, secret);
}

/**
 * Cria o middleware de autenticação Express.
 * Extrai o token do header `Authorization: Bearer <token>`, valida a assinatura e
 * anexa o payload autenticado em `req.user`.
 * Rejeita qualquer tentativa com token ausente ou inválido com status 401.
 */
export function createAuthMiddleware(secret = DEFAULT_JWT_SECRET) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Acesso negado: Token JWT de autenticação ausente ou inválido no cabeçalho Authorization.'
      });
    }

    const token = authHeader.substring(7).trim();

    try {
      const decoded = verifyAuthToken(token, secret);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Acesso negado: Sessão expirada ou token de autenticação JWT inválido/adulterado.',
        details: err.message
      });
    }
  };
}

/**
 * Cria o middleware de autorização por função (Role-Based Access Control - RBAC) para evitar BFLA.
 * Valida se a função extraída EXCLUSIVAMENTE do token JWT assinado está na lista de papéis permitidos.
 */
export function requireRoles(...allowedRoles) {
  const upperRoles = allowedRoles.map(r => String(r).toUpperCase().trim());
  return (req, res, next) => {
    if (!req.user || !req.user.perfil) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Acesso negado: Usuário não autenticado.'
      });
    }

    const userRole = String(req.user.perfil).toUpperCase().trim();

    if (!upperRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Acesso proibido: O perfil "${userRole}" não possui permissão para executar esta operação administrativa.`
      });
    }

    next();
  };
}

/**
 * Valida a força de uma senha.
 * Regras: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 especial.
 * Retorna null se a senha é forte, ou uma mensagem de erro em português se não é.
 */

export function validateStrongPassword(password) {
  if (!password || password.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
  if (!/[a-z]/.test(password)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).';
  return null;
}

/**
 * Converte uma data no formato brasileiro (DD/MM/AAAA) para um objeto Date.
 * Retorna null se o formato for inválido.
 */
export function parsePtBrDateServer(dateStr) {
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

/**
 * Cria um limitador de tentativas de login (proteção contra força bruta),
 * isolado por chamada — cada instância tem sua própria memória de tentativas.
 * server.js cria UMA instância no início e usa ela durante toda a vida do processo.
 * Os testes criam uma instância nova a cada teste, para não vazar estado entre eles.
 */
export function createLoginRateLimiter({
  maxFailedAttempts = 5,
  lockoutDurationMs = 15 * 60 * 1000,
  windowDurationMs = 5 * 60 * 1000,
} = {}) {
  const loginAttemptsMap = new Map();

  function checkLoginRateLimit(identifier, now = Date.now()) {
    if (!identifier) return { isLocked: false, remainingAttempts: maxFailedAttempts };
    const key = String(identifier).toLowerCase().trim();
    const attemptData = loginAttemptsMap.get(key);

    if (!attemptData) return { isLocked: false, remainingAttempts: maxFailedAttempts };

    if (attemptData.lockUntil && now < attemptData.lockUntil) {
      const remainingSeconds = Math.ceil((attemptData.lockUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return {
        isLocked: true,
        remainingSeconds,
        remainingMinutes,
        message: `🚨 Proteção contra ataques de força bruta ativada: Excesso de tentativas incorretas. Sua conta está temporariamente bloqueada por segurança. Tente novamente em ${remainingMinutes} minuto(s) (${remainingSeconds}s).`
      };
    }

    if (now - attemptData.firstAttemptAt > windowDurationMs && (!attemptData.lockUntil || now >= attemptData.lockUntil)) {
      loginAttemptsMap.delete(key);
      return { isLocked: false, remainingAttempts: maxFailedAttempts };
    }

    return {
      isLocked: false,
      remainingAttempts: Math.max(0, maxFailedAttempts - attemptData.count)
    };
  }

  function registerFailedLoginAttempt(identifier, now = Date.now()) {
    if (!identifier) return;
    const key = String(identifier).toLowerCase().trim();
    const attemptData = loginAttemptsMap.get(key) || { count: 0, firstAttemptAt: now, lockUntil: null };

    if (now - attemptData.firstAttemptAt > windowDurationMs && (!attemptData.lockUntil || now >= attemptData.lockUntil)) {
      attemptData.count = 1;
      attemptData.firstAttemptAt = now;
      attemptData.lockUntil = null;
    } else {
      attemptData.count += 1;
    }

    if (attemptData.count >= maxFailedAttempts) {
      attemptData.lockUntil = now + lockoutDurationMs;
    }

    loginAttemptsMap.set(key, attemptData);
    return attemptData;
  }

  function resetLoginAttempts(identifier) {
    if (!identifier) return;
    const key = String(identifier).toLowerCase().trim();
    loginAttemptsMap.delete(key);
  }

  return { checkLoginRateLimit, registerFailedLoginAttempt, resetLoginAttempts, maxFailedAttempts };
}

// Instância padrão de Rate Limiter usada pelo servidor principal
const defaultRateLimiter = createLoginRateLimiter();
export const checkLoginRateLimit = defaultRateLimiter.checkLoginRateLimit;
export const registerFailedLoginAttempt = defaultRateLimiter.registerFailedLoginAttempt;
export const resetLoginAttempts = defaultRateLimiter.resetLoginAttempts;

/**
 * Verifica se um cliente deve ser bloqueado por inadimplência (venceu há mais
 * de 3 dias e não teve pagamento confirmado) ou já está marcado como bloqueado.
 * Recebe o cliente `supabase` por parâmetro (em vez de importar direto) para
 * que os testes possam passar um cliente Supabase falso/mock.
 */
export async function checkClientBlocked(supabase, email) {
  if (!supabase) return false;

  try {
    const { data: usersMatched } = await supabase
      .from('usuarios')
      .select('perfil, email, empresa')
      .ilike('email', email);

    if (!usersMatched || usersMatched.length === 0) return false;
    const userRecord = usersMatched[0];

    const evaluateAndBlock = async (clientEmail, empresaNome) => {
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

      if (!matchedClient.pagamento_confirmado && matchedClient.vencimento) {
        const venc = parsePtBrDateServer(matchedClient.vencimento);
        if (venc) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          venc.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - venc.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 3) {
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

    if (userRecord.perfil === 'CLIENTE') {
      return await evaluateAndBlock(userRecord.email, userRecord.empresa);
    }

    if (userRecord.perfil === 'COLABORADOR') {
      if (userRecord.empresa) {
        return await evaluateAndBlock('', userRecord.empresa);
      }
    }

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
