import * as stylex from "@stylexjs/stylex"
import { Extension } from "@tiptap/core"
import { Array as Arr, Option } from "effect"
import type { Node as ProseNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { stylexClass } from "@sth-ui/core/styles/stylexClass.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors, font, fontSize, heading, lineHeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { tokenDecorations } from "./highlight.ts"

const styles = stylex.create({
  editor: {
    position: "relative",
    outline: 0,
    padding: space.md,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    fontVariantLigatures: "none"
  },
  paragraph: { marginTop: 0, marginBottom: "7px" },
  listParagraph: { margin: 0 },
  placeholder: {
    "::before": {
      content: "attr(data-placeholder)",
      pointerEvents: "none",
      userSelect: "none",
      float: "left",
      height: 0,
      color: colors.placeholder
    }
  },
  heading: {
    marginTop: 0,
    marginBottom: space.xs,
    fontFamily: font.headings,
    textWrap: heading.wrap,
    fontWeight: heading.weight
  },
  h1: { fontSize: heading.h1Size, lineHeight: heading.h1Line },
  h2: { fontSize: heading.h2Size, lineHeight: heading.h2Line },
  h3: { fontSize: heading.h3Size, lineHeight: heading.h3Line },
  h4: { fontSize: heading.h4Size, lineHeight: heading.h4Line },
  h5: { fontSize: heading.h5Size, lineHeight: heading.h5Line },
  h6: { fontSize: heading.h6Size, lineHeight: heading.h6Line },
  list: { marginTop: 0, marginBottom: space.md, paddingInlineStart: space.xl, listStylePosition: "outside" },
  listItem: { marginTop: "2px" },
  blockquote: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.md,
    marginBlock: space.md,
    marginInline: 0,
    borderRadius: radius.sm,
    paddingBlock: space.md,
    paddingInline: space.lg,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`
  },
  codeBlock: {
    fontFamily: font.mono,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    borderRadius: radius.default,
    paddingBlock: space.sm,
    paddingInline: space.md,
    marginBlock: space.md,
    overflowX: "auto",
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`,
    color: `light-dark(${palette.gray9}, ${palette.dark1})`
  },
  rule: {
    marginBlock: space.md,
    borderWidth: 0,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `light-dark(${palette.gray3}, ${palette.dark3})`
  },
  details: {
    marginBottom: space.sm,
    padding: space.sm,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    borderRadius: radius.default
  },
  detailsSummary: { fontWeight: 600 },
  table: {
    width: "100%",
    margin: 0,
    marginBottom: space.sm,
    borderCollapse: "collapse",
    tableLayout: "fixed",
    overflow: "hidden"
  },
  cell: {
    position: "relative",
    minWidth: "1em",
    paddingBlock: "7px",
    paddingInline: space.xs,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    verticalAlign: "top",
    boxSizing: "border-box"
  },
  headerCell: { textAlign: "start", fontWeight: 700 },
  image: { maxWidth: "100%", marginBottom: space.xs },
  uploading: { opacity: 0.5 },
  uploadError: { outlineWidth: "2px", outlineStyle: "solid", outlineColor: colors.error },
  last: { marginBottom: 0 },
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
  link: { color: colors.anchor, textDecoration: { default: "none", ":hover": "underline" } },
  highlight: {
    backgroundColor: `light-dark(${palette.yellow2}, ${palette.yellow5})`,
    color: `light-dark(currentColor, ${palette.black})`
  }
})

const className = stylexClass

export const editorClass = className(styles.editor)

const headings = [styles.h1, styles.h2, styles.h3, styles.h4, styles.h5, styles.h6] as const

export type Switches = { readonly typography: boolean; readonly highlighter: Option.Option<object> }

type Place = {
  readonly node: ProseNode
  readonly parent: ProseNode
  readonly last: boolean
  readonly doc: ProseNode
  readonly typography: boolean
}

const typographic = <S>(place: Place, style: S): S | null => (place.typography ? style : null)

const endOf = (place: Place) => (place.last && place.parent === place.doc ? styles.last : null)

const inListItem = (place: Place): boolean =>
  place.parent.type.name.endsWith("istItem") || place.parent.type.name === "taskItem"

const paragraphClass = (place: Place): string => {
  if (inListItem(place)) return className(typographic(place, styles.listParagraph))
  const placeholder = place.doc.childCount === 1 && place.node.childCount === 0 ? styles.placeholder : null

  return className(typographic(place, styles.paragraph), placeholder, typographic(place, endOf(place)))
}

