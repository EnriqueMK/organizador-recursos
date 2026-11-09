import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroAuditoria } from '../models/auditoria.model';
import { PeriodoManutencao, Recurso } from '../models/recurso.model';
import { AcaoReserva, EstadoReserva, NovaReserva, Reserva } from '../models/reserva.model';
import { RelatorioUtilizacao } from '../models/relatorio.model';
import { Usuario } from '../models/usuario.model';
import { acoesPermitidas } from '../../shared/utils/transicoes-reserva';

/**
 * BACKEND FALSO PARA DEMONSTRAÇÃO (environment.useMock = true).
 * Mantém tudo em memória: os dados voltam ao estado inicial ao recarregar a página.
 * Reproduz as regras da API real: 401/403 por perfil, 400 de validação,
 * 409 para dupla reserva e para recurso em manutenção, e auditoria de cada mudança de estado.
 */

const HORA = 3_600_000;
const SENHA_DEMO = '123456';
const ATIVAS: EstadoReserva[] = ['SOLICITADA', 'APROVADA', 'EM_USO'];
const COM_USO: EstadoReserva[] = ['APROVADA', 'EM_USO', 'CONCLUIDA'];

type UsuarioMock = Usuario & { senha: string };
type RecursoBase = Omit<Recurso, 'emManutencao'>;

function em(dias: number, hora: number): string {
  const d = new Date();
  d.setHours(hora, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

// ---------- dados iniciais ----------
const usuarios: UsuarioMock[] = [
  { id: 1, nome: 'Ana Admin', email: 'admin@exemplo.test', perfil: 'ADMINISTRADOR', senha: SENHA_DEMO },
  { id: 2, nome: 'Rui Responsável', email: 'responsavel@exemplo.test', perfil: 'RESPONSAVEL', senha: SENHA_DEMO },
  { id: 3, nome: 'Prof. Carlos', email: 'solicitante@exemplo.test', perfil: 'SOLICITANTE', senha: SENHA_DEMO },
  { id: 4, nome: 'Profa. Marina', email: 'solicitante2@exemplo.test', perfil: 'SOLICITANTE', senha: SENHA_DEMO },
];

const recursos: RecursoBase[] = [
  { id: 1, nome: 'Sala 101', tipo: 'SALA', capacidade: 40, restrito: false },
  { id: 2, nome: 'Laboratório de Informática 2', tipo: 'LABORATORIO', capacidade: 30, restrito: true },
  { id: 3, nome: 'Auditório Principal', tipo: 'AUDITORIO', capacidade: 200, restrito: true },
  { id: 4, nome: 'Projetor portátil', tipo: 'EQUIPAMENTO', capacidade: 1, restrito: false },
  { id: 5, nome: 'Sala 202', tipo: 'SALA', capacidade: 35, restrito: false },
];

const manutencoes: PeriodoManutencao[] = [
  { id: 1, recursoId: 5, inicio: em(-1, 8), fim: em(3, 18), motivo: 'Troca do ar-condicionado' },
  { id: 2, recursoId: 1, inicio: em(5, 8), fim: em(6, 18), motivo: 'Pintura' },
];

const reservas: Reserva[] = [];
const auditoria: RegistroAuditoria[] = [];
const conflitos: string[] = [];          // início das tentativas recusadas por sobreposição
let seqReserva = 0, seqAudit = 0, seqRecurso = recursos.length, seqManut = manutencoes.length;

function nomeUsuario(id: number) { return usuarios.find(u => u.id === id)?.nome ?? '—'; }

function registrar(r: Reserva, usuarioId: number, anterior: EstadoReserva | null, novo: EstadoReserva, motivo: string, instante = new Date().toISOString()) {
  auditoria.push({
    id: ++seqAudit, reservaId: r.id, usuarioId, usuarioNome: nomeUsuario(usuarioId),
    instante, estadoAnterior: anterior, estadoNovo: novo, motivo,
  });
}

const CAMINHO: Record<EstadoReserva, EstadoReserva[]> = {
  SOLICITADA: [], APROVADA: ['APROVADA'], EM_USO: ['APROVADA', 'EM_USO'],
  CONCLUIDA: ['APROVADA', 'EM_USO', 'CONCLUIDA'], CANCELADA: ['CANCELADA'],
  REJEITADA: ['REJEITADA'], NAO_COMPARECEU: ['APROVADA', 'NAO_COMPARECEU'],
};

function semear(recursoId: number, solicitanteId: number, ini: string, fim: string, estado: EstadoReserva, finalidade: string) {
  const rec = recursos.find(x => x.id === recursoId)!;
  const r: Reserva = {
    id: ++seqReserva, recursoId, recursoNome: rec.nome, solicitanteId, solicitanteNome: nomeUsuario(solicitanteId),
    inicio: ini, fim, estado, finalidade,
  };
  reservas.push(r);
  const base = new Date(ini).getTime() - 6 * HORA;
  registrar(r, solicitanteId, null, 'SOLICITADA', 'Solicitação criada', new Date(base).toISOString());
  let ant: EstadoReserva = 'SOLICITADA';
  CAMINHO[estado].forEach((novo, i) => {
    const quem = novo === 'CANCELADA' ? solicitanteId : 2;
    registrar(r, quem, ant, novo, 'Transição de demonstração', new Date(base + (i + 1) * HORA).toISOString());
    ant = novo;
  });
}

semear(1, 3, em(0, 8), em(0, 10), 'APROVADA', 'Aula de Engenharia de Software');
semear(2, 3, em(1, 14), em(1, 16), 'SOLICITADA', 'Aula prática de testes automatizados');
semear(3, 4, em(2, 19), em(2, 21), 'SOLICITADA', 'Palestra de abertura do semestre');
semear(1, 4, em(-1, 8), em(-1, 10), 'CONCLUIDA', 'Reunião de projeto');
semear(4, 3, em(0, 10), em(0, 12), 'EM_USO', 'Apresentação de seminário');
semear(1, 4, em(-2, 14), em(-2, 16), 'CANCELADA', 'Monitoria (cancelada)');
semear(2, 4, em(-3, 10), em(-3, 12), 'NAO_COMPARECEU', 'Laboratório de redes');

// ---------- utilidades ----------
const t = (iso: string) => new Date(iso).getTime();
const sobrepoe = (a1: string, a2: string, b1: string, b2: string) => t(a1) < t(b2) && t(b1) < t(a2);

function ok(body: unknown, status = 200): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse<unknown>({ status, body }));
}
function erro(status: number, title: string, detail: string): Observable<HttpEvent<unknown>> {
  return throwError(() => new HttpErrorResponse({ status, statusText: title, error: { title, status, detail } }));
}

