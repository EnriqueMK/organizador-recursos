export type TipoRecurso = 'SALA' | 'LABORATORIO' | 'EQUIPAMENTO' | 'AUDITORIO';

export interface Recurso {
  id: number;
  nome: string;
  tipo: TipoRecurso;
  capacidade: number;
  restrito: boolean;          // exige aprovação de um Responsável
  emManutencao: boolean;
}

export interface PeriodoManutencao {
  id?: number;
  recursoId: number;
  inicio: string;             // ISO-8601 com offset
  fim: string;
  motivo: string;
}

export interface Disponibilidade {
  recursoId: number;
  livres: { inicio: string; fim: string }[];
}
