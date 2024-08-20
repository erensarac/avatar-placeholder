import "dotenv/config";
import Fastify, { type FastifyInstance } from "fastify";
import closeWithGrace from "close-with-grace";
import appService from "./app";

const app: FastifyInstance = Fastify({
  logger: false,
});

app.register(appService);

closeWithGrace({ delay: Number(process.env["FASTIFY_CLOSE_GRACE_DELAY"]) || 500 }, async function ({ signal, err, manual }) {
  if (err) {
    app.log.error(err);
  }
  await app.close();
});

app.listen({ port: Number(process.env["PORT"]!) || 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
  console.log(`Access API Documentation at ${address}/docs`);
});
