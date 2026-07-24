import { describe, it, expect } from 'vitest';
import { checkClientBlocked } from '../server/authLogic.js';

// -----------------------------------------------------------------------
// Supabase "falso" (mock) — simula só o pedaço da API real que o
// checkClientBlocked() usa (.from().select().ilike()/.eq()/.update()).
// Isso deixa o teste rápido e sem precisar de internet ou banco de verdade.
// -----------------------------------------------------------------------
function criarSupabaseFalso({ usuarios = [], clientes = [], condutores = [] } = {}) {
  const updates = []; // registra toda vez que o código tenta bloquear um cliente

  function tabela(nome) {
    const dadosPorTabela = { usuarios, clientes, condutores };
    let rows = dadosPorTabela[nome] || [];
    let filtros = [];

    const builder = {
      select: () => builder,
      ilike: (campo, valor) => {
        filtros.push((r) => r[campo] && String(r[campo]).toLowerCase() === String(valor).toLowerCase());
        return builder;
      },
      eq: (campo, valor) => {
        filtros.push((r) => r[campo] === valor);
        return builder;
      },
      update: (novosValores) => ({
        eq: (campo, valor) => {
          updates.push({ tabela: nome, campo, valor, novosValores });
          return Promise.resolve({ data: null, error: null });
        },
      }),
      then: (resolve) => {
        const resultado = rows.filter((r) => filtros.every((f) => f(r)));
        resolve({ data: resultado, error: null });
      },
    };
    return builder;
  }

  return {
    from: (nome) => tabela(nome),
    _updates: updates, // exposto só para o teste inspecionar o que foi alterado
  };
}

// Data de hoje fixa para os testes serem sempre previsíveis, não dependerem do dia real
function dataDeHojeMenosDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

describe('checkClientBlocked — bloqueio automático por inadimplência', () => {
  it('retorna false se o Supabase não está configurado (modo offline)', async () => {
    const resultado = await checkClientBlocked(null, 'cliente@teste.com.br');
    expect(resultado).toBe(false);
  });

  it('retorna false se o e-mail não existe no sistema', async () => {
    const supabase = criarSupabaseFalso({ usuarios: [] });
    const resultado = await checkClientBlocked(supabase, 'naoexiste@teste.com.br');
    expect(resultado).toBe(false);
  });

  it('NÃO bloqueia cliente com pagamento confirmado, mesmo com vencimento antigo', async () => {
    const supabase = criarSupabaseFalso({
      usuarios: [{ email: 'cliente@teste.com.br', perfil: 'CLIENTE', empresa: 'Distribuidora Teste' }],
      clientes: [{
        email: 'cliente@teste.com.br',
        status: 'Ativo',
        pagamento_confirmado: true,
        vencimento: dataDeHojeMenosDias(30),
        empresa: 'Distribuidora Teste',
      }],
    });

    const resultado = await checkClientBlocked(supabase, 'cliente@teste.com.br');
    expect(resultado).toBe(false);
  });

  it('NÃO bloqueia cliente vencido há 2 dias (dentro da carência de 3 dias)', async () => {
    const supabase = criarSupabaseFalso({
      usuarios: [{ email: 'cliente@teste.com.br', perfil: 'CLIENTE', empresa: 'Distribuidora Teste' }],
      clientes: [{
        email: 'cliente@teste.com.br',
        status: 'Ativo',
        pagamento_confirmado: false,
        vencimento: dataDeHojeMenosDias(2),
        empresa: 'Distribuidora Teste',
      }],
    });

    const resultado = await checkClientBlocked(supabase, 'cliente@teste.com.br');
    expect(resultado).toBe(false);
  });

  it('BLOQUEIA cliente vencido há 5 dias (fora da carência de 3 dias)', async () => {
    const supabase = criarSupabaseFalso({
      usuarios: [{ email: 'cliente@teste.com.br', perfil: 'CLIENTE', empresa: 'Distribuidora Teste' }],
      clientes: [{
        email: 'cliente@teste.com.br',
        status: 'Ativo',
        pagamento_confirmado: false,
        vencimento: dataDeHojeMenosDias(5),
        empresa: 'Distribuidora Teste',
      }],
    });

    const resultado = await checkClientBlocked(supabase, 'cliente@teste.com.br');
    expect(resultado).toBe(true);

    // Confirma que o sistema realmente tentou GRAVAR o bloqueio no banco,
    // não só retornar true na memória
    expect(supabase._updates).toHaveLength(1);
    expect(supabase._updates[0]).toMatchObject({
      tabela: 'clientes',
      novosValores: { status: 'Bloqueado' },
    });
  });

  it('já bloqueia direto se o status já está marcado como "Bloqueado" no banco', async () => {
    const supabase = criarSupabaseFalso({
      usuarios: [{ email: 'cliente@teste.com.br', perfil: 'CLIENTE', empresa: 'Distribuidora Teste' }],
      clientes: [{
        email: 'cliente@teste.com.br',
        status: 'Bloqueado',
        pagamento_confirmado: false,
        vencimento: dataDeHojeMenosDias(1),
        empresa: 'Distribuidora Teste',
      }],
    });

    const resultado = await checkClientBlocked(supabase, 'cliente@teste.com.br');
    expect(resultado).toBe(true);
  });

  it('motorista herda o bloqueio da empresa (cliente) a que pertence', async () => {
    const supabase = criarSupabaseFalso({
      usuarios: [{ email: 'motorista@teste.com.br', perfil: 'MOTORISTA', empresa: null }],
      condutores: [{ email: 'motorista@teste.com.br', cliente_email: 'cliente@teste.com.br' }],
      clientes: [{
        email: 'cliente@teste.com.br',
        status: 'Ativo',
        pagamento_confirmado: false,
        vencimento: dataDeHojeMenosDias(10),
        empresa: 'Distribuidora Teste',
      }],
    });

    const resultado = await checkClientBlocked(supabase, 'motorista@teste.com.br');
    expect(resultado).toBe(true);
  });

  it('colaborador do Master (perfil COLABORADOR) nunca é bloqueado por vencimento de cliente', async () => {
    const supabase = criarSupabaseFalso({
      usuarios: [{ email: 'colaborador@logusq.com.br', perfil: 'COLABORADOR', empresa: null }],
      clientes: [],
    });

    const resultado = await checkClientBlocked(supabase, 'colaborador@logusq.com.br');
    expect(resultado).toBe(false);
  });
});
