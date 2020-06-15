import { toneStrings } from "./note";
import { Do } from "fp-ts-contrib/lib/Do";
import * as A from "fp-ts/lib/Array";
import { boolean } from "fp-ts";

const Ajv = require("ajv");
export const ajv = new Ajv({ allErrors: true });
export const schema = {
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      pattern: {
        type: "array",
        minItems: 1,
        items: { type: "number", exclusiveMinimum: 0 }
      },
      roots: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            name: { type: "string", isNoteValue: true },
            sharp: { type: "boolean" },
            mp3: { type: ["string", "null"] }
          },
          required: ["name", "sharp", "mp3"]
        },
        required: ["name", "pattern", "roots"]
      }
    }
  }
};

const noteValues: string[] = Do(A.array)
  .bind("a", toneStrings)
  .bindL("b", ({ a: { sharp, flat } }) => [sharp, flat])
  .return(({ b }) => b);

ajv.addKeyword("isNoteValue", {
  type: "string",
  validate: (schema: boolean, data: unknown) => {
    if (schema && typeof data === "string") {
      return noteValues.includes(data);
    } else {
      return false;
    }
  },
  errors: true
});
