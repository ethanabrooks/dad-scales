import React, { ReactPortal } from "react";
import { Picker, Switch, Text, TouchableOpacity, View } from "react-native";
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
import { MakeResult, Result, TaskResult } from "./result";
import { ajv, schema } from "./schema";
import { styles } from "./styles";
import Svg, { G, Polygon } from "react-native-svg";

const TIMEOUT = 2000;

type Scale = { pattern: number[]; roots: Map<string, Root> };
type State =
  | { type: "loading" }
  | { type: "loaded"; scaleMap: Result<Map<string, Scale>> };

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

export default function App(): JSX.Element {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [clef, setClef] = React.useState<Clef>("treble");
  const [scaleName, setScale] = React.useState<Option<string>>(O.some("major"));
  const [rootName, setRoot] = React.useState<Option<string>>(O.some("g♯"));
  const [play, setPlay] = React.useState<boolean>(false);
  const sequence = A.array.sequence(TE.taskEither);
  const scaleMapTask: TaskResult<Map<string, Scale>> = pipe(
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
      (): TaskResult<[string, Scale]>[] =>
        rawScales.map(
          ({ name, pattern, roots }): TaskResult<[string, Scale]> =>
            pipe(
              roots.map(
                ({ name: rootName, sharp, mp3 }): TaskResult<[string, Root]> =>
                  Do(TE.taskEither)
                    .bind(
                      "root",
                      Root.fromString(
                        rootName,
                        sharp,
                        O.fromNullable(mp3),
                        TIMEOUT
                      )
                    )
                    .bindL(
                      "unicodeString",
                      ({ root }): TaskResult<string> =>
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
              TE.map(Map),
              TE.map(roots => [name, { pattern, roots }])
            )
        )
    ),
    TE.chain(sequence),
    TE.map(Map)
  );
  React.useEffect(() => {
    if (state.type == "loading") {
      scaleMapTask().then(
        scaleMap => {
          setState({ type: "loaded", scaleMap });
        },
        e => console.log("rejected", e)
      );
    }
  });

  switch (state.type) {
    case "loading":
      return (
        <View>
          <Text>Loading...</Text>
        </View>
      );
    case "loaded":
      const clefSwitch: JSX.Element = (
        <View style={styles.switch}>
          {<Text>{clef}</Text>}
          <Switch
            onValueChange={() => {
              switch (clef) {
                case "treble":
                  return setClef("bass");
                case "bass":
                  return setClef("treble");
              }
            }}
            value={clef == "treble"}
          />
        </View>
      );

      const scalePicker: Result<JSX.Element> = pipe(
        state.scaleMap,
        E.chain(
          (scaleMap: Map<string, Scale>): Result<JSX.Element> =>
            pipe(
              first(scaleMap.keySeq()),
              E.mapLeft((e: string) => e + ": scale names"),
              E.map(
                (firstScale: string): JSX.Element => (
                  <Picker
                    style={{ backgroundColor: "white", ...styles.picker }}
                    selectedValue={pipe(
                      scaleName,
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
              )
            )
        )
      );

      const rootPicker: Result<JSX.Element> = pipe(
        scaleName,
        O.fold(
          () => E.right(<View style={styles.picker} />),
          (scaleKey: string): Result<JSX.Element> =>
            Do(E.either)
              .bind("scaleMap", state.scaleMap)
              .bindL("scaleValue", ({ scaleMap }) =>
                R.lookup(scaleKey, scaleMap)
              )
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
                      rootName,
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
        )
      );

      const scaleAndRoot: Option<Result<{ scale: Scale; root: Root }>> = pipe(
        rootName,
        O.mapNullable((name: string) =>
          Do(E.either)
            .bind(
              "scaleName",
              pipe(
                scaleName,
                MakeResult.fromOption<string>(
                  `Somehow, scale was none when root was ${rootName}.`
                )
              )
            )
            .bind("scaleMap", state.scaleMap)
            .bindL(
              "scale",
              ({ scaleName, scaleMap }): Result<Scale> =>
                R.lookup(scaleName, scaleMap)
            )
            .bindL("root", ({ scale }) => R.lookup(name, scale.roots))
            .return(({ scale, root }) => ({
              scale,
              root
            }))
        )
      );

      const sheetMusic: Result<ReactPortal | JSX.Element> = pipe(
        scaleAndRoot,
        O.fold(
          () => E.right(<View style={styles.music} />),
          (scaleAndRoot): Result<ReactPortal | JSX.Element> =>
            Do(E.either)
              .bind("scaleAndRoot", scaleAndRoot)
              .letL(
                "notes",
                ({ scaleAndRoot: { scale, root } }): Note[] =>
                  scale.pattern
                    .reduce(modCumSum, {
                      acc: [root.getIndex()],
                      prev: root.getIndex()
                    })
                    .acc.map(v => new Note(v, root.sharp))
              )
              .bindL(
                "reactPortal",
                ({ notes }): Result<ReactPortal> =>
                  Music.getContext(notes, clef, styles.svg)
              )
              .return(({ reactPortal }) => reactPortal)
        )
      );

      const placeholder = <View style={styles.toggles} />;
      const playPauseButton: Result<JSX.Element> = pipe(
        scaleAndRoot,
        O.fold(
          () => E.right(placeholder),
          (scaleAndRoot): Result<JSX.Element> =>
            Do(E.either)
              .bind("scaleAndRoot", scaleAndRoot)
              .return(({ scaleAndRoot: { root } }) =>
                pipe(
                  root.sound,
                  O.fold(
                    () => placeholder,
                    sound => {
                      let onPressPlay = () => {
                        sound.playAsync();
                        setPlay(true);
                      };
                      let onPressPause = () => {
                        sound.pauseAsync();
                        setPlay(false);
                      };
                      return play ? (
                        <TouchableOpacity
                          style={styles.button}
                          onPress={onPressPause}
                        >
                          <Svg height="80%" width="100%" viewBox="0 0 35 70">
                            <G onPress={onPressPause}>
                              <Polygon points="0,0 15,0 15,60 0,60" />
                              <Polygon points="25,0 40,0 40,60 25,60" />
                            </G>
                          </Svg>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.button}
                          onPress={onPressPlay}
                        >
                          <Svg height="80%" width="100%" viewBox="0 0 35 70">
                            <Polygon
                              points="0,0 50,30 0,60"
                              onPress={onPressPlay}
                            />
                          </Svg>
                        </TouchableOpacity>
                      );
                    }
                  )
                )
              )
        )
      );

      return pipe(
        Do(E.either)
          .bind("scalePicker", scalePicker)
          .bind("rootPicker", rootPicker)
          .bind("sheetMusic", sheetMusic)
          .bind("playButton", playPauseButton)
          .return(({ scalePicker, rootPicker, sheetMusic, playButton }) => (
            <View style={styles.container}>
              <View style={styles.picker}>{scalePicker}</View>
              <View style={styles.picker}>{rootPicker}</View>
              <View style={styles.toggles}>
                {clefSwitch}
                {playButton}
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
}
