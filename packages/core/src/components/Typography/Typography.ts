import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, StyleXStyles } from "@stylexjs/stylex"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { stylexClass } from "../../styles/stylexClass.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, font, fontSize, fontWeight, heading, lineHeight, radius, space } from "../../theme/tokens.stylex.ts"
import { isVoid, parseTypography } from "./parse.ts"
import type { ContainerTag, TypographyElement, TypographyNode, VoidTag } from "./parse.ts"
import { typographyVars } from "./Typography.stylex.ts"

export type TypographyPart = "root"

export type TypographyProps = StylesApiProps<TypographyPart> & {
  readonly html?: string
  readonly children?: ReadonlyArray<Child>
}

export type TypographyConfig = ComponentConfig<object, TypographyPart>

const tableBorder = `light-dark(${palette.gray3}, ${palette.dark4})`

const cellPadding = { paddingBlock: space.xs, paddingInline: space.sm }

const styles = stylex.create({
  root: {},
  first: { marginTop: 0 },
  last: { marginBottom: 0 },
  heading: { marginBottom: space.xs, textWrap: heading.wrap, fontFamily: font.headings, fontWeight: heading.weight },
  h1: { marginTop: `calc(1.5 * ${space.xl})`, fontSize: heading.h1Size, lineHeight: heading.h1Line },
  h2: { marginTop: space.xl, fontSize: heading.h2Size, lineHeight: heading.h2Line },
  h3: { marginTop: `calc(0.8 * ${space.xl})`, fontSize: heading.h3Size, lineHeight: heading.h3Line },
  h4: { marginTop: `calc(0.8 * ${space.xl})`, fontSize: heading.h4Size, lineHeight: heading.h4Line },
  h5: { marginTop: `calc(0.5 * ${space.xl})`, fontSize: heading.h5Size, lineHeight: heading.h5Line },
  h6: { marginTop: `calc(0.5 * ${space.xl})`, fontSize: heading.h6Size, lineHeight: heading.h6Line },
  img: { maxWidth: "100%", marginBottom: space.xs },
  p: { marginTop: 0, marginBottom: space.lg },
  mark: {
    backgroundColor: `light-dark(${palette.yellow2}, ${palette.yellow5})`,
    color: `light-dark(currentColor, ${palette.black})`
  },
  a: { color: colors.anchor, textDecoration: { default: "none", ":hover": "underline" } },
  hr: {
    marginTop: space.md,
    marginBottom: space.md,
    borderWidth: 0,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `light-dark(${palette.gray3}, ${palette.dark3})`
  },
  pre: {
    padding: space.xs,
    lineHeight: lineHeight.md,
    marginInline: 0,
    marginTop: space.md,
    marginBottom: space.md,
    overflowX: "auto",
    fontFamily: font.mono,
    fontSize: fontSize.xs,
    borderRadius: radius.sm,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`
  },
  kbd: {
    fontFamily: font.mono,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.bold,
    paddingBlock: "3px",
    paddingInline: "5px",
    fontSize: "12px",
    borderRadius: radius.sm,
    borderStyle: "solid",
    borderTopWidth: "1px",
    borderInlineWidth: "1px",
    borderBottomWidth: "3px",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark3})`,
    color: `light-dark(${palette.gray7}, ${palette.dark0})`,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark5})`
  },
  code: {
    lineHeight: lineHeight.md,
    paddingBlock: "1px",
    paddingInline: "5px",
    borderRadius: radius.sm,
    fontFamily: font.mono,
    fontSize: fontSize.xs,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark5})`,
    color: `light-dark(${palette.black}, ${palette.white})`
  },
  codeInPre: { backgroundColor: "transparent", padding: 0, borderRadius: 0, color: "inherit", borderWidth: 0 },
  list: { marginBottom: space.md, paddingInlineStart: space.xl, listStylePosition: "outside" },
  table: { width: "100%", borderCollapse: "collapse", captionSide: "bottom", marginBottom: space.md },
  caption: { marginTop: space.xs, fontSize: fontSize.sm, color: colors.dimmed },
  th: { textAlign: "start", fontWeight: "bold", fontSize: fontSize.sm, ...cellPadding },
  headCell: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: tableBorder },
  footCell: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: tableBorder },
  td: {
    ...cellPadding,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: tableBorder,
    fontSize: fontSize.sm
  },
  lastRowCell: { borderBottomWidth: 0 },
  details: {
    marginBottom: space.md,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: tableBorder,
    borderRadius: radius.default
  },
  summary: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    cursor: "pointer",
    fontWeight: 600,
    listStyle: "none",
    [typographyVars.summaryHover]: {
      default: "transparent",
      ":hover": `light-dark(${palette.gray1}, ${palette.dark5})`
    },
    "::-webkit-details-marker": { display: "none" },
    "::before": {
      content: "''",
      flexShrink: 0,
      width: "1.25rem",
      height: `calc(1em * ${lineHeight.md})`,
      borderRadius: radius.sm,
      backgroundColor: typographyVars.summaryHover
    },
    "::after": {
      content: "''",
      position: "absolute",
      insetInlineStart: "0.4375rem",
      top: "50%",
      width: 0,
      height: 0,
      borderStyle: "solid",
      borderTopWidth: "5px",
      borderBottomWidth: "5px",
      borderRightWidth: 0,
      borderLeftWidth: "6px",
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
      borderRightColor: "transparent",
      borderLeftColor: "currentColor",
      transform: {
        default: "translateY(-50%)",
        [stylex.when.ancestor(":is([open])")]: "translateY(-50%) rotate(90deg)"
      }
    }
  },
  blockquote: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.md,
    marginBlock: space.md,
    marginInline: 0,
    borderRadius: radius.sm,
    paddingBlock: space.md,
    paddingInline: space.lg,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`
  }
})

const tagStyles: Readonly<Partial<Record<ContainerTag | VoidTag, ReadonlyArray<Style>>>> = {
  h1: [styles.heading, styles.h1],
  h2: [styles.heading, styles.h2],
  h3: [styles.heading, styles.h3],
  h4: [styles.heading, styles.h4],
  h5: [styles.heading, styles.h5],
  h6: [styles.heading, styles.h6],
  img: [styles.img],
  p: [styles.p],
  mark: [styles.mark],
  a: [styles.a],
  hr: [styles.hr],
  pre: [styles.pre],
  kbd: [styles.kbd],
  code: [styles.code],
  ul: [styles.list],
  ol: [styles.list],
  table: [styles.table],
  caption: [styles.caption],
  th: [styles.th],
  td: [styles.td],
  details: [styles.details, stylex.defaultMarker()],
  summary: [styles.summary],
  blockquote: [styles.blockquote]
}

type Style = CompiledStyles | StyleXStyles | null

type Context = { readonly parent: string; readonly section: string; readonly lastRow: boolean }

type Place = Context & { readonly first: boolean; readonly last: boolean }

const isTaskList = (element: TypographyElement): boolean =>
  element.attributes.some(([name, value]) => name === "data-type" && value === "taskList")

const ownStyles = (element: TypographyElement, place: Place): ReadonlyArray<Style> => {
  if (element.tag === "code" && place.parent === "pre") return [styles.codeInPre]
  if (isTaskList(element)) return []

  return tagStyles[element.tag] ?? []
}

const cellStyles = (element: TypographyElement, place: Place): ReadonlyArray<Style> => [
  element.tag === "th" && place.section === "thead" ? styles.headCell : null,
  element.tag === "th" && place.section === "tfoot" ? styles.footCell : null,
  element.tag === "td" && place.lastRow ? styles.lastRowCell : null
]

const classOf = (element: TypographyElement, place: Place): string =>
  stylexClass(
    ...ownStyles(element, place),
    ...cellStyles(element, place),
    place.first ? styles.first : null,
    place.last ? styles.last : null
  )

const sections = ["thead", "tbody", "tfoot"]

const contextIn = (element: TypographyElement, place: Place): Context => ({
  parent: element.tag,
  section: sections.includes(element.tag) ? element.tag : place.section,
  lastRow: element.tag === "tr" ? place.last : place.lastRow
})

const isElement = (node: TypographyNode): node is TypographyElement => node._tag === "Element"

const renderNodes = <M>(
  h: HtmlBuilder<M>,
  nodes: ReadonlyArray<TypographyNode>,
  context: Context
): ReadonlyArray<Child> => {
  const elements = nodes.filter(isElement)

  return nodes.map((node) => {
    if (node._tag === "Text") return node.text
    const place = { ...context, first: elements[0] === node, last: elements.at(-1) === node }

    return renderElement(h, node, place)
  })
}

const renderElement = <M>(h: HtmlBuilder<M>, element: TypographyElement, place: Place): Html => {
  const attributes: ReadonlyArray<Attribute<M>> = [
    h.Class(classOf(element, place)),
    ...element.attributes.map(([name, value]) => h.Attribute(name, value))
  ]
  if (isVoid(element.tag)) return h[element.tag](attributes)

  return h[element.tag](attributes, renderNodes(h, element.children, contextIn(element, place)))
}

export const Typography =
  (config: { readonly Typography?: TypographyConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TypographyProps): Html => {
    const props = withDefaults(config.Typography, input)
    const getStyles = stylesApi<M, TypographyPart>(h, props, config.Typography, "root")
    const parsed = props.html === undefined ? [] : parseTypography(props.html)

    return h.div(getStyles("root", styles.root), [
      ...(props.children ?? []),
      ...renderNodes(h, parsed, { parent: "root", section: "", lastRow: false })
    ])
  }
