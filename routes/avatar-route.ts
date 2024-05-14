import svg2img from "svg2img";
import type { FastifyRequest, FastifyReply, FastifyInstance, FastifyPluginOptions } from "fastify";
import type { Color } from "../types/color";
import generateColor from "../utils/generate-color";
import getLetters from "../utils/get-letters";
import transformCase from "../utils/transform-case";

type IAvatarShape = "circle" | "square";
type IAvatarFormat = "svg" | "jpeg";

interface IQuerystring {
  color: string;
  name: string;
  letterCount: number;
  size: number;
  shape: IAvatarShape;
  lowercase: boolean;
  format: IAvatarFormat;
}

async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  const avatarQuerystringJsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      color: {
        type: "string",
        description: "",
        enum: ["orange", "yellow", "green", "blue", "purple", "pink", "red"],
      },
      name: {
        type: "string",
      },
      letterCount: {
        type: "number",
        enum: [1, 2],
      },
      size: {
        type: "number",
        enum: [300],
        default: 300,
      },
      shape: {
        type: "string",
        enum: ["square", "circle"],
      },
      lowercase: {
        type: "boolean",
      },
      format: {
        type: "string",
        enum: ["svg", "jpeg"],
        default: "jpeg",
      },
    },
  };

  const schema = {
    tags: ["avatar"],
    querystring: avatarQuerystringJsonSchema,
    produces: ["image/*"],
    examples: false,
    response: {
      "2xx": {
        description: "OK",
        content: {
          "image/jpeg": {
            schema: {
              type: "string",
              format: "binary",
            },
          },
          "image/svg+xml": {
            schema: {
              type: "string",
              format: "binary",
            },
          },
        },
      },
      "4xx": {
        description: "Missing Parameter",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                statusCode: {
                  type: "number",
                },
                error: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  };

  fastify.get(
    "/avatar",
    {
      schema,
      preValidation: (request, reply, done) => {
        if (!request.query.name) {
          reply.code(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: "Name parameter is required. Please provide a valid name parameter.",
          });
        }

        done();
      },
      preParsing: (request: FastifyRequest<{ Querystring: IQuerystring }>, _reply: FastifyReply, payload, done) => {
        const letterCount: number = request.query.letterCount
          ? Number(request.query.letterCount.toString().replace(/["]+/g, ""))
          : 2;

        request.query.size = 300;
        request.query.lowercase = request.query.lowercase || false;
        request.query.shape = request.query.shape ? (request.query.shape.replace(/['"]+/g, "") as IAvatarShape) : "square";
        request.query.letterCount = isNaN(letterCount) ? 2 : letterCount;

        done(null, payload);
      },
    },
    async (request: FastifyRequest<{ Querystring: IQuerystring }>, reply: FastifyReply) => {
      const { color, size, shape, name, letterCount, lowercase } = request.query;

      const generatedColor: Color = generateColor(name, color);

      const letters: string = getLetters(name, letterCount).toString().replace(",", "");
      const textCase = lowercase ? "lowercase" : "uppercase";
      const text: string = transformCase(letters, textCase);

      const fontFamily: "Arial" = "Arial";

      const circle = `<circle r="${size / 2 - 1}" cx="${size / 2}" cy="${size / 2}" fill="${generatedColor.background}" stroke="${generatedColor.background}" />`;
      const square = `<rect x="0" y="0" width="${size}" height="${size}" fill="${generatedColor.background}"/>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shape === "circle" ? circle : square}<text x="${size / 2}" y="${size / 2}" fill="${generatedColor.foreground}" font-size="${size / 2 - 10}" font-weight="bold" font-family="${fontFamily}" text-anchor="middle" alignment-baseline="central">${text}</text></svg>`;

      if (request.query.format === "jpeg") {
        svg2img(svg, (error, buffer) => {
          if (!error) reply.type("image/jpeg").send(buffer);
          reply.code(500).send("Internal Server Error");
        });
      }

      reply.header("Content-Type", "image/svg+xml").send(svg.replace(/<!--(.*?)-->|\s\B/gm, "").trim());
    },
  );
}

export default routes;
