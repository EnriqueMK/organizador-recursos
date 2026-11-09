# Organizador de Recursos — API (Node.js + Express + MongoDB)

API REST do sistema de Organização de Recursos (reservas de salas, laboratórios e equipamentos).
Segue a mesma divisão do projeto de exemplo do professor (`entity/`, `repository/`, `service/`, `controller/`),
com banco **MongoDB**, e é consumida pelo site Angular (`organizador-recursos-web`).

## Funcionalidades
* Login com JWT e três perfis: **Solicitante**, **Responsável** e **Administrador**
* Recursos (salas, laboratórios, equipamentos, auditório), alguns **restritos** (exigem aprovação de um Responsável)
* Períodos de **manutenção** (recurso em manutenção não pode ser reservado)
* Reservas com ciclo de vida: `SOLICITADA → APROVADA → EM_USO → CONCLUIDA` (+ rejeitada, cancelada, não compareceu)
* **Sem dupla reserva**, mesmo com requisições simultâneas, e sem conflito na agenda do professor
* **Auditoria** de toda mudança de estado (somente leitura; a API não altera nem apaga)
* Relatório de utilização (horas por recurso, carga por professor, conflitos evitados)

## Tecnologias
Node.js 20+ · Express 5 · MongoDB (driver oficial) · JWT (`jsonwebtoken`) · `bcryptjs` · testes com `node:test` (sem dependências extras)

