import { describe, it, expect } from 'vitest';
import { createTenantSupabaseClient, resolveTenantEmail } from '../server/tenantSupabase.js';

describe('Isolamento Multi-Tenant e Supabase RLS (tenantSupabase)', () => {
  const fakeUrl = 'https://fake-project.supabase.co';
  const fakeAnonKey = 'sb_anon_key_test_1234567890';

  it('deve instanciar o Supabase com cabeçalhos de contexto de tenant sem service_role', () => {
    const client = createTenantSupabaseClient(fakeUrl, fakeAnonKey, {
      tenantEmail: 'transportadora@exemplo.com',
      perfil: 'CLIENTE',
      token: 'jwt-token-valido-123'
    });

    expect(client).toBeDefined();
    expect(client.from).toBeTypeOf('function');
  });

  it('deve retornar null se as credenciais de URL ou AnonKey estiverem ausentes', () => {
    const client = createTenantSupabaseClient('', '');
    expect(client).toBeNull();
  });

  it('deve resolver corretamente o tenant para perfil CLIENTE', async () => {
    const user = {
      email: 'logistica@empresa.com.br',
      perfil: 'CLIENTE'
    };

    const tenantInfo = await resolveTenantEmail(null, user);
    expect(tenantInfo).toEqual({
      isMaster: false,
      tenantEmail: 'logistica@empresa.com.br',
      perfil: 'CLIENTE'
    });
  });

  it('deve resolver corretamente o privilégio para perfil MASTER', async () => {
    const user = {
      email: 'ceo@logusq.com.br',
      perfil: 'MASTER'
    };

    const tenantInfo = await resolveTenantEmail(null, user);
    expect(tenantInfo).toEqual({
      isMaster: true,
      tenantEmail: 'ceo@logusq.com.br',
      perfil: 'MASTER'
    });
  });
});
