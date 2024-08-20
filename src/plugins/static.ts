import path from "path";
import fp from "fastify-plugin";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export default fp(async (fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> => {
  fastify.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "../public"),
    prefix: "/public/",
  });
});
