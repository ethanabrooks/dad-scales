import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { Lazy } from "fp-ts/lib/function";

export type Result<T> = TaskEither<string, T>;

export function fromThunk<A>(message: string) {
  return (thunk: Lazy<Promise<A>>): Result<A> =>
    TE.tryCatch(thunk, () => message);
}
