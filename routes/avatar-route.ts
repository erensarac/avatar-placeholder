import { Resvg } from "@resvg/resvg-js";
import type { FastifyRequest, FastifyReply, FastifyInstance, FastifyPluginOptions } from "fastify";
import type { Color } from "@/types/color";
import generateColor from "@/utils/generate-color";
import getLetters from "@/utils/get-letters";
import transformCase from "@/utils/transform-case";

type IAvatarShape = "circle" | "square";
type IAvatarFormat = "svg" | "jpeg";
type IFontFamily = "Rubik" | "Inter";
type IFontWeight = "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

interface IQuerystring {
  color: string;
  name: string;
  letterCount: number;
  size: number;
  shape: IAvatarShape;
  lowercase: boolean;
  format: IAvatarFormat;
  fontFamily: IFontFamily;
  fontWeight: IFontWeight;
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
      fontFamily: {
        type: "string",
        enum: ["Rubik", "Inter"],
        default: "Rubik",
      },
      fontWeight: {
        type: "number",
        enum: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        default: 500,
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

      const fontFamily: "Rubik" | "Inter" = request.query.fontFamily || "Rubik";
      const fontWeight: IFontWeight = request.query.fontWeight || 500;

      const circle = `<circle r="${size / 2 - 1}" cx="${size / 2}" cy="${size / 2}" fill="${generatedColor.background}" stroke="${generatedColor.background}" />`;
      const square = `<rect x="0" y="0" width="${size}" height="${size}" fill="${generatedColor.background}"/>`;
      const style = `<style>@font-face{font-family: "Inter";src:url("./public/fonts/Inter/Inter-VariableFont_slnt,wght.ttf")}@font-face{font-family:"Rubik";src:url("./public/fonts/Rubik/Rubik-VariableFont_wght.ttf")}</style>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shape === "circle" ? circle : square}${style}<text x="${size / 2}" y="${size / 2}" fill="${generatedColor.foreground}" font-size="${size / 2 - 10}" font-weight="${fontWeight}" font-family="${fontFamily}, sans-serif" text-anchor="middle" alignment-baseline="central">${text}</text></svg>`;

      if (request.query.format === "jpeg") {
        const resvg = new Resvg(svg, {
          font: {
            fontFiles: [
              "./public/fonts/Inter/static/Inter-Black.ttf",
              "./public/fonts/Inter/static/Inter-Bold.ttf",
              "./public/fonts/Inter/static/Inter-ExtraBold.ttf",
              "./public/fonts/Inter/static/Inter-ExtraLight.ttf",
              "./public/fonts/Inter/static/Inter-Light.ttf",
              "./public/fonts/Inter/static/Inter-Medium.ttf",
              "./public/fonts/Inter/static/Inter-Regular.ttf",
              "./public/fonts/Inter/static/Inter-SemiBold.ttf",
              "./public/fonts/Inter/static/Inter-Thin.ttf",
              "./public/fonts/Rubik/static/Rubik-Black.ttf",
              "./public/fonts/Rubik/static/Rubik-Bold.ttf",
              "./public/fonts/Rubik/static/Rubik-ExtraBold.ttf",
              "./public/fonts/Rubik/static/Rubik-Light.ttf",
              "./public/fonts/Rubik/static/Rubik-Medium.ttf",
              "./public/fonts/Rubik/static/Rubik-SemiBold.ttf",
            ],
            loadSystemFonts: false,
            defaultFontFamily: "Rubik",
          },
        });
        const data = resvg.render();
        const buffer = data.asPng();

        if (!buffer) reply.code(500).send("Internal Server Error");
        reply.type("image/jpeg").send(buffer);
      }

      reply.header("Content-Type", "image/svg+xml").send(svg.replace(/<!--(.*?)-->|\s\B/gm, "").trim());
    },
  );
}

export default routes;
