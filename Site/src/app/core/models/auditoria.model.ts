import { EstadoReserva } from './reserva.model';

export interface RegistroAuditoria {
  id: number;
  reservaId: number;
  usuarioId: number;
  usuarioNome: string;
  instante: string;
  estadoAnterior: EstadoReserva | null;
  estadoNovo: EstadoReserva;
  motivo: string;
}
