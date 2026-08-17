-- ============================================================================
-- LOGUSQ MULTI-TENANT ROW LEVEL SECURITY (RLS) POLICIES & CONTEXT INJECTION
-- ============================================================================
-- Este script SQL define a estrutura atômica de isolamento multi-tenant no PostgreSQL / Supabase.
-- Garante que clientes e motoristas NUNCA acessem dados de outras organizações, mesmo em caso de falha no app.

-- 1. Habilitar RLS em todas as tabelas sensíveis
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS condutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rotas_ativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mensagens_suporte ENABLE ROW LEVEL SECURITY;

-- 2. Função auxiliar para extrair o tenant_id / cliente_email da sessão atual ou JWT
CREATE OR REPLACE FUNCTION current_tenant_email() 
RETURNS TEXT AS $$
BEGIN
  -- 1º Prioridade: Variável de sessão segura definida via SET LOCAL app.current_tenant
  IF NULLIF(current_setting('app.current_tenant', true), '') IS NOT NULL THEN
    RETURN LOWER(TRIM(current_setting('app.current_tenant', true)));
  END IF;

  -- 2º Prioridade: Metadados do token JWT do Supabase Auth (auth.jwt() -> app_metadata ou user_metadata)
  IF auth.jwt() IS NOT NULL THEN
    IF (auth.jwt() -> 'app_metadata' ->> 'tenant_id') IS NOT NULL THEN
      RETURN LOWER(TRIM(auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
    END IF;
    IF (auth.jwt() ->> 'email') IS NOT NULL THEN
      RETURN LOWER(TRIM(auth.jwt() ->> 'email'));
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Função auxiliar para verificar se o usuário atual é MASTER / ADMIN
CREATE OR REPLACE FUNCTION is_admin_or_master() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica variável de sessão de privilégio administrativo
  IF current_setting('app.is_admin', true) = 'true' THEN
    RETURN TRUE;
  END IF;

  -- Verifica perfil no token JWT
  IF auth.jwt() IS NOT NULL THEN
    IF (auth.jwt() -> 'app_metadata' ->> 'perfil') IN ('MASTER', 'COLABORADOR') OR
       (auth.jwt() -> 'user_metadata' ->> 'perfil') IN ('MASTER', 'COLABORADOR') THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) ATÔMICAS
-- ============================================================================

-- Tabela: VEICULOS
DROP POLICY IF EXISTS veiculos_tenant_isolation ON veiculos;
CREATE POLICY veiculos_tenant_isolation ON veiculos
  FOR ALL
  USING (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  )
  WITH CHECK (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  );

-- Tabela: CONDUTORES
DROP POLICY IF EXISTS condutores_tenant_isolation ON condutores;
CREATE POLICY condutores_tenant_isolation ON condutores
  FOR ALL
  USING (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  )
  WITH CHECK (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  );

-- Tabela: ENTREGAS
DROP POLICY IF EXISTS entregas_tenant_isolation ON entregas;
CREATE POLICY entregas_tenant_isolation ON entregas
  FOR ALL
  USING (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  )
  WITH CHECK (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  );

-- Tabela: ROTAS ATIVAS
DROP POLICY IF EXISTS rotas_ativas_tenant_isolation ON rotas_ativas;
CREATE POLICY rotas_ativas_tenant_isolation ON rotas_ativas
  FOR ALL
  USING (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  )
  WITH CHECK (
    is_admin_or_master() OR 
    LOWER(TRIM(cliente_email)) = current_tenant_email()
  );

-- Tabela: AUDITORIA_LOGS (Apenas administradores gravam/visualizam logs globais)
DROP POLICY IF EXISTS auditoria_logs_admin_only ON auditoria_logs;
CREATE POLICY auditoria_logs_admin_only ON auditoria_logs
  FOR ALL
  USING (
    is_admin_or_master() OR 
    LOWER(TRIM(operador_email)) = current_tenant_email()
  )
  WITH CHECK (
    is_admin_or_master() OR 
    LOWER(TRIM(operador_email)) = current_tenant_email()
  );
