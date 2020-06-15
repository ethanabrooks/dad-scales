import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { Map } from "immutable";
import { Music } from "./music";

export type Result<T> = Either<string, T>;

export class MakeResult {
  static fromOption<T>(e: string): (ma: Option<T>) => Result<T> {
    return O.fold(() => E.left(e), res => E.right(res));
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

export function lookup<K, V>(key: K, map: Map<K, V>): Result<V> {
  return pipe(
    O.fromNullable(map.get(key)),
    MakeResult.fromOption(`Failed to get key ${key} from map: ${map}`)
  );
}