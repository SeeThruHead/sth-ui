import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { everyPoint, spacing } from "../../styles/styleProps.ts"
import type { Point, Responsive, StyleValue } from "../../styles/styleProps.ts"
import { setDefinedStyle, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { gridVars } from "./Grid.stylex.ts"
import { gridRules } from "./rules.ts"

export type GridPart = "root" | "inner" | "col" | "container"

export type ColSpan = number | "auto" | "content"

export type GridCol = {
  readonly _tag: "GridCol"
  readonly span?: Responsive<ColSpan>
  readonly offset?: Responsive<number>
  readonly order?: Responsive<number>
  readonly align?: Responsive<string>
  readonly children: ReadonlyArray<Child>
}

export type GridOptions = {
  readonly gutter?: Responsive<StyleValue>
  readonly grow?: boolean
  readonly justify?: string
  readonly align?: string
  readonly columns?: number
  readonly overflow?: string
  readonly type?: "media" | "container"
}

export type GridProps = GridOptions & StylesApiProps<GridPart> & { readonly children: ReadonlyArray<GridCol> }

export type GridConfig = ComponentConfig<GridOptions, GridPart>

export const gridCol = (col: Omit<GridCol, "_tag">): GridCol => ({ _tag: "GridCol", ...col })

const styles = stylex.create({
  root: { overflow: "visible" },
  inner: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "stretch",
    columnGap: gridVars.gap,
    rowGap: gridVars.gap
  },
  col: { flexShrink: 0 },
  container: { containerType: "inline-size", containerName: "sth-grid" }
})

const flexBasis = (span: ColSpan, columns: number): string => {
  if (span === "content") return "auto"
  if (span === "auto") return "0rem"
  if (span === columns) return "100%"

  return `calc(${(100 * span) / columns}% - ${(columns - span) / columns} * ${gridVars.gap})`
}

const maxWidth = (span: ColSpan, columns: number, grow: boolean): string => {
  if (grow || span === "auto") return "100%"
  if (span === "content") return "unset"

  return flexBasis(span, columns)
}

const flexGrow = (span: ColSpan, grow: boolean): string => (span === "auto" || grow ? "1" : "0")

const offsetOf = (offset: number, columns: number): string =>
  offset === 0 ? "0" : `calc(${(100 * offset) / columns}% + ${offset / columns} * ${gridVars.gap})`

type Group = "order" | "grow" | "basis" | "maxWidth" | "offset" | "alignSelf"

const token = (group: Group, point: Point): string => gridVars[`${group}_${point}`]

const pointVars = <Value>(
  value: Responsive<Value> | undefined,
  entries: (value: Value) => ReadonlyArray<readonly [Group, string]>
): ReadonlyArray<readonly [string, string]> =>
  value === undefined
    ? []
    : everyPoint(value).flatMap(([point, chosen]) =>
        entries(chosen).map(([group, css]): readonly [string, string] => [token(group, point), css])
      )

const colVars = (col: GridCol, columns: number, grow: boolean) =>
  setVars(
    ...pointVars(col.span ?? 12, (span) => [
      ["grow", flexGrow(span, grow)],
      ["basis", flexBasis(span, columns)],
      ["maxWidth", maxWidth(span, columns, grow)]
    ]),
    ...pointVars(col.offset, (offset) => [["offset", offsetOf(offset, columns)]]),
    ...pointVars(col.order, (order) => [["order", String(order)]]),
    ...pointVars(col.align, (align) => [["alignSelf", align]])
  )

const gapVars = (gutter: Responsive<StyleValue>) =>
  setVars(
    ...everyPoint(gutter).map(([point, value]): readonly [string, string] => [gridVars[`gap_${point}`], spacing(value)])
  )

export const Grid =
  (config: { readonly Grid?: GridConfig }) =>
  <M>(h: HtmlBuilder<M>, input: GridProps): Html => {
    const props = withDefaults(config.Grid, input)
    const getStyles = stylesApi<M, GridPart>(h, props, config.Grid, "root")
    const container = props.type === "container"
    const columns = props.columns ?? 12
    const grow = props.grow === true
    const cols = props.children.map((col) =>
      h.div(
        [
          ...getStyles(
            "col",
            styles.col,
            container ? gridRules.colContainer : gridRules.colMedia,
            colVars(col, columns, grow)
          ),
          h.DataAttribute("with-col-vars", "")
        ],
        col.children
      )
    )
    const grid = h.div(
      [
        ...getStyles("root", styles.root, setDefinedStyle(["overflow", props.overflow])),
        h.DataAttribute("with-gap", "")
      ],
      [
        h.div(
          getStyles(
            "inner",
            styles.inner,
            container ? gridRules.gapContainer : gridRules.gapMedia,
            gapVars(props.gutter ?? "md"),
            setDefinedStyle(["justifyContent", props.justify], ["alignItems", props.align])
          ),
          cols
        )
      ]
    )

    return container ? h.div(getStyles("container", styles.container), [grid]) : grid
  }
