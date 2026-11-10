import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, sx } from "@sth-ui/core/styles/StylesApi.ts"
import type { GetStyles } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { colors, fontSize } from "@sth-ui/core/theme/tokens.stylex.ts"
import { focusable } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { chartHover, chartLegend, chartTooltip } from "../shared/chartParts.ts"
import type { ChartLegendPart, ChartTooltipPart } from "../shared/chartParts.ts"
import { labelText, polar, sectors } from "./pie.ts"
import type { LabelsType, PieCell, Sector } from "./pie.ts"
import { pieVars } from "./pie.stylex.ts"

export type PiePart = "root" | "label" | ChartTooltipPart | ChartLegendPart

export type PieOptions = {
  readonly withTooltip?: boolean
  readonly accessibilityLayer?: boolean
  readonly withLegend?: boolean
  readonly withLabels?: boolean
  readonly withLabelsLine?: boolean
  readonly labelsType?: LabelsType
  readonly strokeColor?: string
  readonly labelColor?: string
  readonly paddingAngle?: number
  readonly size?: number
  readonly strokeWidth?: number
  readonly startAngle?: number
  readonly endAngle?: number
  readonly tooltipDataSource?: "segment" | "all"
}

export type PieInput = PieOptions & {
  readonly data: ReadonlyArray<PieCell>
  readonly valueFormatter?: (value: number) => string
}

export type PieShape = {
  readonly innerRadius: (size: number) => number
  readonly withTooltip: boolean
  readonly labelsInside: boolean
  readonly chartLabel: string | undefined
}

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
  svg: { display: "block", overflow: "visible", outline: "none" },
  label: { fill: colors.text, fontSize: fontSize.sm },
  segment: {
    stroke: pieVars.strokeColor,
    fillOpacity: { default: 1, ":is([data-dimmed])": 0.2 },
    transitionProperty: "fill-opacity",
    transitionDuration: "150ms"
  },
  sectorLabel: { fill: pieVars.labelsColor, fontSize: "12px" },
  insideLabel: { fill: colors.text },
  labelLine: { stroke: pieVars.labelsColor, fill: "none" }
})

const chartVars = (input: PieInput, size: number) =>
  setVars(
    [pieVars.size, `${size}px`],
    ...(input.strokeColor === undefined ? [] : [[pieVars.strokeColor, themeColor(input.strokeColor)] as const]),
    ...(input.labelColor === undefined ? [] : [[pieVars.labelsColor, themeColor(input.labelColor)] as const])
  )

const textAt = <M>(
  h: HtmlBuilder<M>,
  point: { readonly x: number; readonly y: number; readonly anchor: string },
  attributes: ReturnType<typeof sx<M>>,
  text: string
) =>
  h.text(
    [
      ...attributes,
      h.Attribute("x", String(point.x)),
      h.Attribute("y", String(point.y)),
      h.Attribute("text-anchor", point.anchor),
      h.Attribute("dominant-baseline", "central")
    ],
    [text]
  )

export const pieView = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, PiePart>,
  input: PieInput,
  shape: PieShape
): Html => {
  const size = input.size ?? 160
  const withLabels = input.withLabels === true
  const outside = withLabels && !shape.labelsInside
  const box = size + (outside ? 80 : 0)
  const chartSize = box + (input.withLegend === true ? 80 : 0)
  const centre = box / 2
  const outerRadius = size / 2
  const innerRadius = shape.innerRadius(size)
  const laid = sectors(input.data, {
    cx: centre,
    cy: centre,
    innerRadius,
    outerRadius,
    startAngle: input.startAngle ?? 0,
    endAngle: input.endAngle ?? 360,
    paddingAngle: input.paddingAngle ?? 0
  })
  const format = input.valueFormatter ?? String
  const keys = (input.withTooltip ?? shape.withTooltip) && input.accessibilityLayer !== false
  const items = input.data.map((cell) => ({ ...cell, color: themeColor(cell.color) }))
  const tooltips = (() => {
    if (!(input.withTooltip ?? shape.withTooltip)) return []
    if (input.tooltipDataSource !== "segment") return [chartTooltip(h, getStyles, { items, key: "all", format })]

    return items.map((item, index) => chartTooltip(h, getStyles, { items: [item], key: String(index), format }))
  })()
  const text = (sector: Sector) => labelText(sector, input.labelsType ?? "value", input.valueFormatter)
  const inside = (sector: Sector) => {
    const point = polar(centre, centre, innerRadius + (outerRadius - innerRadius) * 0.5, sector.middle)

    return textAt(h, { ...point, anchor: point.x > centre ? "start" : "end" }, sx(h, styles.insideLabel), text(sector))
  }
  const outsideLabel = (sector: Sector) => [
    ...(input.withLabelsLine === false
      ? []
      : [h.path([...sx(h, styles.labelLine), h.Attribute("d", sector.line)], [])]),
    textAt(h, sector.label, sx(h, styles.sectorLabel), text(sector))
  ]
  const labels = withLabels
    ? laid.flatMap((sector) => (shape.labelsInside ? [inside(sector)] : outsideLabel(sector)))
    : []

  return h.div(
    [
      ...getStyles("root", styles.root, chartVars(input, chartSize), keys && shared.focusRing),
      ...focusable(h, keys),
      chartHover(h)
    ],
    [
      h.svg(
        [
          ...sx(h, styles.svg),
          h.Attribute("width", String(box)),
          h.Attribute("height", String(box)),
          h.Attribute("viewBox", `0 0 ${box} ${box}`),
          h.Role("img")
        ],
        [
          ...laid.map((sector) =>
            h.path(
              [
                ...sx(h, styles.segment),
                h.Attribute("d", sector.path),
                h.Style({ fill: themeColor(sector.cell.color) }),
                h.Attribute("stroke-width", String(input.strokeWidth ?? 1)),
                h.DataAttribute("segment", String(sector.index)),
                h.DataAttribute("series", String(sector.index))
              ],
              []
            )
          ),
          ...labels,
          ...(shape.chartLabel === undefined
            ? []
            : [
                h.text(
                  [
                    ...getStyles("label", styles.label),
                    h.Attribute("x", "50%"),
                    h.Attribute("y", "50%"),
                    h.Attribute("text-anchor", "middle"),
                    h.Attribute("dominant-baseline", "middle")
                  ],
                  [shape.chartLabel]
                )
              ])
        ]
      ),
      ...(input.withLegend === true ? [chartLegend(h, getStyles, items)] : []),
      ...tooltips
    ]
  )
}
