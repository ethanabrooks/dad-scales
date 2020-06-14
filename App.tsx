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
  const [scaleIndex, setScaleIndex] = React.useState<number>(0);
  const [rootIndex, setRootIndex] = React.useState<number | null>(null);
  const patterns: Pattern[] = rawPatterns.map(({ roots, ...pattern }) => ({
    roots: roots.map(note => Note.fromString(note)).filter(notEmpty),
    ...pattern
  }));
  const patternPicker = (
    <Picker
      style={styles.picker}
      selectedValue={scaleIndex}
      onValueChange={v => setScaleIndex(v)}
    >
      {patterns.map((p: Pattern, i: number) => (
        <Picker.Item label={p.name} value={i} key={i} />
      ))}
    </Picker>
  );
  const scale = patterns[scaleIndex];
  const rootPicker = () => {
    return scale && scale.roots ? (
      <Picker
        style={styles.picker}
        selectedValue={rootIndex}
        onValueChange={i => setRootIndex(i)}
      >
        {scale.roots
          .map(n => n.unicodeString())
          .map((label, i) =>
            label ? <Picker.Item label={label} value={i} key={i} /> : null
          )
          .filter(notEmpty)}
      </Picker>
    ) : (
      <View style={styles.picker} />
    );
  };
  const sheetmusic = () => {
    if (rootIndex !== null) {
      const root = scale.roots[rootIndex];
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
    flex: 1,
    paddingTop: 40,
    alignItems: "center"
  },
  picker: {
    height: "50%"
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
