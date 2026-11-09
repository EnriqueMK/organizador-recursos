import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, iso, prepararBase } from './ajuda.js';

let ctx;
afterEach(async () => { if (ctx) await ctx.fechar(); ctx = null; });

const periodoRel = `?inicio=${encodeURIComponent(iso(2030, 1, 1))}&fim=${encodeURIComponent(iso(2030, 2, 1))}`;
const manut = { inicio: iso(2030, 3, 1, 8), fim: iso(2030, 3, 1, 18), motivo: 'Revisão' };
const reservaNova = (recursoId, ini, fim) => ({ recursoId, inicio: ini, fim, finalidade: 'Aula de teste' });

describe('autenticação', () => {
  it('login válido devolve token e usuário (sem hash de senha)', async () => {
    ctx = await iniciar();
    const r = await ctx.api('POST', '/api/auth/login', { corpo: { email: 'resp@teste.test', senha: '123456' } });
    assert.equal(r.status, 200);
    assert.ok(r.corpo.token);
    assert.equal(r.corpo.usuario.perfil, 'RESPONSAVEL');
    assert.equal(r.corpo.usuario.senhaHash, undefined);
    assert.doesNotMatch(r.texto, /senhaHash|\$2[aby]\$/);
  });
  it('senha errada e e-mail inexistente dão 401 com a mesma mensagem', async () => {
    ctx = await iniciar();
    const a = await ctx.api('POST', '/api/auth/login', { corpo: { email: 'resp@teste.test', senha: 'errada' } });
    const b = await ctx.api('POST', '/api/auth/login', { corpo: { email: 'nao@existe.test', senha: '123456' } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.corpo.detail, b.corpo.detail);
  });
  it('token adulterado dá 401', async () => {
    ctx = await iniciar();
    const r = await fetch(`${ctx.url}/api/recursos`, { headers: { Authorization: 'Bearer abc.def.ghi' } });
    assert.equal(r.status, 401);
  });
});

// operação, perfil → status esperado (matriz de autorização)
const MATRIZ = [
  ['GET', '/api/recursos', null, null, 401],
  ['GET', '/api/recursos', 'sol', null, 200],
  ['GET', '/api/recursos', 'resp', null, 200],
  ['GET', '/api/recursos', 'admin', null, 200],
  ['POST', '/api/recursos', null, { nome: 'X', tipo: 'SALA', capacidade: 10, restrito: false }, 401],
  ['POST', '/api/recursos', 'sol', { nome: 'X', tipo: 'SALA', capacidade: 10, restrito: false }, 403],
  ['POST', '/api/recursos', 'resp', { nome: 'X', tipo: 'SALA', capacidade: 10, restrito: false }, 403],
  ['POST', '/api/recursos', 'admin', { nome: 'X', tipo: 'SALA', capacidade: 10, restrito: false }, 201],
  ['GET', `/api/relatorios/utilizacao${periodoRel}`, null, null, 401],
  ['GET', `/api/relatorios/utilizacao${periodoRel}`, 'sol', null, 403],
  ['GET', `/api/relatorios/utilizacao${periodoRel}`, 'resp', null, 200],
  ['GET', `/api/relatorios/utilizacao${periodoRel}`, 'admin', null, 200],
  ['GET', '/api/reservas/1/historico', null, null, 401],
  ['GET', '/api/reservas/1/historico', 'sol', null, 403],
  ['GET', '/api/reservas/1/historico', 'sol2', null, 403],
  ['GET', '/api/reservas/1/historico', 'resp', null, 200],
  ['GET', '/api/reservas/1/historico', 'admin', null, 200],
  ['POST', '/api/recursos/1/manutencoes', null, manut, 401],
  ['POST', '/api/recursos/1/manutencoes', 'sol', manut, 403],
  ['POST', '/api/recursos/1/manutencoes', 'resp', manut, 201],
  ['POST', '/api/recursos/1/manutencoes', 'admin', manut, 201],
  ['GET', '/api/recursos/1/manutencoes', 'sol', null, 200],
  // posse: o Solicitante só vê, altera e cancela as próprias reservas
  ['GET', '/api/reservas/1', 'sol', null, 200],
  ['GET', '/api/reservas/1', 'sol2', null, 403],
  ['GET', '/api/reservas/1', 'resp', null, 200],
  ['PUT', '/api/reservas/1', 'sol', reservaNova(1, iso(2030, 1, 1, 12), iso(2030, 1, 1, 13)), 200],
  ['PUT', '/api/reservas/1', 'sol2', reservaNova(1, iso(2030, 1, 1, 12), iso(2030, 1, 1, 13)), 403],
  ['PUT', '/api/reservas/1', 'resp', reservaNova(1, iso(2030, 1, 1, 12), iso(2030, 1, 1, 13)), 403],
  ['POST', '/api/reservas/1/cancelar', null, { motivo: 'x' }, 401],
  ['POST', '/api/reservas/1/cancelar', 'sol', { motivo: 'não preciso mais' }, 200],
  ['POST', '/api/reservas/1/cancelar', 'sol2', { motivo: 'x' }, 403],
  ['POST', '/api/reservas/1/cancelar', 'resp', { motivo: 'x' }, 403],
  // aprovação: Solicitante nunca aprova (nem a própria)
  ['POST', '/api/reservas/1/aprovar', 'sol', {}, 403],
  ['POST', '/api/reservas/1/aprovar', 'sol2', {}, 403],
  ['POST', '/api/reservas/1/aprovar', 'resp', {}, 200],
  ['POST', '/api/reservas/1/aprovar', 'admin', {}, 200],
];

describe('matriz de autorização (operação × perfil)', () => {
  for (const [metodo, rota, quem, corpo, esperado] of MATRIZ) {
    it(`${metodo} ${rota.split('?')[0]} como ${quem ?? 'anônimo'} → ${esperado}`, async () => {
      ctx = await iniciar();
      await prepararBase(ctx);
      const r = await ctx.api(metodo, rota, { quem, corpo: corpo ?? undefined });
      assert.equal(r.status, esperado, r.texto);
    });
  }
});

describe('recurso restrito', () => {
  it('Administrador não aprova (403); Responsável aprova (200)', async () => {
    ctx = await iniciar();
    const { restrito } = await prepararBase(ctx);
    const criada = await ctx.api('POST', '/api/reservas', { quem: 'sol2', corpo: reservaNova(restrito._id, iso(2030, 1, 5, 9), iso(2030, 1, 5, 10)) });
    assert.equal(criada.status, 201);
    assert.equal(criada.corpo.recursoRestrito, true);
    const id = criada.corpo.id;
    assert.equal((await ctx.api('POST', `/api/reservas/${id}/aprovar`, { quem: 'admin', corpo: {} })).status, 403);
    assert.equal((await ctx.api('POST', `/api/reservas/${id}/aprovar`, { quem: 'resp', corpo: {} })).status, 200);
  });
});

describe('validação de entrada e mensagens de erro', () => {
  it('término antes do início → 400 com mensagem compreensível', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    const r = await ctx.api('POST', '/api/reservas', { quem: 'sol', corpo: reservaNova(1, iso(2030, 2, 1, 11), iso(2030, 2, 1, 10)) });
    assert.equal(r.status, 400);
    assert.match(r.corpo.detail, /término deve ser depois do início/);
  });
  it('campos ausentes → 400', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    for (const corpo of [{}, { recursoId: 1 }, { recursoId: 1, inicio: iso(2030, 2, 1, 9) }, { recursoId: 'a', inicio: 'x', fim: 'y', finalidade: 'z' }]) {
      const r = await ctx.api('POST', '/api/reservas', { quem: 'sol', corpo });
      assert.equal(r.status, 400, JSON.stringify(corpo));
      assert.ok(r.corpo.detail);
    }
  });
  it('capacidade negativa → 400 citando o campo', async () => {
    ctx = await iniciar();
    const r = await ctx.api('POST', '/api/recursos', { quem: 'admin', corpo: { nome: 'Sala', tipo: 'SALA', capacidade: -5 } });
    assert.equal(r.status, 400);
    assert.match(r.corpo.detail, /capacidade/);
  });
  it('JSON malformado → 400', async () => {
    ctx = await iniciar();
    const r = await ctx.api('POST', '/api/reservas', { quem: 'sol', bruto: '{ isso não é json' });
    assert.equal(r.status, 400);
  });
  it('nenhuma resposta de erro vaza stack trace, caminho de arquivo, SQL ou nome de classe interna', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    const respostas = [
      await ctx.api('POST', '/api/reservas', { quem: 'sol', corpo: {} }),
      await ctx.api('POST', '/api/reservas', { quem: 'sol', bruto: '{ruim' }),
      await ctx.api('GET', '/api/reservas/abc', { quem: 'sol' }),
      await ctx.api('GET', '/api/reservas/999', { quem: 'sol' }),
      await ctx.api('GET', '/api/nao-existe', { quem: 'sol' }),
      await ctx.api('GET', '/api/reservas/1', { quem: 'sol2' }),
      await ctx.api('GET', '/api/recursos', { quem: null }),
    ];
    for (const r of respostas) {
      assert.ok(r.status >= 400);
      assert.deepEqual(Object.keys(r.corpo).sort(), ['detail', 'status', 'title']);
      assert.doesNotMatch(r.texto, /stack|\bat .*\(|node_modules|\.js:\d+|Error:|mongodb|select |insert /i);
    }
  });
});