function usuarioDe(req: HttpRequest<unknown>): UsuarioMock | undefined {
  const m = /^Bearer mock-token-(\d+)$/.exec(req.headers.get('Authorization') ?? '');
  return m ? usuarios.find(u => u.id === +m[1]) : undefined;
}

function recursoComManutencao(r: RecursoBase): Recurso {
  const agora = new Date().toISOString();
  return { ...r, emManutencao: manutencoes.some(m => m.recursoId === r.id && m.inicio <= agora && agora < m.fim) };
}

function reservaView(r: Reserva): Reserva {
  return { ...r, recursoRestrito: recursos.find(x => x.id === r.recursoId)?.restrito };
}

function janelasLivres(recursoId: number, ini: string, fim: string) {
  const a = t(ini), b = t(fim);
  const ocupados: Array<[number, number]> = [
    ...reservas.filter(r => r.recursoId === recursoId && ATIVAS.includes(r.estado)).map(r => [t(r.inicio), t(r.fim)] as [number, number]),
    ...manutencoes.filter(m => m.recursoId === recursoId).map(m => [t(m.inicio), t(m.fim)] as [number, number]),
  ].filter(([i, f]) => i < b && f > a).sort((x, y) => x[0] - y[0]);

  const livres: { inicio: string; fim: string }[] = [];
  let cursor = a;
  for (const [i, f] of ocupados) {
    if (i > cursor) livres.push({ inicio: new Date(cursor).toISOString(), fim: new Date(i).toISOString() });
    cursor = Math.max(cursor, f);
  }
  if (cursor < b) livres.push({ inicio: new Date(cursor).toISOString(), fim: new Date(b).toISOString() });
  return livres;
}

