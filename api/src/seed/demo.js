import bcrypt from 'bcryptjs';

const SENHA_DEMO = '123456';
const HORA = 3_600_000;

/** Cria usuários, recursos e reservas de exemplo SE o banco ainda estiver vazio. Dados fictícios. */
export async function semearSeVazio({ repos, relogio, bcryptRounds }) {
  if ((await repos.usuarios.contar()) > 0) return false;

  const em = (dias, hora) => {
    const d = new Date(relogio.agora());
    d.setHours(hora, 0, 0, 0);
    d.setDate(d.getDate() + dias);
    return d;
  };
  const hash = await bcrypt.hash(SENHA_DEMO, bcryptRounds);
  const u = {};
  for (const [chave, nome, email, perfil] of [
    ['admin', 'Ana Admin', 'admin@exemplo.test', 'ADMINISTRADOR'],
    ['resp', 'Rui Responsável', 'responsavel@exemplo.test', 'RESPONSAVEL'],
    ['carlos', 'Prof. Carlos', 'solicitante@exemplo.test', 'SOLICITANTE'],
    ['marina', 'Profa. Marina', 'solicitante2@exemplo.test', 'SOLICITANTE'],
  ]) {
    u[chave] = await repos.usuarios.inserir({ nome, email, senhaHash: hash, perfil });
  }

  const rec = {};
  for (const [chave, nome, tipo, capacidade, restrito] of [
    ['sala101', 'Sala 101', 'SALA', 40, false],
    ['lab2', 'Laboratório de Informática 2', 'LABORATORIO', 30, true],
    ['auditorio', 'Auditório Principal', 'AUDITORIO', 200, true],
    ['projetor', 'Projetor portátil', 'EQUIPAMENTO', 1, false],
    ['sala202', 'Sala 202', 'SALA', 35, false],
  ]) {
    rec[chave] = await repos.recursos.inserir({ nome, tipo, capacidade, restrito });
  }

  await repos.manutencoes.inserir({ recursoId: rec.sala202._id, inicio: em(-1, 8), fim: em(3, 18), motivo: 'Troca do ar-condicionado' });
  await repos.manutencoes.inserir({ recursoId: rec.sala101._id, inicio: em(5, 8), fim: em(6, 18), motivo: 'Pintura' });

  const caminho = {
    SOLICITADA: [], APROVADA: ['APROVADA'], EM_USO: ['APROVADA', 'EM_USO'],
    CONCLUIDA: ['APROVADA', 'EM_USO', 'CONCLUIDA'], CANCELADA: ['CANCELADA'],
    REJEITADA: ['REJEITADA'], NAO_COMPARECEU: ['APROVADA', 'NAO_COMPARECEU'],
  };

  async function semearReserva(recurso, solicitante, inicio, fim, estado, finalidade) {
    const r = await repos.reservas.inserir({
      recursoId: recurso._id, recursoNome: recurso.nome,
      solicitanteId: solicitante._id, solicitanteNome: solicitante.nome,
      inicio, fim, estado, finalidade, criadoEm: new Date(inicio.getTime() - 6 * HORA),
    });
    let anterior = null;
    let instante = inicio.getTime() - 6 * HORA;
    const etapas = [{ para: 'SOLICITADA', quem: solicitante, motivo: 'Solicitação criada' }];
    for (const para of caminho[estado]) {
      etapas.push({ para, quem: para === 'CANCELADA' ? solicitante : u.resp, motivo: 'Transição de demonstração' });
    }
    for (const e of etapas) {
      await repos.auditoria.inserir({
        reservaId: r._id, usuarioId: e.quem._id, usuarioNome: e.quem.nome,
        instante: new Date(instante), estadoAnterior: anterior, estadoNovo: e.para, motivo: e.motivo,
      });
      anterior = e.para;
      instante += HORA;
    }
  }

  await semearReserva(rec.sala101, u.carlos, em(0, 8), em(0, 10), 'APROVADA', 'Aula de Engenharia de Software');
  await semearReserva(rec.lab2, u.carlos, em(1, 14), em(1, 16), 'SOLICITADA', 'Aula prática de testes automatizados');
  await semearReserva(rec.auditorio, u.marina, em(2, 19), em(2, 21), 'SOLICITADA', 'Palestra de abertura do semestre');
  await semearReserva(rec.sala101, u.marina, em(-1, 8), em(-1, 10), 'CONCLUIDA', 'Reunião de projeto');
  await semearReserva(rec.projetor, u.carlos, em(0, 10), em(0, 12), 'EM_USO', 'Apresentação de seminário');
  await semearReserva(rec.sala101, u.marina, em(-2, 14), em(-2, 16), 'CANCELADA', 'Monitoria (cancelada)');
  await semearReserva(rec.lab2, u.marina, em(-3, 10), em(-3, 12), 'NAO_COMPARECEU', 'Laboratório de redes');
  return true;
}
