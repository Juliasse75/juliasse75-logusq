import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Cliente Upstash Redis inicializado sob demanda.
 * Se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estiverem presentes,
 * utiliza o Redis distribuído em nuvem.
 * Caso contrário, utiliza o limitador local com fallback gracioso em memória.
 */
let upstashRedisClient = null;
let distributedAuthRateLimiter = null;

export function getUpstashRedisClient() {
  if (upstashRedisClient) return upstashRedisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && (url.startsWith('https://') || url.startsWith('http://'))) {
    try {
      upstashRedisClient = new Redis({ url, token });
      return upstashRedisClient;
    } catch (err) {
      console.warn('⚠️ Falha ao inicializar Upstash Redis client:', err);
      return null;
    }
  }
  return null;
}

export function getDistributedRateLimiter() {
  if (distributedAuthRateLimiter) return distributedAuthRateLimiter;

  const redis = getUpstashRedisClient();
  if (redis) {
    distributedAuthRateLimiter = new Ratelimit({
      redis,
      // Janela deslizante de 5 requisições a cada 15 minutos para endpoints de login/auth
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'logusq:ratelimit:auth'
    });
    return distributedAuthRateLimiter;
  }
  return null;
}

/**
 * Limitador em memória de fallback caso Upstash Redis não esteja configurado
 */
const localMemoryMap = new Map();
const LOCAL_WINDOW_MS = 15 * 60 * 1000;
const LOCAL_MAX_ATTEMPTS = 5;

/**
 * Middleware Express para Rate Limiting de Autenticação baseado em IP e Identificador
 */
export function createDistributedAuthRateLimiterMiddleware() {
  return async function distributedAuthRateLimiterMiddleware(req, res, next) {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const identifier = `auth:${clientIp}:${email || 'general'}`;

    const upstashLimiter = getDistributedRateLimiter();

    if (upstashLimiter) {
      try {
        const { success, limit, remaining, reset } = await upstashLimiter.limit(identifier);

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', reset);

        if (!success) {
          const waitSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
          return res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: `🚨 Muitas tentativas de acesso a partir deste endereço IP. Por favor, aguarde ${Math.ceil(waitSeconds / 60)} minuto(s) antes de tentar novamente.`,
            retryAfterSeconds: waitSeconds
          });
        }
        return next();
      } catch (err) {
        console.warn('⚠️ Erro ao consultar Upstash Redis, utilizando fallback local:', err);
      }
    }

    // Fallback local em memória (sliding window simplificada)
    const now = Date.now();
    const entry = localMemoryMap.get(identifier) || { count: 0, firstAttempt: now, lockUntil: 0 };

    if (entry.lockUntil && now < entry.lockUntil) {
      const waitMinutes = Math.ceil((entry.lockUntil - now) / 60000);
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `🚨 Muitas tentativas de acesso. Por favor, aguarde ${waitMinutes} minuto(s) antes de tentar novamente.`
      });
    }

    if (now - entry.firstAttempt > LOCAL_WINDOW_MS) {
      entry.count = 0;
      entry.firstAttempt = now;
      entry.lockUntil = 0;
    }

    next();
  };
}