function relatorio(ini: string, fim: string): RelatorioUtilizacao {
  const a = t(ini), b = t(fim);
  const porRecurso = new Map<number, number>();
  const porProf = new Map<number, number>();
  for (const r of reservas.filter(x => COM_USO.includes(x.estado))) {
    const i = Math.max(a, t(r.inicio)), f = Math.min(b, t(r.fim));
    if (f > i) {
      const h = (f - i) / HORA;
      porRecurso.set(r.recursoId, (porRecurso.get(r.recursoId) ?? 0) + h);
      porProf.set(r.solicitanteId, (porProf.get(r.solicitanteId) ?? 0) + h);
    }
  }
  return {
    inicio: ini, fim,
    horasPorRecurso: [...porRecurso].map(([id, horas]) => ({ recursoId: id, recursoNome: recursos.find(x => x.id === id)!.nome, horas })),
    cargaPorProfessor: [...porProf].map(([id, horas]) => ({ professorId: id, professorNome: nomeUsuario(id), horas })),
    conflitosEvitados: conflitos.filter(c => t(c) >= a && t(c) < b).length,
  };
}

const ALVO: Record<string, EstadoReserva> = {
  aprovar: 'APROVADA', rejeitar: 'REJEITADA', iniciar: 'EM_USO',
  concluir: 'CONCLUIDA', cancelar: 'CANCELADA', 'nao-compareceu': 'NAO_COMPARECEU',
};

const negado = () => erro(403, 'Acesso negado', 'Você não tem permissão para esta operação.');
const gestor = (u: UsuarioMock) => u.perfil === 'RESPONSAVEL' || u.perfil === 'ADMINISTRADOR';

