export type EstadoReserva =
  | 'SOLICITADA' | 'APROVADA' | 'EM_USO' | 'CONCLUIDA'
  | 'REJEITADA' | 'CANCELADA' | 'NAO_COMPARECEU';

export interface Reserva {
  id: number;
  recursoId: number;
  recursoNome: string;
  solicitanteId: number;
  solicitanteNome: string;
  inicio: string;
  fim: string;
  estado: EstadoReserva;
  finalidade: string;
  recursoRestrito?: boolean;
}

export interface NovaReserva {
  recursoId: number;
  inicio: string;
  fim: string;
  finalidade: string;
}

export type AcaoReserva = 'aprovar' | 'rejeitar' | 'iniciar' | 'concluir' | 'cancelar' | 'nao-compareceu';
