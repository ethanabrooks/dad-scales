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
        items: { type: "string", exclusiveMinimum: 0, matches: "^[A-G][#b]?$" },
        required: ["name", "pattern", "roots"]
      }
    }
  }
};
