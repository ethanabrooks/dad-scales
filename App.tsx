import React from "react";
import { Picker, StyleSheet, View } from "react-native";
import rawPatterns from "./patterns.json";
import { Music } from "./music";
import { Note, NUM_TONES } from "./note";

type Pattern = { name: string; pattern: number[]; roots: Note[] };

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export default function App() {
  const [scale, setScale] = React.useState<Pattern | null>(null);
  const [root, setRoot] = React.useState<Note | null>(null);
  const patterns: Pattern[] = rawPatterns.map(({ roots, ...pattern }) => ({
    roots: roots.map(note => Note.fromString(note)).filter(notEmpty),
    ...pattern
  }));
  console.log("scale", scale);
  const patternPicker = (
    <Picker
      style={styles.picker}
      onValueChange={(_, i) => setScale(patterns[i - 1])}
      selectedValue={scale ? scale.name : "Select scale"}
    >
      {patterns.map((p: Pattern, i: number) => (
        <Picker.Item label={p.name} value={p.name} key={p.name} />
      ))}
    </Picker>
  );
  const rootPicker = () => {
    if (scale && scale.roots) {
      return (
        <Picker
          onValueChange={i => setRoot(scale.roots[i])}
          selectedValue={root}
          style={styles.picker}
        >
          {scale.roots
            .map(n => n.unicodeString())
            .map((label, i) =>
              label ? <Picker.Item label={label} value={i} key={i} /> : null
            )
            .filter(notEmpty)}
        </Picker>
      );
    }
  };
  const sheetmusic = () => {
    if (scale && root) {
      const cumSum = (
        { acc, prev }: { acc: number[]; prev: number },
        curr: number
      ) => {
        const sum: number = prev + curr;
        return { acc: acc.concat(sum % NUM_TONES), prev: sum };
      };
      const notes: Note[] = scale.pattern
        .reduce(cumSum, { acc: [root.getIndex()], prev: root.getIndex() })
        .acc.map(v => new Note(v, root.sharp));
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
  // {patternPicker}
  // {rootPicker()}
  // <View style={styles.music}>{sheetmusic()}</View>
  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: "gray", ...styles.pickers }}>
        <View style={{ backgroundColor: "blue", ...styles.picker }} />
        <View style={{ backgroundColor: "red", ...styles.picker }} />
      </View>
      <View style={{ backgroundColor: "green", ...styles.music }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center"
  },
  picker: {
    height: "20%"
  },
  pickers: {
    justifyContent: "space-evenly",
    flex: 3,
    width: "100%"
  },
  music: {
    flex: 1,
    width: "100%"
  },
  svg: {
    position: "absolute",
    width: "100%"
  }
});
