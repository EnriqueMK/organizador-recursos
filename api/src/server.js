import 'dotenv/config';
import { lerConfig } from './config/env.js';
import { criarRepositorios } from './repository/index.js';
import { criarApp } from './app.js';
import { semearSeVazio } from './seed/demo.js';
import { relogioSistema } from './util/tempo.js';

const config = lerConfig();
let repos;
try {
  repos = await criarRepositorios(config);
} catch (e) {
  console.error(`\n[db] Não foi possível iniciar o banco: ${e.message}\n`);
  process.exit(1);
}
console.log(`[db] Conectado (${repos.driver}${repos.driver === 'mongo' ? `, banco "${config.mongoDb}"` : ''}).`);

if (config.seed && (await semearSeVazio({ repos, relogio: relogioSistema, bcryptRounds: config.bcryptRounds }))) {
  console.log('[seed] Banco vazio: usuários e dados de exemplo criados (senha de todos: 123456).');
}

const { app } = criarApp({ config, repos, relogio: relogioSistema });
const servidor = app.listen(config.porta, () => {
  console.log(`[api] Rodando em http://localhost:${config.porta}/api  (saúde: /api/saude)`);
});

const encerrar = async () => {
  servidor.close();
  await repos.fechar();
  process.exit(0);
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
