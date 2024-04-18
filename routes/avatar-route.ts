import svg2img from "svg2img";
import type { FastifyRequest, FastifyReply, FastifyInstance, FastifyPluginOptions } from "fastify";

interface IColor {
  name: string;
  background: string;
  foreground: string;
}

interface IQuerystring {
  color: string;
  name: string;
  letterCount: number;
  size: number;
  shape: "circle" | "square";
  lowercase: boolean;
  format: "svg" | "jpeg";
}

const colors: IColor[] = await Bun.file("colors.json").json();

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

        const randomIndex: number =
          request.query.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        const randomColor: IColor = colors.at(Math.round(randomIndex))!;
        request.query.color = !request.query.color ? randomColor.name : request.query.color;
        done();
      },
      preParsing: (request: FastifyRequest<{ Querystring: IQuerystring }>, _reply: FastifyReply, payload, done) => {
        const letterCount: number = request.query.letterCount
          ? Number(request.query.letterCount.toString().replace(/["]+/g, ""))
          : 2;

        request.query.size = 300;
        request.query.lowercase = request.query.lowercase || false;
        request.query.shape = request.query.shape ? (request.query.shape.replace(/['"]+/g, "") as "circle" | "square") : "square";
        request.query.letterCount = isNaN(letterCount) ? 2 : letterCount;

        done(null, payload);
      },
    },
    async (request: FastifyRequest<{ Querystring: IQuerystring }>, reply: FastifyReply) => {
      const { size, shape, name, letterCount, lowercase } = request.query;
      const letters = name
        .split(" ")
        .map((value) => value.replace('"', "").at(0))
        .slice(0, letterCount);
      const color: IColor = colors.find((color) => color.name === request.query.color)!;
      const text = letters.toLocaleString().replace(",", "");
      const circle = `<circle r="${size / 2 - 1}" cx="${size / 2}" cy="${size / 2}" fill="${color?.background}" stroke="${color?.background}" />`;
      const square = `<rect x="0" y="0" width="${size}" height="${size}" fill="${color?.background}"/>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shape === "circle" ? circle : square}<text x="${size / 2}" y="${size / 2}" fill="${color?.foreground}" font-size="${size / 2 - 10}" font-weight="bold" font-family="Rubik, sans-serif" text-anchor="middle" alignment-baseline="central">${lowercase ? text.toLowerCase() : text.toUpperCase()}</text></svg>`;

      if (request.query.format === "jpeg") {
        svg2img(svg, (error, buffer) => {
          if (!error) return reply.type("image/jpeg").send(buffer);
          else reply.code(500).send("Internal Server Error");
        });
      } else {
        reply.header("Content-Type", "image/svg+xml").send(svg.replace(/<!--(.*?)-->|\s\B/gm, "").trim());
      }
    },
  );
}

export default routes;
