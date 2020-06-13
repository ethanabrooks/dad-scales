import React from "react";
import { Button, Picker, StyleSheet, Text, View } from "react-native";
import { List } from "immutable";
import patterns from "./patterns.json";
import { ajv, schema } from "./schema";
import Vex from "vexflow";
import { Music } from "./music";

type Note = string;
type Pattern = { name: string; pattern: number[]; roots: Note[] };
type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "selectPattern";
      pattern: Pattern;
      patterns: Pattern[];
    }
  | {
      type: "selectRoot";
      pattern: Pattern;
      patterns: Pattern[];
      root: Note;
    }
  | {
      type: "display";
      pattern: Pattern;
      patterns: Pattern[];
      root: Note;
      notes: Note[];
    };

export default function App() {
  const [state, setState] = React.useState<State>({ type: "loading" });

  React.useEffect(() => {
    let validate = ajv.compile(schema);
    const valid = validate(patterns);
    if (!valid) {
      setState({
        type: "error",
        message: ajv.errorsText(validate.errors)
      });
    } else {
      const firstPattern: null | Pattern = List(patterns).first(null);
      if (!firstPattern) {
        setState({ type: "error", message: "patterns were empty" });
      } else {
        setState({
          type: "selectPattern",
          patterns: patterns,
          pattern: firstPattern
        });
      }
    }
  }, []);

  const errorScreen = (message: string) => (
    <View style={styles.error}>
      <Text style={{ fontWeight: "bold" }}>Error!</Text>
      <Text>🙀</Text>
      <Text style={{ textAlign: "center" }}>{message}</Text>
    </View>
  );

  switch (state.type) {
    case "loading":
      return <Text style={styles.container}>Loading…</Text>;
    case "error":
      return errorScreen(state.message);
    case "selectPattern":
      const root = List(state.pattern.roots).first(null);
      if (!root) {
        return errorScreen("roots were empty");
      } else {
        return (
          <View style={styles.container}>
            <Picker
              selectedValue={state.pattern}
              style={styles.picker}
              onValueChange={value =>
                setState({
                  ...state,
                  pattern: value
                })
              }
            >
              {state.patterns.map((p: Pattern) => (
                <Picker.Item label={p.name} value={p} key={p.name} />
              ))}
            </Picker>
            {
              <Button
                title="Select Scale"
                onPress={() =>
                  setState({
                    ...state,
                    type: "selectRoot",
                    root: root
                  })
                }
              />
            }
          </View>
        );
      }
    case "selectRoot":
      const music = new Vex.Flow.Music();
      const scaleTones: number[] = music.getScaleTones(
        // @ts-ignore
        music.getNoteValue(state.root),
        state.pattern.pattern
      );
      const notes = scaleTones.map(t => music.getCanonicalNoteName(t));
      return (
        <View style={styles.container}>
          <Picker
            selectedValue={state.root}
            style={styles.picker}
            onValueChange={value => setState({ ...state, root: value })}
          >
            {state.pattern.roots.map(note => (
              <Picker.Item label={note} value={note} key={note} />
            ))}
          </Picker>
          <View style={styles.buttons}>
            <Button
              title="Select Scale"
              onPress={() =>
                setState({
                  ...state,
                  type: "display",
                  notes: notes
                })
              }
            />
            <Button
              title="Back"
              onPress={() =>
                setState({
                  ...state,
                  type: "selectPattern"
                })
              }
            />
          </View>
        </View>
      );
    case "display":
      return (
        <View>
          {new Music(state.notes, styles.svg).render()}
          <Button
            title="Back"
            onPress={() =>
              setState({
                ...state,
                type: "selectRoot"
              })
            }
          />
        </View>
      );
  }
}

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
  buttons: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  error: { flex: 1, justifyContent: "center", alignItems: "center" },
  svg: {
    height: 400,
    width: 400,
    justifyContent: "center",
    alignItems: "center"
  }
});
