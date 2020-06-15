import { Map } from "immutable";
import Vex from "vexflow";
import { Option } from "fp-ts/es6/Option";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { MakeResult, Result } from "./result";

type Accidental = "#" | "b" | null;
type Tone = { base: string; accidental: Accidental };

const toneStrings = [
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

type ToneAlternatives = { sharp: Tone; flat: Tone };

export class Note {
  index: number;
  sharp: boolean;

  constructor(index: number, sharp: boolean) {
    this.index = index;
    this.sharp = sharp;
  }

  static fromString(s: string): Result<Note> {
    return pipe(
      O.fromNullable(toneIndexes.get(s)),
      MakeResult.fromOption(`Failed to convert ${s} to a Note`)
    );
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
const toneIndexes: Map<String, Note> = Map(
  toneStrings.flatMap(({ sharp, flat }, i) => {
    let e: [[string, Note]] = [[sharp, new Note(i, true)]];
    if (flat !== sharp) e.push([flat, new Note(i, false)]);
    if (!sharp.match(/[a-z]\(?#\)?/))
      e.push([`${sharp}(#)`, new Note(i, true)]);
    if (!sharp.match(/[a-z]\(?b\)?/))
      e.push([`${flat}(b)`, new Note(i, false)]);
    return e;
  })
);
