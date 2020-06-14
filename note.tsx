import { Map } from "immutable";
import Vex from "vexflow";

export const tones = [
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

type Entry = [string, Note];
type Accidental = "sharp" | "flat" | null;

export class Note {
  index: number;
  accidental: Accidental;

  constructor(index: number, accidental: Accidental) {
    this.index = index;
    this.accidental = accidental;
  }

  static fromString(s: string): undefined | Note {
    return toneIndexes.get(s.replace("(", "").replace(")", ""));
  }

  getIndex() {
    return this.index;
  }

  getAccidental() {
    return this.accidental;
  }

  vexFlowAccidental() {
    switch (this.accidental) {
      case "sharp":
        return new Vex.Flow.Accidental("#");
      case "flat":
        return new Vex.Flow.Accidental("b");
      default:
        return null;
    }
  }

  asciiString() {
    let tone = tones[this.index];
    if (tone) {
      return this.accidental == "flat" ? tone.flat : tone.sharp;
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
  tones.flatMap(({ sharp, flat }, i) => {
    let e1: Entry = [sharp, new Note(i, "sharp")];
    let e2: Entry = [flat, new Note(i, "flat")];
    return [e1, e2];
  })
);
