import { ApiError } from '../util/api-error.js';
import { ehGestor } from './constantes.js';

/** Máquina de estados: SOLICITADA → APROVADA → EM_USO → CONCLUIDA, mais rejeitada, cancelada e não compareceu. */
export const ACOES = {
  aprovar: { origens: ['SOLICITADA'], destino: 'APROVADA', exigeMotivo: false },
  rejeitar: { origens: ['SOLICITADA'], destino: 'REJEITADA', exigeMotivo: true },
  iniciar: { origens: ['APROVADA'], destino: 'EM_USO', exigeMotivo: false },
  concluir: { origens: ['EM_USO'], destino: 'CONCLUIDA', exigeMotivo: false },
  cancelar: { origens: ['SOLICITADA', 'APROVADA'], destino: 'CANCELADA', exigeMotivo: true },
  'nao-compareceu': { origens: ['APROVADA'], destino: 'NAO_COMPARECEU', exigeMotivo: true },
};

function autorizado(acao, perfil, ehDono, recursoRestrito) {
  switch (acao) {
    case 'aprovar':
      if (!ehGestor(perfil) || ehDono) return false;          // ninguém aprova a própria reserva
      return !recursoRestrito || perfil === 'RESPONSAVEL';    // recurso restrito: só Responsável aprova
    case 'rejeitar':
    case 'iniciar':
    case 'concluir':
    case 'nao-compareceu':
      return ehGestor(perfil);
    case 'cancelar':
      return ehDono;                                          // só o dono cancela a própria reserva
    default:
      return false;
  }
}

function mensagemNegada(acao, perfil, ehDono, recursoRestrito) {
  if (acao === 'aprovar' && ehDono) return 'Você não pode aprovar a própria reserva.';
  if (acao === 'aprovar' && recursoRestrito && perfil === 'ADMINISTRADOR') {
    return 'Recurso restrito: somente um Responsável pode aprovar.';
  }
  if (acao === 'cancelar') return 'Você só pode cancelar as suas próprias reservas.';
  return 'Você não tem permissão para esta operação.';
}

/** Ordem: primeiro a permissão (403), depois o estado (409). Devolve a definição da ação. */
export function verificarTransicao({ acao, estado, perfil, ehDono, recursoRestrito }) {
  const def = ACOES[acao];
  if (!def) throw new ApiError(404, 'Ação desconhecida.');
  if (!autorizado(acao, perfil, ehDono, recursoRestrito)) {
    throw new ApiError(403, mensagemNegada(acao, perfil, ehDono, recursoRestrito));
  }
  if (!def.origens.includes(estado)) {
    throw new ApiError(409, `Transição inválida: a reserva está ${estado} e não pode ser ${def.destino}.`);
  }
  return def;
}
