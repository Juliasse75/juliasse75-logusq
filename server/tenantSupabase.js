import { createClient } from '@supabase/supabase-js';

/**
 * Cria uma instância do cliente Supabase configurada para o inquilino (tenant) atual.
 * Injeta o token JWT do usuário ou headers customizados de tenant no cliente,
 * respeitando estritamente o Row Level Security (RLS) sem utilizar a service_role key.
 *
 * @param {string} supabaseUrl - URL do projeto Supabase
 * @param {string} supabaseAnonKey - Chave anônima (pública) do Supabase
 * @param {Object} tenantContext - Informações do usuário autenticado ({ email, perfil, tenantEmail, token })
 * @returns {Object} Instância configurada do Supabase Client
 */
export function createTenantSupabaseClient(supabaseUrl, supabaseAnonKey, tenantContext = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { token, tenantEmail, perfil } = tenantContext;
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantEmail) {
    headers['x-tenant-id'] = tenantEmail;
  }

  if (perfil) {
    headers['x-user-role'] = perfil;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers
    }
  });
}

/**
 * Helper para obter o tenant ID / e-mail da empresa responsável a partir do contexto do usuário autenticado.
 * - MASTER / COLABORADOR: Tem visão global.
 * - CLIENTE: O próprio e-mail corporativo é a chave do tenant.
 * - MOTORISTA: Vinculado ao e-mail do cliente contratante.
 */
export async function resolveTenantEmail(supabaseMasterClient, user) {
  if (!user || !user.email) return null;

  const perfil = String(user.perfil || '').toUpperCase().trim();
  const userEmail = String(user.email).toLowerCase().trim();

  if (perfil === 'MASTER' || perfil === 'COLABORADOR') {
    return { isMaster: true, tenantEmail: userEmail, perfil };
  }

  if (perfil === 'CLIENTE') {
    return { isMaster: false, tenantEmail: userEmail, perfil };
  }

  if (perfil === 'MOTORISTA' && supabaseMasterClient) {
    try {
      const { data: driver } = await supabaseMasterClient
        .from('condutores')
        .select('cliente_email')
        .eq('email', userEmail)
        .maybeSingle();

      if (driver && driver.cliente_email) {
        return { isMaster: false, tenantEmail: String(driver.cliente_email).toLowerCase().trim(), perfil };
      }
    } catch (err) {
      console.warn('Não foi possível resolver o cliente do motorista no Supabase:', err);
    }
  }

  return { isMaster: false, tenantEmail: userEmail, perfil };
}
