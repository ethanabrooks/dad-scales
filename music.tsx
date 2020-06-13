import { Range } from "immutable";
import Vex from "vexflow";
import {
  NotoFontPack,
  ReactNativeSVGContext
  // @ts-ignore
} from "standalone-vexflow-context";

type Note = string;
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
      const scale = notes
        .map((note: Note) => {
          let staveNote = new Vex.Flow.StaveNote({
            clef: "treble",
            keys: [`${note}/4`],
            duration: `${numNotes}`
          });
          let accidental = note[1];
          return "#b".includes(accidental)
            ? staveNote.addAccidental(0, new Vex.Flow.Accidental(accidental))
            : staveNote;
        })
        .concat(
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
