import { Router } from 'express';
import { exigirPerfil } from '../middleware/auth.js';
import { dataQuery } from '../util/validacao.js';

export function criarRelatorioController({ relatorioService }) {
  const router = Router();
  router.get('/utilizacao', exigirPerfil('RESPONSAVEL', 'ADMINISTRADOR'), async (req, res) => {
    res.json(await relatorioService.utilizacao(dataQuery(req.query, 'inicio'), dataQuery(req.query, 'fim')));
  });
  return router;
}
