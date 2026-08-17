import { describe, it, expect } from 'vitest';
import { generatePasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from '../server/passwordResetService.js';

describe('Fluxo Seguro de Recuperação de Senha OOB (passwordResetService)', () => {
  const testEmail = 'recuperacao@empresa.com.br';

  it('deve gerar um token OOB válido e verificar com sucesso', () => {
    const { rawToken, expiresAt } = generatePasswordResetToken(testEmail);
    expect(rawToken).toBeDefined();
    expect(rawToken.length).toBe(64); // 32 bytes em hex
    expect(expiresAt).toBeGreaterThan(Date.now());

    // Verificação válida
    const verification = verifyPasswordResetToken(testEmail, rawToken);
    expect(verification.valid).toBe(true);
  });

  it('deve rejeitar token incorreto ou adulterado', () => {
    generatePasswordResetToken(testEmail);
    const verification = verifyPasswordResetToken(testEmail, 'token-falso-adulterado-123456');
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain('Token de recuperação inválido');
  });

  it('deve invalidar o token após o consumo de uso único', () => {
    const { rawToken } = generatePasswordResetToken(testEmail);
    
    // Consumir
    consumePasswordResetToken(testEmail);

    const checkAgain = verifyPasswordResetToken(testEmail, rawToken);
    expect(checkAgain.valid).toBe(false);
  });

  it('deve rejeitar tentativas sem e-mail ou sem token', () => {
    const verification = verifyPasswordResetToken('', '');
    expect(verification.valid).toBe(false);
  });
});
