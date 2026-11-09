/** Relógio injetável: regras de tempo nunca usam new Date() escondido (testes não precisam de sleep). */
export const relogioSistema = { agora: () => new Date() };

export const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
