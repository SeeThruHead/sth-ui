import * as stylex from "@stylexjs/stylex"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, fontSize, fontWeight, lineHeight, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { ScrollArea } from "../ScrollArea/ScrollArea.ts"
import type { ScrollAreaConfig, ScrollAreaProps } from "../ScrollArea/ScrollArea.ts"
import { tableVars } from "./Table.stylex.ts"

export type TablePart = "table" | "thead" | "tbody" | "tfoot" | "tr" | "th" | "td" | "caption"

export type TableOptions = {
  readonly variant?: "default" | "vertical"
  readonly layout?: "auto" | "fixed"
  readonly captionSide?: "top" | "bottom"
  readonly borderColor?: string
  readonly withTableBorder?: boolean
  readonly withColumnBorders?: boolean
  readonly withRowBorders?: boolean
  readonly horizontalSpacing?: StyleValue
  readonly verticalSpacing?: StyleValue
  readonly striped?: boolean | "odd" | "even"
  readonly stripedColor?: string
  readonly highlightOnHover?: boolean
  readonly highlightOnHoverColor?: string
  readonly stickyHeader?: boolean
  readonly stickyHeaderOffset?: number | string
  readonly tabularNums?: boolean
}

type Section = "head" | "body" | "foot"

type CellPlace = { readonly section: Section; readonly column: number; readonly columns: number }

type RowPlace = { readonly section: Section; readonly index: number; readonly rows: number }

export type TableCell = (place: CellPlace) => Html

export type TableRow = (place: RowPlace) => Html

export type CellOptions<M> = {
  readonly w?: number | string
  readonly colSpan?: number
  readonly rowSpan?: number
  readonly attributes?: ReadonlyArray<Attribute<M>>
}

export type RowOptions<M> = { readonly bg?: string; readonly attributes?: ReadonlyArray<Attribute<M>> }

export type TableBuilder<M> = {
  readonly caption: (children: ReadonlyArray<Child>) => Html
  readonly thead: (rows: ReadonlyArray<TableRow>) => Html
  readonly tbody: (rows: ReadonlyArray<TableRow>) => Html
  readonly tfoot: (rows: ReadonlyArray<TableRow>) => Html
  readonly tr: (cells: ReadonlyArray<TableCell>, options?: RowOptions<M>) => TableRow
  readonly th: (children: ReadonlyArray<Child>, options?: CellOptions<M>) => TableCell
  readonly td: (children: ReadonlyArray<Child>, options?: CellOptions<M>) => TableCell
}

export type TableData = {
  readonly caption?: Child
  readonly head?: ReadonlyArray<Child>
  readonly body?: ReadonlyArray<ReadonlyArray<Child>>
  readonly foot?: ReadonlyArray<Child>
}

export type TableProps<M> = TableOptions &
  StylesApiProps<TablePart> & {
    readonly data?: TableData
    readonly children?: (t: TableBuilder<M>) => ReadonlyArray<Html>
  }

export type TableConfig = ComponentConfig<TableOptions, TablePart>

const styles = stylex.create({
  table: {
    [tableVars.horizontalSpacing]: space.xs,
    [tableVars.verticalSpacing]: "7px",
    [tableVars.hoverColor]: `light-dark(${palette.gray1}, ${palette.dark5})`,
    [tableVars.stripedColor]: `light-dark(${palette.gray0}, ${palette.dark6})`,
    [tableVars.borderColor]: `light-dark(${palette.gray3}, ${palette.dark4})`,
    width: "100%",
    borderCollapse: "collapse",
    borderSpacing: 0,
    lineHeight: lineHeight.md,
    fontSize: fontSize.sm,
    tableLayout: tableVars.layout,
    captionSide: tableVars.captionSide,
    borderWidth: 0
  },
  tableBorder: { borderWidth: "1px", borderStyle: "solid", borderColor: tableVars.borderColor },
  tabular: { fontVariantNumeric: "tabular-nums" },
  th: { textAlign: "start" },
  cell: {
    paddingBlock: tableVars.verticalSpacing,
    paddingInline: tableVars.horizontalSpacing
  },
  columnStart: {
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: tableVars.borderColor
  },
  columnEnd: {
    borderInlineEndWidth: "1px",
    borderInlineEndStyle: "solid",
    borderInlineEndColor: tableVars.borderColor
  },
  vertical: { fontWeight: fontWeight.medium, backgroundColor: `light-dark(${palette.gray0}, ${palette.dark6})` },
  tr: { backgroundColor: "transparent", borderBottomWidth: 0 },
  rowBorder: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: tableVars.borderColor },
  striped: { backgroundColor: tableVars.stripedColor },
  hover: { backgroundColor: { default: "transparent", ":hover": tableVars.hoverColor } },
  hoverStriped: { backgroundColor: { default: tableVars.stripedColor, ":hover": tableVars.hoverColor } },
  thead: { top: tableVars.stickyOffset, zIndex: 3 },
  sticky: { position: "sticky" },
  stickyTh: { position: "sticky", top: tableVars.stickyOffset, backgroundColor: colors.body },
  stickyRowBorder: { boxShadow: `inset 0 -1px 0 ${tableVars.borderColor}` },
  stickyColumn: {
    "::before": {
      content: "''",
      position: "absolute",
      insetBlock: 0,
      insetInlineStart: "-0.5px",
      width: "1px",
      backgroundColor: tableVars.borderColor
    }
  },
  caption: { color: colors.dimmed },
  scrollContainer: { overflowX: "visible" },
  native: { overflowX: "auto" },
  scrollInner: { minWidth: tableVars.minWidth, maxHeight: tableVars.maxHeight }
})

