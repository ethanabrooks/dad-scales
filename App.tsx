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
    <View style={styles.picker}>
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
    </View>
  );
  const rootPicker = () => {
    if (scale && scale.roots) {
      const items = scale.roots
        .map(n => n.unicodeString())
        .map((label, i) => (label ? { label: label, value: i } : null))
        .filter(notEmpty);
      return (
        <View style={styles.picker}>
          <RNPickerSelect
            placeholder={{
              label: "Select a scale root...",
              value: null
            }}
            onValueChange={i => setRoot(scale.roots[i])}
            items={items}
          />
        </View>
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
      const notes: Note[] = noteIndices.map(
        (v: number) => new Note(v, root.sharp)
      );
      return new Music(notes, styles.svg).render();
    }
  };
  const Square = () => {
    const sqStyle = {
      width: 50,
      height: 50,
      backgroundColor: "black"
    };
    return <View style={sqStyle} />;
  };
  return (
    <View style={styles.container}>
      <View style={styles.pickers}>
        {patternPicker}
        {rootPicker()}
      </View>
      <View style={styles.music}>{sheetmusic()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    top: "30%",
    alignItems: "center"
  },
  picker: {
    height: 100
  },
  pickers: {
    flex: 1,
    height: 200,
    justifyContent: "space-around"
  },
  music: {
    position: "relative",
    top: "50%",
    width: "95%"
  },
  svg: {
    position: "absolute",
    width: "100%"
  }
});
