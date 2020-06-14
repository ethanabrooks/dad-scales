import { Map } from "immutable";
import Vex from "vexflow";

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

export class Note {
  index: number;
  sharp: boolean;

  constructor(index: number, sharp: boolean) {
    this.index = index;
    this.sharp = sharp;
  }

  static fromString(s: string): undefined | Note {
    return toneIndexes.get(s);
  }

  getIndex() {
    return this.index;
  }

  getAccidental() {
    let tone: { sharp: Tone; flat: Tone } = tones[this.index];
    if (tone) {
      return (this.sharp ? tone.sharp : tone.flat).accidental;
    }
  }

  vexFlowAccidental() {
    switch (this.getAccidental()) {
      case "#":
        return new Vex.Flow.Accidental("#");
      case "b":
        return new Vex.Flow.Accidental("b");
      default:
        return null;
    }
  }

  asciiString() {
    let tone = toneStrings[this.index];
    if (tone) {
      return this.sharp ? tone.sharp : tone.flat;
    }
  }

  unicodeString() {
    let asciiString = this.asciiString();
    return asciiString
      ? asciiString.replace(/([a-z])b/, "$1♭").replace(/([a-z])#/, "$1♯")
      : null;
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
