import Vex from "vexflow";
import { List, Map, Seq } from "immutable";
import { notes } from "./notes";

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

const noteValues: List<string> = List(notes).flatMap(({ sharp, flat }) => [
  sharp,
  flat
]);
ajv.addKeyword("isNoteValue", {
  type: "string",
  validate: (schema: boolean, data: unknown) => {
    if (schema && typeof data === "string") {
      const match = data.match(/([a-z])\(?([b#])\)?/);
      return match && noteValues.contains(match.slice(1, 3).join(""));
    } else {
      return false;
    }
  },
  errors: true
});
