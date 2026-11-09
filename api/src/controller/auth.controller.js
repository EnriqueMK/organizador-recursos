import { Router } from 'express';
import { objeto } from '../util/validacao.js';

export function criarAuthController({ authService }) {
  const router = Router();
  router.post('/login', async (req, res) => {
    const corpo = objeto(req.body);
    res.json(await authService.login({ email: corpo.email, senha: corpo.senha }));
  });
  return router;
}