describe('ciclo de vida da reserva e auditoria', () => {
  it('SOLICITADA → APROVADA → EM_USO → CONCLUIDA, com histórico completo e ordenado', async () => {
    ctx = await iniciar();
    const { livre } = await prepararBase(ctx);
    const criada = await ctx.api('POST', '/api/reservas', { quem: 'sol2', corpo: reservaNova(livre._id, iso(2030, 4, 1, 9), iso(2030, 4, 1, 10)) });
    assert.equal(criada.status, 201);
    assert.equal(criada.corpo.estado, 'SOLICITADA');
    const id = criada.corpo.id;
    assert.equal((await ctx.api('POST', `/api/reservas/${id}/aprovar`, { quem: 'resp', corpo: {} })).corpo.estado, 'APROVADA');
    assert.equal((await ctx.api('POST', `/api/reservas/${id}/iniciar`, { quem: 'resp', corpo: {} })).corpo.estado, 'EM_USO');
    assert.equal((await ctx.api('POST', `/api/reservas/${id}/concluir`, { quem: 'resp', corpo: {} })).corpo.estado, 'CONCLUIDA');

    const h = await ctx.api('GET', `/api/reservas/${id}/historico`, { quem: 'resp' });
    assert.equal(h.status, 200);
    assert.deepEqual(h.corpo.map((x) => x.estadoNovo), ['SOLICITADA', 'APROVADA', 'EM_USO', 'CONCLUIDA']);
    assert.deepEqual(h.corpo.map((x) => x.estadoAnterior), [null, 'SOLICITADA', 'APROVADA', 'EM_USO']);
    assert.equal(h.corpo[0].usuarioNome, 'Usuário sol2');
    assert.equal(h.corpo[1].usuarioNome, 'Usuário resp');
  });
  it('transição inválida → 409 e nada é gravado na auditoria', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    const r = await ctx.api('POST', '/api/reservas/1/concluir', { quem: 'resp', corpo: {} });
    assert.equal(r.status, 409);
    const h = await ctx.api('GET', '/api/reservas/1/historico', { quem: 'resp' });
    assert.equal(h.corpo.length, 1);
  });
  it('rejeitar e cancelar exigem motivo (400)', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    assert.equal((await ctx.api('POST', '/api/reservas/1/rejeitar', { quem: 'resp', corpo: {} })).status, 400);
    assert.equal((await ctx.api('POST', '/api/reservas/1/cancelar', { quem: 'sol', corpo: { motivo: '   ' } })).status, 400);
  });
  it('a API não expõe nenhuma rota para alterar ou apagar a auditoria nem reservas', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    for (const [m, rota] of [['DELETE', '/api/reservas/1'], ['PUT', '/api/reservas/1/historico'], ['DELETE', '/api/reservas/1/historico'], ['PATCH', '/api/reservas/1']]) {
      const r = await ctx.api(m, rota, { quem: 'admin', corpo: {} });
      assert.ok([404, 405].includes(r.status), `${m} ${rota} → ${r.status}`);
    }
    assert.equal(ctx.repos.contarTudo().reservas, 1);
  });
  it('Solicitante só lista as próprias reservas', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    assert.equal((await ctx.api('GET', '/api/reservas', { quem: 'sol' })).corpo.length, 1);
    assert.equal((await ctx.api('GET', '/api/reservas', { quem: 'sol2' })).corpo.length, 0);
    assert.equal((await ctx.api('GET', '/api/reservas', { quem: 'resp' })).corpo.length, 1);
    assert.equal((await ctx.api('GET', '/api/reservas?estado=CONCLUIDA', { quem: 'resp' })).corpo.length, 0);
    assert.equal((await ctx.api('GET', '/api/reservas?estado=XYZ', { quem: 'resp' })).status, 400);
  });
});

