import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, shadowValue, spacing, styleProps } from "../../styles/styleProps.ts"
import type { StyleProps, StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, radius } from "../../theme/tokens.stylex.ts"
import type { BoxElement } from "../Box/Box.ts"
import { cardVars } from "./Card.stylex.ts"

export type CardPart = "root" | "section"

export type CardOrientation = "horizontal" | "vertical"

export type CardSection = StyleProps & {
  readonly _tag: "CardSection"
  readonly withBorder?: boolean
  readonly inheritPadding?: boolean
  readonly component?: BoxElement
  readonly styles?: Sx
  readonly children: ReadonlyArray<Child>
}

export type CardOptions = {
  readonly shadow?: string
  readonly radius?: StyleValue
  readonly withBorder?: boolean
  readonly padding?: StyleValue
  readonly orientation?: CardOrientation
  readonly component?: BoxElement
}

export type CardProps = CardOptions &
  StylesApiProps<CardPart> & { readonly children: ReadonlyArray<Child | CardSection> }

export type CardConfig = ComponentConfig<CardOptions, CardPart>

export const cardSection = (section: Omit<CardSection, "_tag">): CardSection => ({ _tag: "CardSection", ...section })

const isSection = (child: Child | CardSection): child is CardSection => Predicate.isTagged(child, "CardSection")

const edge = `calc(${cardVars.padding} * -1)`

const borderColor = `light-dark(${palette.gray3}, ${palette.dark4})`

const styles = stylex.create({
  root: {
    [cardVars.padding]: "1rem",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: cardVars.padding,
    color: colors.text,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    borderRadius: radius.default,
    WebkitTapHighlightColor: "transparent",
    textDecoration: "none"
  },
  horizontal: { flexDirection: "row" },
  border: { borderWidth: "1px", borderStyle: "solid", borderColor },
  section: { display: "block", marginInline: edge }
})

const vertical = stylex.create({
  padded: { paddingInline: cardVars.padding },
  bordered: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: borderColor,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: borderColor
  },
  first: { marginTop: edge, borderTopStyle: "none" },
  last: { marginBottom: edge, borderBottomStyle: "none" },
  afterSection: { borderTopStyle: "none" }
})

const horizontal = stylex.create({
  base: { marginBlock: edge, marginInline: 0 },
  padded: { paddingBlock: cardVars.padding },
  bordered: {
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: borderColor,
    borderInlineEndWidth: "1px",
    borderInlineEndStyle: "solid",
    borderInlineEndColor: borderColor
  },
  first: { marginInlineStart: edge, borderInlineStartStyle: "none" },
  last: { marginInlineEnd: edge, borderInlineEndStyle: "none" },
  afterSection: { borderInlineStartStyle: "none" }
})

type Place = { readonly first: boolean; readonly last: boolean; readonly afterSection: boolean }

const sectionStyles = (section: CardSection, place: Place, orientation: CardOrientation) => {
  const set = orientation === "horizontal" ? horizontal : vertical

  return [
    styles.section,
    orientation === "horizontal" && horizontal.base,
    section.inheritPadding === true && set.padded,
    section.withBorder === true && set.bordered,
    place.first && set.first,
    place.last && set.last,
    place.afterSection && set.afterSection
  ]
}

const sectionView = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, CardPart>,
  section: CardSection,
  place: Place,
  orientation: CardOrientation
): Html =>
  h[section.component ?? "div"](
    [
      ...getStyles("section", ...sectionStyles(section, place, orientation), section.styles, ...styleProps(section)),
      h.DataAttribute("orientation", orientation),
      ...(place.first ? [h.DataAttribute("first-section", "")] : []),
      ...(place.last ? [h.DataAttribute("last-section", "")] : []),
      ...(section.withBorder === true ? [h.DataAttribute("with-border", "")] : []),
      ...(section.inheritPadding === true ? [h.DataAttribute("inherit-padding", "")] : [])
    ],
    section.children
  )

export const Card =
  (config: { readonly Card?: CardConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CardProps): Html => {
    const props = withDefaults(config.Card, input)
    const getStyles = stylesApi<M, CardPart>(h, props, config.Card, "root")
    const orientation = props.orientation ?? "vertical"
    const count = props.children.length
    const content = props.children.map((child, index) => {
      if (!isSection(child)) return child
      const previous = props.children[index - 1]
      const place = {
        first: index === 0,
        last: index === count - 1,
        afterSection: previous !== undefined && isSection(previous)
      }

      return sectionView(h, getStyles, child, place, orientation)
    })

    return h[props.component ?? "div"](
      [
        ...getStyles(
          "root",
          styles.root,
          orientation === "horizontal" && styles.horizontal,
          props.withBorder === true && styles.border,
          setDefinedVars([cardVars.padding, mapDefined(props.padding, spacing)]),
          setDefinedStyle(
            ["borderRadius", mapDefined(props.radius, radiusValue)],
            ["boxShadow", mapDefined(props.shadow, shadowValue)]
          )
        ),
        h.DataAttribute("orientation", orientation),
        ...(props.withBorder === true ? [h.DataAttribute("with-border", "")] : [])
      ],
      content
    )
  }
