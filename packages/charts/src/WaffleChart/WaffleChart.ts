import * as stylex from "@stylexjs/stylex"
import { Array as Arr } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setDefinedVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { colors, fontSize, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { legendHover } from "../shared/chartParts.ts"
import { withFloatingLabel } from "../shared/floatingLabel.ts"
import { allocateCells, cellLayout, cellPosition, summary } from "./waffle.ts"
import type { FillDirection, WaffleChartCell } from "./waffle.ts"
import { waffleVars } from "./waffle.stylex.ts"

export type { FillDirection, WaffleChartCell } from "./waffle.ts"

export type WaffleChartPart = "root" | "grid" | "cell" | "legend" | "legendItem" | "legendSwatch" | "legendLabel"

export type WaffleChartOptions = {
  readonly rows?: number
  readonly columns?: number
  readonly gap?: number
  readonly cellRadius?: number
  readonly emptyColor?: string
  readonly withTooltip?: boolean
  readonly withLegend?: boolean
  readonly legendPosition?: "top" | "bottom" | "left" | "right"
  readonly fillDirection?: FillDirection
  readonly size?: number
}

export type WaffleChartProps = WaffleChartOptions &
  StylesApiProps<WaffleChartPart> & {
    readonly data: ReadonlyArray<WaffleChartCell>
    readonly total?: number
    readonly getTooltipLabel?: (cell: WaffleChartCell & { readonly count: number }) => string
    readonly ariaLabel?: string
  }

export type WaffleChartConfig = ComponentConfig<WaffleChartOptions, WaffleChartPart>

const styles = stylex.create({
  root: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.sm,
    [waffleVars.empty]: colors.defaultBorder
  },
  vertical: { flexDirection: "row" },
  cell: { opacity: { default: 1, ":is([data-dimmed])": 0.4 } },
  empty: { fill: waffleVars.empty },
  legend: { display: "flex", flexWrap: "wrap" },
  legendVertical: { flexDirection: "column" },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: `calc(${space.xs} / 2)`,
    cursor: "default",
    paddingBlock: `calc(${space.xs} / 2)`,
    paddingInline: `calc(${space.sm} / 2)`,
    opacity: { default: 1, ":is([data-dimmed])": 0.4 }
  },
  legendSwatch: { display: "block", width: "12px", height: "12px", borderRadius: waffleVars.radius, flexShrink: 0 },
  legendLabel: { fontSize: fontSize.sm, color: colors.text, lineHeight: 1 }
})

export const WaffleChart =
  (config: { readonly WaffleChart?: WaffleChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: WaffleChartProps): Html => {
    const props = withDefaults(config.WaffleChart, input)
    const getStyles = stylesApi<M, WaffleChartPart>(h, props, config.WaffleChart, "root")
    const rows = Math.max(1, Math.floor(props.rows ?? 10))
    const columns = Math.max(1, Math.floor(props.columns ?? 10))
    const layout = cellLayout(columns, Math.max(0, props.gap ?? 2), props.size)
    const step = layout.cell + layout.gap
    const radius = String(props.cellRadius ?? 0)
    const cells = allocateCells(props.data, rows * columns, props.total)
    const counts = props.data.map((_cell, index) => cells.filter((cell) => cell === index).length)
    const position = props.legendPosition ?? "bottom"
    const vertical = position === "left" || position === "right"
    const withLegend = props.withLegend !== false
    const tooltipOf = (cell: WaffleChartCell, count: number) =>
      props.getTooltipLabel === undefined ? cell.name : props.getTooltipLabel({ ...cell, count })
    const label = summary(props.data, props.total)
    const width = columns * layout.cell + (columns - 1) * layout.gap
    const height = rows * layout.cell + (rows - 1) * layout.gap
    const rects = cells.map((segment, index) => {
      const place = cellPosition(index, rows, columns, props.fillDirection ?? "left-to-right")
      const filled = Arr.get(Arr.zip(props.data, counts), segment)

      return h.rect(
        [
          ...getStyles("cell", styles.cell, filled._tag === "None" && styles.empty),
          h.Attribute("x", String(place.column * step)),
          h.Attribute("y", String(place.row * step)),
          h.Attribute("width", String(layout.cell)),
          h.Attribute("height", String(layout.cell)),
          h.Attribute("rx", radius),
          h.Attribute("ry", radius),
          ...(filled._tag === "None"
            ? [h.DataAttribute("empty", "")]
            : [
                h.Style({ fill: themeColor(filled.value[0].color) }),
                h.DataAttribute("series", String(segment)),
                ...(props.withTooltip === true
                  ? [h.DataAttribute("label", tooltipOf(filled.value[0], filled.value[1]))]
                  : [])
              ])
        ],
        []
      )
    })
    const grid = h.svg(
      [
        ...getStyles("grid"),
        h.Attribute("width", String(width)),
        h.Attribute("height", String(height)),
        ...(label === "" ? [] : [h.Role("img"), h.AriaLabel(label)])
      ],
      rects
    )
    const legend = h.div(
      [...getStyles("legend", styles.legend, vertical && styles.legendVertical), h.AriaHidden(true)],
      props.data.map((cell, index) =>
        h.div(
          [
            ...getStyles("legendItem", styles.legendItem),
            h.DataAttribute("legend-index", String(index)),
            h.DataAttribute("series", String(index))
          ],
          [
            h.span(
              [...getStyles("legendSwatch", styles.legendSwatch), h.Style({ backgroundColor: themeColor(cell.color) })],
              []
            ),
            h.span(getStyles("legendLabel", styles.legendLabel), [cell.name])
          ]
        )
      )
    )
    const before = withLegend && (position === "top" || position === "left")
    const after = withLegend && !before

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          vertical && styles.vertical,
          setDefinedVars(
            [waffleVars.radius, `${props.cellRadius ?? 2}px`],
            [waffleVars.empty, props.emptyColor === undefined ? undefined : themeColor(props.emptyColor)]
          )
        ),
        ...(withLegend ? [h.DataAttribute("legend-position", position)] : []),
        ...(vertical ? [h.DataAttribute("vertical", "")] : []),
        ...(props.ariaLabel === undefined ? [] : [h.Role("group"), h.AriaLabel(props.ariaLabel)]),
        legendHover(h)
      ],
      [
        ...(before ? [legend] : []),
        props.withTooltip === true ? withFloatingLabel(h, grid) : grid,
        ...(after ? [legend] : [])
      ]
    )
  }
