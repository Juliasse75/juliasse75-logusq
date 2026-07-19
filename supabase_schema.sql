-- ==========================================
-- LOGUSQ SYSTEM - DATABASE SCHEMA FOR SUPABASE
-- TORRE DE CONTROLE LOGÍSTICA E CONTINGENCIAMENTO
-- ==========================================

-- Habilita extensão de criptografia caso necessária
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE USUÁRIOS (SaaS Auth Credentials & Profiles)
CREATE TABLE IF NOT EXISTS usuarios (
    email VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('MASTER', 'CLIENTE', 'MOTORISTA', 'COLABORADOR')),
    empresa VARCHAR(255),
    veiculo VARCHAR(50), -- Placa associada para motoristas
    nivel_acesso VARCHAR(50) DEFAULT 'PARCIAL' CHECK (nivel_acesso IN ('TOTAL', 'PARCIAL')),
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CLIENTES (Empresas Beta SaaS)
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE REFERENCES usuarios(email) ON DELETE CASCADE,
    empresa VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    plano VARCHAR(50) DEFAULT 'Start' CHECK (plano IN ('POC', 'Start', 'Pro', 'Enterprise')),
    status VARCHAR(50) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Bloqueado', 'Cancelado')),
    valor_plano NUMERIC(10, 2) DEFAULT 0.00,
    pagamento_confirmado BOOLEAN DEFAULT TRUE,
    resp_nome VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE VEÍCULOS (Gestão de Frota)
CREATE TABLE IF NOT EXISTS veiculos (
    id_veiculo VARCHAR(50) PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    fabricante VARCHAR(100),
    ano_fabricacao VARCHAR(10),
    ano_modelo VARCHAR(10),
    cor VARCHAR(50),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Caminhão Pesado', 'Van', 'Picape 4x4', 'Carro Leve', 'Motocicleta')),
    capacidade_kg INTEGER NOT NULL DEFAULT 1000,
    status VARCHAR(50) DEFAULT 'Disponivel' CHECK (status IN ('Disponivel', 'Manutencao', 'Inativo')),
    defeito TEXT,
    cliente_email VARCHAR(255) NOT NULL REFERENCES usuarios(email) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE CONDUTORES (Gestão de Motoristas / RH)
CREATE TABLE IF NOT EXISTS condutores (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    rg VARCHAR(20),
    nascimento VARCHAR(20),
    telefone VARCHAR(50),
    email VARCHAR(255) NOT NULL UNIQUE REFERENCES usuarios(email) ON DELETE CASCADE,
    cnh VARCHAR(20) NOT NULL UNIQUE,
    categoria_cnh VARCHAR(10) NOT NULL,
    venc_cnh VARCHAR(20) NOT NULL,
    veiculo VARCHAR(50), -- Placa do veículo vinculado
    status VARCHAR(50) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Afastado', 'Férias', 'Licença', 'Inativo')),
    cliente_email VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE ENTREGAS / COLETAS
CREATE TABLE IF NOT EXISTS entregas (
    id VARCHAR(100) PRIMARY KEY,
    chave VARCHAR(100) NOT NULL,
    cliente VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    endereco_coleta TEXT,
    ponto_referencia TEXT,
    telefone VARCHAR(50),
    whatsapp VARCHAR(50),
    nota_fiscal VARCHAR(100),
    foto_comprovante TEXT,
    data_entregue VARCHAR(50),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    peso_mercadoria_kg INTEGER NOT NULL DEFAULT 10,
    tipo_operacao VARCHAR(50) DEFAULT 'Entrega' CHECK (tipo_operacao IN ('Entrega', 'Coleta')),
    status VARCHAR(50) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Entregue', 'Cancelado')),
    observacao TEXT,
    motorista_nome VARCHAR(255),
    cliente_email VARCHAR(255) NOT NULL REFERENCES usuarios(email) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE ROTAS ATIVAS (Roteirizações do Operador)
CREATE TABLE IF NOT EXISTS rotas_ativas (
    id SERIAL PRIMARY KEY,
    cliente_email VARCHAR(255) NOT NULL REFERENCES usuarios(email) ON DELETE CASCADE,
    rotas_json JSONB NOT NULL, -- Estrutura de rotas ativas agrupada por placa
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE AUDITORIA DE LOGS
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id VARCHAR(100) PRIMARY KEY,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    operador_email VARCHAR(255) NOT NULL,
    acao VARCHAR(255) NOT NULL,
    descricao TEXT,
    modulo VARCHAR(50) DEFAULT 'Geral',
    status VARCHAR(50) DEFAULT 'Sucesso' CHECK (status IN ('Sucesso', 'Erro'))
);

-- 8. TABELA DE MENSAGENS DE SUPORTE
CREATE TABLE IF NOT EXISTS mensagens_suporte (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    respondido BOOLEAN DEFAULT FALSE,
    data_envio VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES DE DESEMPENHO E GARANTIA DE VELOCIDADE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_condutores_cliente ON condutores(cliente_email);
CREATE INDEX IF NOT EXISTS idx_entregas_cliente ON entregas(cliente_email);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);
CREATE INDEX IF NOT EXISTS idx_rotas_ativas_cliente ON rotas_ativas(cliente_email);

-- ==========================================
-- CRIAÇÃO DE DADOS INICIAIS (SEED INICIAL DO CEO MASTER)
-- Senha de segurança padrão hash bcrypt para 'ceo@logusq.com.br' -> 'ceoLogusQ@2026'
-- ==========================================
INSERT INTO usuarios (email, nome, perfil, nivel_acesso, senha_hash)
VALUES (
    'ceo@logusq.com.br', 
    'Cosme Juliasse', 
    'MASTER', 
    'TOTAL', 
    '$2a$10$w85I61qZ7T.7H7U.SgOWeOf4b2G9N1oT1uV53zS76x9g9h6K8TMyq' -- Hash para ceoLogusQ@2026
)
ON CONFLICT (email) DO NOTHING;
