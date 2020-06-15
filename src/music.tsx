import { Range } from "immutable";
import Vex from "vexflow";
import {
  NotoFontPack,
  ReactNativeSVGContext
} from "standalone-vexflow-context";
import { Note, NUM_TONES } from "./note";
import { Do } from "fp-ts-contrib/lib/Do";
import { MakeResult, Result } from "./result";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { ReactPortal } from "react";
import { StyleSheet } from "react-native";
import Svg from "react-native-svg";
export type Clef = "base" | "treble";

export class Music {
  context: ReactNativeSVGContext;
  static getContext(
    notes: Note[],
    clef: Clef,
    style: StyleSheet.NamedStyles<Svg>
  ): Result<ReactPortal> {
    const sequence = A.array.sequence(E.either);
    const numNotes = Range(0, Infinity)
      .map(n => Math.pow(2, n))
      .filter(n => n >= notes.length)
      .first(null);
    const indices = notes.map(n => n.getIndex() % NUM_TONES);
    const startingOctave = () => {
      switch (clef) {
        case "treble":
          return 4;
        case "base":
          return 4;
      }
    };
    const octaves = pipe(
      A.zip(indices, indices.slice(1)),
      A.scanLeft(startingOctave(), (o, [i1, i2]) => {
        return i1 < i2 ? o : o + 1;
      })
    );
    const staveNotes: Result<Vex.Flow.StaveNote>[] = A.zipWith(
      notes,
      octaves,
      (note, octave) =>
        Do(E.either)
          .bind("string", note.asciiString())
          .bind(
            "numNotes",
            pipe(
              numNotes,
              O.fromNullable,
              MakeResult.fromOption("Somehow, numNotes is null")
            )
          )
          .bindL("staveNote", ({ string, numNotes }) =>
            E.tryCatch(
              () =>
                new Vex.Flow.StaveNote({
                  clef: clef,
                  keys: [`${string}/${octave}`],
                  duration: `${numNotes}`
                }),
              e => `new Vex.Flow.StaveNote({
            clef: ${clef},
            keys: [${string}/${octave}],
            duration: ${numNotes}
          }) threw an error:\n${e}`
            )
          )
          .return(({ staveNote }) => staveNote)
    );

    return Do(E.either)
      .bind("staveNotes", sequence(staveNotes))
      .bind("accidentals", sequence(notes.map(n => n.vexFlowAccidental())))
      .letL("zipped", ({ staveNotes, accidentals }) =>
        A.zip(staveNotes, accidentals)
      )
      .letL("withAccidentals", ({ zipped }) =>
        (zipped as [Vex.Flow.StaveNote, null | Vex.Flow.Accidental][]).map(
          ([staveNote, accidental]) =>
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
            return new Music(scale, clef, style);
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
  constructor(
    scale: Vex.Flow.StaveNote[],
    clef: Clef,
    style: StyleSheet.NamedStyles<Svg>
  ) {
    this.context = new ReactNativeSVGContext(NotoFontPack, style);
    const stave: Vex.Flow.Stave = new Vex.Flow.Stave(0, 0, 300);
    stave.setContext(this.context);
    console.log(scale);
    stave.setClef(clef);
    stave.setTimeSignature(`4/4`);
    stave.draw();
    const beams = Vex.Flow.Beam.generateBeams(scale);
    Vex.Flow.Formatter.FormatAndDraw(this.context, stave, scale);
    const context = this.context;
    beams.forEach(function(b: Vex.Flow.Beam) {
      b.setContext(context).draw();
    });
  }
  render(): ReactPortal {
    return this.context.render() as ReactPortal;
  }
}
