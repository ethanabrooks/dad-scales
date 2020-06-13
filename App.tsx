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

type Note = string;
type PatternData = { name: string; pattern: number[]; roots: Note[] };
type Root = number;
type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "selectPattern";
      patterns: PatternData[];
      firstPattern: PatternData;
    }
  | { type: "selectRoot"; pattern: PatternData }
  | { type: "display"; notes: Note[] };

export default function App() {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [pattern, setPattern] = React.useState<PatternData | null>(null);
  const [root, setRoot] = React.useState<string | null>(null);

  React.useEffect(() => {
    let validate = ajv.compile(schema);
    const valid = validate(patterns);
    if (!valid) {
      setState({
        type: "error",
        message: ajv.errorsText(validate.errors)
      });
    } else {
      const firstPattern: null | PatternData = List(patterns).first(null);
      if (!firstPattern) {
        setState({ type: "error", message: "patterns were empty" });
      } else {
        setState({
          type: "selectPattern",
          patterns: patterns,
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
            onValueChange={value => setPattern(value)}
          >
            {state.patterns.map((p: PatternData) => (
              <Picker.Item label={p.name} value={p} key={p.name} />
            ))}
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
      const music = new Vex.Flow.Music();
      let keyValue = music.getNoteValue(
        root || List(state.pattern.roots).first()
      );
      const scaleTones: number[] = music.getScaleTones(
        // @ts-ignore
        keyValue,
        state.pattern.pattern
      );
      const notes = scaleTones.map(t => music.getCanonicalNoteName(t));
      return (
        <View style={styles.container}>
          <Picker
            selectedValue={root}
            style={styles.picker}
            onValueChange={setRoot}
          >
            {state.pattern.roots.map(note => (
              <Picker.Item label={note} value={note} key={note} />
            ))}
          </Picker>
          {
            <Button
              title="Select Scale"
              onPress={() =>
                setState({
                  type: "display",
                  notes: notes
                })
              }
            />
          }
        </View>
      );
    case "display":
      const _notes = state.notes.map((note: Note) =>
        new Vex.Flow.StaveNote({
          clef: "treble",
          keys: [`${note}/5`],
          duration: "q"
        }).getKeys()
      );
      const context = new ReactNativeSVGContext(NotoFontPack, styles.svg);
      const stave: Vex.Flow.Stave = new Vex.Flow.Stave(0, 0, 200);
      const voice = new Vex.Flow.Voice({ num_beats: 4, beat_value: 4 });
      // voice.addTickables(_notes);
      stave.setContext(context);
      // @ts-ignore
      stave.setClef("treble");
      // @ts-ignore
      stave.setTimeSignature("4/4");
      stave.draw();

      return (
        <View>
          {context.render()}
          <Text>{`${_notes}`}</Text>
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
  error: { flex: 1, justifyContent: "center", alignItems: "center" },
  svg: {
    height: 400,
    width: 400,
    justifyContent: "center",
    alignItems: "center"
  }
});
