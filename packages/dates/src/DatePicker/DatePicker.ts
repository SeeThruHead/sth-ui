import type { HtmlBuilder } from "foldkit/html"
import type { CalendarComponents } from "../Calendar/Calendar.ts"
import { picker } from "../picker/Picker.ts"
import type { PickerConfig, PickerPart, PickerProps } from "../picker/Picker.ts"

export type DatePickerPart = PickerPart<"datePickerRoot">

export type DatePickerProps<M> = PickerProps<M, "datePickerRoot">

export type DatePickerConfig = PickerConfig<"datePickerRoot">

export const DatePicker =
  (config: CalendarComponents & { readonly DatePicker?: DatePickerConfig }) =>
  <M>(h: HtmlBuilder<M>, props: DatePickerProps<M>) =>
    picker("datePickerRoot", config, config.DatePicker)(h, props)
