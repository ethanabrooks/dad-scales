import { Do } from "fp-ts-contrib/lib/Do";
import * as A from "fp-ts/lib/Array";
import { array } from "fp-ts/lib/Array";
import { Map, Seq } from "immutable";

type A = { tag: "1"; suffix: B } | { tag: "11"; suffix: B };
type B = { tag: "2" } | { tag: "32" } | { tag: "3A"; suffix: A };
type SubScale = { tag: "A"; subtype: A } | { tag: "B"; subtype: B };

type ATag = "1" | "11";
type BTag = "2" | "32" | "3A";

const aTags: ATag[] = ["1", "11"];
const bTags: BTag[] = ["2", "32", "3A"];
const OCTAVE_LENGTH = 13;

function getStepsA(a: A): number[] {
  switch (a.tag) {
    case "1":
      return [1].concat(getStepsB(a.suffix));
    case "11":
      return [1, 1].concat(getStepsB(a.suffix));
  }
}

function getStepsB(b: B): number[] {
  switch (b.tag) {
    case "2":
      return [1];
    case "32":
      return [3, 2];
    case "3A":
      return [3].concat(getStepsA(b.suffix));
  }
}

function getSteps(s: SubScale): number[] {
  switch (s.tag) {
    case "A":
      return getStepsA(s.subtype);
    case "B":
      return getStepsB(s.subtype);
  }
}

function subScalesA(maxLen: number): A[] {
  return Do(array)
    .bind("tag", aTags)
    .bindL(
      "suffix",
      ({ tag }): B[] => {
        switch (tag) {
          case "1":
            return maxLen < 2 ? [] : subScalesB(maxLen - 1);
          case "11":
            return maxLen < 3 ? [] : subScalesB(maxLen - 2);
        }
      }
    )
    .return(a => a);
}

function subScalesB(maxLen: number): B[] {
  return bTags.flatMap(
    (tag: BTag): B[] => {
      switch (tag) {
        case "2":
          return maxLen < 1 ? [] : [{ tag }];
        case "32":
          return maxLen < 2 ? [] : [{ tag }];
        case "3A":
          return maxLen < 2
            ? []
            : subScalesA(maxLen - 1).map(a => ({ tag, suffix: a }));
      }
    }
  );
}

function subScales(maxLen: number): SubScale[] {
  let as: SubScale[] = subScalesA(maxLen).map(a => ({ tag: "A", subtype: a }));
  let bs: SubScale[] = subScalesB(maxLen).map(b => ({ tag: "B", subtype: b }));
  return as.concat(bs);
}

function subScalesOfLength(length: number): SubScale[][] {
  return Do(array)
    .bind("s", subScales(length))
    .bindL(
      "ss",
      ({ s }): SubScale[][] => subScalesOfLength(length - getSteps(s).length)
    )
    .return(({ s, ss }) => ss.concat(s));
}

function stringOfScale(scale: number[]) {
  return scale.reduce((s, n) => s + String(n), "");
}

const octaves = subScalesOfLength(OCTAVE_LENGTH).map(ss =>
  ss.flatMap(getSteps)
);

const scaleMap: Map<String, Number[]> = Map(
  octaves.map(s => [stringOfScale(s), s])
);
