import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export default fp(async (fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> => {
  await fastify.register(swagger);
  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: (_request, _reply, next) => next(),
      preHandler: (_request, _reply, next) => next(),
    },
    staticCSP: false,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
});
