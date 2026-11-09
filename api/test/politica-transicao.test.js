import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verificarTransicao } from '../src/domain/politica-transicao.js';

const tenta = (o) => () => verificarTransicao({ ehDono: false, recursoRestrito: false, ...o });
const status = (fn) => { try { fn(); return 200; } catch (e) { return e.status; } };

describe('política de transição de reservas', () => {
  it('Solicitante não aprova a própria reserva (403)', () => {
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'SOLICITADA', perfil: 'SOLICITANTE', ehDono: true })), 403);
  });
  it('Responsável também não aprova a própria reserva (403)', () => {
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'SOLICITADA', perfil: 'RESPONSAVEL', ehDono: true })), 403);
  });
  it('recurso restrito: Administrador não aprova, Responsável aprova', () => {
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'SOLICITADA', perfil: 'ADMINISTRADOR', recursoRestrito: true })), 403);
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'SOLICITADA', perfil: 'RESPONSAVEL', recursoRestrito: true })), 200);
  });
  it('recurso comum: Administrador aprova', () => {
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'SOLICITADA', perfil: 'ADMINISTRADOR' })), 200);
  });
  it('só o dono cancela; gestor que não é dono recebe 403', () => {
    assert.equal(status(tenta({ acao: 'cancelar', estado: 'SOLICITADA', perfil: 'SOLICITANTE', ehDono: true })), 200);
    assert.equal(status(tenta({ acao: 'cancelar', estado: 'APROVADA', perfil: 'SOLICITANTE', ehDono: true })), 200);
    assert.equal(status(tenta({ acao: 'cancelar', estado: 'SOLICITADA', perfil: 'SOLICITANTE', ehDono: false })), 403);
    assert.equal(status(tenta({ acao: 'cancelar', estado: 'SOLICITADA', perfil: 'ADMINISTRADOR', ehDono: false })), 403);
  });
  it('Solicitante não inicia, conclui, rejeita nem marca não comparecimento', () => {
    for (const acao of ['iniciar', 'concluir', 'rejeitar', 'nao-compareceu']) {
      assert.equal(status(tenta({ acao, estado: 'APROVADA', perfil: 'SOLICITANTE', ehDono: true })), 403, acao);
    }
  });
  it('caminho feliz: SOLICITADA → APROVADA → EM_USO → CONCLUIDA', () => {
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'SOLICITADA', perfil: 'RESPONSAVEL' })), 200);
    assert.equal(status(tenta({ acao: 'iniciar', estado: 'APROVADA', perfil: 'RESPONSAVEL' })), 200);
    assert.equal(status(tenta({ acao: 'concluir', estado: 'EM_USO', perfil: 'RESPONSAVEL' })), 200);
  });
  it('transições fora da máquina de estados dão 409', () => {
    assert.equal(status(tenta({ acao: 'concluir', estado: 'APROVADA', perfil: 'RESPONSAVEL' })), 409);
    assert.equal(status(tenta({ acao: 'iniciar', estado: 'SOLICITADA', perfil: 'RESPONSAVEL' })), 409);
    assert.equal(status(tenta({ acao: 'aprovar', estado: 'CONCLUIDA', perfil: 'RESPONSAVEL' })), 409);
    assert.equal(status(tenta({ acao: 'cancelar', estado: 'EM_USO', perfil: 'SOLICITANTE', ehDono: true })), 409);
  });
  it('estados finais não aceitam nenhuma ação', () => {
    for (const estado of ['CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU']) {
      for (const acao of ['aprovar', 'rejeitar', 'iniciar', 'concluir', 'nao-compareceu']) {
        assert.equal(status(tenta({ acao, estado, perfil: 'ADMINISTRADOR' })), 409, `${estado}/${acao}`);
      }
    }
  });
  it('ação desconhecida dá 404', () => {
    assert.equal(status(tenta({ acao: 'explodir', estado: 'SOLICITADA', perfil: 'ADMINISTRADOR' })), 404);
  });
});
