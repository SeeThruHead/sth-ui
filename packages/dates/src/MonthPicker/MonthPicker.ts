import type { HtmlBuilder } from "foldkit/html"
import type { CalendarComponents } from "../Calendar/Calendar.ts"
import { picker } from "../picker/Picker.ts"
import type { PickerConfig, PickerPart, PickerProps } from "../picker/Picker.ts"

export type MonthPickerPart = PickerPart<"monthPickerRoot">

export type MonthPickerProps<M> = PickerProps<M, "monthPickerRoot">

export type MonthPickerConfig = PickerConfig<"monthPickerRoot">

export const MonthPicker =
  (config: CalendarComponents & { readonly MonthPicker?: MonthPickerConfig }) =>
  <M>(h: HtmlBuilder<M>, props: MonthPickerProps<M>) =>
    picker("monthPickerRoot", config, config.MonthPicker)(h, props)