const headingOf = (level: unknown) => Option.getOrNull(Arr.get(headings, Number(level) - 1))

const blockClasses: Readonly<Record<string, (place: Place) => string>> = {
  paragraph: paragraphClass,
  heading: (place) =>
    className(
      ...[styles.heading, headingOf(place.node.attrs["level"]), endOf(place)].map((style) => typographic(place, style))
    ),
  bulletList: (place) => className(typographic(place, styles.list), typographic(place, endOf(place))),
  orderedList: (place) => className(typographic(place, styles.list), typographic(place, endOf(place))),
  listItem: (place) => className(typographic(place, styles.listItem)),
  blockquote: (place) => className(typographic(place, styles.blockquote), typographic(place, endOf(place))),
  codeBlock: (place) => className(styles.codeBlock, endOf(place)),
  horizontalRule: (place) => className(typographic(place, styles.rule)),
  details: (place) => className(styles.details, endOf(place)),
  detailsSummary: () => className(styles.detailsSummary),
  table: () => className(styles.table),
  image: (place) =>
    className(
      typographic(place, styles.image),
      place.node.attrs["uploading"] === true ? styles.uploading : null,
      place.node.attrs["uploadError"] === true ? styles.uploadError : null
    ),
  tableCell: () => className(styles.cell),
  tableHeader: () => className(styles.cell, styles.headerCell)
}

const blockClass = (place: Place): string =>
  Option.match(Option.fromNullishOr(blockClasses[place.node.type.name]), {
    onNone: () => "",
    onSome: (classOf) => classOf(place)
  })

const markClasses: Readonly<Record<string, string>> = {
  code: className(styles.code),
  link: className(styles.link),
  highlight: className(styles.highlight)
}

const textDecorations = (node: ProseNode, from: number, switches: Switches): ReadonlyArray<Decoration> =>
  node.marks.flatMap((mark) => {
    const found = switches.typography ? markClasses[mark.type.name] : undefined
    return found === undefined ? [] : [Decoration.inline(from, from + node.nodeSize, { class: found })]
  })

const childrenOf = (node: ProseNode): ReadonlyArray<ProseNode> =>
  Array.from({ length: node.childCount }, (_, index) => node.child(index))

const tokensIn = (node: ProseNode, at: number, switches: Switches): ReadonlyArray<Decoration> =>
  node.type.name === "codeBlock"
    ? Option.toArray(switches.highlighter).flatMap((highlighter) => tokenDecorations(highlighter, node, at + 1))
    : []

const ownDecorations = (place: Place, at: number): ReadonlyArray<Decoration> =>
  [blockClass(place)]
    .filter((name) => name !== "")
    .map((name) => Decoration.node(at, at + place.node.nodeSize, { class: name }))

const decorationsIn = (
  parent: ProseNode,
  start: number,
  doc: ProseNode,
  switches: Switches
): ReadonlyArray<Decoration> =>
  childrenOf(parent).reduce<{ readonly at: number; readonly found: ReadonlyArray<Decoration> }>(
    (state, node, index) => {
      const place = { node, parent, last: index === parent.childCount - 1, doc, typography: switches.typography }
      const own = node.isText ? textDecorations(node, state.at, switches) : ownDecorations(place, state.at)
      const inner = node.isText ? [] : decorationsIn(node, state.at + 1, doc, switches)

      return {
        at: state.at + node.nodeSize,
        found: [...state.found, ...own, ...tokensIn(node, state.at, switches), ...inner]
      }
    },
    { at: start, found: [] }
  ).found

export const decorate = (doc: ProseNode, switches: Switches): DecorationSet =>
  DecorationSet.create(doc, [...decorationsIn(doc, 0, doc, switches)])

const contentStylesKey = new PluginKey<DecorationSet>("sthContentStyles")

export const contentStyles = (switches: Switches) =>
  Extension.create({
    name: "sthContentStyles",
    addProseMirrorPlugins: () => [
      new Plugin({
        key: contentStylesKey,
        state: {
          init: (_, state) => decorate(state.doc, switches),
          apply: (transaction, previous, _, state) =>
            transaction.docChanged ? decorate(state.doc, switches) : previous
        },
        props: { decorations: (state) => contentStylesKey.getState(state) }
      })
    ]
  })
