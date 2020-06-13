import React from "react";
import { StyleSheet, View } from "react-native";
import patterns from "./patterns.json";
import Vex from "vexflow";
import { Music } from "./music";
import RNPickerSelect from "react-native-picker-select";

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
  const [pattern, setPattern] = React.useState<Pattern | null>(null);
  const [root, setRoot] = React.useState<Note | null>(null);
  let patternPicker = (
    <RNPickerSelect
      placeholder={{
        label: "Select a scale type...",
        value: null
      }}
      onValueChange={(_, i) => setPattern(patterns[i])}
      items={patterns.map((p: Pattern) => ({
        label: p.name,
        value: p
      }))}
    />
  );
  const rootPicker =
    pattern && pattern.roots ? (
      <RNPickerSelect
        placeholder={{
          label: "Select a scale root...",
          value: null
        }}
        onValueChange={(_, i) => setRoot(pattern.roots[i])}
        items={pattern.roots.map(note => ({ label: note, value: note }))}
      />
    ) : null;
  const sheetmusic = () => {
    if (pattern && root) {
      const music = new Vex.Flow.Music();
      const scaleTones: number[] = music.getScaleTones(
        // @ts-ignore
        music.getNoteValue(root),
        pattern
      );
      const notes = scaleTones.map(t => music.getCanonicalNoteName(t));
      return new Music(notes, styles.svg).render();
    }
  };
  return (
    <View style={styles.container}>
      {patternPicker}
      {rootPicker}
      {sheetmusic()}
    </View>
  );
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
