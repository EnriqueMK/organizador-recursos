import { randomUUID } from 'node:crypto';
import { ApiError } from '../util/api-error.js';
import { dormir } from '../util/tempo.js';

/**
 * Exclusão mútua distribuída por chave (ex.: "recurso:3", "agenda:7").
 * O MongoDB não tem "constraint de exclusão" para intervalos como o PostgreSQL, então a checagem de
 * sobreposição + inserção da reserva roda dentro de um bloqueio. Funciona com várias instâncias da API
 * e sem exigir replica set/transações. O bloqueio expira sozinho (lease) se o processo morrer.
 */
export async function comBloqueio(bloqueios, relogio, chaves, fn, opcoes = {}) {
  const { esperaMaximaMs = 30_000, leaseMs = 30_000, passoMs = 15 } = opcoes;
  const dono = randomUUID();
  const ordenadas = [...new Set(chaves)].sort(); // ordem fixa evita deadlock
  const adquiridas = [];
  try {
    for (const chave of ordenadas) {
      const limite = Date.now() + esperaMaximaMs;
      let ok = false;
      while (!ok) {
        const agora = relogio.agora();
        ok = await bloqueios.adquirir(chave, dono, new Date(agora.getTime() + leaseMs), agora);
        if (!ok) {
          if (Date.now() > limite) throw new ApiError(503, 'Sistema ocupado. Tente novamente em instantes.');
          await dormir(passoMs + Math.random() * passoMs);
        }
      }
      adquiridas.push(chave);
    }
    return await fn();
  } finally {
    for (const chave of adquiridas.reverse()) {
      await bloqueios.liberar(chave, dono).catch(() => {});
    }
  }
}
