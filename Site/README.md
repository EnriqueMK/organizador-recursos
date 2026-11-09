# Organizador de Recursos — Front-end (Angular 18)

Interface web do sistema de Organização de Recursos (reservas de salas, laboratórios e equipamentos).
Consome a API REST em Java 21 + Spring Boot 3 + PostgreSQL (repositório do backend).

## Como rodar
```bash
npm install
npm start            # http://localhost:4200  (API esperada em http://localhost:8080/api)
npm run test:ci      # testes unitários (Karma + Jasmine, Chrome headless)
npm run build        # build de produção em dist/
```
A URL da API fica em `src/environments/environment.ts`.

## Conectando à API (padrão)
Com `useMock: false` em `src/environments/environment.ts` (padrão), o site chama a API Node.js em
`http://localhost:8080/api` (projeto `organizador-recursos-api`). Suba a API antes de abrir o site.

## Modo demonstração (sem backend)
Com `useMock: true`, o site usa um backend falso em memória
(`src/app/core/mock/mock-backend.interceptor.ts`). Na tela de login há botões que preenchem as contas de teste:

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@exemplo.test | 123456 |
| Responsável | responsavel@exemplo.test | 123456 |
| Solicitante | solicitante@exemplo.test | 123456 |
| Solicitante 2 | solicitante2@exemplo.test | 123456 |

Os dados voltam ao estado inicial ao recarregar a página. Quando a API real existir, ponha `useMock: false`.

## Perfis
| Perfil | Pode |
|---|---|
| SOLICITANTE | consultar recursos, criar reservas, cancelar as próprias |
| RESPONSAVEL | tudo acima + aprovar (inclusive recurso restrito), manutenção, histórico, relatórios |
| ADMINISTRADOR | tudo acima + cadastrar recursos |

> Guards e botões escondidos são só UX. A autorização real é do backend (401/403).

## Estrutura de `src/app`
- `core/` — auth (service, guards, interceptor), tratamento de erros (ProblemDetail), models, serviços de API
- `shared/` — navbar, toast, badge de estado, diálogo de confirmação, pipe, validators, máquina de estados da reserva
- `features/` — login, dashboard, recursos, reservas, agenda, auditoria, relatórios, erros

## Contrato da API
| Método | Rota | Perfis |
|---|---|---|
| POST | `/api/auth/login` | anônimo |
| GET / POST | `/api/recursos` | autenticado / Administrador |
| GET | `/api/recursos/{id}/disponibilidade?inicio=&fim=` | autenticado |
| GET / POST | `/api/recursos/{id}/manutencoes` | Responsável, Administrador |
| GET / POST | `/api/reservas` (`?minhas=true&estado=`) | autenticado |
| GET / PUT | `/api/reservas/{id}` | dono, Responsável, Administrador |
| POST | `/api/reservas/{id}/{aprovar,rejeitar,iniciar,concluir,cancelar,nao-compareceu}` | conforme matriz de autorização |
| GET | `/api/reservas/{id}/historico` | Responsável, Administrador |
| GET | `/api/relatorios/utilizacao?inicio=&fim=` | Responsável, Administrador |

Regras que o backend garante: dupla reserva → **409** (constraint `EXCLUDE USING gist` sobre `tstzrange`);
erros em `ProblemDetail` sem stack trace; auditoria gravada na mesma transação da mudança de estado.
