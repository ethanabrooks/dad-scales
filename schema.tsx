import Vex from "vexflow";
import { Map, Seq } from "immutable";

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

const noteValues: Seq.Indexed<string> = Map(Vex.Flow.Music.noteValues).keySeq();
ajv.addKeyword("isNoteValue", {
  type: "string",
  validate: (schema: boolean, data: unknown) =>
    schema && typeof data === "string" && noteValues.includes(data),
  errors: true
});
ajv.addKeyword("matches", {
  type: "string",
  validate: function(schema: unknown, data: unknown) {
    return (
      typeof schema === "string" &&
      typeof data === "string" &&
      data.match(schema)
    );
  },
  errors: true
});