describe('conflitos de horário', () => {
  it('sobreposição no mesmo recurso → 409; começar exatamente no fim da outra → 201', async () => {
    ctx = await iniciar();
    const { livre } = await prepararBase(ctx); // reserva 1: 10:00–11:00 de "sol"
    const dentro = await ctx.api('POST', '/api/reservas', { quem: 'sol2', corpo: reservaNova(livre._id, iso(2030, 1, 1, 10, 30), iso(2030, 1, 1, 11, 30)) });
    assert.equal(dentro.status, 409);
    const encostando = await ctx.api('POST', '/api/reservas', { quem: 'sol2', corpo: reservaNova(livre._id, iso(2030, 1, 1, 11), iso(2030, 1, 1, 12)) });
    assert.equal(encostando.status, 201);
    const antes = await ctx.api('POST', '/api/reservas', { quem: 'admin', corpo: reservaNova(livre._id, iso(2030, 1, 1, 9), iso(2030, 1, 1, 10)) });
    assert.equal(antes.status, 201);
  });
  it('recurso em manutenção: fronteiras (termina no início, começa no fim, cruza 1 segundo)', async () => {
    ctx = await iniciar();
    const { livre } = await prepararBase(ctx);
    const m = await ctx.api('POST', `/api/recursos/${livre._id}/manutencoes`, { quem: 'resp', corpo: { inicio: iso(2030, 5, 1, 14), fim: iso(2030, 5, 1, 16), motivo: 'Pintura' } });
    assert.equal(m.status, 201);
    const casos = [
      ['termina exatamente no início', iso(2030, 5, 1, 13), iso(2030, 5, 1, 14), 201],
      ['começa exatamente no fim', iso(2030, 5, 1, 16), iso(2030, 5, 1, 17), 201],
      ['cruza o início por 1 segundo', iso(2030, 5, 1, 13), iso(2030, 5, 1, 14, 0, 1), 409],
      ['cruza o fim por 1 segundo', iso(2030, 5, 1, 15, 59, 59), iso(2030, 5, 1, 17), 409],
    ];
    let usuario = 0;
    for (const [descricao, ini, fim, esperado] of casos) {
      const quem = ['sol', 'sol2', 'resp', 'admin'][usuario++];
      const r = await ctx.api('POST', '/api/reservas', { quem, corpo: reservaNova(livre._id, ini, fim) });
      assert.equal(r.status, esperado, `${descricao}: ${r.texto}`);
    }
  });
  it('agenda do professor: não pode ter duas reservas no mesmo horário em recursos diferentes', async () => {
    ctx = await iniciar();
    const { livre, restrito } = await prepararBase(ctx); // sol já tem 10:00–11:00 no recurso livre
    const r = await ctx.api('POST', '/api/reservas', { quem: 'sol', corpo: reservaNova(restrito._id, iso(2030, 1, 1, 10, 30), iso(2030, 1, 1, 11, 30)) });
    assert.equal(r.status, 409);
    assert.match(r.corpo.detail, /agenda/);
    assert.ok(livre);
  });
  it('reserva cancelada libera o horário', async () => {
    ctx = await iniciar();
    const { livre } = await prepararBase(ctx);
    assert.equal((await ctx.api('POST', '/api/reservas/1/cancelar', { quem: 'sol', corpo: { motivo: 'mudança de planos' } })).status, 200);
    const r = await ctx.api('POST', '/api/reservas', { quem: 'sol2', corpo: reservaNova(livre._id, iso(2030, 1, 1, 10), iso(2030, 1, 1, 11)) });
    assert.equal(r.status, 201);
  });
});

