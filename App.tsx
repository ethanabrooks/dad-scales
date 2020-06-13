import React from "react";
import { Button, Picker, StyleSheet, Text, View } from "react-native";
import { List } from "immutable";
import patterns from "./patterns.json";
import { ajv, schema } from "./schema";
import Vex from "vexflow";
import {
  NotoFontPack,
  ReactNativeSVGContext
} from "standalone-vexflow-context";

type Note = [string, "sharp" | "flat" | null];
type PatternData = { name: string; pattern: number[]; roots: Note[] };
type Root = number;
type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "selectPattern";
      patterns: List<PatternData>;
      firstPattern: PatternData;
    }
  | { type: "selectRoot"; pattern: PatternData }
  | { type: "display"; pattern: PatternData; root: Root };

export default function App() {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [pattern, setPattern] = React.useState<PatternData | null>(null);
  const [root, setRoot] = React.useState<string>("A");

  React.useEffect(() => {
    let validate = ajv.compile(schema);
    const valid = validate(patterns);
    if (!valid) {
      setState({
        type: "error",
        message: ajv.errorsText(validate.errors)
      });
    } else {
      const patternList: List<PatternData> = List(
        patterns.map(pattern => {
          return {
            ...pattern,
            roots: pattern.roots.map(
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
        })
      );
      const firstPattern: null | PatternData = patternList.first(null);
      if (!firstPattern) {
        setState({ type: "error", message: "patterns were empty" });
      } else {
        setState({
          type: "selectPattern",
          patterns: patternList,
          firstPattern: firstPattern
        });
      }
    }
  }, []);

  switch (state.type) {
    case "loading":
      return <Text style={styles.container}>Loading…</Text>;
    case "error":
      return (
        <View style={styles.error}>
          <Text style={{ fontWeight: "bold" }}>Error!</Text>
          <Text>🙀</Text>
          <Text style={{ textAlign: "center" }}>{state.message}</Text>
        </View>
      );

    case "selectPattern":
      return (
        <View style={styles.container}>
          <Picker
            selectedValue={state.firstPattern}
            style={styles.picker}
            onValueChange={(value, itemIndex) => setPattern(value)}
          >
            {state.patterns
              .map((p: PatternData) => (
                <Picker.Item label={p.name} value={p} key={p.name} />
              ))
              .toArray()}
          </Picker>
          <Button
            title="Select Scale"
            onPress={() =>
              setState({
                type: "selectRoot",
                pattern: pattern || state.firstPattern
              })
            }
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
              const noteName = () => {
                switch (note[1]) {
                  case "sharp":
                    return `${note[0]}♯`;
                  case "flat":
                    return `${note[0]}♭`;
                  default:
                    return note[0];
                }
              };
              return (
                <Picker.Item label={noteName()} value={note} key={noteName()} />
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
      const context = new ReactNativeSVGContext(NotoFontPack, {
        width: 400,
        height: 400
      });
      const stave = new Vex.Flow.Stave(100, 150, 200);
      stave.setContext(context);
      // @ts-ignore
      stave.setClef("treble");
      // @ts-ignore
      stave.setTimeSignature("4/4");
      stave.draw();

      return <View>{context.render()}</View>;
  }
}

const commonStyles = StyleSheet.create({
  full: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%"
  },
  cell: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center"
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around"
  },
  picker: {
    height: 150,
    width: 150
  },
  buttonStyle: {
    alignSelf: "center"
  },
  error: { flex: 1, justifyContent: "center", alignItems: "center" },
  examples: {
    ...commonStyles.full,
    padding: 5,
    paddingBottom: 0
  },
  example: {
    paddingBottom: 5,
    flex: 1,
    flexDirection: "row"
  },
  exampleLeft: {
    ...commonStyles.cell
  },
  exampleRight: {
    ...commonStyles.cell
  }
});
