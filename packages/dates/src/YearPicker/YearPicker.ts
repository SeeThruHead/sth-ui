import type { HtmlBuilder } from "foldkit/html"
import type { CalendarComponents } from "../Calendar/Calendar.ts"
import { picker } from "../picker/Picker.ts"
import type { PickerConfig, PickerPart, PickerProps } from "../picker/Picker.ts"

export type YearPickerPart = PickerPart<"yearPickerRoot">

export type YearPickerProps<M> = PickerProps<M, "yearPickerRoot">

export type YearPickerConfig = PickerConfig<"yearPickerRoot">

export const YearPicker =
  (config: CalendarComponents & { readonly YearPicker?: YearPickerConfig }) =>
  <M>(h: HtmlBuilder<M>, props: YearPickerProps<M>) =>
    picker("yearPickerRoot", config, config.YearPicker)(h, props)
