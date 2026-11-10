import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { areaPath, linePath } from "../shared/geometry.ts"
import type { CurveType } from "../shared/geometry.ts"
import { barGroups } from "../grid/bars.ts"
import { bandCenter, numberAt, seriesPoints, xFraction, yFraction } from "../grid/grid.ts"
import type { ChartSeries } from "../grid/grid.ts"
import { colorOf, gridView } from "../grid/gridView.ts"
import type { GridInput, GridOptions, GridPart } from "../grid/gridView.ts"

export type { ChartRow } from "../grid/grid.ts"

export type CompositeChartSeries = ChartSeries & { readonly type: "line" | "area" | "bar" }

export type CompositeChartPart = GridPart | "line" | "area" | "bar"

export type CompositeChartOptions = GridOptions & {
  readonly strokeWidth?: number
  readonly curveType?: CurveType
  readonly connectNulls?: boolean
  readonly maxBarWidth?: number
}

export type CompositeChartProps = CompositeChartOptions &
  Omit<GridInput, "series"> &
  StylesApiProps<CompositeChartPart> & { readonly series: ReadonlyArray<CompositeChartSeries> }

export type CompositeChartConfig = ComponentConfig<CompositeChartOptions, CompositeChartPart>

const styles = stylex.create({
  line: { fill: "none", strokeOpacity: { default: 1, ":is([data-dimmed])": 0.5 } },
  area: {
    fillOpacity: { default: 0.2, ":is([data-dimmed])": 0 },
    strokeOpacity: { default: 1, ":is([data-dimmed])": 0.5 }
  }
})

export const CompositeChart =
  (config: { readonly CompositeChart?: CompositeChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CompositeChartProps): Html => {
    const props = withDefaults(config.CompositeChart, input)
    const getStyles = stylesApi<M, CompositeChartPart>(h, props, config.CompositeChart, "root")
    const band = props.series.some((series) => series.type === "bar")
    const position = band ? bandCenter : xFraction
    const curve = props.curveType ?? "monotone"
    const connect = props.connectNulls !== false
    const indexed = props.series.map((series, index) => ({ series, index }))
    const pointsOf = (series: CompositeChartSeries, ticks: ReadonlyArray<number>, joined: boolean) =>
      seriesPoints(props.data, series.name, ticks, joined, position)
    const stroke = (series: CompositeChartSeries, index: number) => [
      h.Style({ stroke: colorOf(series) }),
      h.Attribute("stroke-width", String(props.strokeWidth ?? 2)),
      ...(series.strokeDasharray === undefined ? [] : [h.Attribute("stroke-dasharray", series.strokeDasharray)]),
      h.Attribute("vector-effect", "non-scaling-stroke"),
      h.DataAttribute("series", String(index))
    ]
    const shape = (series: CompositeChartSeries, index: number, ticks: ReadonlyArray<number>) =>
      pointsOf(series, ticks, connect).map((points) =>
        series.type === "area"
          ? h.path(
              [
                ...getStyles("area", styles.area),
                h.Attribute("d", areaPath(points, curve, yFraction(0, ticks) * 100)),
                h.Style({ fill: colorOf(series) }),
                ...stroke(series, index)
              ],
              []
            )
          : h.path(
              [...getStyles("line", styles.line), h.Attribute("d", linePath(points, curve)), ...stroke(series, index)],
              []
            )
      )
    const bars = indexed.filter(({ series }) => series.type === "bar")

    return gridView(h, getStyles, props, {
      values: props.data.flatMap((row) => props.series.flatMap((series) => numberAt(row, series.name) ?? [])),
      band,
      svg: (ticks) =>
        indexed
          .filter(({ series }) => series.type !== "bar")
          .flatMap(({ series, index }) => shape(series, index, ticks)),
      overlay: (ticks) =>
        barGroups(
          h,
          props.data.map((row) =>
            bars.map(({ series, index }) => [
              { series: index, color: colorOf(series), low: 0, high: numberAt(row, series.name) ?? 0 }
            ])
          ),
          {
            ticks,
            opacity: "1",
            maxBarWidth: props.maxBarWidth,
            barAttributes: (style: StyleXStyles) => getStyles("bar", style)
          }
        ),
      dots: (ticks) =>
        indexed
          .filter(({ series }) => series.type !== "bar")
          .map(({ series, index }) => ({
            series: index,
            color: colorOf(series),
            points: pointsOf(series, ticks, true).flat()
          }))
    })
  }
