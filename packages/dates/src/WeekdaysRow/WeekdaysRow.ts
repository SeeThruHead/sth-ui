import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { colors, fontSize, fontWeight, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { weekdayNames } from "../date/date.ts"
import type { DayOfWeek } from "../date/date.ts"
import type { DaySize } from "../Day/Day.ts"

export type WeekdaysRowPart = "weekday" | "weekdaysRow"

export type WeekdaysRowOptions = {
  readonly locale?: string
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekdayFormat?: string
  readonly size?: DaySize
}

export type WeekdaysRowProps = WeekdaysRowOptions &
  StylesApiProps<WeekdaysRowPart> & {
    readonly withWeekNumbers?: boolean
    readonly cellComponent?: "th" | "td"
  }

export type WeekdaysRowConfig = ComponentConfig<WeekdaysRowOptions, WeekdaysRowPart>

const sizes = stylex.create({
  xs: { fontSize: fontSize.xs, paddingBottom: `calc(${space.xs} / 2)` },
  sm: { fontSize: fontSize.sm, paddingBottom: `calc(${space.sm} / 2)` },
  md: { fontSize: fontSize.md, paddingBottom: `calc(${space.md} / 2)` },
  lg: { fontSize: fontSize.lg, paddingBottom: `calc(${space.lg} / 2)` },
  xl: { fontSize: fontSize.xl, paddingBottom: `calc(${space.xl} / 2)` }
})

const styles = stylex.create({
  weekday: { color: colors.dimmed, fontWeight: fontWeight.regular, textTransform: "capitalize" }
})

export const WeekdaysRow =
  (config: { readonly WeekdaysRow?: WeekdaysRowConfig }) =>
  <M>(h: HtmlBuilder<M>, input: WeekdaysRowProps): Html => {
    const props = withDefaults(config.WeekdaysRow, input)
    const getStyles = stylesApi<M, WeekdaysRowPart>(h, props, config.WeekdaysRow, "weekdaysRow")
    const cell = props.cellComponent === "td" ? h.td : h.th
    const size = sizes[props.size ?? "sm"]
    const names = weekdayNames(props.locale ?? "en", props.firstDayOfWeek ?? 1, props.weekdayFormat ?? "dd")

    return h.tr(getStyles("weekdaysRow"), [
      ...(props.withWeekNumbers === true ? [cell(getStyles("weekday", styles.weekday, size), ["#"])] : []),
      ...names.map((name) => cell(getStyles("weekday", styles.weekday, size), [name]))
    ])
  }
