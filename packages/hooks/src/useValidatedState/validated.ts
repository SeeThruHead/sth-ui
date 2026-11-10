import { Option } from "effect"

export type Validated<A> = {
  readonly value: A
  readonly lastValidValue: Option.Option<A>
  readonly valid: boolean
}

export const validated = <A>(initial: A, validate: (value: A) => boolean, initialValid?: boolean): Validated<A> => ({
  value: initial,
  lastValidValue: Option.liftPredicate(initial, validate),
  valid: initialValid ?? validate(initial)
})

export const changeValidated = <A>(state: Validated<A>, value: A, validate: (value: A) => boolean): Validated<A> => {
  const valid = validate(value)

  return { value, valid, lastValidValue: valid ? Option.some(value) : state.lastValidValue }
}
