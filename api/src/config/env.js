export function lerConfig(env = process.env) {
  const producao = env.NODE_ENV === 'production';
  if (producao && !env.JWT_SECRET) throw new Error('Defina JWT_SECRET em produção.');

  return {
    porta: Number(env.PORT ?? 8080),
    driver: env.DB_DRIVER === 'memoria' ? 'memoria' : 'mongo',
    mongoUri: env.MONGODB_URI,
    mongoDb: env.MONGODB_DB ?? 'organizador_recursos',
    jwtSecret: env.JWT_SECRET ?? 'dev-only-troque-esta-chave-por-uma-com-mais-de-32-caracteres',
    jwtExpiracao: env.JWT_EXPIRACAO ?? '2h',
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:4200').split(',').map((s) => s.trim()),
    seed: (env.SEED_ENABLED ?? 'true') === 'true',
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? 10),
  };
}
