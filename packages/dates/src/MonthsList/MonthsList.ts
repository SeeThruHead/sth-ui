import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { formatDate, isMonthDisabled, isSameMonth, monthsData } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import type { DaySize } from "../Day/Day.ts"
import { PickerControl } from "../PickerControl/PickerControl.ts"
import type { PickerControlConfig, PickerControlPart } from "../PickerControl/PickerControl.ts"
import { controlsTable } from "../PickerControl/controlsTable.ts"
import type { ControlState } from "../PickerControl/controlsTable.ts"

export type MonthsListPart = "monthsList" | "monthsListRow" | "monthsListCell" | PickerControlPart

export type MonthsListOptions = {
  readonly locale?: string
  readonly monthsListFormat?: string
  readonly size?: DaySize
  readonly withCellSpacing?: boolean
  readonly fullWidth?: boolean
}

export type MonthsListProps<M> = MonthsListOptions &
  StylesApiProps<MonthsListPart> & {
    readonly year: DateString
    readonly today?: DateString
    readonly minDate?: DateString
    readonly maxDate?: DateString
    readonly getMonthControlProps?: (month: DateString) => ControlState
    readonly onMonthClick?: (month: DateString) => M
    readonly onMonthMouseEnter?: (month: DateString) => M
    readonly focusableDate?: DateString
  }

export type MonthsListConfig = ComponentConfig<MonthsListOptions, MonthsListPart>

const styles = stylex.create({ list: { borderCollapse: "collapse", borderWidth: 0 } })

export const MonthsList =
  (config: { readonly MonthsList?: MonthsListConfig; readonly PickerControl?: PickerControlConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MonthsListProps<M>): Html => {
    const props = withDefaults(config.MonthsList, input)
    const getStyles = stylesApi<M, MonthsListPart>(h, props, config.MonthsList, "monthsList")
    const locale = props.locale ?? "en"

    return controlsTable(h, PickerControl(config), {
      getStyles,
      tableStyle: styles.list,
      parts: { table: "monthsList", row: "monthsListRow", cell: "monthsListCell" },
      rows: monthsData(props.year),
      same: isSameMonth,
      label: (month) => formatDate(month, props.monthsListFormat ?? "MMM", locale),
      ariaLabel: (month) => formatDate(month, "MMMM YYYY", locale),
      disabled: (month) => isMonthDisabled(month, props.minDate, props.maxDate),
      size: props.size ?? "sm",
      withCellSpacing: props.withCellSpacing !== false,
      fullWidth: props.fullWidth === true,
      forwarded: props,
      ...(props.today === undefined ? {} : { today: props.today }),
      ...(props.focusableDate === undefined ? {} : { focusableDate: props.focusableDate }),
      ...(props.getMonthControlProps === undefined ? {} : { controlProps: props.getMonthControlProps }),
      ...(props.onMonthClick === undefined ? {} : { onClick: props.onMonthClick }),
      ...(props.onMonthMouseEnter === undefined ? {} : { onMouseEnter: props.onMonthMouseEnter })
    })
  }
