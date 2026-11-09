# Organizador de Recursos

Projeto com frontend Angular em `Site/` e API Spring Boot/PostgreSQL em `api/`.

## Executar localmente

Pré-requisitos: Node.js (dependências do site já instaladas), Java 21, Maven e Docker Desktop.

1. Terminal do banco: `cd api` e `docker compose up -d`.
2. Terminal da API: `cd api` e `mvn spring-boot:run`.
3. Terminal do site: `cd Site` e `npm start`.
4. Acesse `http://localhost:4200`.

O Angular encaminha `/api` para `http://localhost:8080` pelo proxy em `Site/proxy.conf.json`; não é necessário habilitar CORS para o desenvolvimento local. A aplicação Flyway cria as tabelas, três usuários demonstrativos e recursos iniciais no primeiro start do banco.

### Contas locais

As três contas de demonstração usam a senha `password`:

- Administrador: `admin@local.test`
- Responsável: `responsavel@local.test`
- Solicitante: `solicitante@local.test`

Use essas credenciais somente no ambiente local. A produção usa `Site/src/environments/environment.prod.ts` (`/api` relativo), que requer um proxy reverso do servidor web para a API.

## Verificação

- Frontend: `cd Site` e `npm run build`.
- API: `cd api` e `mvn test`.
