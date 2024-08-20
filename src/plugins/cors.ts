import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export default fp(async (fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> => {
  await fastify.register(cors, {
    origin: true,
  });
});
