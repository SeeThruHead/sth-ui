import * as stylex from "@stylexjs/stylex"
import { Array as Arr } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { areaPath, linePath } from "../shared/geometry.ts"
import type { CurveType, Point } from "../shared/geometry.ts"
import { hashOf } from "../shared/ids.ts"
import { bandPoints, numberAt, seriesPoints, stackedBands, yFraction } from "../grid/grid.ts"
import type { Band, ChartSeries } from "../grid/grid.ts"
import { colorOf, gridView } from "../grid/gridView.ts"
import type { GridInput, GridOptions, GridPart } from "../grid/gridView.ts"

export type { ChartRow, ChartSeries } from "../grid/grid.ts"

export type AreaChartPart = GridPart | "area"

export type AreaChartType = "default" | "stacked" | "percent"

export type AreaChartOptions = GridOptions & {
  readonly type?: AreaChartType
  readonly withGradient?: boolean
  readonly fillOpacity?: number
  readonly strokeWidth?: number
  readonly curveType?: CurveType
  readonly connectNulls?: boolean
}

export type AreaChartProps = AreaChartOptions & GridInput & StylesApiProps<AreaChartPart>

export type AreaChartConfig = ComponentConfig<AreaChartOptions, AreaChartPart>

const styles = stylex.create({
  area: {
    fillOpacity: { default: 1, ":is([data-dimmed])": 0 },
    strokeOpacity: { default: 1, ":is([data-dimmed])": 0.5 }
  }
})

const percentText = (value: number) => `${(value * 100).toFixed(0)}%`

type Shape = { readonly fill: string; readonly line: ReadonlyArray<Point> }

const bandShape = (top: ReadonlyArray<Point>, bottom: ReadonlyArray<Point>, curve: CurveType): Shape => ({
  fill: `${linePath(top, curve)}${linePath(bottom.toReversed(), curve).replace(/^M/, "L")}Z`,
  line: top
})

export const AreaChart =
  (config: { readonly AreaChart?: AreaChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AreaChartProps): Html => {
    const props = withDefaults(config.AreaChart, input)
    const getStyles = stylesApi<M, AreaChartPart>(h, props, config.AreaChart, "root")
    const type = props.type ?? "default"
    const stacked = type !== "default"
    const curve = props.curveType ?? "monotone"
    const count = props.data.length
    const bands = stackedBands(props.data, props.series, type === "percent")
    const id = `area-${props.id ?? hashOf(JSON.stringify([props.series, count, type]))}`
    const gradient = props.withGradient ?? type === "default"
    const opacity = String(props.fillOpacity ?? 0.2)
    const layers = Arr.zip(props.series, bands)
    const shapesOf = (
      series: ChartSeries,
      band: ReadonlyArray<Band>,
      ticks: ReadonlyArray<number>
    ): ReadonlyArray<Shape> => {
      if (!stacked) {
        return seriesPoints(props.data, series.name, ticks, props.connectNulls !== false).map((points) => ({
          fill: areaPath(points, curve, yFraction(0, ticks) * 100),
          line: points
        }))
      }
      return [bandShape(bandPoints(band, count, ticks, "high"), bandPoints(band, count, ticks, "low"), curve)]
    }
    const stops = (index: number, series: ChartSeries) => {
      const color = colorOf(series)
      const stop = (offset: string, stopOpacity: string) =>
        h.stop([h.Attribute("offset", offset), h.Style({ stopColor: color, stopOpacity })], [])

      return h.linearGradient(
        [
          h.Id(`${id}-${index}`),
          h.Attribute("x1", "0"),
          h.Attribute("y1", "0"),
          h.Attribute("x2", "0"),
          h.Attribute("y2", "1")
        ],
        gradient ? [stop("0%", opacity), stop("100%", "0.01")] : [stop("0%", opacity)]
      )
    }

    return gridView(h, getStyles, props, {
      values: stacked
        ? bands.flatMap((band) => band.map((entry) => entry.high))
        : props.data.flatMap((row) => props.series.flatMap((series) => numberAt(row, series.name) ?? [])),
      ...(type === "percent" ? { ticks: [0, 0.25, 0.5, 0.75, 1], tickFormat: percentText } : {}),
      largeDots: true,
      svg: (ticks) => [
        h.defs(
          [],
          props.series.map((series, index) => stops(index, series))
        ),
        ...layers.flatMap(([series, band], index) =>
          shapesOf(series, band, ticks).flatMap((shape) => [
            h.path(
              [
                ...getStyles("area", styles.area),
                h.Attribute("d", shape.fill),
                h.Attribute("fill", `url(#${id}-${index})`),
                h.DataAttribute("series", String(index))
              ],
              []
            ),
            h.path(
              [
                ...getStyles("area", styles.area),
                h.Attribute("d", linePath(shape.line, curve)),
                h.Attribute("fill", "none"),
                h.Style({ stroke: colorOf(series) }),
                h.Attribute("stroke-width", String(props.strokeWidth ?? 2)),
                ...(series.strokeDasharray === undefined
                  ? []
                  : [h.Attribute("stroke-dasharray", series.strokeDasharray)]),
                h.Attribute("vector-effect", "non-scaling-stroke"),
                h.DataAttribute("series", String(index))
              ],
              []
            )
          ])
        )
      ],
      dots: (ticks) =>
        layers.map(([series, band], index) => ({
          series: index,
          color: colorOf(series),
          points: stacked
            ? bandPoints(band, count, ticks, "high")
            : seriesPoints(props.data, series.name, ticks, true).flat()
        }))
    })
  }