const captionSides = stylex.create({
  top: { marginBottom: space.xs },
  bottom: { marginTop: space.xs }
})

const lengthOf = (value: number | string): string => (typeof value === "number" ? rem(value) : value)

const stripedOf = (striped: TableOptions["striped"]): "odd" | "even" | undefined => {
  if (striped === true) return "odd"
  if (striped === "even") return "even"

  return striped === "odd" ? "odd" : undefined
}

const isStriped = (striped: "odd" | "even" | undefined, place: RowPlace): boolean => {
  if (place.section !== "body") return false
  if (striped === undefined) return false

  return striped === "odd" ? place.index % 2 === 0 : place.index % 2 === 1
}

const hasRowBorder = (withRowBorders: boolean, place: RowPlace): boolean => {
  if (!withRowBorders) return false

  return place.section !== "body" || place.index < place.rows - 1
}

const builder = <M>(h: HtmlBuilder<M>, props: TableProps<M>, getStyles: GetStyles<M, TablePart>): TableBuilder<M> => {
  const striped = stripedOf(props.striped)
  const withRowBorders = props.withRowBorders !== false
  const withColumnBorders = props.withColumnBorders === true
  const stickyHeader = props.stickyHeader === true
  const highlight = props.highlightOnHover === true
  const vertical = props.variant === "vertical"
  const captionSide = props.captionSide ?? "bottom"
  const cell =
    (tag: "th" | "td") =>
    (children: ReadonlyArray<Child>, options: CellOptions<M> = {}): TableCell =>
    (place) => {
      const stickyCell = stickyHeader && place.section === "head"
      const first = place.column === 0
      const last = place.column === place.columns - 1

      return h[tag](
        [
          ...getStyles(
            tag,
            styles.cell,
            tag === "th" && styles.th,
            tag === "th" && vertical && styles.vertical,
            withColumnBorders && !stickyCell && !first && styles.columnStart,
            withColumnBorders && !stickyCell && !last && styles.columnEnd,
            tag === "th" && stickyCell && styles.stickyTh,
            tag === "th" && stickyCell && withRowBorders && styles.stickyRowBorder,
            tag === "th" && stickyCell && withColumnBorders && !first && styles.stickyColumn,
            setStyle(...(options.w === undefined ? [] : [["width", lengthOf(options.w)] as const]))
          ),
          ...(withColumnBorders ? [h.DataAttribute("with-column-border", "")] : []),
          ...(options.colSpan === undefined ? [] : [h.Attribute("colspan", String(options.colSpan))]),
          ...(options.rowSpan === undefined ? [] : [h.Attribute("rowspan", String(options.rowSpan))]),
          ...(options.attributes ?? [])
        ],
        children
      )
    }
  const section =
    (tag: "thead" | "tbody" | "tfoot", name: Section) =>
    (rows: ReadonlyArray<TableRow>): Html =>
      h[tag](
        [
          ...getStyles(tag, tag === "thead" && styles.thead, tag === "thead" && stickyHeader && styles.sticky),
          ...(tag === "thead" && stickyHeader ? [h.DataAttribute("sticky", "")] : [])
        ],
        rows.map((row, index) => row({ section: name, index, rows: rows.length }))
      )

  return {
    caption: (children) =>
      h.caption(
        [...getStyles("caption", styles.caption, captionSides[captionSide]), h.DataAttribute("side", captionSide)],
        children
      ),
    thead: section("thead", "head"),
    tbody: section("tbody", "body"),
    tfoot: section("tfoot", "foot"),
    tr:
      (cells, options = {}) =>
      (place) =>
        h.tr(
          [
            ...getStyles(
              "tr",
              styles.tr,
              hasRowBorder(withRowBorders, place) && !(stickyHeader && place.section === "head") && styles.rowBorder,
              isStriped(striped, place) && styles.striped,
              highlight && place.section === "body" && (isStriped(striped, place) ? styles.hoverStriped : styles.hover),
              setStyle(...(options.bg === undefined ? [] : [["backgroundColor", options.bg] as const]))
            ),
            ...(withRowBorders ? [h.DataAttribute("with-row-border", "")] : []),
            ...(striped === undefined ? [] : [h.DataAttribute("striped", striped)]),
            ...(highlight ? [h.DataAttribute("hover", "")] : []),
            ...(options.attributes ?? [])
          ],
          cells.map((cellAt, column) => cellAt({ section: place.section, column, columns: cells.length }))
        ),
    th: cell("th"),
    td: cell("td")
  }
}

