import { describe, it, expect } from 'vitest';
import { envSchema } from '../server/envValidation.js';

describe('Validação de Variáveis de Ambiente com Zod (envValidation)', () => {
  it('deve validar com sucesso variáveis corretas', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: '3000',
      JWT_SECRET: 'uma-chave-secreta-muito-segura-e-longa-2026',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'sb_anon_key_1234567890'
    };

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.JWT_SECRET).toBe('uma-chave-secreta-muito-segura-e-longa-2026');
    }
  });

  it('deve rejeitar SUPABASE_URL mal formatada', () => {
    const invalidEnv = {
      SUPABASE_URL: 'url-invalida-sem-protocolo',
      JWT_SECRET: 'uma-chave-secreta-longa-2026'
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('SUPABASE_URL'));
      expect(issue).toBeDefined();
    }
  });

  it('deve rejeitar JWT_SECRET muito curto (menos de 6 caracteres)', () => {
    const invalidEnv = {
      JWT_SECRET: 'abc'
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('JWT_SECRET'));
      expect(issue).toBeDefined();
    }
  });
});