## Começando
Pré-requisito: **Node.js 20 ou superior** (https://nodejs.org, versão LTS).

```cmd
cd organizador-recursos-api
copy .env.example .env
```
Abra o `.env` e preencha:

| Variável | O que colocar |
|---|---|
| `MONGODB_URI` | a string de conexão do MongoDB que o professor passou (`mongodb://USUARIO:SENHA@HOST:PORTA`) |
| `MONGODB_DB` | um nome de banco **só do seu grupo**, ex.: `organizador_recursos_grupo3` |
| `JWT_SECRET` | uma chave sua, com 32+ caracteres |

Depois:
```cmd
npm install
npm start
```
A API sobe em `http://localhost:8080/api` (teste: `http://localhost:8080/api/saude`).
Na primeira execução, se o seu banco estiver vazio, são criados usuários e dados fictícios:

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@exemplo.test | 123456 |
| Responsável | responsavel@exemplo.test | 123456 |
| Solicitante | solicitante@exemplo.test | 123456 |
| Solicitante 2 | solicitante2@exemplo.test | 123456 |

> **Segurança:** o `.env` está no `.gitignore` e **nunca** deve ir para o GitHub (o repositório da entrega é público).
> O servidor MongoDB do professor é compartilhado: por isso o `MONGODB_DB` próprio, e nada de apagar coleções que não sejam suas.

## Comandos
* `npm start` — inicia a API
* `npm run dev` — inicia com reinício automático ao salvar
* `npm test` — roda os testes (não usam o MongoDB nem a rede)

## API Endpoints
Base: `/api`. Todas exigem `Authorization: Bearer <token>`, exceto o login e a saúde.

| Método | Rota | Perfis |
|---|---|---|
| GET | `/saude` | público |
| POST | `/auth/login` | público |
| GET | `/recursos` | autenticado |
| POST | `/recursos` | Administrador |
| GET | `/recursos/{id}/disponibilidade?inicio=&fim=` | autenticado |
| GET | `/recursos/{id}/manutencoes` | autenticado |
| POST | `/recursos/{id}/manutencoes` | Responsável, Administrador |
| GET | `/reservas` (`?minhas=true&estado=`) | autenticado (Solicitante só vê as próprias) |
| POST | `/reservas` | autenticado |
| GET | `/reservas/{id}` | dono, Responsável, Administrador |
| PUT | `/reservas/{id}` | só o dono, e só se `SOLICITADA` |
| POST | `/reservas/{id}/{aprovar,rejeitar,iniciar,concluir,cancelar,nao-compareceu}` | conforme regras abaixo |
| GET | `/reservas/{id}/historico` | Responsável, Administrador |
| GET | `/relatorios/utilizacao?inicio=&fim=` | Responsável, Administrador |

Regras das transições: **aprovar** (Responsável/Administrador, nunca a própria reserva; recurso restrito só Responsável) ·
**rejeitar, iniciar, concluir, não compareceu** (Responsável/Administrador) · **cancelar** (só o dono).
`rejeitar`, `cancelar` e `nao-compareceu` exigem `{ "motivo": "..." }`.

Erros seguem `{ "title", "status", "detail" }` (400 validação · 401 sem login · 403 sem permissão · 404 · 409 conflito) e nunca expõem stack trace.

## Estrutura
```
src/
  server.js              inicia banco, seed e servidor
  app.js                 monta o Express (rotas, CORS, erros)
  config/env.js          variáveis de ambiente
  entity/                formato dos documentos e das respostas
  repository/            acesso a dados: mongo.js (produção) e memoria.js (testes)
  service/               regras de negócio
  controller/            rotas HTTP
  middleware/            autenticação/perfis e tratamento de erros
  domain/                regras puras: transições, períodos, bloqueio
  seed/demo.js           dados fictícios iniciais
test/                    unitários, API (matriz de autorização) e concorrência
```

## Banco de dados (coleções MongoDB)
| Coleção | Campos |
|---|---|
| `usuarios` | `_id, nome, email (único), senhaHash, perfil` |
| `recursos` | `_id, nome, tipo, capacidade, restrito` |
| `manutencoes` | `_id, recursoId, inicio, fim, motivo` |
| `reservas` | `_id, recursoId, recursoNome, solicitanteId, solicitanteNome, inicio, fim, estado, finalidade, criadoEm` |
| `auditoria` | `_id, reservaId, usuarioId, usuarioNome, instante, estadoAnterior, estadoNovo, motivo` |
| `tentativas_conflito` | `_id, recursoId, usuarioId, inicioSolicitado, fimSolicitado, criadoEm` |
| `bloqueios` | `_id (chave), dono, ate` — exclusão mútua (ver abaixo) |
| `contadores` | `_id (coleção), seq` — ids numéricos sequenciais |

## Decisões de projeto
* **Dupla reserva no MongoDB:** diferente do PostgreSQL, o MongoDB não tem constraint de exclusão para intervalos.
  A checagem de sobreposição e a inserção rodam dentro de um **bloqueio por recurso e por professor** (coleção `bloqueios`,
  com expiração automática). Funciona com várias instâncias da API e sem exigir *replica set* ou transações.
* **Agenda do professor:** o mesmo solicitante também não pode ter duas reservas ativas no mesmo horário.
* **Intervalos `[início, fim)`:** terminar exatamente quando outra reserva começa não é conflito.
* **Auditoria sem transação:** a reserva e o registro de auditoria são gravados em sequência; se a auditoria falhar, a mudança é desfeita (compensação).
  A imutabilidade é garantida pela API (não há rota de alterar/apagar); o MongoDB do professor não impõe isso por si só.
* **Mudança de estado concorrente:** usa atualização condicional (*compare-and-set*): se duas pessoas aprovam ao mesmo tempo, uma recebe 409.
* **Relógio injetável** (`util/tempo.js`): as regras de tempo não usam `new Date()` escondido.

## Testes
`npm test` roda 93 testes: política de transições, fronteiras de períodos, **matriz de autorização (operação × perfil)**, posse de reservas,
validação de entrada, ausência de vazamento de detalhes internos nos erros, relatório com valores calculados à mão e
**20 requisições simultâneas** para a mesma sala (exatamente 1 aceita e 19 com 409) repetidas 5 vezes.
Os testes usam o repositório em memória (`repository/memoria.js`), que tem a mesma interface do MongoDB.
