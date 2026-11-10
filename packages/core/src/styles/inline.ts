import type { CompiledStyles, StyleXStyles } from "@stylexjs/stylex"
import { Option, Predicate } from "effect"

export type Inline = { readonly _tag: "Inline"; readonly values: ReadonlyArray<readonly [string, string]> }

export type Sx = CompiledStyles | StyleXStyles | Inline | null | undefined

const varName = (token: string): string => token.replace(/^var\(/, "").replace(/\)$/, "")

export const setVars = (...values: ReadonlyArray<readonly [token: string, value: string]>): Inline => ({
  _tag: "Inline",
  values: values.map(([token, value]) => [varName(token), value])
})

export const setStyle = (...values: ReadonlyArray<readonly [property: string, value: string]>): Inline => ({
  _tag: "Inline",
  values
})

export const isInline = (style: Sx): style is Inline => Predicate.isTagged(style, "Inline")

export const isCompiled = (style: Sx): style is Exclude<Sx, Inline> => !isInline(style)

export const setDefinedVars = (...values: ReadonlyArray<readonly [token: string, value: string | undefined]>): Inline =>
  setVars(...values.filter((pair): pair is readonly [string, string] => pair[1] !== undefined))

export const setDefinedStyle = (
  ...values: ReadonlyArray<readonly [property: string, value: string | undefined]>
): Inline => setStyle(...values.filter((pair): pair is readonly [string, string] => pair[1] !== undefined))

export const mapDefined = <Value, Mapped>(value: Value | undefined, f: (value: Value) => Mapped): Mapped | undefined =>
  Option.getOrUndefined(Option.map(Option.fromUndefinedOr(value), f))
