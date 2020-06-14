import React from "react";
import { StyleSheet, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import patterns from "./patterns.json";
import { Music } from "./music";
import Vex from "vexflow";

type Note = string;
type Pattern = { name: string; pattern: number[]; roots: Note[] };

export default function App() {
  const [scale, setScale] = React.useState<Pattern | null>(null);
  const [root, setRoot] = React.useState<Note | null>(null);
  const patternPicker = (
    <RNPickerSelect
      placeholder={{
        label: "Select a scale type...",
        value: null
      }}
      onValueChange={(_, i) => setScale(patterns[i - 1])}
      items={patterns.map((p: Pattern) => {
        return {
          label: p.name,
          value: p.name
        };
      })}
    />
  );
  const rootPicker =
    scale && scale.roots ? (
      <RNPickerSelect
        placeholder={{
          label: "Select a scale root...",
          value: null
        }}
        onValueChange={setRoot}
        items={scale.roots.map(note => ({ label: note, value: note }))}
      />
    ) : null;
  const sheetmusic = () => {
    if (scale && root) {
      const music = new Vex.Flow.Music();
      let keyValue: number = music.getNoteValue(root);
      const notes: string[] = music
        // @ts-ignore
        .getScaleTones(keyValue, scale.pattern)
        .map((v: number) => music.getCanonicalNoteName(v));
      return new Music(notes, styles.svg).render();
    }
  };
  let message = sheetmusic();
  return (
    <View style={styles.container}>
      {patternPicker}
      {rootPicker}
      {message}
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
