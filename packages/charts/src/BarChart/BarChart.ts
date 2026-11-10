import type { StyleXStyles } from "@stylexjs/stylex"
import { Array as Arr } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { barGroups } from "../grid/bars.ts"
import { numberAt, stackedBands } from "../grid/grid.ts"
import type { Band } from "../grid/grid.ts"
import { colorOf, gridView } from "../grid/gridView.ts"
import type { GridInput, GridOptions, GridPart } from "../grid/gridView.ts"

export type { ChartRow, ChartSeries } from "../grid/grid.ts"

export type BarChartPart = GridPart | "bar"

export type BarChartType = "default" | "stacked" | "percent"

export type BarChartOptions = Omit<GridOptions, "withDots"> & {
  readonly type?: BarChartType
  readonly fillOpacity?: number
  readonly maxBarWidth?: number
}

export type BarChartProps = BarChartOptions & GridInput & StylesApiProps<BarChartPart>

export type BarChartConfig = ComponentConfig<BarChartOptions, BarChartPart>

const percentText = (value: number) => `${(value * 100).toFixed(0)}%`

export const BarChart =
  (config: { readonly BarChart?: BarChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BarChartProps): Html => {
    const props = withDefaults(config.BarChart, input)
    const getStyles = stylesApi<M, BarChartPart>(h, props, config.BarChart, "root")
    const type = props.type ?? "default"
    const stacked = type !== "default"
    const bands = stackedBands(props.data, props.series, type === "percent")
    const opacity = String(props.fillOpacity ?? 1)
    const layout = (ticks: ReadonlyArray<number>) => ({
      ticks,
      opacity,
      maxBarWidth: props.maxBarWidth,
      barAttributes: (style: StyleXStyles) => getStyles("bar", style)
    })
    const stackedGroups = props.data.map((_row, index) => [
      Arr.zip(props.series, bands).map(([series, band], seriesIndex) => {
        const entry: Band = Arr.getUnsafe(band, index)

        return { series: seriesIndex, color: colorOf(series), low: entry.low, high: entry.high }
      })
    ])
    const groupedGroups = props.data.map((row) =>
      props.series.map((series, seriesIndex) => [
        { series: seriesIndex, color: colorOf(series), low: 0, high: numberAt(row, series.name) ?? 0 }
      ])
    )

    return gridView(h, getStyles, props, {
      values: stacked
        ? bands.flatMap((band) => band.map((entry) => entry.high))
        : props.data.flatMap((row) => props.series.flatMap((series) => numberAt(row, series.name) ?? [])),
      ...(type === "percent" ? { ticks: [0, 0.25, 0.5, 0.75, 1], tickFormat: percentText } : {}),
      band: true,
      svg: () => [],
      overlay: (ticks) => barGroups(h, stacked ? stackedGroups : groupedGroups, layout(ticks))
    })
  }
