import { AcaoReserva, EstadoReserva } from '../../core/models/reserva.model';
import { Perfil } from '../../core/models/usuario.model';

export interface Transicao {
  acao: AcaoReserva;
  rotulo: string;
  perfis: Perfil[];
  donoPode?: boolean;
}

/** Máquina de estados: SOLICITADA → APROVADA → EM_USO → CONCLUIDA + rejeitada, cancelada, não compareceu. */
const TRANSICOES: Record<EstadoReserva, Transicao[]> = {
  SOLICITADA: [
    { acao: 'aprovar',  rotulo: 'Aprovar',  perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] },
    { acao: 'rejeitar', rotulo: 'Rejeitar', perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] },
    { acao: 'cancelar', rotulo: 'Cancelar', perfis: [], donoPode: true },
  ],
  APROVADA: [
    { acao: 'iniciar',        rotulo: 'Iniciar uso',    perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] },
    { acao: 'nao-compareceu', rotulo: 'Não compareceu', perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] },
    { acao: 'cancelar',       rotulo: 'Cancelar',       perfis: [], donoPode: true },
  ],
  EM_USO: [{ acao: 'concluir', rotulo: 'Concluir', perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] }],
  CONCLUIDA: [], REJEITADA: [], CANCELADA: [], NAO_COMPARECEU: [],
};

export function acoesPermitidas(
  estado: EstadoReserva, perfil: Perfil, ehDono: boolean, recursoRestrito = false,
): Transicao[] {
  return TRANSICOES[estado].filter(t => {
    // Solicitante nunca aprova a própria reserva; recurso restrito só é aprovado por Responsável.
    if (t.acao === 'aprovar') {
      if (ehDono) return false;
      if (recursoRestrito && perfil !== 'RESPONSAVEL') return false;
    }
    return t.perfis.includes(perfil) || (!!t.donoPode && ehDono);
  });
}
