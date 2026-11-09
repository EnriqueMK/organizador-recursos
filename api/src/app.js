import express from 'express';
import cors from 'cors';
import { criarJwt, autenticar } from './middleware/auth.js';
import { naoEncontrado, tratarErros } from './middleware/erros.js';
import { criarAuthService } from './service/auth.service.js';
import { criarRecursoService } from './service/recurso.service.js';
import { criarReservaService } from './service/reserva.service.js';
import { criarRelatorioService } from './service/relatorio.service.js';
import { criarAuthController } from './controller/auth.controller.js';
import { criarRecursoController } from './controller/recurso.controller.js';
import { criarReservaController } from './controller/reserva.controller.js';
import { criarRelatorioController } from './controller/relatorio.controller.js';

/** Monta o app Express. Recebe repositórios e relógio por injeção (MongoDB em produção, memória nos testes). */
export function criarApp({ config, repos, relogio }) {
  const jwt = criarJwt(config);
  const authService = criarAuthService({ usuarios: repos.usuarios, jwt });
  const recursoService = criarRecursoService({ ...repos, relogio });
  const reservaService = criarReservaService({ ...repos, relogio });
  const relatorioService = criarRelatorioService({ reservas: repos.reservas, tentativas: repos.tentativas });
  const protegido = autenticar(jwt);

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/saude', (_req, res) => res.json({ status: 'ok', banco: repos.driver }));
  app.use('/api/auth', criarAuthController({ authService }));
  app.use('/api/recursos', protegido, criarRecursoController({ recursoService }));
  app.use('/api/reservas', protegido, criarReservaController({ reservaService }));
  app.use('/api/relatorios', protegido, criarRelatorioController({ relatorioService }));

  app.use(naoEncontrado);
  app.use(tratarErros);
  return { app, jwt };
}
