import { Option, Predicate, Struct } from "effect"
import { isAccentName, shadeValue } from "../theme/accent.ts"
import { filledColors, textColors } from "../theme/accents.ts"
import type { AccentName } from "../theme/accents.ts"
import { colors, font, fontSize, heading, lineHeight, radius, shadow, space } from "../theme/tokens.stylex.ts"
import { rem } from "../theme/units.ts"
import { stylePropRules } from "./stylePropRules.ts"
import { breakpointNames, flexTable, inlineTable, responsiveTable } from "./stylePropTable.ts"
import type { StylePropKind } from "./stylePropTable.ts"
import { stylePropVars } from "./stylePropVars.stylex.ts"
import { setStyle, setVars } from "./inline.ts"
import type { Sx } from "./inline.ts"

export type Breakpoint = (typeof breakpointNames)[number]

export type StyleValue = string | number

export type ResponsiveValue<Value> = { readonly base?: Value } & { readonly [Name in Breakpoint]?: Value }

export type Responsive<Value> = Value | ResponsiveValue<Value>

type ResponsiveName = keyof typeof responsiveTable

type InlineName = keyof typeof inlineTable

export type StyleProps = { readonly [Name in ResponsiveName]?: Responsive<StyleValue> } & {
  readonly [Name in InlineName]?: StyleValue
}

const sizeScale = (group: {
  readonly xs: string
  readonly sm: string
  readonly md: string
  readonly lg: string
  readonly xl: string
}): { readonly [key: string]: string } => ({ xs: group.xs, sm: group.sm, md: group.md, lg: group.lg, xl: group.xl })

const spaceScale = sizeScale(space)

const radiusScale = sizeScale(radius)

const fontSizeScale = sizeScale(fontSize)

const lineHeightScale = sizeScale(lineHeight)

const named = (scale: { readonly [key: string]: string }, value: string): Option.Option<string> =>
  Option.fromNullishOr(Object.hasOwn(scale, value) ? scale[value] : undefined)

export const spacing = (value: StyleValue): string => {
  if (Predicate.isNumber(value)) return rem(value)
  const negative = value.startsWith("-")

  return Option.match(named(spaceScale, value.replace("-", "")), {
    onNone: () => value,
    onSome: (token) => (negative ? `calc(${token} * -1)` : token)
  })
}

export const sizeValue = (value: StyleValue): string => (Predicate.isNumber(value) ? rem(value) : value)

const fromScale = (scale: { readonly [key: string]: string }) => (value: StyleValue) =>
  Predicate.isNumber(value) ? rem(value) : Option.getOrElse(named(scale, value), () => value)

const headingSizes: { readonly [key: string]: string } = {
  h1: heading.h1Size,
  h2: heading.h2Size,
  h3: heading.h3Size,
  h4: heading.h4Size,
  h5: heading.h5Size,
  h6: heading.h6Size
}

const headingLines: { readonly [key: string]: string } = {
  h1: heading.h1Line,
  h2: heading.h2Line,
  h3: heading.h3Line,
  h4: heading.h4Line,
  h5: heading.h5Line,
  h6: heading.h6Line
}

const families: { readonly [key: string]: string } = {
  text: font.body,
  mono: font.mono,
  monospace: font.mono,
  heading: font.headings,
  headings: font.headings
}

const namedColors: { readonly [key: string]: string } = {
  dimmed: colors.dimmed,
  bright: colors.bright,
  anchor: colors.anchor,
  white: colors.white,
  black: colors.black
}

const color = (value: string, themed: { readonly [Name in AccentName]: string }): string => {
  const special = named(namedColors, value)
  if (Option.isSome(special)) return special.value
  if (isAccentName(value)) return themed[value]

  return Option.getOrElse(shadeValue(value), () => value)
}

const border = (value: StyleValue): string => {
  if (Predicate.isNumber(value)) return `${rem(value)} solid`
  const words = value.split(" ").filter((word) => word.length > 0)
  const paint = words.slice(2).join(" ")

  return [...words.slice(0, 2), ...(paint === "" ? [] : [color(paint, filledColors)])].join(" ")
}

export const radiusValue = fromScale(radiusScale)

const shadowScale = sizeScale(shadow)

export const shadowValue = (value: string): string => Option.getOrElse(named(shadowScale, value), () => value)

