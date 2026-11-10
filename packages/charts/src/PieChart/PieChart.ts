import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import type { PieCell } from "../pie/pie.ts"
import { pieView } from "../pie/pieView.ts"
import type { PieInput, PieOptions, PiePart } from "../pie/pieView.ts"

export type PieChartCell = PieCell

export type PieChartPart = PiePart

export type PieChartOptions = PieOptions & { readonly labelsPosition?: "inside" | "outside" }

export type PieChartProps = PieChartOptions & PieInput & StylesApiProps<PieChartPart>

export type PieChartConfig = ComponentConfig<PieChartOptions, PieChartPart>

export const PieChart =
  (config: { readonly PieChart?: PieChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PieChartProps): Html => {
    const props = withDefaults(config.PieChart, input)

    return pieView(h, stylesApi<M, PieChartPart>(h, props, config.PieChart, "root"), props, {
      innerRadius: () => 0,
      withTooltip: false,
      labelsInside: props.labelsPosition === "inside",
      chartLabel: undefined
    })
  }
