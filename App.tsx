import React from "react";
import { Button, Picker, StyleSheet, Text, View } from "react-native";
import { List, Range } from "immutable";
import patterns from "./patterns.json";
import { ajv, schema } from "./schema";
import Vex from "vexflow";
import {
  NotoFontPack,
  ReactNativeSVGContext
  // @ts-ignore
} from "standalone-vexflow-context";

type Note = string;
type ScaleData = { name: string; pattern: number[]; roots: Note[] };
type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "selectPattern";
      patterns: ScaleData[];
      firstPattern: ScaleData;
    }
  | {
      type: "selectRoot";
      pattern: ScaleData;
      patterns: ScaleData[];
      firstPattern: ScaleData;
    }
  | {
      type: "display";
      notes: Note[];
      pattern: ScaleData;
      patterns: ScaleData[];
      firstPattern: ScaleData;
    };

export default function App() {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [pattern, setPattern] = React.useState<ScaleData | null>(null);
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
      const firstPattern: null | ScaleData = List(patterns).first(null);
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
            {state.patterns.map((p: ScaleData) => (
              <Picker.Item label={p.name} value={p} key={p.name} />
            ))}
          </Picker>
          <Button
            title="Select Scale"
            onPress={() =>
              setState({
                ...state,
                type: "selectRoot",
                pattern: pattern || state.firstPattern
              })
            }
          />
        </View>
      );
    case "selectRoot":
      const music = new Vex.Flow.Music();
      let key: number = music.getNoteValue(
        root || List(state.pattern.roots).first()
      );
      const scaleTones: number[] = music.getScaleTones(
        // @ts-ignore
        key,
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
      const length = state.notes.length;
      const numNotes = Range(0, Infinity)
        .map(n => Math.pow(2, n))
        .filter(n => n > length)
        .first(null);
      if (!numNotes) {
        setState({ type: "error", message: "Mis-computed numNotes." });
      } else {
        const context = new ReactNativeSVGContext(NotoFontPack, styles.svg);
        const scale = state.notes
          .map((note: Note) => {
            let staveNote = new Vex.Flow.StaveNote({
              clef: "treble",
              keys: [`${note}/4`],
              duration: `${numNotes}`
            });
            let accidental = note[1];
            return "#b".includes(accidental)
              ? staveNote.addAccidental(0, new Vex.Flow.Accidental(accidental))
              : staveNote;
          })
          .concat(
            Array(numNotes - state.notes.length).fill(
              new Vex.Flow.StaveNote({
                clef: "treble",
                keys: ["bb/4"],
                duration: `${numNotes}r`
              })
            )
          );

        const stave: Vex.Flow.Stave = new Vex.Flow.Stave(0, 0, 300);
        stave.setContext(context);
        // @ts-ignore
        stave.setClef("treble");
        // @ts-ignore
        stave.setTimeSignature(`4/4`);
        stave.draw();
        const beams = Vex.Flow.Beam.generateBeams(scale);
        Vex.Flow.Formatter.FormatAndDraw(context, stave, scale);
        beams.forEach(function(b) {
          b.setContext(context).draw();
        });

        return (
          <View>
            {context.render()}
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
