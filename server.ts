import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

const fastify: FastifyInstance = Fastify({
  logger: false,
});

await fastify.register(import("@fastify/cors"), {
  origin: true,
});

await fastify.register(import("@fastify/rate-limit"), {
  max: 100,
  timeWindow: "5 minute",
});

await fastify.register(import("@fastify/swagger"));

await fastify.register(import("@fastify/swagger-ui"), {
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

fastify.get("/", (_, reply) => {
  reply.redirect("/docs");
});

await fastify.register(import("./routes/avatar-route"));

fastify.listen({ port: Number(process.env["PORT"]!) || 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
  console.log(`Access API Documentation at ${address}/docs`);
});
