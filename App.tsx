import React from "react";
import { Picker, StyleSheet, Text, View } from "react-native";
import rawPatterns from "./patterns.json";
import { Note, NUM_TONES } from "./note";
import { Map, Seq } from "immutable";
import * as O from "fp-ts/lib/Option";
import { none, Option, some } from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { Music } from "./music";
import { MakeResult, Result } from "./result";
import * as R from "./result";

type Scale = { pattern: number[]; roots: Map<string, Note> };

function first<T>(seq: Seq.Indexed<T>): Result<T> {
  return pipe(
    O.fromNullable(seq.first(null)),
    MakeResult.fromOption("Sequence was empty.")
  );
}

function modCumSum(
  { acc, prev }: { acc: number[]; prev: number },
  curr: number
) {
  const sum: number = prev + curr;
  return { acc: acc.concat(sum % NUM_TONES), prev: sum };
}

export default function App() {
  const [scale, setScale] = React.useState<Option<string>>(none);
  const [root, setRoot] = React.useState<Option<string>>(none);
  let sequence = A.array.sequence(E.either);
  let scalePairs: Result<[string, Scale]>[] = rawPatterns.map(
    ({ name, pattern, roots }): Result<[string, Scale]> => {
      let pairs: Result<[string, Note]>[] = roots.map(
        (root: string): Result<[string, Note]> => {
          return Do(E.either)
            .bind("note", Note.fromString(root))
            .bindL("unicodeString", ({ note }) => note.unicodeString())
            .return(({ note, unicodeString }) => [unicodeString, note]);
        }
      );
      return Do(E.either)
        .bind("pairs", sequence(pairs))
        .return(({ pairs }) => [name, { pattern, roots: Map(pairs) }]);
    }
  );
  let scaleMap: Result<Map<string, Scale>> = Do(E.either)
    .bind("ppairs", sequence(scalePairs))
    .return(({ ppairs }) => Map(ppairs));

  const scalePicker: Result<JSX.Element> = Do(E.either)
    .bind("scaleMap", scaleMap)
    .bindL("firstScale", ({ scaleMap }) => first(scaleMap.keySeq()))
    .return(
      ({
        scaleMap,
        firstScale
      }: {
        scaleMap: Map<string, Scale>;
        firstScale: string;
      }) => (
        <Picker
          style={styles.picker}
          selectedValue={firstScale}
          onValueChange={v => setScale(v)}
        >
          {scaleMap
            .keySeq()
            .toArray()
            .map((s, i) => (
              <Picker.Item label={s} value={s} key={s} />
            ))}
        </Picker>
      )
    );

  const rootPicker: Result<JSX.Element> = pipe(
    scale,
    O.fold(
      () => E.right(<View style={styles.picker} />),
      (scaleKey: string) =>
        Do(E.either)
          .bind("scaleMap", scaleMap)
          .bindL("scaleValue", ({ scaleMap }) => R.lookup(scaleKey, scaleMap))
          .bindL("firstRoot", ({ scaleValue }) =>
            first(scaleValue.roots.keySeq())
          )
          .return(({ firstRoot, scaleValue }) => (
            <Picker
              style={styles.picker}
              selectedValue={firstRoot}
              onValueChange={i => setRoot(i)}
            >
              {scaleValue.roots
                .keySeq()
                .toArray()
                .map(
                  (s: string): JSX.Element => (
                    <Picker.Item label={s} value={s} key={s} />
                  )
                )}
            </Picker>
          ))
    )
  );
  const sheetMusic: Result<JSX.Element | null> = pipe(
    scale,
    O.fold(
      () => E.right(null),
      (scaleKey: string) =>
        Do(E.either)
          .bind("scaleMap", scaleMap)
          .bindL("scaleValue", ({ scaleMap }) => R.lookup(scaleKey, scaleMap))
          .bind(
            "rootKey",
            pipe(
              root,
              MakeResult.fromOption<string>(
                "Somehow, root was none when scale was not none."
              )
            )
          )
          .bindL("rootValue", ({ rootKey, scaleValue }) =>
            R.lookup(rootKey, scaleValue.roots)
          )
          .letL("rootIndex", ({ rootValue }) => rootValue.getIndex())
          .letL("notes", ({ scaleValue, rootIndex, rootValue }) =>
            scaleValue.pattern
              .reduce(modCumSum, { acc: [rootIndex], prev: rootIndex })
              .acc.map(v => new Note(v, rootValue.sharp))
          )
          .return(({ notes }) => new Music(notes, styles.svg).render())
    )
  );
  return pipe(
    Do(E.either)
      .bind("scalePicker", scalePicker)
      .bind("rootPicker", rootPicker)
      .bind("sheetMusic", sheetMusic)
      .return(({ scalePicker, rootPicker, sheetMusic }) => (
        <View style={styles.container}>
          <View style={styles.pickers}>
            {scalePicker}
            {rootPicker}
          </View>
          <View style={styles.music}>{sheetMusic}</View>
        </View>
      )),
    E.getOrElse((e: string) => (
      <View style={styles.error}>
        <Text style={{ fontWeight: "bold" }}>Error!</Text>
        <Text>🙀</Text>
        <Text style={{ textAlign: "center" }}>{e}</Text>
      </View>
    ))
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center"
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
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
