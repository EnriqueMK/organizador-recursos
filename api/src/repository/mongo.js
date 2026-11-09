import { MongoClient } from 'mongodb';
import { ATIVAS } from '../domain/constantes.js';

/**
 * Repositório MongoDB (driver oficial). Mesma interface de repository/memoria.js.
 * Os ids são numéricos e sequenciais (coleção "contadores"), então o site Angular usa /reservas/12.
 */
export async function criarRepositoriosMongo({ uri, dbName }) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });
  await client.connect();
  const db = client.db(dbName);

  const c = {
    usuarios: db.collection('usuarios'),
    recursos: db.collection('recursos'),
    manutencoes: db.collection('manutencoes'),
    reservas: db.collection('reservas'),
    auditoria: db.collection('auditoria'),
    tentativas: db.collection('tentativas_conflito'),
    bloqueios: db.collection('bloqueios'),
    contadores: db.collection('contadores'),
  };

  try {
    await Promise.all([
      c.usuarios.createIndex({ email: 1 }, { unique: true }),
      c.manutencoes.createIndex({ recursoId: 1, inicio: 1 }),
      c.reservas.createIndex({ recursoId: 1, inicio: 1 }),
      c.reservas.createIndex({ solicitanteId: 1, inicio: 1 }),
      c.auditoria.createIndex({ reservaId: 1, instante: 1 }),
      c.tentativas.createIndex({ inicioSolicitado: 1 }),
    ]);
  } catch (e) {
    console.warn('[mongo] Não foi possível criar os índices (seguindo sem eles):', e.message);
  }

  async function proximoId(nome) {
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        const doc = await c.contadores.findOneAndUpdate(
          { _id: nome },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after' },
        );
        return doc.seq;
      } catch (e) {
        if (e.code !== 11000) throw e; // corrida na criação do contador: tenta de novo
      }
    }
    throw new Error(`Não foi possível gerar id para ${nome}`);
  }

  async function inserir(colecao, nomeContador, doc) {
    const novo = { _id: await proximoId(nomeContador), ...doc };
    await colecao.insertOne(novo);
    return novo;
  }

  const ativas = { $in: ATIVAS };

  return {
    driver: 'mongo',

    usuarios: {
      inserir: (doc) => inserir(c.usuarios, 'usuarios', doc),
      buscarPorEmail: (email) => c.usuarios.findOne({ email }),
      buscarPorId: (id) => c.usuarios.findOne({ _id: id }),
      contar: () => c.usuarios.countDocuments({}),
    },

    recursos: {
      inserir: (doc) => inserir(c.recursos, 'recursos', doc),
      buscar: (id) => c.recursos.findOne({ _id: id }),
      listar: () => c.recursos.find({}).sort({ _id: 1 }).toArray(),
    },

    manutencoes: {
      inserir: (doc) => inserir(c.manutencoes, 'manutencoes', doc),
      listarPorRecurso: (recursoId) => c.manutencoes.find({ recursoId }).sort({ inicio: 1 }).toArray(),
      existeSobreposicao: async (recursoId, ini, fim) =>
        !!(await c.manutencoes.findOne({ recursoId, inicio: { $lt: fim }, fim: { $gt: ini } }, { projection: { _id: 1 } })),
      noPeriodo: (recursoId, ini, fim) =>
        c.manutencoes.find({ recursoId, inicio: { $lt: fim }, fim: { $gt: ini } }).toArray(),
      emAndamento: (agora) => c.manutencoes.distinct('recursoId', { inicio: { $lte: agora }, fim: { $gt: agora } }),
    },

    reservas: {
      inserir: (doc) => inserir(c.reservas, 'reservas', doc),
      buscar: (id) => c.reservas.findOne({ _id: id }),
      remover: async (id) => { await c.reservas.deleteOne({ _id: id }); },
      listar: ({ solicitanteId } = {}) =>
        c.reservas.find(solicitanteId === undefined ? {} : { solicitanteId }).sort({ inicio: 1 }).toArray(),
      /** Atualização condicional (compare-and-set): só aplica se o documento ainda satisfaz `condicao`. */
      atualizar: async (id, alteracoes, condicao = {}) => {
        const r = await c.reservas.updateOne({ _id: id, ...condicao }, { $set: alteracoes });
        return r.matchedCount > 0;
      },
      existeSobreposicaoRecurso: async (recursoId, ini, fim, ignorarId) =>
        !!(await c.reservas.findOne(
          { recursoId, estado: ativas, inicio: { $lt: fim }, fim: { $gt: ini }, ...(ignorarId ? { _id: { $ne: ignorarId } } : {}) },
          { projection: { _id: 1 } },
        )),
      existeSobreposicaoAgenda: async (solicitanteId, ini, fim, ignorarId) =>
        !!(await c.reservas.findOne(
          { solicitanteId, estado: ativas, inicio: { $lt: fim }, fim: { $gt: ini }, ...(ignorarId ? { _id: { $ne: ignorarId } } : {}) },
          { projection: { _id: 1 } },
        )),
      ativasNoPeriodo: (recursoId, ini, fim) =>
        c.reservas.find({ recursoId, estado: ativas, inicio: { $lt: fim }, fim: { $gt: ini } }).toArray(),
      comUsoNoPeriodo: (estados, ini, fim) =>
        c.reservas.find({ estado: { $in: estados }, inicio: { $lt: fim }, fim: { $gt: ini } }).toArray(),
    },

    auditoria: {
      inserir: (doc) => inserir(c.auditoria, 'auditoria', doc),
      listarPorReserva: (reservaId) => c.auditoria.find({ reservaId }).sort({ instante: 1, _id: 1 }).toArray(),
    },

    tentativas: {
      inserir: (doc) => inserir(c.tentativas, 'tentativas', doc),
      contar: (de, ate) => c.tentativas.countDocuments({ inicioSolicitado: { $gte: de, $lt: ate } }),
    },

    bloqueios: {
      /**
       * Adquire o bloqueio de forma atômica. O filtro só casa com um bloqueio EXPIRADO; se o bloqueio existe e
       * está vivo, o upsert tenta inserir um _id duplicado (erro 11000) e devolvemos false.
       */
      adquirir: async (chave, dono, ate, agora) => {
        try {
          await c.bloqueios.updateOne({ _id: chave, ate: { $lt: agora } }, { $set: { dono, ate } }, { upsert: true });
          return true;
        } catch (e) {
          if (e.code === 11000) return false;
          throw e;
        }
      },
      liberar: async (chave, dono) => { await c.bloqueios.deleteOne({ _id: chave, dono }); },
    },

    fechar: () => client.close(),
  };
}
