import React from "react";
import { Button, Picker, StyleSheet, Text, View } from "react-native";
import { Map } from "immutable";
import patterns from "./patterns.json";

const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
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
const schema = {
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

type RawPatternData = { pattern: number[]; roots: string[] };
type Note = [string, "sharp" | "flat" | null];
type PatternData = { pattern: number[]; roots: Note[] };
type Root = number;
type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "selectPattern";
      patterns: Map<string, PatternData>;
      firstPattern: PatternData;
    }
  | { type: "selectRoot"; pattern: PatternData }
  | { type: "display"; pattern: PatternData; root: Root };

export default function App() {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [pattern, setPattern] = React.useState<PatternData | null>(null);
  const [root, setRoot] = React.useState<string>("A");

  React.useEffect(() => {
    // ajv.compile(schema)(patterns);
    const rawScalePatterns: null | Map<string, RawPatternData> = Map(patterns);
    const patternMap: Map<string, PatternData> = rawScalePatterns.map(
      (raw, name) => {
        return {
          ...raw,
          roots: raw.roots.map(
            (r: string): Note => {
              switch (r[1]) {
                case "#":
                  return [r[0], "sharp"];
                case "b":
                  return [r[0], "flat"];
                default:
                  return [r[0], null];
              }
            }
          )
        };
      }
    );
    const firstPattern: null | PatternData = patternMap.valueSeq().first(null);
    if (!firstPattern) {
      setState({ type: "error", message: "patterns were empty" });
    } else {
      setState({
        type: "selectPattern",
        patterns: patternMap,
        firstPattern: firstPattern
      });
    }
  }, []);

  switch (state.type) {
    case "loading":
      return <Text>Loading…</Text>;
    case "error":
      return <Text>{state.message}</Text>;
    case "selectPattern":
      return (
        <View style={styles.container}>
          <Picker
            selectedValue={pattern}
            style={styles.picker}
            onValueChange={(value, itemIndex) => setPattern(value)}
          >
            {state.patterns
              .toSeq()
              .map((p, n) => <Picker.Item label={n} value={p} key={n} />)
              .valueSeq()
              .toArray()}
          </Picker>
          <Button
            title="Select Scale"
            onPress={() => setState({ type: "selectRoot", pattern: pattern })}
          />
        </View>
      );
    case "selectRoot":
      return (
        <View style={styles.container}>
          <Picker
            selectedValue={root}
            style={styles.picker}
            onValueChange={(value, itemIndex) => setRoot(value)}
          >
            {state.pattern.roots.map(note => {
              const noteName = `${note[0]}${note[1]}`;
              return (
                <Picker.Item label={noteName} value={note} key={noteName} />
              );
            })}
          </Picker>
          {
            <Button
              title="Select Scale"
              onPress={() =>
                setState({
                  type: "display",
                  pattern: state.pattern,
                  root: 0
                })
              }
            />
          }
        </View>
      );
    case "display":
      return <Text>wut</Text>;
    default:
      return <Text>{state.type}</Text>;
  }
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // alignItems: "center",
    // justifyContent: "space-around"
  },
  picker: {
    height: 150,
    width: 150
  },
  buttonStyle: {
    alignSelf: "center"
  }
});
