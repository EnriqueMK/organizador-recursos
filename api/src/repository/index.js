import { criarRepositoriosMemoria } from './memoria.js';
import { criarRepositoriosMongo } from './mongo.js';

export async function criarRepositorios(config) {
  if (config.driver === 'memoria') {
    console.warn('[db] ATENÇÃO: usando banco EM MEMÓRIA (os dados somem ao reiniciar). Use apenas em testes.');
    return criarRepositoriosMemoria();
  }
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI não definida. Copie .env.example para .env e preencha a string de conexão.');
  }
  return criarRepositoriosMongo({ uri: config.mongoUri, dbName: config.mongoDb });
}
