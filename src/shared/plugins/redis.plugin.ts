import fastifyRedis from "@fastify/redis";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config/config";

export async function redisPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRedis, {
    url: env.REDIS_URL,
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) return null; // Para de tentar
      return Math.min(times * 200, 5000); // Backoff: 200ms, 400ms, ..., 5s
    },
    connectTimeout: 5000,
  });

  // Validar conexão
  try {
    await app.redis.ping();
    app.log.info("Redis connected");
  } catch (err) {
    app.log.error({ err }, "Redis connection failed");
    throw err; // Não inicia app sem Redis
  }
}

export default fp(redisPlugin, {
  name: "redis-plugin",
});
