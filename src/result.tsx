import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { Map } from "immutable";
import { Lazy } from "fp-ts/lib/function";

export type Result<T> = Either<string, T>;

export function eitherTryCatchAsync<L, R>(
  f: Lazy<Promise<R>>,
  onError: (reason: any) => L
): Lazy<Promise<Either<L, R>>> {
  return () => {
    try {
      return f().then(
        a => E.right<L, R>(a),
        reason => E.left<L, R>(onError(reason))
      );
    } catch (e) {
      return Promise.resolve(E.left<L, R>(e));
    }
  };
}

export function result<T>(
  f: Lazy<Promise<T>>,
  onError: (reason: any) => string
): Lazy<Promise<Result<T>>> {
  return () => {
    try {
      return f().then(
        a => E.right<string, T>(a),
        reason => E.left<string, T>(onError(reason))
      );
    } catch (e) {
      return Promise.resolve(E.left<string, T>(e));
    }
  };
}

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