const fromData = <M>(t: TableBuilder<M>, data: TableData): ReadonlyArray<Html> => [
  ...(data.caption === undefined ? [] : [t.caption([data.caption])]),
  ...(data.head === undefined ? [] : [t.thead([t.tr(data.head.map((item) => t.th([item])))])]),
  ...(data.body === undefined ? [] : [t.tbody(data.body.map((row) => t.tr(row.map((item) => t.td([item])))))]),
  ...(data.foot === undefined ? [] : [t.tfoot([t.tr(data.foot.map((item) => t.th([item])))])])
]

const colorOf = (color: string | undefined): string | undefined => mapDefined(color, themeColor)

export const Table =
  (config: { readonly Table?: TableConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TableProps<M>): Html => {
    const props = withDefaults(config.Table, input)
    const getStyles = stylesApi<M, TablePart>(h, props, config.Table, "table")
    const t = builder(h, props, getStyles)
    const highlightColor = props.highlightOnHover === true ? colorOf(props.highlightOnHoverColor) : undefined

    return h.table(
      [
        ...getStyles(
          "table",
          styles.table,
          props.withTableBorder === true && styles.tableBorder,
          props.tabularNums === true && styles.tabular,
          setDefinedVars(
            [tableVars.layout, props.layout],
            [tableVars.captionSide, props.captionSide],
            [tableVars.horizontalSpacing, mapDefined(props.horizontalSpacing, spacing)],
            [tableVars.verticalSpacing, mapDefined(props.verticalSpacing, spacing)],
            [tableVars.borderColor, colorOf(props.borderColor)],
            [
              tableVars.stripedColor,
              props.striped === undefined || props.striped === false ? undefined : colorOf(props.stripedColor)
            ],
            [tableVars.hoverColor, highlightColor],
            [
              tableVars.stickyOffset,
              props.stickyHeader === true ? mapDefined(props.stickyHeaderOffset, lengthOf) : undefined
            ]
          )
        ),
        h.DataAttribute("variant", props.variant ?? "default"),
        ...(props.withTableBorder === true ? [h.DataAttribute("with-table-border", "")] : []),
        ...(props.tabularNums === true ? [h.DataAttribute("tabular-nums", "")] : [])
      ],
      props.children === undefined ? fromData(t, props.data ?? {}) : props.children(t)
    )
  }

export type TableScrollContainerPart = "scrollContainer" | "scrollContainerInner"

export type TableScrollContainerProps<M> = StylesApiProps<TableScrollContainerPart> & {
  readonly minWidth: number | string
  readonly maxHeight?: number | string
  readonly scrollArea?: Pick<ScrollAreaProps<M>, "model" | "toParentMessage">
  readonly children: ReadonlyArray<Child>
}

export type TableScrollContainerConfig = ComponentConfig<object, TableScrollContainerPart>

export const TableScrollContainer =
  (config: { readonly TableScrollContainer?: TableScrollContainerConfig; readonly ScrollArea?: ScrollAreaConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TableScrollContainerProps<M>): Html => {
    const props = withDefaults(config.TableScrollContainer, input)
    const getStyles = stylesApi<M, TableScrollContainerPart>(h, props, config.TableScrollContainer, "scrollContainer")
    const inner = h.div(getStyles("scrollContainerInner", styles.scrollInner), props.children)
    const vars = setDefinedVars(
      [tableVars.minWidth, lengthOf(props.minWidth)],
      [tableVars.maxHeight, mapDefined(props.maxHeight, lengthOf)]
    )

    return props.scrollArea === undefined
      ? h.div(getStyles("scrollContainer", styles.scrollContainer, styles.native, vars), [inner])
      : h.div(getStyles("scrollContainer", styles.scrollContainer, vars), [
          ScrollArea(config)(h, {
            ...props.scrollArea,
            offsetScrollbars: props.maxHeight === undefined ? "x" : true,
            children: [inner]
          })
        ])
  }
