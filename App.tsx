import React, { ReactPortal } from "react";
import { Picker, StyleSheet, Text, View } from "react-native";
import rawScales from "./scale.json";
import { Note, NUM_TONES } from "./note";
import { Map, Seq } from "immutable";
import * as O from "fp-ts/lib/Option";
import { Option, some } from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { Music } from "./music";
import * as R from "./result";
import { MakeResult, Result } from "./result";
import { ajv, schema } from "./schema";

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
  const [scale, setScale] = React.useState<Option<string>>(O.none);
  const [root, setRoot] = React.useState<Option<string>>(O.none);
  const sequence = A.array.sequence(E.either);
  const scaleMap: Result<Map<string, Scale>> = React.useMemo(
    () =>
      Do(E.either)
        .bind(
          "errorsText",
          E.tryCatch(
            () => {
              let validate = ajv.compile(schema);
              const valid = validate(rawScales);
              return valid
                ? E.right(null)
                : E.left(ajv.errorsText(validate.errors));
            },
            e => `validate threw an error`
          )
        )
        .let(
          "scalePairs",
          rawScales.map(
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
          )
        )
        .bindL("filtered", ({ scalePairs }) => sequence(scalePairs))
        .return(({ filtered }) => Map(filtered)),
    [rawScales]
  );

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
          selectedValue={pipe(
            scale,
            O.getOrElse(() => firstScale)
          )}
          onValueChange={s => setScale(some(s))}
        >
          {scaleMap
            .keySeq()
            .toArray()
            .map(s => (
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
              style={{ backgroundColor: "white", ...styles.picker }}
              selectedValue={pipe(
                root,
                O.getOrElse(() => firstRoot)
              )}
              onValueChange={r => setRoot(some(r))}
            >
              {scaleValue.roots
                .keySeq()
                .toArray()
                .map(
                  (r: string): JSX.Element => (
                    <Picker.Item label={r} value={r} key={r} />
                  )
                )}
            </Picker>
          ))
    )
  );
  const sheetMusic: Result<ReactPortal | null> = pipe(
    root,
    O.fold(
      () => E.right(null),
      (rootKey: string): Result<ReactPortal | null> =>
        Do(E.either)
          .bind("scaleMap", scaleMap)
          .bind(
            "scaleKey",
            pipe(
              scale,
              MakeResult.fromOption<string>(
                `Somehow, scale was none when root was ${root}.`
              )
            )
          )
          .bindL("scaleValue", ({ scaleKey, scaleMap }) =>
            R.lookup(scaleKey, scaleMap)
          )
          .bindL("rootValue", ({ scaleValue }) =>
            R.lookup(rootKey, scaleValue.roots)
          )
          .letL("rootIndex", ({ rootValue }) => rootValue.getIndex())
          .letL("notes", ({ scaleValue, rootIndex, rootValue }) =>
            scaleValue.pattern
              .reduce(modCumSum, { acc: [rootIndex], prev: rootIndex })
              .acc.map(v => new Note(v, rootValue.sharp))
          )
          .bindL("reactPortal", ({ notes }) => {
            return Music.getContext(notes, styles.svg);
          })
          .return(({ reactPortal }) => reactPortal)
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
    flex: 1 + Math.sqrt(5),
    width: "100%"
  },
  music: {
    flex: 2,
    width: "95%"
  },
  svg: {}
});
