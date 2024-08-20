import type { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", (_request, reply) => {
    reply.redirect("/docs");
  });
};

export default root;
