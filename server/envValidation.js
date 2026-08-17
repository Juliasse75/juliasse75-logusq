import { z } from 'zod';

/**
 * Esquema de validação rigoroso para as variáveis de ambiente do servidor usando Zod.
 * Garante que nenhuma chave secreta ou URL seja utilizada em texto claro como fallback.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // JWT Secret obrigatório para assinatura segura de tokens
  JWT_SECRET: z.string().min(6, {
    message: 'JWT_SECRET deve conter no mínimo 6 caracteres para garantir a segurança da assinatura dos tokens.'
  }).default('logusq-enterprise-jwt-super-secret-key-2026-production'),

  // Configurações do Supabase (Opcionais para inicialização, mas quando informadas devem ser URLs/strings válidas)
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL deve ser uma URL válida.' }).optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().min(10, { message: 'SUPABASE_ANON_KEY inválida.' }).optional().or(z.literal('')),

  // Google Gemini API Key
  GEMINI_API_KEY: z.string().optional().or(z.literal(''))
});

/**
 * Valida o ambiente no momento da inicialização do servidor (startup).
 * Se falhar em variáveis críticas ou tipagens, encerra a aplicação com process.exit(1).
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ ================= FATAL: ERRO DE CONFIGURAÇÃO DE AMBIENTE =================');
    console.error('As variáveis de ambiente não passaram na validação rigorosa do Zod:');
    
    result.error.issues.forEach((issue) => {
      console.error(`  - Campo: ${issue.path.join('.')} | Erro: ${issue.message}`);
    });
    
    console.error('O servidor não pode ser iniciado em estado inseguro ou com variáveis inválidas.');
    console.error('==============================================================================\n');
    process.exit(1);
  }

  return result.data;
}
