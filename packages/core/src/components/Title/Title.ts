import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { font, fontSize, heading } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { clampStyles, wraps } from "../Text/Text.ts"
import type { TextWrap } from "../Text/Text.ts"

export type TitlePart = "root"

export type TitleOrder = 1 | 2 | 3 | 4 | 5 | 6

export type TitleSize = keyof typeof headingSizes | keyof typeof themeSizes | number | (string & {})

export type TitleOptions = {
  readonly order?: TitleOrder
  readonly size?: TitleSize
  readonly lineClamp?: number
  readonly textWrap?: TextWrap
}

export type TitleProps = TitleOptions & StylesApiProps<TitlePart> & { readonly children: ReadonlyArray<Child> }

export type TitleConfig = ComponentConfig<TitleOptions, TitlePart>

const styles = stylex.create({
  root: { margin: 0, fontFamily: font.headings, fontWeight: heading.weight, textWrap: heading.wrap }
})

const headingSizes = stylex.create({
  h1: { fontSize: heading.h1Size, lineHeight: heading.h1Line },
  h2: { fontSize: heading.h2Size, lineHeight: heading.h2Line },
  h3: { fontSize: heading.h3Size, lineHeight: heading.h3Line },
  h4: { fontSize: heading.h4Size, lineHeight: heading.h4Line },
  h5: { fontSize: heading.h5Size, lineHeight: heading.h5Line },
  h6: { fontSize: heading.h6Size, lineHeight: heading.h6Line }
})

const themeSizes = stylex.create({
  xs: { fontSize: fontSize.xs },
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
  xl: { fontSize: fontSize.xl }
})

const headingOf = (order: TitleOrder) => headingSizes[`h${order}`]

const isHeadingSize = (size: string): size is keyof typeof headingSizes => Object.hasOwn(headingSizes, size)

const isThemeSize = (size: string): size is keyof typeof themeSizes => Object.hasOwn(themeSizes, size)

const sizeStyle = (size: TitleSize | undefined) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setStyle(["fontSize", rem(size)])
  if (isHeadingSize(size)) return headingSizes[size]
  if (isThemeSize(size)) return themeSizes[size]

  return setStyle(["fontSize", size])
}

export const Title =
  (config: { readonly Title?: TitleConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TitleProps): Html => {
    const props = withDefaults(config.Title, input)
    const order = props.order ?? 1
    const getStyles = stylesApi<M, TitlePart>(h, props, config.Title, "root")

    return h[`h${order}`](
      getStyles(
        "root",
        styles.root,
        headingOf(order),
        sizeStyle(props.size),
        ...clampStyles(props.lineClamp),
        props.textWrap === undefined ? null : wraps[props.textWrap]
      ).concat([
        h.DataAttribute("order", String(order)),
        ...(props.lineClamp === undefined ? [] : [h.DataAttribute("line-clamp", "")])
      ]),
      props.children
    )
  }
