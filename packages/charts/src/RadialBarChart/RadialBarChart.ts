import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { niceTicks } from "../shared/geometry.ts"
import { focusable, keyboardOn } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { chartHover, chartLegend, chartTooltip } from "../shared/chartParts.ts"
import type { ChartLegendPart, ChartTooltipPart } from "../shared/chartParts.ts"
import { numberAt } from "../grid/grid.ts"
import type { ChartRow } from "../grid/grid.ts"
import { polar, sectorPath } from "../pie/pie.ts"
import { rings, sweep } from "./radial.ts"
import { radialVars } from "./radial.stylex.ts"

export type RadialBarChartPart = "root" | ChartTooltipPart | ChartLegendPart

export type RadialBarChartOptions = {
  readonly barSize?: number
  readonly startAngle?: number
  readonly endAngle?: number
  readonly withBackground?: boolean
  readonly withTooltip?: boolean
  readonly accessibilityLayer?: boolean
  readonly withLegend?: boolean
  readonly withLabels?: boolean
  readonly emptyBackgroundColor?: string
}

export type RadialBarChartProps = RadialBarChartOptions &
  StylesApiProps<RadialBarChartPart> & {
    readonly data: ReadonlyArray<ChartRow & { readonly name: string; readonly color: string }>
    readonly dataKey: string
  }

export type RadialBarChartConfig = ComponentConfig<RadialBarChartOptions, RadialBarChartPart>

const size = 300

const centre = size / 2

const styles = stylex.create({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    [radialVars.empty]: `light-dark(${palette.gray1}, ${palette.dark6})`
  },
  container: { position: "relative", flexGrow: 1, minHeight: 0 },
  svg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", outline: "none" },
  background: { fill: radialVars.empty },
  bar: { fillOpacity: { default: 1, ":is([data-dimmed])": 0.2 } },
  label: { fill: palette.white, fontSize: "12px" }
})

export const RadialBarChart =
  (config: { readonly RadialBarChart?: RadialBarChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RadialBarChartProps): Html => {
    const props = withDefaults(config.RadialBarChart, input)
    const getStyles = stylesApi<M, RadialBarChartPart>(h, props, config.RadialBarChart, "root")
    const start = props.startAngle ?? 90
    const end = props.endAngle ?? -270
    const values = props.data.map((row) => numberAt(row, props.dataKey) ?? 0)
    const top = Option.getOrThrow(Arr.last(niceTicks(values)))
    const laid = Arr.zip(Arr.zip(props.data, values), rings(props.data.length, props.barSize ?? 20, centre))
    const sector = (inner: number, outer: number, from: number, to: number) =>
      sectorPath(
        {
          cx: centre,
          cy: centre,
          innerRadius: inner,
          outerRadius: outer,
          startAngle: from,
          endAngle: to,
          paddingAngle: 0
        },
        from,
        to
      )
    const items = Arr.zip(props.data, values).map(([row, value]) => ({
      name: row.name,
      value,
      color: themeColor(row.color)
    }))
    const shapes = laid.flatMap(([[row, value], ring], index) => [
      ...(props.withBackground === false
        ? []
        : [h.path([...sx(h, styles.background), h.Attribute("d", sector(ring.inner, ring.outer, start, end))], [])]),
      h.path(
        [
          ...sx(h, styles.bar),
          h.Attribute("d", sector(ring.inner, ring.outer, start, sweep(value, top, start, end))),
          h.Style({ fill: themeColor(row.color) }),
          h.DataAttribute("segment", String(index)),
          h.DataAttribute("series", String(index))
        ],
        []
      ),
      ...(props.withLabels === true
        ? [
            (() => {
              const point = polar(centre, centre, (ring.inner + ring.outer) / 2, start + Math.sign(end - start) * 4)

              return h.text(
                [
                  ...sx(h, styles.label),
                  h.Attribute("x", String(point.x)),
                  h.Attribute("y", String(point.y)),
                  h.Attribute("dominant-baseline", "central")
                ],
                [String(value)]
              )
            })()
          ]
        : [])
    ])

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          ...(props.emptyBackgroundColor === undefined
            ? []
            : [setVars([radialVars.empty, themeColor(props.emptyBackgroundColor)])]),
          keyboardOn(props) && shared.focusRing
        ),
        ...focusable(h, keyboardOn(props)),
        chartHover(h)
      ],
      [
        h.div(sx(h, styles.container), [
          h.svg([...sx(h, styles.svg), h.Attribute("viewBox", `0 0 ${size} ${size}`), h.Role("img")], shapes)
        ]),
        ...(props.withLegend === true ? [chartLegend(h, getStyles, items)] : []),
        ...(props.withTooltip === false
          ? []
          : items.map((item, index) =>
              chartTooltip(h, getStyles, { items: [item], key: String(index), format: String })
            ))
      ]
    )
  }
