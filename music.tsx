import { Range } from "immutable";
import Vex from "vexflow";
import {
  NotoFontPack,
  ReactNativeSVGContext
  // @ts-ignore
} from "standalone-vexflow-context";
import { Note, NUM_TONES } from "./note";
import { Do } from "fp-ts-contrib/lib/Do";
import { MakeResult, Result } from "./result";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { ReactPortal } from "react";

function cumSum(numbers: number[]) {
  pipe(
    numbers,
    A.scanLeft(0, (a, b) => a + b)
  );
}

let sequence = A.array.sequence(E.either);
export class Music {
  context: ReactNativeSVGContext;
  render(): ReactPortal {
    return this.context.render() as ReactPortal;
  }
  static getContext(notes: Note[], style: unknown): Result<ReactPortal> {
    const numNotes = pipe(
      Range(0, Infinity)
        .map(n => Math.pow(2, n))
        .filter(n => n >= notes.length)
        .first(null),
      O.fromNullable,
      MakeResult.fromOption("Somehow, numNotes is null")
    );
    const indices = notes.map(n => n.getIndex() % NUM_TONES);
    const pairs = A.zip(indices, indices.slice(1));
    const octaves = pipe(
      pairs,
      A.scanLeft(4, (o, [i1, i2]) => {
        return i1 < i2 ? o : o + 1;
      })
    );
    const staveNotes = A.zipWith(notes, octaves, (note, octave) =>
      E.tryCatch(
        () => {
          let staveNote = new Vex.Flow.StaveNote({
            clef: "treble",
            keys: [`${note.asciiString()}/${octave}`],
            duration: `${numNotes}`
          });
          console.log(staveNote);
          return staveNote;
        },
        e => `new Vex.Flow.StaveNote({
            clef: "treble",
            keys: [${note.asciiString()}/${octave}],
            duration: ${numNotes}
          }) threw an error:\n${e}`
      )
    );
    console.log(staveNotes);

    return Do(E.either)
      .bind("staveNotes", sequence(staveNotes))
      .bind("accidentals", sequence(notes.map(n => n.vexFlowAccidental())))
      .letL("zipped", ({ staveNotes, accidentals }) =>
        A.zip(staveNotes, accidentals)
      )
      .letL("withAccidentals", ({ zipped }) =>
        zipped.map(([staveNote, accidental]) =>
          accidental == null
            ? E.right(staveNote)
            : E.tryCatch(
                () => staveNote.addAccidental(0, accidental),

                e =>
                  `staveNote.addAccidental(0, ${accidental}) threw an error:\n${e}`
              )
        )
      )
      .bindL("scale", ({ withAccidentals }) => sequence(withAccidentals))
      .bindL("music", ({ scale }) =>
        E.tryCatch(
          () => {
            return new Music(scale, style);
          },
          e =>
            `new Music(scale, style) threw an error:\n${e}
              \nscale:${scale}
              \nstyle:${style}`
        )
      )
      .bindL("reactPortal", ({ music }) =>
        E.tryCatch(
          () => music.render(),
          e => `music.render() threw an error:\n${e}`
        )
      )
      .return(({ reactPortal }) => reactPortal);
  }
  constructor(scale: Vex.Flow.StaveNote[], style: unknown) {
    this.context = new ReactNativeSVGContext(NotoFontPack, style);
    const stave: Vex.Flow.Stave = new Vex.Flow.Stave(0, 0, 300);
    stave.setContext(this.context);
    // @ts-ignore
    stave.setClef("treble");
    // @ts-ignore
    stave.setTimeSignature(`4/4`);
    stave.draw();
    const beams = Vex.Flow.Beam.generateBeams(scale);
    Vex.Flow.Formatter.FormatAndDraw(this.context, stave, scale);
    const context = this.context;
    beams.forEach(function(b) {
      b.setContext(context).draw();
    });
  }
}