describe('recursos e disponibilidade', () => {
  it('lista indica recurso em manutenção agora', async () => {
    ctx = await iniciar();
    const { livre, restrito } = await prepararBase(ctx);
    const agora = Date.now();
    await ctx.repos.manutencoes.inserir({ recursoId: restrito._id, inicio: new Date(agora - 3600_000), fim: new Date(agora + 3600_000), motivo: 'Teste' });
    const r = await ctx.api('GET', '/api/recursos', { quem: 'sol' });
    const por = Object.fromEntries(r.corpo.map((x) => [x.id, x.emManutencao]));
    assert.equal(por[restrito._id], true);
    assert.equal(por[livre._id], false);
  });
  it('janelas livres descontam reservas ativas e manutenções', async () => {
    ctx = await iniciar();
    const { livre } = await prepararBase(ctx); // ocupado 10–11
    await ctx.repos.manutencoes.inserir({ recursoId: livre._id, inicio: new Date(iso(2030, 1, 1, 14)), fim: new Date(iso(2030, 1, 1, 15)), motivo: 'x' });
    const r = await ctx.api('GET', `/api/recursos/${livre._id}/disponibilidade?inicio=${encodeURIComponent(iso(2030, 1, 1, 8))}&fim=${encodeURIComponent(iso(2030, 1, 1, 18))}`, { quem: 'sol' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.corpo.livres.map((j) => [new Date(j.inicio).getUTCHours(), new Date(j.fim).getUTCHours()]), [[8, 10], [11, 14], [15, 18]]);
  });
  it('disponibilidade com período inválido → 400; recurso inexistente → 404', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    const q = (a, b) => `?inicio=${encodeURIComponent(a)}&fim=${encodeURIComponent(b)}`;
    assert.equal((await ctx.api('GET', `/api/recursos/1/disponibilidade${q(iso(2030, 1, 1, 10), iso(2030, 1, 1, 9))}`, { quem: 'sol' })).status, 400);
    assert.equal((await ctx.api('GET', `/api/recursos/999/disponibilidade${q(iso(2030, 1, 1, 8), iso(2030, 1, 1, 9))}`, { quem: 'sol' })).status, 404);
    assert.equal((await ctx.api('GET', '/api/recursos/1/disponibilidade', { quem: 'sol' })).status, 400);
  });
});

