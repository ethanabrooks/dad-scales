import { toneStrings } from "./note";
import { Do } from "fp-ts-contrib/lib/Do";
import * as A from "fp-ts/lib/Array";

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
        items: { type: "string", exclusiveMinimum: 0, isNoteValue: true },
        required: ["name", "pattern", "roots"]
      }
    }
  }
};

const noteValues: string[] = Do(A.array)
  .bind("a", toneStrings)
  .bindL("b", ({ a }) => [a.sharp, a.flat])
  .return(({ b }) => b);

ajv.addKeyword("isNoteValue", {
  type: "string",
  validate: (schema: boolean, data: unknown) => {
    if (schema && typeof data === "string") {
      const match1 = data.match(/([a-z])\(?[b#]?\)?/);
      const match2 = data.match(/([a-zb#]*)/);
      return match1 && match2 && noteValues.includes(match2[0]);
    } else {
      return false;
    }
  },
  errors: true
});
