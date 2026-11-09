export interface RelatorioUtilizacao {
  inicio: string;
  fim: string;
  horasPorRecurso: { recursoId: number; recursoNome: string; horas: number }[];
  cargaPorProfessor: { professorId: number; professorNome: string; horas: number }[];
  conflitosEvitados: number;
}
