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
  const patternPicker = (
    <View style={styles.picker}>
      <Picker onValueChange={(_, i) => setScale(patterns[i - 1])}>
        {patterns.map((p: Pattern, i: number) => (
          <Picker.Item label={p.name} value={i} key={i} />
        ))}
      </Picker>
    </View>
  );
  const rootPicker = () => {
    if (scale && scale.roots) {
      return (
        <View style={styles.picker}>
          <Picker onValueChange={i => setRoot(scale.roots[i])}>
            {scale.roots
              .map(n => n.unicodeString())
              .map((label, i) =>
                label ? <Picker.Item label={label} value={i} key={i} /> : null
              )
              .filter(notEmpty)}
          </Picker>
        </View>
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
    top: "5%",
    alignItems: "center"
  },
  picker: {
    height: 50
  },
  pickers: {
    flex: 1,
    paddingVertical: 5,
    width: "100%"
  },
  music: {
    position: "relative",
    top: "40%",
    width: "95%"
  },
  svg: {
    position: "absolute",
    width: "100%"
  }
});
