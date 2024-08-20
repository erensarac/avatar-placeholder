import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export default fp(async (fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "5 minute",
  });
});
