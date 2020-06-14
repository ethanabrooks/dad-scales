import React from "react";
import { StyleSheet, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import rawPatterns from "./patterns.json";
import { Music } from "./music";
import Vex from "vexflow";
import { Note, NUM_TONES } from "./note";

type RawPattern = { name: string; pattern: number[]; roots: string[] };
type Pattern = { name: string; pattern: number[]; roots: Note[] };

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export default function App() {
  const [scale, setScale] = React.useState<Pattern | null>(null);
  const [root, setRoot] = React.useState<Note | null>(null);
  const patterns: Pattern[] = rawPatterns.map(({ roots, ...pattern }) => ({
    roots: roots.map(note => Note.fromString(note)).filter(notEmpty),
    ...pattern
  }));
  const patternPicker = (
    <RNPickerSelect
      placeholder={{
        label: "Select a scale type...",
        value: null
      }}
      onValueChange={(_, i) => setScale(patterns[i - 1])}
      items={rawPatterns.map((p: RawPattern) => ({
        label: p.name,
        value: p.name
      }))}
    />
  );
  const rootPicker = () => {
    if (scale && scale.roots) {
      const items = scale.roots
        .map(n => n.unicodeString())
        .map((label, i) => (label ? { label: label, value: i } : null))
        .filter(notEmpty);
      return (
        <RNPickerSelect
          placeholder={{
            label: "Select a scale root...",
            value: null
          }}
          onValueChange={i => setRoot(scale.roots[i])}
          items={items}
        />
      );
    }
  };
  const sheetmusic = () => {
    if (scale && root) {
      const keyValue: number = root.getIndex();
      const noteIndices = scale.pattern.reduce(
        ({ acc, prev }, curr) => {
          let sum: number = prev + curr;
          return { acc: acc.concat(sum % NUM_TONES), prev: sum };
        },
        { acc: [keyValue], prev: keyValue }
      ).acc;
      console.log(noteIndices);
      const notes: Note[] = noteIndices.map(
        (v: number) => new Note(v, root.sharp)
      );
      console.log(notes);
      console.log(notes.map(n => n.asciiString()));
      return new Music(notes, styles.svg).render();
    }
  };
  return (
    <View style={styles.container}>
      {patternPicker}
      {rootPicker()}
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
