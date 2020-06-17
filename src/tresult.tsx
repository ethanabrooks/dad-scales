import { TaskEither } from "fp-ts/lib/TaskEither";

export type Result<T> = TaskEither<string, T>;
