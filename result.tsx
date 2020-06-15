import { Either, left } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";

export type Result<T> = Either<string, T>;

export class MakeResult {
  static fromOption<T>(e: string): (ma: Option<T>) => Result<T> {
    return O.fold(() => E.left(e), res => E.right(res));
  }

  static fromNullable<T>(e: string): (ma: T) => Result<T> {
    return (n: T) => MakeResult.fromOption<T>(e)(O.fromNullable(n));
  }

  private static rangeErrorMessage(
    index: number,
    length: number,
    arrayName: string
  ) {
    return `Index ${index} is out of range for array ${arrayName} of length ${length}`;
  }
  static withRangeError<T, X>(
    index: number,
    array: X[]
  ): (ma: Option<T>) => Result<T> {
    return MakeResult.fromOption<T>(
      MakeResult.rangeErrorMessage(
        index,
        array.length,
        Object.keys({ array })[0]
      )
    );
  }
}
