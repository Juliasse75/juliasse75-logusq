-- =========================================================================
-- LOGUSQ SAAS - ROW-LEVEL SECURITY (RLS) MULTI-TENANT ISOLATION (COMPLETO)
-- Database: PostgreSQL / Supabase
-- Target Tables: clientes, veiculos, condutores, entregas, rotas_ativas, usuarios, auditoria_logs
-- =========================================================================

-- 1. HABILITAR E FORÇAR ROW LEVEL SECURITY EM TODAS AS TABELAS
ALTER TABLE IF EXISTS clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS condutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rotas_ativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auditoria_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS clientes FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS condutores FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rotas_ativas FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auditoria_logs FORCE ROW LEVEL SECURITY;

-- 2. DERRUBAR POLÍTICAS ANTIGAS PARA EVITAR CONFLITOS
DROP POLICY IF EXISTS rls_clientes_tenant_policy ON clientes;
DROP POLICY IF EXISTS rls_veiculos_tenant_policy ON veiculos;
DROP POLICY IF EXISTS rls_condutores_tenant_policy ON condutores;
DROP POLICY IF EXISTS rls_entregas_tenant_policy ON entregas;
DROP POLICY IF EXISTS rls_rotas_ativas_tenant_policy ON rotas_ativas;
DROP POLICY IF EXISTS rls_usuarios_tenant_policy ON usuarios;
DROP POLICY IF EXISTS rls_auditoria_logs_tenant_policy ON auditoria_logs;

DROP POLICY IF EXISTS usuarios_tenant_isolation ON usuarios;
DROP POLICY IF EXISTS clientes_tenant_isolation ON clientes;
DROP POLICY IF EXISTS veiculos_tenant_isolation ON veiculos;
DROP POLICY IF EXISTS condutores_tenant_isolation ON condutores;
DROP POLICY IF EXISTS entregas_tenant_isolation ON entregas;
DROP POLICY IF EXISTS rotas_ativas_tenant_isolation ON rotas_ativas;

-- 3. CRIAR FUNÇÃO PL/pgSQL DE INJEÇÃO DE CONTEXTO DO INQUILINO (set_config)
CREATE OR REPLACE FUNCTION set_tenant_context(
    p_tenant_id TEXT,
    p_tenant_email TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Injeta a variável de sessão local da conexão PostgreSQL (válida durante a transação)
    PERFORM set_config('app.current_tenant_id', COALESCE(p_tenant_id, ''), true);
    
    IF p_tenant_email IS NOT NULL AND p_tenant_email <> '' THEN
        PERFORM set_config('app.current_tenant_email', p_tenant_email, true);
    ELSE
        PERFORM set_config('app.current_tenant_email', COALESCE(p_tenant_id, ''), true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICAS DE SEGURANÇA POR LINHA (CREATE POLICY)

-- 4.1 Tabela: clientes (Dados cadastrais da empresa embarcadora)
CREATE POLICY rls_clientes_tenant_policy ON clientes
    FOR ALL
    USING (
        id_cliente = current_setting('app.current_tenant_id', true)
        OR email = current_setting('app.current_tenant_email', true)
        OR email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        id_cliente = current_setting('app.current_tenant_id', true)
        OR email = current_setting('app.current_tenant_email', true)
        OR email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 4.2 Tabela: veiculos (Frota cadastrada do cliente embarcador)
CREATE POLICY rls_veiculos_tenant_policy ON veiculos
    FOR ALL
    USING (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 4.3 Tabela: condutores (Motoristas vinculados à operação do embarcador)
CREATE POLICY rls_condutores_tenant_policy ON condutores
    FOR ALL
    USING (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 4.4 Tabela: entregas (Notas fiscais e pedidos de entrega/coleta)
CREATE POLICY rls_entregas_tenant_policy ON entregas
    FOR ALL
    USING (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 4.5 Tabela: rotas_ativas (Roteirizações e itinerários em tempo real do operador)
CREATE POLICY rls_rotas_ativas_tenant_policy ON rotas_ativas
    FOR ALL
    USING (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        cliente_email = current_setting('app.current_tenant_email', true)
        OR cliente_email = current_setting('app.current_tenant_id', true)
        OR cliente_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 4.6 Tabela: usuarios (Acesso às credenciais/perfil do próprio usuário ou visão MASTER)
CREATE POLICY rls_usuarios_tenant_policy ON usuarios
    FOR ALL
    USING (
        email = current_setting('app.current_tenant_email', true)
        OR email = current_setting('app.current_tenant_id', true)
        OR email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        email = current_setting('app.current_tenant_email', true)
        OR email = current_setting('app.current_tenant_id', true)
        OR email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 4.7 Tabela: auditoria_logs (Logs de auditoria isolados por operador/tenant)
CREATE POLICY rls_auditoria_logs_tenant_policy ON auditoria_logs
    FOR ALL
    USING (
        operador_email = current_setting('app.current_tenant_email', true)
        OR operador_email = current_setting('app.current_tenant_id', true)
        OR operador_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    )
    WITH CHECK (
        operador_email = current_setting('app.current_tenant_email', true)
        OR operador_email = current_setting('app.current_tenant_id', true)
        OR operador_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'perfil' = 'MASTER')
    );

-- 5. COMENTÁRIOS DE AUDITORIA NO BANCO DE DADOS
COMMENT ON TABLE clientes IS 'LogusQ SaaS: Protegido por RLS (Isolamento de Clientes Embarcadores)';
COMMENT ON TABLE veiculos IS 'LogusQ SaaS: Protegido por RLS (Isolamento de Frotas de Veículos)';
COMMENT ON TABLE condutores IS 'LogusQ SaaS: Protegido por RLS (Isolamento de Motoristas / RH)';
COMMENT ON TABLE entregas IS 'LogusQ SaaS: Protegido por RLS (Isolamento Estrito de Notas Fiscais e Pedidos)';
COMMENT ON TABLE rotas_ativas IS 'LogusQ SaaS: Protegido por RLS (Isolamento de Itinerários e Rotas Calculadas)';
COMMENT ON TABLE usuarios IS 'LogusQ SaaS: Protegido por RLS (Isolamento de Usuários e Perfis)';
COMMENT ON TABLE auditoria_logs IS 'LogusQ SaaS: Protegido por RLS (Isolamento de Rastro de Auditoria)';
