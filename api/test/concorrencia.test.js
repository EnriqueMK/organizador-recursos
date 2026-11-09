import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, iso } from './ajuda.js';

const N = 20;
const contar = (statuses) => statuses.reduce((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {});

describe('dupla reserva provada por teste (20 requisições simultâneas)', () => {
  for (let rodada = 1; rodada <= 5; rodada++) {
    it(`mesma sala e mesmo horário: exatamente 1 aceita (201) e 19 recusadas (409) — rodada ${rodada}/5`, async () => {
      const ctx = await iniciar();
      try {
        const sala = await ctx.repos.recursos.inserir({ nome: 'Sala disputada', tipo: 'SALA', capacidade: 30, restrito: false });
        const pessoas = [];
        for (let i = 0; i < N; i++) pessoas.push(await ctx.novoUsuario(`prof${i}`));
        const tokens = await Promise.all(pessoas.map((p) => ctx.tokenDe(p.email)));
        assert.equal(tokens.length, N);

        const corpo = { recursoId: sala._id, inicio: iso(2030, 6, 1, 10), fim: iso(2030, 6, 1, 11), finalidade: 'disputa' };
        const respostas = await Promise.all(pessoas.map((p) => ctx.api('POST', '/api/reservas', { quem: p.email, corpo })));
        const statuses = respostas.map((r) => r.status);

        assert.deepEqual(contar(statuses), { 201: 1, 409: N - 1 }, JSON.stringify(contar(statuses)));
        // verificado direto no banco, não só pela resposta
        assert.equal(ctx.repos.contarTudo().reservas, 1);
        const todas = await ctx.repos.reservas.listar();
        assert.equal(todas.filter((r) => r.recursoId === sala._id).length, 1);
        assert.equal(ctx.repos.contarTudo().auditoria, 1);
        assert.equal(ctx.repos.contarTudo().tentativas, N - 1);
      } finally {
        await ctx.fechar();
      }
    });
  }

  for (let rodada = 1; rodada <= 5; rodada++) {
    it(`agenda do professor: o mesmo professor em 20 salas ao mesmo tempo → 1 aceita e 19 recusadas — rodada ${rodada}/5`, async () => {
      const ctx = await iniciar();
      try {
        const salas = [];
        for (let i = 0; i < N; i++) salas.push(await ctx.repos.recursos.inserir({ nome: `Sala ${i}`, tipo: 'SALA', capacidade: 30, restrito: false }));
        await ctx.tokenDe('sol@teste.test');

        const respostas = await Promise.all(salas.map((s) => ctx.api('POST', '/api/reservas', {
          quem: 'sol', corpo: { recursoId: s._id, inicio: iso(2030, 6, 2, 14), fim: iso(2030, 6, 2, 15), finalidade: 'aula' },
        })));
        const statuses = respostas.map((r) => r.status);

        assert.deepEqual(contar(statuses), { 201: 1, 409: N - 1 }, JSON.stringify(contar(statuses)));
        assert.equal(ctx.repos.contarTudo().reservas, 1);
      } finally {
        await ctx.fechar();
      }
    });
  }

  it('20 reservas simultâneas em horários diferentes da mesma sala: todas aceitas (sem falso conflito)', async () => {
    const ctx = await iniciar();
    try {
      const sala = await ctx.repos.recursos.inserir({ nome: 'Sala', tipo: 'SALA', capacidade: 30, restrito: false });
      const pessoas = [];
      for (let i = 0; i < N; i++) pessoas.push(await ctx.novoUsuario(`livre${i}`));
      const respostas = await Promise.all(pessoas.map((p, i) => ctx.api('POST', '/api/reservas', {
        quem: p.email, corpo: { recursoId: sala._id, inicio: iso(2030, 7, 1, i), fim: iso(2030, 7, 1, i + 1), finalidade: 'x' },
      })));
      assert.deepEqual(contar(respostas.map((r) => r.status)), { 201: N });
      assert.equal(ctx.repos.contarTudo().reservas, N);
    } finally {
      await ctx.fechar();
    }
  });

  it('duas aprovações simultâneas da mesma reserva: uma vence (200) e a outra recebe 409; histórico sem duplicar', async () => {
    const ctx = await iniciar();
    try {
      const sala = await ctx.repos.recursos.inserir({ nome: 'Sala', tipo: 'SALA', capacidade: 30, restrito: false });
      const criada = await ctx.api('POST', '/api/reservas', { quem: 'sol', corpo: { recursoId: sala._id, inicio: iso(2030, 8, 1, 9), fim: iso(2030, 8, 1, 10), finalidade: 'x' } });
      const id = criada.corpo.id;
      const [a, b] = await Promise.all([
        ctx.api('POST', `/api/reservas/${id}/aprovar`, { quem: 'resp', corpo: {} }),
        ctx.api('POST', `/api/reservas/${id}/aprovar`, { quem: 'admin', corpo: {} }),
      ]);
      assert.deepEqual([a.status, b.status].sort(), [200, 409]);
      const h = await ctx.api('GET', `/api/reservas/${id}/historico`, { quem: 'resp' });
      assert.deepEqual(h.corpo.map((x) => x.estadoNovo), ['SOLICITADA', 'APROVADA']);
    } finally {
      await ctx.fechar();
    }
  });
});
