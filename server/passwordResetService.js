import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Armazenamento em memória dos hashes de tokens de recuperação OOB (com fallback resiliente).
 * Estrutura: email => { tokenHash, expiresAt, used }
 */
const passwordResetTokensMap = new Map();
const RESET_TOKEN_VALIDITY_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Gera um token seguro de uso único para recuperação de senha (OOB - Out of Band).
 * Retorna o token em texto claro (para ser enviado ao usuário) e salva o hash criptográfico com validade de 15 minutos.
 *
 * @param {string} email - E-mail do usuário
 * @returns {{ rawToken: string, expiresAt: number }}
 */
export function generatePasswordResetToken(email) {
  if (!email) throw new Error('E-mail é obrigatório para gerar token de recuperação.');

  const cleanEmail = String(email).toLowerCase().trim();
  
  // Gera token aleatório criptograficamente forte (32 bytes hex)
  const rawToken = crypto.randomBytes(32).toString('hex');
  
  // Gera hash SHA-256 do token para salvar no banco/memória
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + RESET_TOKEN_VALIDITY_MS;

  passwordResetTokensMap.set(cleanEmail, {
    tokenHash,
    expiresAt,
    used: false
  });

  return { rawToken, expiresAt };
}

/**
 * Valida o token de recuperação fornecido contra o hash armazenado.
 *
 * @param {string} email - E-mail do usuário
 * @param {string} rawToken - Token em texto claro enviado na requisição
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyPasswordResetToken(email, rawToken) {
  if (!email || !rawToken) {
    return { valid: false, error: 'E-mail e token de recuperação são obrigatórios.' };
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const entry = passwordResetTokensMap.get(cleanEmail);

  if (!entry) {
    return { valid: false, error: 'Nenhum pedido de recuperação de senha ativo para este e-mail ou o token já expirou.' };
  }

  if (entry.used) {
    return { valid: false, error: 'Este token de recuperação já foi utilizado. Solicite um novo código.' };
  }

  if (Date.now() > entry.expiresAt) {
    passwordResetTokensMap.delete(cleanEmail);
    return { valid: false, error: 'O token de recuperação expirou (validade máxima de 15 minutos). Solicite um novo.' };
  }

  const computedHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  if (computedHash !== entry.tokenHash) {
    return { valid: false, error: 'Token de recuperação inválido ou incorreto.' };
  }

  return { valid: true };
}

/**
 * Marca o token de recuperação como utilizado e o remove.
 *
 * @param {string} email
 */
export function consumePasswordResetToken(email) {
  if (!email) return;
  const cleanEmail = String(email).toLowerCase().trim();
  passwordResetTokensMap.delete(cleanEmail);
}
