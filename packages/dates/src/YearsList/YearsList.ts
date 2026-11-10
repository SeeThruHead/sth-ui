import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { formatDate, isYearDisabled, isSameYear, yearsData } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import type { DaySize } from "../Day/Day.ts"
import { PickerControl } from "../PickerControl/PickerControl.ts"
import type { PickerControlConfig, PickerControlPart } from "../PickerControl/PickerControl.ts"
import { controlsTable } from "../PickerControl/controlsTable.ts"
import type { ControlState } from "../PickerControl/controlsTable.ts"

export type YearsListPart = "yearsList" | "yearsListRow" | "yearsListCell" | PickerControlPart

export type YearsListOptions = {
  readonly locale?: string
  readonly yearsListFormat?: string
  readonly size?: DaySize
  readonly withCellSpacing?: boolean
  readonly fullWidth?: boolean
}

export type YearsListProps<M> = YearsListOptions &
  StylesApiProps<YearsListPart> & {
    readonly decade: DateString
    readonly today?: DateString
    readonly minDate?: DateString
    readonly maxDate?: DateString
    readonly getYearControlProps?: (year: DateString) => ControlState
    readonly onYearClick?: (year: DateString) => M
    readonly onYearMouseEnter?: (year: DateString) => M
    readonly focusableDate?: DateString
  }

export type YearsListConfig = ComponentConfig<YearsListOptions, YearsListPart>

const styles = stylex.create({ list: { borderCollapse: "collapse", borderWidth: 0 } })

export const YearsList =
  (config: { readonly YearsList?: YearsListConfig; readonly PickerControl?: PickerControlConfig }) =>
  <M>(h: HtmlBuilder<M>, input: YearsListProps<M>): Html => {
    const props = withDefaults(config.YearsList, input)
    const getStyles = stylesApi<M, YearsListPart>(h, props, config.YearsList, "yearsList")
    const locale = props.locale ?? "en"

    return controlsTable(h, PickerControl(config), {
      getStyles,
      tableStyle: styles.list,
      parts: { table: "yearsList", row: "yearsListRow", cell: "yearsListCell" },
      rows: yearsData(props.decade),
      same: isSameYear,
      label: (year) => formatDate(year, props.yearsListFormat ?? "YYYY", locale),
      ariaLabel: (year) => formatDate(year, "YYYY", locale),
      disabled: (year) => isYearDisabled(year, props.minDate, props.maxDate),
      size: props.size ?? "sm",
      withCellSpacing: props.withCellSpacing !== false,
      fullWidth: props.fullWidth === true,
      forwarded: props,
      ...(props.today === undefined ? {} : { today: props.today }),
      ...(props.focusableDate === undefined ? {} : { focusableDate: props.focusableDate }),
      ...(props.getYearControlProps === undefined ? {} : { controlProps: props.getYearControlProps }),
      ...(props.onYearClick === undefined ? {} : { onClick: props.onYearClick }),
      ...(props.onYearMouseEnter === undefined ? {} : { onMouseEnter: props.onYearMouseEnter })
    })
  }
