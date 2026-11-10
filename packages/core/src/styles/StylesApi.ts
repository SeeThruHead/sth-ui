import type { StyleXStyles } from "@stylexjs/stylex"
import type { Attribute, ChildAttribute, HtmlBuilder } from "foldkit/html"
import { isCompiled, isInline } from "./inline.ts"
import type { Inline } from "./inline.ts"
import { shared } from "./shared.ts"
import { stylexClass } from "./stylexClass.ts"
import type { Sx } from "./inline.ts"
import { styleProps } from "./styleProps.ts"
import type { StyleProps } from "./styleProps.ts"

export type { Inline, Sx } from "./inline.ts"

export type ElementAttribute<M> = Attribute<M> | ChildAttribute

export { mapDefined, setDefinedStyle, setDefinedVars, setStyle, setVars } from "./inline.ts"

export type PartStyle = StyleXStyles | Inline | ReadonlyArray<Sx>

export type PartStyles<Part extends string> = { readonly [Name in Part]?: PartStyle }

export type PartAttributes<Part extends string> = { readonly [Name in Part]?: { readonly [attribute: string]: string } }

export type Mod = { readonly [name: string]: string | number | boolean | undefined }

export type StylesApiProps<Part extends string> = StyleProps & {
  readonly mod?: Mod
  readonly styles?: PartStyles<Part>
  readonly unstyled?: boolean
  readonly attributes?: PartAttributes<Part>
  readonly bind?: ReadonlyArray<ChildAttribute>
  readonly id?: string
}

export type ComponentConfig<Options, Part extends string> = {
  readonly defaultProps?: Partial<Options>
  readonly styles?: PartStyles<Part>
}

export type GetStyles<M, Part extends string> = (
  part: Part,
  ...styles: ReadonlyArray<Sx>
) => ReadonlyArray<ElementAttribute<M>>

const isList = (style: PartStyle | undefined): style is ReadonlyArray<Sx> => Array.isArray(style)

export const listOf = (style: PartStyle | undefined): ReadonlyArray<Sx> => (isList(style) ? style : [style])

const dataName = (name: string): string => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

const modAttributes = <M>(h: HtmlBuilder<M>, mod: Mod | undefined): ReadonlyArray<Attribute<M>> =>
  Object.entries(mod ?? {}).flatMap(([name, value]) => {
    if (value === undefined || value === false) return []

    return [h.DataAttribute(dataName(name), value === true ? "" : String(value))]
  })

export const withDefaults = <Options, Props extends Options>(
  config: ComponentConfig<Options, string> | undefined,
  props: Props
): Props => (config === undefined ? props : { ...config.defaultProps, ...props })

export const sx = <M>(h: HtmlBuilder<M>, ...styles: ReadonlyArray<Sx>): ReadonlyArray<Attribute<M>> => {
  const values = styles.filter(isInline).flatMap((style) => style.values)
  const classes = [h.Class(stylexClass(shared.borderBox, ...styles.filter(isCompiled)))]
  if (values.length === 0) return classes

  return [...classes, h.Style(Object.fromEntries(values))]
}

export const stylesApi =
  <M, Part extends string>(
    h: HtmlBuilder<M>,
    props: StylesApiProps<Part>,
    config: { readonly styles?: PartStyles<Part> } | undefined,
    root: Part
  ): GetStyles<M, Part> =>
  (part, ...styles) => {
    const own = props.unstyled === true ? styles.filter(isInline) : styles
    const extra = Object.entries(props.attributes?.[part] ?? {}).map(([name, value]) => h.Attribute(name, value))

    return [
      ...(part === root ? (props.bind ?? []) : []),
      ...sx(
        h,
        ...own,
        ...listOf(config?.styles?.[part]),
        ...listOf(props.styles?.[part]),
        ...(part === root ? styleProps(props) : [])
      ),
      ...(part === root && props.id !== undefined ? [h.Id(props.id)] : []),
      ...(part === root ? modAttributes(h, props.mod) : []),
      ...extra
    ]
  }

export type ForwardedPart = {
  readonly styles: PartStyles<"root">
  readonly attributes: PartAttributes<"root">
  readonly unstyled?: boolean
}

export const forwardPart = <Part extends string>(
  props: StylesApiProps<Part>,
  config: { readonly styles?: PartStyles<Part> } | undefined,
  part: Part,
  child: { readonly styles?: PartStyles<"root">; readonly attributes?: PartAttributes<"root"> },
  ...own: ReadonlyArray<Sx>
): ForwardedPart => ({
  styles: {
    root: [...own, ...listOf(child.styles?.root), ...listOf(config?.styles?.[part]), ...listOf(props.styles?.[part])]
  },
  attributes: { root: { ...child.attributes?.root, ...props.attributes?.[part] } },
  ...(props.unstyled === undefined ? {} : { unstyled: props.unstyled })
})

export const mergeStyles = <Part extends string>(
  parts: ReadonlyArray<Part>,
  ...sources: ReadonlyArray<PartStyles<Part> | undefined>
): PartStyles<Part> =>
  parts.reduce<PartStyles<Part>>(
    (merged, part) => ({ ...merged, [part]: sources.flatMap((source) => listOf(source?.[part])) }),
    {}
  )
