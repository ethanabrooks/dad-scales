import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { Lazy } from "fp-ts/lib/function";

export type Result<T> = TaskEither<string, T>;

export function fromThunk<A>(thunk: Lazy<Promise<A>>): Result<A> {
  return TE.tryCatch(thunk, e => `${e}`);
}
