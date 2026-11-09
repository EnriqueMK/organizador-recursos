import { Router } from 'express';
import { exigirPerfil } from '../middleware/auth.js';
import { TIPOS_RECURSO } from '../domain/constantes.js';
import { booleano, data, dataQuery, idParam, inteiro, objeto, opcao, texto } from '../util/validacao.js';

export function criarRecursoController({ recursoService }) {
  const router = Router();

  router.get('/', async (_req, res) => res.json(await recursoService.listar()));

  router.post('/', exigirPerfil('ADMINISTRADOR'), async (req, res) => {
    const b = objeto(req.body);
    const novo = await recursoService.criar({
      nome: texto(b, 'nome', { max: 100 }),
      tipo: opcao(b, 'tipo', TIPOS_RECURSO),
      capacidade: inteiro(b, 'capacidade', { min: 1 }),
      restrito: booleano(b, 'restrito'),
    });
    res.status(201).json(novo);
  });

  router.get('/:id/disponibilidade', async (req, res) => {
    res.json(await recursoService.disponibilidade(idParam(req.params.id), dataQuery(req.query, 'inicio'), dataQuery(req.query, 'fim')));
  });

  router.get('/:id/manutencoes', async (req, res) => {
    res.json(await recursoService.listarManutencoes(idParam(req.params.id)));
  });

  router.post('/:id/manutencoes', exigirPerfil('RESPONSAVEL', 'ADMINISTRADOR'), async (req, res) => {
    const b = objeto(req.body);
    const criada = await recursoService.registrarManutencao(idParam(req.params.id), {
      inicio: data(b, 'inicio'),
      fim: data(b, 'fim'),
      motivo: texto(b, 'motivo', { max: 200 }),
    });
    res.status(201).json(criada);
  });

  return router;
}