describe('relatório de utilização (oráculo calculado à mão)', () => {
  it('horas por recurso/professor recortadas ao período, canceladas e solicitadas não contam, conflitos evitados', async () => {
    ctx = await iniciar();
    const { repos, usuarios } = ctx;
    const A = await repos.recursos.inserir({ nome: 'Sala A', tipo: 'SALA', capacidade: 10, restrito: false });
    const B = await repos.recursos.inserir({ nome: 'Sala B', tipo: 'SALA', capacidade: 10, restrito: false });
    const novo = (rec, u, ini, fim, estado) => repos.reservas.inserir({
      recursoId: rec._id, recursoNome: rec.nome, solicitanteId: u._id, solicitanteNome: u.nome,
      inicio: new Date(ini), fim: new Date(fim), estado, finalidade: 'x', criadoEm: new Date(),
    });
    // Período: 2030-01-01 00:00Z → 2030-01-02 00:00Z
    await novo(A, usuarios.sol, iso(2030, 1, 1, 8), iso(2030, 1, 1, 10), 'CONCLUIDA');       // A: 2h  | sol: 2h
    await novo(A, usuarios.sol2, iso(2030, 1, 1, 10), iso(2030, 1, 1, 11, 30), 'APROVADA'); // A: 1,5h| sol2: 1,5h
    await novo(B, usuarios.sol, iso(2030, 1, 1, 23), iso(2030, 1, 2, 2), 'EM_USO');          // B: só 1h dentro do período | sol: 1h
    await novo(B, usuarios.sol, iso(2030, 1, 1, 12), iso(2030, 1, 1, 14), 'CANCELADA');      // não conta
    await novo(A, usuarios.sol2, iso(2030, 1, 1, 15), iso(2030, 1, 1, 16), 'SOLICITADA');    // não conta (ainda não é uso)
    // Um conflito evitado: tentativa de reservar a Sala A às 10:30 (ocupada pela reserva APROVADA 10:00–11:30)
    const tentativa = await ctx.api('POST', '/api/reservas', { quem: 'admin', corpo: reservaNova(A._id, iso(2030, 1, 1, 10, 30), iso(2030, 1, 1, 11)) });
    assert.equal(tentativa.status, 409);

    const r = await ctx.api('GET', `/api/relatorios/utilizacao?inicio=${encodeURIComponent(iso(2030, 1, 1))}&fim=${encodeURIComponent(iso(2030, 1, 2))}`, { quem: 'resp' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.corpo.horasPorRecurso.map((x) => [x.recursoNome, x.horas]), [['Sala A', 3.5], ['Sala B', 1]]);
    assert.deepEqual(r.corpo.cargaPorProfessor.map((x) => [x.professorNome, x.horas]), [['Usuário sol', 3], ['Usuário sol2', 1.5]]);
    assert.equal(r.corpo.conflitosEvitados, 1);
  });
  it('período vazio devolve listas vazias e zero conflitos', async () => {
    ctx = await iniciar();
    await prepararBase(ctx);
    const r = await ctx.api('GET', `/api/relatorios/utilizacao?inicio=${encodeURIComponent(iso(2031, 1, 1))}&fim=${encodeURIComponent(iso(2031, 2, 1))}`, { quem: 'admin' });
    assert.deepEqual(r.corpo.horasPorRecurso, []);
    assert.deepEqual(r.corpo.cargaPorProfessor, []);
    assert.equal(r.corpo.conflitosEvitados, 0);
  });
});
