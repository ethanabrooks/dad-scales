import { Map } from "immutable";

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

export class Note {
  index: number;
  sharp: boolean;

  constructor(index: number, sharp: boolean = false) {
    this.index = index;
    this.sharp = sharp;
  }

  static fromString(s: string): undefined | Note {
    return toneIndexes.get(s.replace("(", "").replace(")", ""));
  }

  getIndex() {
    return this.index;
  }

  string() {
    let tone = tones[this.index];
    if (tone) {
      if (this.sharp) {
        return this.sharp ? tone.sharp : tone.flat;
      }
    }
  }
}

const toneIndexes: Map<String, Note> = Map(
  tones.flatMap(({ sharp, flat }, i) => {
    let e1: Entry = [sharp, new Note(i, true)];
    let e2: Entry = [flat, new Note(i, false)];
    return [e1, e2];
  })
);
