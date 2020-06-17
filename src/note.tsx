import { List } from "immutable";
import Vex from "vexflow";
import { Option } from "fp-ts/es6/Option";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";

import { Lazy, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as T from "./tresult";
import { MakeResult, Result } from "./result";
import { Do } from "fp-ts-contrib/lib/Do";
import { Sound } from "expo-av/build/Audio/Sound";
import { AVPlaybackSource } from "expo-av/build/AV";
import { Audio, AVPlaybackStatus } from "expo-av";

type Accidental = "#" | "b" | null;
type Tone = { base: string; accidental: Accidental };

export const toneStrings: { sharp: string; flat: string }[] = [
  { sharp: "c", flat: "c" },
  { sharp: "c#", flat: "db" },
  { sharp: "d", flat: "d" },
  { sharp: "d#", flat: "eb" },
  { sharp: "e", flat: "e" },
  { sharp: "f", flat: "f" },
  { sharp: "f#", flat: "gb" },
  { sharp: "g", flat: "g" },
  { sharp: "g#", flat: "ab" },
  { sharp: "a", flat: "a" },
  { sharp: "a#", flat: "bb" },
  { sharp: "b", flat: "b" }
];

export const NUM_TONES = toneStrings.length;

const tones: { sharp: Tone; flat: Tone }[] = toneStrings.map(
  ({ sharp, flat }) => {
    const parse = (s: string): Tone => {
      switch (s[1]) {
        case "#":
          return { base: s[0], accidental: "#" };
        case "b":
          return { base: s[0], accidental: "b" };
        default:
          return { base: s[0], accidental: null };
      }
    };
    return { sharp: parse(sharp), flat: parse(flat) };
  }
);

export type ToneAlternatives = { sharp: Tone; flat: Tone };

export class Note {
  index: number;
  sharp: boolean;

  constructor(index: number, sharp: boolean) {
    this.index = index;
    this.sharp = sharp;
  }

  static indexFromString(s: string, sharpVersion: boolean): Result<number> {
    let searchResult = List(toneStrings).findIndex(({ sharp, flat }) =>
      [sharp, flat].includes(s)
    );
    const checkResult = E.fromPredicate(
      (r: number) => r >= 0,
      () =>
        `Did not find ${
          sharpVersion ? "sharp" : "flat"
        } version of "${s}" in toneStrings:\n${toneStrings}`
    );
    return checkResult(searchResult);
  }

  static noteFromString(s: string, sharpVersion: boolean): Result<Note> {
    return Do(E.either)
      .bind("index", Note.indexFromString(s, sharpVersion))
      .return(({ index }) => new Note(index, sharpVersion));
  }

  getIndex(): number {
    return this.index;
  }

  getAccidental(): Result<Accidental> {
    return pipe(
      A.lookup(this.index, tones) as Option<ToneAlternatives>,
      MakeResult.withRangeError(this.index, tones),
      E.map(({ sharp, flat }: ToneAlternatives) => {
        let tone: Tone = this.sharp ? sharp : flat;
        return tone.accidental;
      })
    );
  }

  vexFlowAccidental(): Result<null | Vex.Flow.Accidental> {
    return pipe(
      this.getAccidental(),
      E.map((accidental: Accidental) => {
        switch (accidental) {
          case "#":
            return new Vex.Flow.Accidental("#");
          case "b":
            return new Vex.Flow.Accidental("b");
          default:
            return null;
        }
      })
    );
  }

  asciiString(): Result<string> {
    return pipe(
      O.fromNullable(toneStrings[this.index]),
      MakeResult.withRangeError(this.index, toneStrings),
      E.map(tone => (this.sharp ? tone.sharp : tone.flat))
    );
  }

  unicodeString(): Result<string> {
    return pipe(
      this.asciiString(),
      E.map(asciiString =>
        asciiString.replace(/([a-z])b/, "$1♭").replace(/([a-z])#/, "$1♯")
      )
    );
  }
}

type Created = { sound: Sound; status: AVPlaybackStatus };

export class Root extends Note {
  sound: Option<Sound>;
  constructor(index: number, sharp: boolean, sound: Option<Sound>) {
    super(index, sharp);
    this.sound = sound;
  }

  static getSoundThunk: (path: AVPlaybackSource) => Lazy<Promise<Created>> = (
    path: AVPlaybackSource
  ) => () => Audio.Sound.createAsync(path, { shouldPlay: false });

  static fromString(
    s: string,
    sharpVersion: boolean,
    mp3path: Option<string>
  ): T.Result<Root> {
    return Do(TE.taskEither)
      .bind("index", TE.fromEither(Note.indexFromString(s, sharpVersion)))
      .bind(
        "sound",
        pipe(
          mp3path,
          O.fold(
            () => TE.right(O.none),
            (mp3path: string): T.Result<Option<Sound>> =>
              pipe(
                Root.getSoundThunk({ uri: mp3path }),
                T.fromThunk,
                TE.map(({ sound }) => O.some(sound))
              )
          )
        )
      )
      .return(({ index, sound }) => new Root(index, sharpVersion, sound));
  }
}
