import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors as tokens } from "@sth-ui/core/theme/tokens.stylex.ts"
import { heatColor } from "../Heatmap/calendar.ts"
import { heatmapVars } from "../Heatmap/heatmap.stylex.ts"
import { withFloatingLabel } from "../shared/floatingLabel.ts"
import { cellKey, cellMap, legendWidth, matrixDomain, uniqueValues } from "./matrix.ts"
import type { MatrixChartCell } from "./matrix.ts"

export type { MatrixChartCell } from "./matrix.ts"

export type MatrixChartPart = "root" | "cell" | "xLabel" | "yLabel" | "legend" | "legendLabel" | "legendRect"

export type MatrixChartOptions = {
  readonly colors?: ReadonlyArray<string>
  readonly cellSize?: number
  readonly gap?: number
  readonly cellRadius?: number
  readonly withTooltip?: boolean
  readonly yLabelsWidth?: number
  readonly xLabelsHeight?: number
  readonly xLabelsPosition?: "top" | "bottom"
  readonly fontSize?: number
  readonly emptyColor?: string
  readonly withLegend?: boolean
  readonly legendLabels?: readonly [string, string]
  readonly withXLabels?: boolean
  readonly withYLabels?: boolean
  readonly xLabelsRotation?: number
}

export type MatrixChartProps = MatrixChartOptions &
  StylesApiProps<MatrixChartPart> & {
    readonly data: ReadonlyArray<MatrixChartCell>
    readonly xLabels?: ReadonlyArray<string>
    readonly yLabels?: ReadonlyArray<string>
    readonly domain?: readonly [number, number]
    readonly getTooltipLabel?: (cell: MatrixChartCell) => string
    readonly ariaLabel?: string
  }

export type MatrixChartConfig = ComponentConfig<MatrixChartOptions, MatrixChartPart>

const styles = stylex.create({
  root: {
    display: "block",
    width: "fit-content",
    [heatmapVars.level1]: "light-dark(rgba(81, 207, 102, 0.3), rgba(43, 138, 62, 0.3))",
    [heatmapVars.level2]: "light-dark(rgba(64, 192, 87, 0.45), rgba(47, 158, 68, 0.45))",
    [heatmapVars.level3]: "light-dark(rgba(55, 178, 77, 0.75), rgba(55, 178, 77, 0.75))",
    [heatmapVars.level4]: "light-dark(rgba(43, 138, 62, 1), rgba(81, 207, 102, 1))",
    [heatmapVars.empty]: `light-dark(${palette.gray2}, ${palette.dark5})`
  },
  cell: { strokeWidth: "1px" },
  empty: { fill: heatmapVars.empty },
  label: { cursor: "default", userSelect: "none", fill: tokens.dimmed }
})

const levels = [heatmapVars.level1, heatmapVars.level2, heatmapVars.level3, heatmapVars.level4].map(String)

