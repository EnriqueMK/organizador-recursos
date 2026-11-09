import { Router } from 'express';
import { exigirPerfil } from '../middleware/auth.js';
import { ESTADOS } from '../domain/constantes.js';
import { ApiError } from '../util/api-error.js';
import { data, idParam, inteiro, objeto, texto } from '../util/validacao.js';

function lerReserva(corpo) {
  const b = objeto(corpo);
  return {
    recursoId: inteiro(b, 'recursoId', { min: 1 }),
    inicio: data(b, 'inicio'),
    fim: data(b, 'fim'),
    finalidade: texto(b, 'finalidade', { max: 300 }),
  };
}

export function criarReservaController({ reservaService }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const estado = typeof req.query.estado === 'string' && req.query.estado ? req.query.estado : undefined;
    if (estado && !ESTADOS.includes(estado)) throw new ApiError(400, `O parâmetro 'estado' deve ser um de: ${ESTADOS.join(', ')}.`);
    res.json(await reservaService.listar(req.usuario, { minhas: req.query.minhas === 'true', estado }));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await reservaService.criar(req.usuario, lerReserva(req.body)));
  });

  router.get('/:id', async (req, res) => {
    res.json(await reservaService.obter(idParam(req.params.id), req.usuario));
  });

  router.put('/:id', async (req, res) => {
    res.json(await reservaService.atualizar(idParam(req.params.id), req.usuario, lerReserva(req.body)));
  });

  router.get('/:id/historico', exigirPerfil('RESPONSAVEL', 'ADMINISTRADOR'), async (req, res) => {
    res.json(await reservaService.historico(idParam(req.params.id)));
  });

  router.post('/:id/:acao', async (req, res) => {
    const motivo = req.body && typeof req.body === 'object' ? req.body.motivo : undefined;
    res.json(await reservaService.transicionar(idParam(req.params.id), req.params.acao, req.usuario, motivo));
  });

  return router;
}
