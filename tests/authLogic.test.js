import { describe, it, expect } from 'vitest';
import { validateStrongPassword, createLoginRateLimiter, parsePtBrDateServer } from '../server/authLogic.js';

describe('validateStrongPassword', () => {
  it('rejeita senha curta', () => {
    expect(validateStrongPassword('Ab1!')).toMatch(/mínimo 8 caracteres/);
  });

  it('rejeita senha sem maiúscula', () => {
    expect(validateStrongPassword('abcdef1!')).toMatch(/maiúscula/);
  });

  it('rejeita senha sem minúscula', () => {
    expect(validateStrongPassword('ABCDEF1!')).toMatch(/minúscula/);
  });

  it('rejeita senha sem número', () => {
    expect(validateStrongPassword('Abcdefg!')).toMatch(/número/);
  });

  it('rejeita senha sem caractere especial', () => {
    expect(validateStrongPassword('Abcdefg1')).toMatch(/caractere especial/);
  });

  it('rejeita as senhas antigas fracas que o sistema aceitava antes (123456)', () => {
    // Prova de regressão: garante que a senha universal antiga nunca mais passa na validação
    expect(validateStrongPassword('123456')).not.toBeNull();
  });

  it('aceita uma senha forte de verdade', () => {
    expect(validateStrongPassword('LogusQ@2026')).toBeNull();
  });
});

describe('parsePtBrDateServer', () => {
  it('converte uma data DD/MM/AAAA corretamente', () => {
    const d = parsePtBrDateServer('23/07/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // Julho = índice 6
    expect(d.getDate()).toBe(23);
  });

  it('retorna null para string vazia ou inválida', () => {
    expect(parsePtBrDateServer('')).toBeNull();
    expect(parsePtBrDateServer('data-invalida')).toBeNull();
  });
});

describe('createLoginRateLimiter (proteção contra força bruta)', () => {
  it('permite login normalmente antes de qualquer tentativa falha', () => {
    const limiter = createLoginRateLimiter();
    const status = limiter.checkLoginRateLimit('cliente@teste.com.br');
    expect(status.isLocked).toBe(false);
    expect(status.remainingAttempts).toBe(5);
  });

  it('reduz as tentativas restantes a cada falha registrada', () => {
    const limiter = createLoginRateLimiter();
    limiter.registerFailedLoginAttempt('cliente@teste.com.br');
    limiter.registerFailedLoginAttempt('cliente@teste.com.br');

    const status = limiter.checkLoginRateLimit('cliente@teste.com.br');
    expect(status.isLocked).toBe(false);
    expect(status.remainingAttempts).toBe(3);
  });

  it('bloqueia a conta após 5 tentativas falhas consecutivas', () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 5; i++) {
      limiter.registerFailedLoginAttempt('vitima@teste.com.br');
    }

    const status = limiter.checkLoginRateLimit('vitima@teste.com.br');
    expect(status.isLocked).toBe(true);
    expect(status.remainingMinutes).toBeGreaterThan(0);
  });

  it('o bloqueio expira depois de 15 minutos', () => {
    const limiter = createLoginRateLimiter();
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) {
      limiter.registerFailedLoginAttempt('vitima2@teste.com.br', t0);
    }

    // Ainda dentro dos 15 minutos de bloqueio
    const aindaBloqueado = limiter.checkLoginRateLimit('vitima2@teste.com.br', t0 + 14 * 60 * 1000);
    expect(aindaBloqueado.isLocked).toBe(true);

    // Passaram os 15 minutos
    const jaLiberado = limiter.checkLoginRateLimit('vitima2@teste.com.br', t0 + 16 * 60 * 1000);
    expect(jaLiberado.isLocked).toBe(false);
  });

  it('login correto reseta o contador de tentativas', () => {
    const limiter = createLoginRateLimiter();
    limiter.registerFailedLoginAttempt('user@teste.com.br');
    limiter.registerFailedLoginAttempt('user@teste.com.br');
    limiter.resetLoginAttempts('user@teste.com.br');

    const status = limiter.checkLoginRateLimit('user@teste.com.br');
    expect(status.remainingAttempts).toBe(5);
  });

  it('contas diferentes têm contadores de tentativas independentes', () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 5; i++) {
      limiter.registerFailedLoginAttempt('contaA@teste.com.br');
    }

    // A conta B não deve ser afetada pelas tentativas falhas da conta A
    const statusB = limiter.checkLoginRateLimit('contaB@teste.com.br');
    expect(statusB.isLocked).toBe(false);
    expect(statusB.remainingAttempts).toBe(5);
  });
});