export const MatrixChart =
  (config: { readonly MatrixChart?: MatrixChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MatrixChartProps): Html => {
    const props = withDefaults(config.MatrixChart, input)
    const getStyles = stylesApi<M, MatrixChartPart>(h, props, config.MatrixChart, "root")
    const xs = uniqueValues(props.data, "x", props.xLabels)
    const ys = uniqueValues(props.data, "y", props.yLabels)
    const cells = cellMap(props.data)
    const [min, max] = matrixDomain(props.data, props.domain)
    const given = props.colors ?? []
    const shades = given.length > 0 ? given.map(themeColor) : levels
    const empty = props.emptyColor === undefined ? undefined : themeColor(props.emptyColor)
    const size = props.cellSize ?? 20
    const gap = props.gap ?? 1
    const step = size + gap
    const radius = String(props.cellRadius ?? 2)
    const font = String(props.fontSize ?? 12)
    const rotation = props.xLabelsRotation ?? -90
    const hasX = props.withXLabels === true && xs.length > 0
    const hasY = props.withYLabels === true && ys.length > 0
    const left = hasY ? (props.yLabelsWidth ?? 60) : 0
    const labelsHeight = props.xLabelsHeight ?? 60
    const atTop = hasX && props.xLabelsPosition === "top"
    const top = atTop ? labelsHeight : 0
    const bottom = hasX && !atTop ? labelsHeight : 0
    const gridWidth = Math.max(0, xs.length * step - gap)
    const gridHeight = Math.max(0, ys.length * step - gap)
    const labels = props.legendLabels ?? ["Less", "More"]
    const legend = props.withLegend === true ? legendWidth(labels, Number(font), shades.length, size, gap) : 0
    const width = Math.max(left + gridWidth, legend)
    const height = top + gridHeight + bottom + (props.withLegend === true ? 10 + size : 0)
    const labeler = props.withTooltip === true ? props.getTooltipLabel : undefined
    const rects = ys.flatMap((y, row) =>
      xs.map((x, column) => {
        const cell = cells.get(cellKey(x, y)) ?? { x, y, value: null }
        const value = cell.value
        const filled = value !== null && Number.isFinite(value)

        return h.rect(
          [
            ...getStyles("cell", styles.cell, !filled && empty === undefined && styles.empty),
            h.Attribute("x", String(left + column * step)),
            h.Attribute("y", String(top + row * step)),
            h.Attribute("width", String(size)),
            h.Attribute("height", String(size)),
            h.Attribute("rx", radius),
            ...(filled ? [h.Style({ fill: heatColor(value, min, max, shades) })] : []),
            ...(!filled && empty !== undefined ? [h.Style({ fill: empty })] : []),
            ...(!filled && empty === undefined ? [h.DataAttribute("empty", "")] : []),
            ...(labeler === undefined ? [] : [h.DataAttribute("label", labeler(cell))])
          ],
          []
        )
      })
    )
    const yNodes = hasY
      ? ys.map((label, index) =>
          h.text(
            [
              ...getStyles("yLabel", styles.label),
              h.Attribute("x", String(left - 8)),
              h.Attribute("y", String(top + index * step + size / 2)),
              h.Attribute("font-size", font),
              h.Attribute("text-anchor", "end"),
              h.Attribute("dominant-baseline", "central")
            ],
            [label]
          )
        )
      : []
    const xNodes = hasX
      ? xs.map((label, index) => {
          const x = left + index * step + size / 2
          const y = atTop ? labelsHeight - 8 : top + gridHeight + 8

          return h.text(
            [
              ...getStyles("xLabel", styles.label),
              h.Attribute("x", String(x)),
              h.Attribute("y", String(y)),
              h.Attribute("font-size", font),
              h.Attribute("text-anchor", rotation === 0 ? "middle" : "end"),
              h.Attribute("dominant-baseline", rotation !== 0 ? "central" : atTop ? "auto" : "hanging"),
              ...(rotation === 0 ? [] : [h.Attribute("transform", `rotate(${rotation}, ${x}, ${y})`)])
            ],
            [label]
          )
        })
      : []
    const swatches = [empty, ...shades]
    const char = Number(font) * 0.6
    const legendNodes =
      props.withLegend === true
        ? [
            h.g(
              [
                ...getStyles("legend"),
                h.Attribute("transform", `translate(${width - legend}, ${top + gridHeight + bottom + 10})`),
                h.DataAttribute("id", "legend")
              ],
              [
                h.text(
                  [
                    ...getStyles("legendLabel", styles.label),
                    h.Attribute("x", "0"),
                    h.Attribute("y", String(size / 2)),
                    h.Attribute("font-size", font),
                    h.Attribute("dominant-baseline", "central")
                  ],
                  [labels[0]]
                ),
                ...swatches.map((color, index) =>
                  h.rect(
                    [
                      ...getStyles("legendRect", color === undefined && styles.empty),
                      h.Attribute("x", String(labels[0].length * char + 6 + index * step)),
                      h.Attribute("y", "0"),
                      h.Attribute("width", String(size)),
                      h.Attribute("height", String(size)),
                      h.Attribute("rx", radius),
                      ...(color === undefined ? [h.DataAttribute("empty", "")] : [h.Style({ fill: color })])
                    ],
                    []
                  )
                ),
                h.text(
                  [
                    ...getStyles("legendLabel", styles.label),
                    h.Attribute(
                      "x",
                      String(labels[0].length * char + 6 + swatches.length * size + (swatches.length - 1) * gap + 6)
                    ),
                    h.Attribute("y", String(size / 2)),
                    h.Attribute("font-size", font),
                    h.Attribute("dominant-baseline", "central")
                  ],
                  [labels[1]]
                )
              ]
            )
          ]
        : []
    const summary =
      xs.length > 0 && ys.length > 0
        ? `Heatmap, ${xs.length} columns by ${ys.length} rows, values from ${min} to ${max}`
        : undefined
    const name = props.ariaLabel ?? summary
    const svg = h.svg(
      [
        ...getStyles("root", styles.root),
        h.Attribute("width", String(width)),
        h.Attribute("height", String(height)),
        ...(name === undefined ? [] : [h.Role("img"), h.AriaLabel(name)])
      ],
      [...rects, ...yNodes, ...xNodes, ...legendNodes]
    )

    return labeler === undefined ? svg : withFloatingLabel(h, svg)
  }