const resolvers: { readonly [Kind in StylePropKind]: (value: StyleValue) => string } = {
  spacing,
  size: sizeValue,
  radius: radiusValue,
  fontSize: (value) =>
    Predicate.isNumber(value)
      ? rem(value)
      : Option.getOrElse(
          Option.orElse(named(fontSizeScale, value), () => named(headingSizes, value)),
          () => value
        ),
  lineHeight: (value) =>
    Option.getOrElse(
      Option.orElse(named(lineHeightScale, String(value)), () => named(headingLines, String(value))),
      () => String(value)
    ),
  fontFamily: (value) => Option.getOrElse(named(families, String(value)), () => String(value)),
  color: (value) => color(String(value), filledColors),
  textColor: (value) => color(String(value), textColors),
  identity: String,
  border
}

export type Point = "base" | Breakpoint

const isResponsive = <Value>(value: Responsive<Value>): value is ResponsiveValue<Value> => Predicate.isObject(value)

export const points: ReadonlyArray<Point> = ["base", ...breakpointNames]

export const cascade = <Value>(value: ResponsiveValue<Value>): ReadonlyArray<readonly [Point, Value]> =>
  points.reduce<ReadonlyArray<readonly [Point, Value]>>((found, point) => {
    const own = value[point]
    const previous = found.at(-1)?.[1]
    const chosen = own ?? previous
    return chosen === undefined ? found : [...found, [point, chosen]]
  }, [])

const isResponsiveName = (name: string): name is ResponsiveName => Object.hasOwn(responsiveTable, name)

const isInlineName = (name: string): name is InlineName => Object.hasOwn(inlineTable, name)

type FlexName = keyof typeof flexTable

const ruleTable = { ...responsiveTable, ...flexTable }

const responsiveStyles = (name: ResponsiveName | FlexName, value: Responsive<StyleValue>): ReadonlyArray<Sx> => {
  const [kind, property] = ruleTable[name]
  const resolve = resolvers[kind]
  if (!isResponsive(value)) return [setStyle([property, resolve(value)])]

  return [
    stylePropRules[name],
    setVars(
      ...cascade(value).map(([point, chosen]): readonly [string, string] => [
        stylePropVars[`${name}_${point}`],
        resolve(chosen)
      ])
    )
  ]
}

const inlineStyles = (name: InlineName, value: StyleValue): ReadonlyArray<Sx> => {
  const [kind, property] = inlineTable[name]

  return [setStyle([property, resolvers[kind](value)])]
}

export type FlexProps = {
  readonly gap?: Responsive<StyleValue>
  readonly rowGap?: Responsive<StyleValue>
  readonly columnGap?: Responsive<StyleValue>
  readonly align?: Responsive<string>
  readonly justify?: Responsive<string>
  readonly wrap?: Responsive<string>
  readonly direction?: Responsive<string>
}

const flexNames: { readonly [Name in keyof FlexProps]-?: FlexName } = {
  gap: "fxGap",
  rowGap: "fxRowGap",
  columnGap: "fxColumnGap",
  align: "fxAlign",
  justify: "fxJustify",
  wrap: "fxWrap",
  direction: "fxDirection"
}

const isFlexProp = (name: string): name is keyof FlexProps => Object.hasOwn(flexNames, name)

export const flexStyles = (props: FlexProps): ReadonlyArray<Sx> =>
  Object.entries(props).flatMap(([name, value]: readonly [string, Responsive<StyleValue>]) =>
    isFlexProp(name) ? responsiveStyles(flexNames[name], value) : []
  )

export const everyPoint = <Value>(value: Responsive<Value>): ReadonlyArray<readonly [Point, Value]> =>
  cascade(isResponsive(value) ? value : { base: value })

export const styleProps = (props: StyleProps): ReadonlyArray<Sx> =>
  Object.entries(props).flatMap(([name, value]: readonly [string, Responsive<StyleValue>]) => {
    if (isResponsiveName(name)) return responsiveStyles(name, value)
    if (isInlineName(name) && !isResponsive(value)) return inlineStyles(name, value)

    return []
  })

export const stylePropNames: ReadonlyArray<keyof StyleProps> = [
  ...Struct.keys(responsiveTable),
  ...Struct.keys(inlineTable)
]
