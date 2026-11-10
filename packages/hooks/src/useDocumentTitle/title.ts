import { Option } from "effect"

export const titleOf = (title: string): Option.Option<string> =>
  Option.liftPredicate(title.trim(), (trimmed) => trimmed.length > 0)
