/**
 * Entidades (documentos do MongoDB) e sua representação na API.
 *
 * usuarios            { _id, nome, email, senhaHash, perfil }
 * recursos            { _id, nome, tipo, capacidade, restrito }
 * manutencoes         { _id, recursoId, inicio, fim, motivo }
 * reservas            { _id, recursoId, recursoNome, solicitanteId, solicitanteNome, inicio, fim, estado, finalidade, criadoEm }
 * auditoria           { _id, reservaId, usuarioId, usuarioNome, instante, estadoAnterior, estadoNovo, motivo }
 * tentativas_conflito { _id, recursoId, usuarioId, inicioSolicitado, fimSolicitado, criadoEm }
 * bloqueios           { _id: chave, dono, ate }
 * contadores          { _id: nomeDaColeção, seq }   (ids numéricos sequenciais: 1, 2, 3…)
 */
const iso = (d) => new Date(d).toISOString();

export const usuarioDto = (u) => ({ id: u._id, nome: u.nome, email: u.email, perfil: u.perfil });

export const recursoDto = (r, emManutencao) => ({
  id: r._id,
  nome: r.nome,
  tipo: r.tipo,
  capacidade: r.capacidade,
  restrito: r.restrito,
  emManutencao: !!emManutencao,
});

export const manutencaoDto = (m) => ({
  id: m._id,
  recursoId: m.recursoId,
  inicio: iso(m.inicio),
  fim: iso(m.fim),
  motivo: m.motivo,
});

export const reservaDto = (r, recursoRestrito) => ({
  id: r._id,
  recursoId: r.recursoId,
  recursoNome: r.recursoNome,
  solicitanteId: r.solicitanteId,
  solicitanteNome: r.solicitanteNome,
  inicio: iso(r.inicio),
  fim: iso(r.fim),
  estado: r.estado,
  finalidade: r.finalidade,
  recursoRestrito: !!recursoRestrito,
});

export const auditoriaDto = (a) => ({
  id: a._id,
  reservaId: a.reservaId,
  usuarioId: a.usuarioId,
  usuarioNome: a.usuarioNome,
  instante: iso(a.instante),
  estadoAnterior: a.estadoAnterior ?? null,
  estadoNovo: a.estadoNovo,
  motivo: a.motivo,
});
