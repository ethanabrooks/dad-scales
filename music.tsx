import { Range } from "immutable";
import Vex from "vexflow";
import {
  NotoFontPack,
  ReactNativeSVGContext
} from "standalone-vexflow-context";
import { Note } from "./note";

export class Music {
  context: ReactNativeSVGContext;
  render() {
    return this.context.render();
  }
  constructor(notes: Note[], style: unknown) {
    const length = notes.length;
    const numNotes = Range(0, Infinity)
      .map(n => Math.pow(2, n))
      .filter(n => n > length)
      .first(null);
    if (!numNotes) {
      throw Error("Mis-computed numNotes.");
    } else {
      this.context = new ReactNativeSVGContext(NotoFontPack, style);
      let initializer: {
        octave: number;
        last: Note | null;
        staveNotes: Vex.Flow.StaveNote[];
      } = {
        octave: 4,
        last: null,
        staveNotes: []
      };
      const scale = notes
        .reduce(({ octave, last, staveNotes }, note: Note) => {
          if (last ? last.getIndex() > note.getIndex() : false) {
            octave++;
          }
          let staveNote = new Vex.Flow.StaveNote({
            clef: "treble",
            keys: [`${note.asciiString()}/${octave}`],
            duration: `${numNotes}`
          });
          const accidental = note.vexFlowAccidental();
          if (accidental) {
            staveNote = staveNote.addAccidental(0, accidental);
          }
          return {
            octave: octave,
            last: note,
            staveNotes: staveNotes.concat(staveNote)
          };
        }, initializer)
        .staveNotes.concat(
          Array(numNotes - notes.length).fill(
            new Vex.Flow.StaveNote({
              clef: "treble",
              keys: ["bb/4"],
              duration: `${numNotes}r`
            })
          )
        );

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
}
