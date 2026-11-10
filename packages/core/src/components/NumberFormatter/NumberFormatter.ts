import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { formatNumber } from "./format.ts"
import type { NumberFormatterFormat } from "./format.ts"

export { formatNumber, numericString } from "./format.ts"
export type { NumberFormatterFormat, ThousandsGroupStyle } from "./format.ts"

export type NumberFormatterPart = "root"

export type NumberFormatterProps = NumberFormatterFormat &
  StylesApiProps<NumberFormatterPart> & { readonly value?: number | string }

export type NumberFormatterConfig = ComponentConfig<NumberFormatterFormat, NumberFormatterPart>

export const NumberFormatter =
  (config: { readonly NumberFormatter?: NumberFormatterConfig }) =>
  <M>(h: HtmlBuilder<M>, input: NumberFormatterProps): Html => {
    const props = withDefaults(config.NumberFormatter, input)
    if (props.value === undefined) return h.empty
    const getStyles = stylesApi<M, NumberFormatterPart>(h, props, config.NumberFormatter, "root")

    return h.span(getStyles("root"), [formatNumber(props.value, props)])
  }
