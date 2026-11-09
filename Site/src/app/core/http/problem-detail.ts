export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string>;
}

export function mensagemAmigavel(status: number, pd?: ProblemDetail): string {
  if (status === 409) return pd?.detail ?? 'Conflito: o recurso já está reservado neste horário.';
  if (status === 400) return pd?.detail ?? 'Dados inválidos. Revise o formulário.';
  if (status === 403) return 'Você não tem permissão para esta operação.';
  if (status === 401) return 'Sessão expirada. Entre novamente.';
  if (status >= 500) return 'Erro inesperado no servidor. Tente novamente.';
  return pd?.detail ?? 'Não foi possível concluir a operação.';
}
