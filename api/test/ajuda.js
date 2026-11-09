import bcrypt from 'bcryptjs';
import { criarApp } from '../src/app.js';
import { lerConfig } from '../src/config/env.js';
import { criarRepositoriosMemoria } from '../src/repository/memoria.js';

/** Sobe a API inteira (rotas, JWT, validação, serviços) sobre o repositório em memória, numa porta livre. */
export async function iniciar() {
  const config = lerConfig({
    DB_DRIVER: 'memoria',
    BCRYPT_ROUNDS: '4',
    JWT_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres-ok',
  });
  const repos = criarRepositoriosMemoria();
  const relogio = { agora: () => new Date() };
  const { app } = criarApp({ config, repos, relogio });
  const servidor = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const url = `http://127.0.0.1:${servidor.address().port}`;

  const hash = await bcrypt.hash('123456', 4);
  const usuarios = {};
  for (const [chave, perfil] of [
    ['admin', 'ADMINISTRADOR'], ['resp', 'RESPONSAVEL'], ['sol', 'SOLICITANTE'], ['sol2', 'SOLICITANTE'],
  ]) {
    usuarios[chave] = await repos.usuarios.inserir({ nome: `Usuário ${chave}`, email: `${chave}@teste.test`, senhaHash: hash, perfil });
  }

  const tokens = new Map();
  async function login(email) {
    const r = await fetch(`${url}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha: '123456' }),
    });
    return (await r.json()).token;
  }
  async function tokenDe(email) {
    if (!tokens.has(email)) tokens.set(email, await login(email));
    return tokens.get(email);
  }

  /** quem: chave de usuário ('sol'), e-mail, ou null para anônimo. */
  async function api(metodo, caminho, { quem = null, corpo, bruto } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (quem) headers.Authorization = `Bearer ${await tokenDe(quem.includes('@') ? quem : `${quem}@teste.test`)}`;
    const r = await fetch(`${url}${caminho}`, {
      method: metodo, headers, body: bruto ?? (corpo === undefined ? undefined : JSON.stringify(corpo)),
    });
    const texto = await r.text();
    let json = null;
    try { json = JSON.parse(texto); } catch { /* corpo não-JSON */ }
    return { status: r.status, corpo: json, texto };
  }

  /** Cria um solicitante novo (para testes com muitos usuários). */
  async function novoUsuario(nome, perfil = 'SOLICITANTE') {
    const email = `${nome}@teste.test`;
    const u = await repos.usuarios.inserir({ nome, email, senhaHash: hash, perfil });
    return { usuario: u, email };
  }

  return { url, repos, usuarios, api, tokenDe, novoUsuario, fechar: () => new Promise((r) => servidor.close(r)) };
}

export const iso = (ano, mes, dia, hora = 0, min = 0, seg = 0) =>
  new Date(Date.UTC(ano, mes - 1, dia, hora, min, seg)).toISOString();

/** Dados base: recurso 1 (livre), recurso 2 (restrito) e reserva 1 SOLICITADA do usuário "sol". */
export async function prepararBase(ctx) {
  const { repos, usuarios } = ctx;
  const livre = await repos.recursos.inserir({ nome: 'Sala 1', tipo: 'SALA', capacidade: 30, restrito: false });
  const restrito = await repos.recursos.inserir({ nome: 'Laboratório X', tipo: 'LABORATORIO', capacidade: 20, restrito: true });
  const reserva = await repos.reservas.inserir({
    recursoId: livre._id, recursoNome: livre.nome,
    solicitanteId: usuarios.sol._id, solicitanteNome: usuarios.sol.nome,
    inicio: new Date(iso(2030, 1, 1, 10)), fim: new Date(iso(2030, 1, 1, 11)),
    estado: 'SOLICITADA', finalidade: 'Aula', criadoEm: new Date(),
  });
  await repos.auditoria.inserir({
    reservaId: reserva._id, usuarioId: usuarios.sol._id, usuarioNome: usuarios.sol.nome,
    instante: new Date(), estadoAnterior: null, estadoNovo: 'SOLICITADA', motivo: 'Solicitação criada',
  });
  return { livre, restrito, reserva };
}