// ---------- roteador ----------
function tratar(req: HttpRequest<unknown>, path: string): Observable<HttpEvent<unknown>> {
  const m = req.method;

  if (m === 'POST' && path === '/auth/login') {
    const b = req.body as { email?: string; senha?: string };
    const u = usuarios.find(x => x.email === b?.email && x.senha === b?.senha);
    if (!u) return erro(401, 'Não autenticado', 'E-mail ou senha inválidos.');
    const { senha: _omitida, ...usuario } = u;
    return ok({ token: `mock-token-${u.id}`, usuario });
  }

  const u = usuarioDe(req);
  if (!u) return erro(401, 'Não autenticado', 'Sessão inválida.');
  let r: RegExpExecArray | null;

  // recursos
  if (m === 'GET' && path === '/recursos') return ok(recursos.map(recursoComManutencao));
  if (m === 'POST' && path === '/recursos') {
    if (u.perfil !== 'ADMINISTRADOR') return negado();
    const b = req.body as Omit<RecursoBase, 'id'>;
    if (!b?.nome?.trim() || !(b.capacidade > 0)) return erro(400, 'Requisição inválida', 'Informe nome e uma capacidade positiva.');
    const novo: RecursoBase = { id: ++seqRecurso, nome: b.nome.trim(), tipo: b.tipo, capacidade: b.capacidade, restrito: !!b.restrito };
    recursos.push(novo);
    return ok(recursoComManutencao(novo), 201);
  }
  if (m === 'GET' && (r = /^\/recursos\/(\d+)\/disponibilidade$/.exec(path))) {
    const ini = req.params.get('inicio'), fim = req.params.get('fim');
    if (!ini || !fim || t(fim) <= t(ini)) return erro(400, 'Requisição inválida', 'Período inválido.');
    return ok({ recursoId: +r[1], livres: janelasLivres(+r[1], ini, fim) });
  }
  if (m === 'GET' && (r = /^\/recursos\/(\d+)\/manutencoes$/.exec(path))) {
    return ok(manutencoes.filter(x => x.recursoId === +r![1]));
  }
  if (m === 'POST' && (r = /^\/recursos\/(\d+)\/manutencoes$/.exec(path))) {
    if (!gestor(u)) return negado();
    const b = req.body as Omit<PeriodoManutencao, 'id' | 'recursoId'>;
    if (!b?.inicio || !b?.fim || t(b.fim) <= t(b.inicio) || !b.motivo?.trim()) {
      return erro(400, 'Requisição inválida', 'Informe um período válido e o motivo.');
    }
    const novo: PeriodoManutencao = { id: ++seqManut, recursoId: +r[1], inicio: b.inicio, fim: b.fim, motivo: b.motivo.trim() };
    manutencoes.push(novo);
    return ok(novo, 201);
  }

  // reservas
  if (m === 'GET' && path === '/reservas') {
    const apenasMinhas = req.params.get('minhas') === 'true' || u.perfil === 'SOLICITANTE';
    const estado = req.params.get('estado');
    return ok(reservas
      .filter(x => (!apenasMinhas || x.solicitanteId === u.id) && (!estado || x.estado === estado))
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .map(reservaView));
  }
  if (m === 'POST' && path === '/reservas') {
    const b = req.body as NovaReserva;
    if (!b?.recursoId || !b.inicio || !b.fim || !b.finalidade?.trim()) {
      return erro(400, 'Requisição inválida', 'Preencha recurso, período e finalidade.');
    }
    if (t(b.fim) <= t(b.inicio)) return erro(400, 'Requisição inválida', 'O término deve ser depois do início.');
    const rec = recursos.find(x => x.id === b.recursoId);
    if (!rec) return erro(404, 'Não encontrado', 'Recurso inexistente.');
    if (manutencoes.some(x => x.recursoId === rec.id && sobrepoe(b.inicio, b.fim, x.inicio, x.fim))) {
      return erro(409, 'Conflito', 'O recurso está em manutenção no período solicitado.');
    }
    if (reservas.some(x => x.recursoId === rec.id && ATIVAS.includes(x.estado) && sobrepoe(b.inicio, b.fim, x.inicio, x.fim))) {
      conflitos.push(b.inicio);
      return erro(409, 'Conflito', 'Já existe uma reserva para este recurso neste horário.');
    }
    const nova: Reserva = {
      id: ++seqReserva, recursoId: rec.id, recursoNome: rec.nome, solicitanteId: u.id, solicitanteNome: u.nome,
      inicio: b.inicio, fim: b.fim, estado: 'SOLICITADA', finalidade: b.finalidade.trim(),
    };
    reservas.push(nova);
    registrar(nova, u.id, null, 'SOLICITADA', 'Solicitação criada');
    return ok(reservaView(nova), 201);
  }
  if (m === 'GET' && (r = /^\/reservas\/(\d+)$/.exec(path))) {
    const x = reservas.find(v => v.id === +r![1]);
    if (!x) return erro(404, 'Não encontrado', 'Reserva inexistente.');
    if (u.perfil === 'SOLICITANTE' && x.solicitanteId !== u.id) return negado();
    return ok(reservaView(x));
  }
  if (m === 'GET' && (r = /^\/reservas\/(\d+)\/historico$/.exec(path))) {
    if (!gestor(u)) return negado();
    return ok(auditoria.filter(a => a.reservaId === +r![1]));
  }
  if (m === 'POST' && (r = /^\/reservas\/(\d+)\/([a-z-]+)$/.exec(path))) {
    const x = reservas.find(v => v.id === +r![1]);
    const acao = r[2];
    if (!x) return erro(404, 'Não encontrado', 'Reserva inexistente.');
    const alvo = ALVO[acao];
    if (!alvo) return erro(404, 'Não encontrado', 'Ação desconhecida.');
    const rec = recursos.find(v => v.id === x.recursoId)!;
    const permitidas = acoesPermitidas(x.estado, u.perfil, x.solicitanteId === u.id, rec.restrito).map(a => a.acao);
    if (!permitidas.includes(acao as AcaoReserva)) return negado();
    const motivo = (req.body as { motivo?: string } | null)?.motivo ?? '';
    registrar(x, u.id, x.estado, alvo, motivo || 'Sem motivo informado');
    x.estado = alvo;
    return ok(reservaView(x));
  }

  // relatórios
  if (m === 'GET' && path === '/relatorios/utilizacao') {
    if (!gestor(u)) return negado();
    const ini = req.params.get('inicio'), fim = req.params.get('fim');
    if (!ini || !fim || t(fim) <= t(ini)) return erro(400, 'Requisição inválida', 'Período inválido.');
    return ok(relatorio(ini, fim));
  }

  return erro(404, 'Não encontrado', `Rota desconhecida: ${m} ${path}`);
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  return tratar(req, req.url.slice(environment.apiUrl.length)).pipe(delay(250));
};
