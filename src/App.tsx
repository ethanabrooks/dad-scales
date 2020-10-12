import React, { ReactPortal } from "react";
import { Button, Picker, Switch, Text, View } from "react-native";
import { Note, NUM_TONES, roots, toneStrings } from "./note";
import { Seq } from "immutable";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { Clef, Music } from "./music";
import { MakeResult, Result } from "./result";
import { styles } from "./styles";
import "./Scales";
import { scales } from "./Scales";

type Scale = number[];
type State =
  | { type: "loading" }
  | { type: "loaded" }
  | { type: "error"; message: string };

function modCumSum(
  { acc, prev }: { acc: number[]; prev: number },
  curr: number
) {
  const sum: number = prev + curr;
  return { acc: acc.concat(sum % NUM_TONES), prev: sum };
}

function randomNumber(n: number): number {
  return Math.floor(Math.random() * n);
}

function randomScale(): Scale {
  let scale = scales[randomNumber(scales.length)];
  return scale;
  // return A.rotate(randomNumber(NUM_TONES))(scale);
}

export default function App(): JSX.Element {
  const [state, setState] = React.useState<State>({ type: "loading" });
  const [clef, setClef] = React.useState<Clef>("treble");
  const [scale, setScale] = React.useState<Scale>(scales[0]);
  const [rootOption, setRoot] = React.useState<O.Option<string>>(O.none);
  console.log(scale);
  // const sequence = A.array.sequence(E.either);

  React.useEffect(() => {
    if (state.type == "loading") {
      let rootName: Result<string> = Do(E.either)
        .bind(
          "root",
          pipe(
            roots,
            A.head,
            E.fromOption(() => "Roots was empty")
          )
        )
        .bindL("rootName", ({ root }) => root.unicodeString())
        .return(({ rootName }) => rootName);
      pipe(
        rootName,
        E.fold(
          (e) => setState({ type: "error", message: e }),
          (rootName) => {
            setRoot(O.some(rootName));
            setState({ type: "loaded" });
          }
        )
      );
    }
  });

  switch (state.type) {
    case "error":
      return (
        <View style={styles.error}>
          <Text style={{ fontWeight: "bold" }}>Error!</Text>
          <Text>🙀</Text>
          <Text style={{ textAlign: "center" }}>{state.message}</Text>
        </View>
      );
    case "loading":
      return (
        <View>
          <Text>Loading...</Text>
        </View>
      );
    case "loaded":
      const clefSwitch: JSX.Element = (
        <View style={styles.switch}>
          <Text>{clef}</Text>
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

      const scaleButton: JSX.Element = (
        <Button
          title={"Randomize Scale"}
          onPress={() => setScale(randomScale())}
        />
      );

      const rootName: Result<string> = pipe(
        rootOption,
        E.fromOption(() => "rootName was None")
      );

      const rootPicker: Result<JSX.Element> = pipe(
        rootName,
        E.map((rootName: string) => (
          <Picker
            style={{ backgroundColor: "white", ...styles.picker }}
            selectedValue={rootName}
            onValueChange={(s) => setRoot(O.some(s))}
          >
            {toneStrings
              .map((t) => t.sharp)
              .map((r) => (
                <Picker.Item label={r} value={r} key={r} />
              ))}
          </Picker>
        ))
      );

      const root: Result<Note> = pipe(
        rootName,
        E.map(
          (rootName: string): Result<Note> => {
            return Note.fromString(rootName, true);
          }
        ),
        E.flatten
      );

      const notes: Result<Note[]> = pipe(
        root,
        E.map(
          (root) =>
            scale
              .reduce(modCumSum, {
                acc: [root.getIndex()],
                prev: root.getIndex(),
              })
              .acc.map((v) => new Note(v, root.sharp)) // TODO
        )
      );

      const sheetMusic: Result<ReactPortal | JSX.Element> = pipe(
        notes,
        E.map((notes) => Music.getContext(notes, clef, styles.svg)),
        E.flatten
      );

      return pipe(
        Do(E.either)
          .bind("sheetMusic", sheetMusic)
          .bind("rootPicker", rootPicker)
          .return(({ sheetMusic, rootPicker }) => (
            <View style={styles.container}>
              <View style={styles.picker}>{rootPicker}</View>
              <View style={styles.button}>{scaleButton}</View>
              <View style={styles.toggles}>{clefSwitch}</View>
              <View style={styles.music}>{sheetMusic}</View>
            </View>
          )),
        E.getOrElse((e: string) => {
          setState({ type: "error", message: `${e}` });
          return (
            <View style={styles.error}>
              <Text>Loading error...</Text>
            </View>
          );
        })
      );
  }
}
