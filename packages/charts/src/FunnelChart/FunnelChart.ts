import * as stylex from "@stylexjs/stylex"
import { Array as Arr } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors } from "@sth-ui/core/theme/tokens.stylex.ts"
import { focusable, keyboardOn } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { chartHover, chartLegend, chartTooltip } from "../shared/chartParts.ts"
import type { ChartLegendPart, ChartTooltipPart } from "../shared/chartParts.ts"
import { pieVars } from "../pie/pie.stylex.ts"
import { trapezoids } from "./funnel.ts"
import type { Trapezoid } from "./funnel.ts"

export type FunnelChartCell = { readonly name: string; readonly value: number; readonly color: string }

export type FunnelChartPart = "root" | ChartTooltipPart | ChartLegendPart

export type FunnelChartOptions = {
  readonly withTooltip?: boolean
  readonly accessibilityLayer?: boolean
  readonly withLegend?: boolean
  readonly withLabels?: boolean
  readonly labelsPosition?: "right" | "left" | "inside"
  readonly tooltipDataSource?: "segment" | "all"
  readonly size?: number
  readonly strokeWidth?: number
  readonly strokeColor?: string
  readonly labelColor?: string
}

export type FunnelChartProps = FunnelChartOptions &
  StylesApiProps<FunnelChartPart> & {
    readonly data: ReadonlyArray<FunnelChartCell>
    readonly valueFormatter?: (value: number) => string
  }

export type FunnelChartConfig = ComponentConfig<FunnelChartOptions, FunnelChartPart>

const styles = stylex.create({
  root: {
    position: "relative",
    width: pieVars.size,
    minWidth: pieVars.size,
    height: pieVars.size,
    minHeight: pieVars.size,
    [pieVars.strokeColor]: colors.body,
    [pieVars.labelsColor]: colors.dimmed
  },
  rootInside: { [pieVars.labelsColor]: palette.white },
  svg: { display: "block", overflow: "visible", outline: "none" },
  segment: {
    stroke: pieVars.strokeColor,
    fillOpacity: { default: 1, ":is([data-dimmed])": 0.2 },
    transitionProperty: "fill-opacity",
    transitionDuration: "150ms"
  },
  label: { fill: pieVars.labelsColor, fontSize: "12px" }
})

const labelPoint = (shape: Trapezoid, position: "right" | "left" | "inside") => {
  const y = (shape.top + shape.bottom) / 2
  if (position === "inside") return { x: (shape.left + shape.right) / 2, y, anchor: "middle" }
  if (position === "left") return { x: shape.left - 5, y, anchor: "end" }

  return { x: shape.right + 5, y, anchor: "start" }
}

export const FunnelChart =
  (config: { readonly FunnelChart?: FunnelChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: FunnelChartProps): Html => {
    const props = withDefaults(config.FunnelChart, input)
    const getStyles = stylesApi<M, FunnelChartPart>(h, props, config.FunnelChart, "root")
    const size = props.size ?? 300
    const position = props.labelsPosition ?? "right"
    const format = props.valueFormatter ?? String
    const shapes = trapezoids(
      props.data.map((cell) => cell.value),
      size
    )
    const items = props.data.map((cell) => ({ ...cell, color: themeColor(cell.color) }))
    const tooltips = (() => {
      if (props.withTooltip === false) return []
      if (props.tooltipDataSource !== "segment") return [chartTooltip(h, getStyles, { items, key: "all", format })]

      return items.map((item, index) => chartTooltip(h, getStyles, { items: [item], key: String(index), format }))
    })()
    const rows = Arr.zip(shapes, props.data)
    const labels =
      props.withLabels === true
        ? rows.map(([shape, cell]) => {
            const point = labelPoint(shape, position)

            return h.text(
              [
                ...sx(h, styles.label),
                h.Attribute("x", String(point.x)),
                h.Attribute("y", String(point.y)),
                h.Attribute("text-anchor", point.anchor),
                h.Attribute("dominant-baseline", "central")
              ],
              [format(cell.value)]
            )
          })
        : []

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          position === "inside" && styles.rootInside,
          setVars(
            [pieVars.size, `${size + (props.withLegend === true ? 80 : 0)}px`],
            ...(props.strokeColor === undefined ? [] : [[pieVars.strokeColor, themeColor(props.strokeColor)] as const]),
            ...(props.labelColor === undefined ? [] : [[pieVars.labelsColor, themeColor(props.labelColor)] as const])
          ),
          keyboardOn(props) && shared.focusRing
        ),
        ...focusable(h, keyboardOn(props)),
        chartHover(h)
      ],
      [
        h.svg(
          [
            ...sx(h, styles.svg),
            h.Attribute("width", String(size)),
            h.Attribute("height", String(size)),
            h.Attribute("viewBox", `0 0 ${size} ${size}`),
            h.Role("img")
          ],
          [
            ...rows.map(([shape, cell], index) =>
              h.path(
                [
                  ...sx(h, styles.segment),
                  h.Attribute("d", shape.path),
                  h.Style({ fill: themeColor(cell.color) }),
                  h.Attribute("stroke-width", String(props.strokeWidth ?? 1)),
                  h.DataAttribute("segment", String(index)),
                  h.DataAttribute("series", String(index))
                ],
                []
              )
            ),
            ...labels
          ]
        ),
        ...(props.withLegend === true ? [chartLegend(h, getStyles, items)] : []),
        ...tooltips
      ]
    )
  }
