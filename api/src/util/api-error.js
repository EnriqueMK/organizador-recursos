const TITULOS = {
  400: 'Requisição inválida',
  401: 'Não autenticado',
  403: 'Acesso negado',
  404: 'Não encontrado',
  409: 'Conflito',
  503: 'Indisponível',
};

/** Erro de negócio com status HTTP. A resposta segue o formato ProblemDetail: { title, status, detail }. */
export class ApiError extends Error {
  constructor(status, detail, title) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.title = title ?? TITULOS[status] ?? 'Erro';
  }
}
