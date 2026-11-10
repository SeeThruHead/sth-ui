import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { linePath } from "../shared/geometry.ts"
import type { CurveType } from "../shared/geometry.ts"
import { numberAt, seriesPoints } from "../grid/grid.ts"
import { colorOf, gridView } from "../grid/gridView.ts"
import type { GridInput, GridOptions, GridPart } from "../grid/gridView.ts"

export type { ChartRow, ChartSeries } from "../grid/grid.ts"
export type { ReferenceLine } from "../grid/gridView.ts"

export type LineChartPart = GridPart | "line"

export type LineChartOptions = GridOptions & {
  readonly strokeWidth?: number
  readonly curveType?: CurveType
  readonly connectNulls?: boolean
  readonly fillOpacity?: number
}

export type LineChartProps = LineChartOptions & GridInput & StylesApiProps<LineChartPart>

export type LineChartConfig = ComponentConfig<LineChartOptions, LineChartPart>

const styles = stylex.create({
  line: { fill: "none", strokeOpacity: { default: 1, ":is([data-dimmed])": 0.5 } }
})

export const LineChart =
  (config: { readonly LineChart?: LineChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: LineChartProps): Html => {
    const props = withDefaults(config.LineChart, input)
    const getStyles = stylesApi<M, LineChartPart>(h, props, config.LineChart, "root")
    const connect = props.connectNulls !== false

    return gridView(h, getStyles, props, {
      values: props.data.flatMap((row) => props.series.flatMap((series) => numberAt(row, series.name) ?? [])),
      svg: (ticks) =>
        props.series.flatMap((series, index) =>
          seriesPoints(props.data, series.name, ticks, connect).map((points) =>
            h.path(
              [
                ...getStyles("line", styles.line),
                h.Attribute("d", linePath(points, props.curveType ?? "monotone")),
                h.Style({ stroke: colorOf(series), opacity: String(props.fillOpacity ?? 1) }),
                h.Attribute("stroke-width", String(props.strokeWidth ?? 2)),
                ...(series.strokeDasharray === undefined
                  ? []
                  : [h.Attribute("stroke-dasharray", series.strokeDasharray)]),
                h.Attribute("vector-effect", "non-scaling-stroke"),
                h.DataAttribute("series", String(index))
              ],
              []
            )
          )
        ),
      dots: (ticks) =>
        props.series.map((series, index) => ({
          series: index,
          color: colorOf(series),
          points: seriesPoints(props.data, series.name, ticks, true).flat()
        }))
    })
  }
