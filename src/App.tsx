import React, { ReactPortal } from "react";
import { Picker, StyleSheet, Text, View } from "react-native";
import rawScales from "../scales.json";
import { Note, NUM_TONES, Root } from "./note";
import { Map, Seq } from "immutable";
import * as O from "fp-ts/lib/Option";
import { Option, some } from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { Clef, Music } from "./music";
import * as TE from "fp-ts/lib/TaskEither";
import * as R from "./result";
import { MakeResult, Result } from "./result";
import * as T from "./tresult";
import { ajv, schema } from "./schema";
import { task, Task } from "fp-ts/lib/Task";

type Scale = { pattern: number[]; roots: Map<string, Root> };

function modCumSum(
  { acc, prev }: { acc: number[]; prev: number },
  curr: number
) {
  const sum: number = prev + curr;
  return { acc: acc.concat(sum % NUM_TONES), prev: sum };
}

export function first<T>(seq: Seq.Indexed<T>): Result<T> {
  return pipe(
    O.fromNullable(seq.first(null)),
    MakeResult.fromOption("Sequence was empty")
  );
}

type State = { type: "loading" } | { type: "loaded"; dom: JSX.Element };

export default function App(): JSX.Element {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [clef, setClef] = React.useState<Clef>("treble");
  const [scale, setScale] = React.useState<Option<string>>(O.some("major"));
  const [root, setRoot] = React.useState<Option<string>>(O.some("c"));
  const [play, setPlay] = React.useState<boolean>(false);
  const sequence = A.array.sequence(TE.taskEither);
  const scaleMap: T.Result<Map<string, Scale>> = React.useMemo(
    () =>
      pipe(
        E.tryCatch(
          (): [boolean, string] => {
            const validate = ajv.compile(schema);
            const valid = validate(rawScales);
            return [valid, ajv.errorsText(validate.errors)];
          },
          e => `${e}`
        ),
        E.map(
          ([valid, error]: [boolean, string]): Result<null> =>
            valid ? E.right(null) : E.left(error)
        ),
        TE.fromEither,
        TE.map(
          (): T.Result<[string, Scale]>[] =>
            rawScales.map(
              ({ name, pattern, roots }): T.Result<[string, Scale]> =>
                pipe(
                  roots.map(
                    ({
                      name: rootName,
                      sharp,
                      mp3
                    }): T.Result<[string, Root]> =>
                      Do(TE.taskEither)
                        .bind(
                          "root",
                          Root.fromString(rootName, sharp, O.fromNullable(mp3))
                        )
                        .bindL(
                          "unicodeString",
                          ({ root }): T.Result<string> =>
                            TE.fromEither(root.unicodeString())
                        )
                        .return(
                          ({ root, unicodeString }): [string, Root] => [
                            unicodeString,
                            root
                          ]
                        )
                  ),
                  sequence,
                  TE.map(x => {
                    console.log(x);
                    return Map(x);
                  }),
                  TE.map(roots => [name, { pattern, roots }])
                )
            )
        ),
        TE.chain(sequence),
        TE.map(Map)
      ),
    [rawScales]
  );

  React.useEffect(() => {
    domTask().then(
      dom => {
        console.log("accepted");
        console.log(dom);
        setState({ type: "loaded", dom });
      },
      e => console.log("rejected", e)
    );
  });

  const clefPicker: JSX.Element = (
    <Picker
      style={styles.picker}
      selectedValue={clef}
      onValueChange={v => setClef(v)}
    >
      <Picker.Item label={"treble"} value={"treble"} key={"treble"} />
      <Picker.Item label={"bass"} value={"bass"} key={"bass"} />
    </Picker>
  );

  const scalePicker: T.Result<JSX.Element> = pipe(
    scaleMap,
    TE.chain(
      (scaleMap: Map<string, Scale>): T.Result<JSX.Element> =>
        pipe(
          first(scaleMap.keySeq()),
          E.mapLeft((e: string) => e + ": scale names"),
          E.map(
            (firstScale: string): JSX.Element => (
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
                  .map((scaleName: string) => (
                    <Picker.Item
                      label={scaleName}
                      value={scaleName}
                      key={scaleName}
                    />
                  ))}
              </Picker>
            )
          ),
          TE.fromEither
        )
    )
  );

  const rootPicker: T.Result<JSX.Element> = pipe(
    scaleMap,
    TE.chain(
      (scaleMap: Map<string, Scale>): T.Result<JSX.Element> =>
        pipe(
          scale,
          O.fold(
            () => E.right(<View style={styles.picker} />),
            (scaleKey: string): Result<JSX.Element> =>
              Do(E.either)
                .bind("scaleValue", R.lookup(scaleKey, scaleMap))
                .bindL(
                  "firstRoot",
                  ({ scaleValue }): Result<string> =>
                    pipe(
                      first(scaleValue.roots.keySeq()),
                      E.mapLeft(e => e + `: "${scaleKey}" roots`)
                    )
                )
                .return(
                  ({ firstRoot, scaleValue }): JSX.Element => (
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
                        .map(r => (
                          <Picker.Item label={r} value={r} key={r} />
                        ))}
                    </Picker>
                  )
                )
          ),
          TE.fromEither
        )
    )
  );
  const sheetMusic: T.Result<ReactPortal | null> = pipe(
    scaleMap,
    TE.chain(scaleMap =>
      pipe(
        root,
        O.fold(
          () => E.right(null),
          (rootKey: string): Result<ReactPortal | null> =>
            Do(E.either)
              .bind(
                "scaleKey",
                pipe(
                  scale,
                  MakeResult.fromOption<string>(
                    `Somehow, scale was none when root was ${root}.`
                  )
                )
              )
              .bindL(
                "scaleValue",
                ({ scaleKey }): Result<Scale> => R.lookup(scaleKey, scaleMap)
              )
              .bindL(
                "rootValue",
                ({ scaleValue }): Result<Root> =>
                  R.lookup(rootKey, scaleValue.roots)
              )
              .letL(
                "rootIndex",
                ({ rootValue }): number => rootValue.getIndex()
              )
              .letL(
                "notes",
                ({ scaleValue, rootIndex, rootValue }): Note[] =>
                  scaleValue.pattern
                    .reduce(modCumSum, { acc: [rootIndex], prev: rootIndex })
                    .acc.map(v => new Note(v, rootValue.sharp))
              )
              .bindL(
                "reactPortal",
                ({ notes }): Result<ReactPortal> =>
                  Music.getContext(notes, clef, styles.svg)
              )
              .return(({ reactPortal }) => reactPortal)
        ),
        TE.fromEither
      )
    )
  );
  const domTask: Task<JSX.Element> = pipe(
    Do(TE.taskEither)
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
    TE.getOrElse((e: string) =>
      task.of(
        <View style={styles.error}>
          <Text style={{ fontWeight: "bold" }}>Error!</Text>
          <Text>🙀</Text>
          <Text style={{ textAlign: "center" }}>{e}</Text>
        </View>
      )
    )
  );
  switch (state.type) {
    case "loading":
      return (
        <View>
          <Text>Loading...</Text>
        </View>
      );
    case "loaded":
      return state.dom;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "space-around"
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
    width: "95%",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  svg: {}
});
