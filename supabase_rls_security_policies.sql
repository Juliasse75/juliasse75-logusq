-- LOGUSQ SYSTEM - ROW LEVEL SECURITY (RLS) POLICIES
-- Script de Políticas de Segurança no Banco de Dados (PostgreSQL / Supabase)
-- Data de Atualização: 23/07/2026

-- 1. Habilitar RLS em todas as tabelas operacionais
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS condutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rotas_ativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mensagens_suporte ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas legadas se existirem
DROP POLICY IF EXISTS usuarios_tenant_isolation ON usuarios;
DROP POLICY IF EXISTS clientes_tenant_isolation ON clientes;
DROP POLICY IF EXISTS veiculos_tenant_isolation ON veiculos;
DROP POLICY IF EXISTS condutores_tenant_isolation ON condutores;
DROP POLICY IF EXISTS entregas_tenant_isolation ON entregas;
DROP POLICY IF EXISTS rotas_ativas_tenant_isolation ON rotas_ativas;

-- 3. Política de Isolamento para Usuários
CREATE POLICY usuarios_tenant_isolation ON usuarios
  FOR ALL
  USING (
    email = auth.jwt() ->> 'email'
    OR (auth.jwt() ->> 'perfil' = 'MASTER')
  );

-- 4. Política de Isolamento para Clientes (Empresas Contratantes)
CREATE POLICY clientes_tenant_isolation ON clientes
  FOR ALL
  USING (
    email = auth.jwt() ->> 'email'
    OR (auth.jwt() ->> 'perfil' = 'MASTER')
  );

-- 5. Política de Isolamento para Veículos de Frota
CREATE POLICY veiculos_tenant_isolation ON veiculos
  FOR ALL
  USING (
    cliente_email = auth.jwt() ->> 'email'
    OR (auth.jwt() ->> 'perfil' = 'MASTER')
  );

-- 6. Política de Isolamento para Condutores / Motoristas
CREATE POLICY condutores_tenant_isolation ON condutores
  FOR ALL
  USING (
    cliente_email = auth.jwt() ->> 'email'
    OR email = auth.jwt() ->> 'email'
    OR (auth.jwt() ->> 'perfil' = 'MASTER')
  );

-- 7. Política de Isolamento para Entregas e Coletas
CREATE POLICY entregas_tenant_isolation ON entregas
  FOR ALL
  USING (
    cliente_email = auth.jwt() ->> 'email'
    OR (auth.jwt() ->> 'perfil' = 'MASTER')
  );

-- 8. Política de Isolamento para Rotas Roteirizadas Ativas
CREATE POLICY rotas_ativas_tenant_isolation ON rotas_ativas
  FOR ALL
  USING (
    cliente_email = auth.jwt() ->> 'email'
    OR (auth.jwt() ->> 'perfil' = 'MASTER')
  );

-- Confirmação
COMMENT ON TABLE entregas IS 'Tabela protegida por RLS com isolamento estrito por cliente_email (LogusQ 2026)';
