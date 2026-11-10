import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import type { PieCell } from "../pie/pie.ts"
import { pieView } from "../pie/pieView.ts"
import type { PieInput, PieOptions, PiePart } from "../pie/pieView.ts"

export type DonutChartCell = PieCell

export type DonutChartPart = PiePart

export type DonutChartOptions = PieOptions & { readonly thickness?: number }

export type DonutChartProps = DonutChartOptions &
  PieInput &
  StylesApiProps<DonutChartPart> & { readonly chartLabel?: string | number }

export type DonutChartConfig = ComponentConfig<DonutChartOptions, DonutChartPart>

export const DonutChart =
  (config: { readonly DonutChart?: DonutChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: DonutChartProps): Html => {
    const props = withDefaults(config.DonutChart, input)

    return pieView(h, stylesApi<M, DonutChartPart>(h, props, config.DonutChart, "root"), props, {
      innerRadius: (size) => size / 2 - (props.thickness ?? 20),
      withTooltip: true,
      labelsInside: false,
      chartLabel: props.chartLabel === undefined ? undefined : String(props.chartLabel)
    })
  }
