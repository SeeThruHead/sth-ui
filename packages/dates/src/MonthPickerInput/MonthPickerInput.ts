import type { InputBaseConfig } from "@sth-ui/core/components/Input/InputBase.ts"
import { pickerInput } from "../picker/PickerInput.ts"
import type { PickerInputProps } from "../picker/PickerInput.ts"

export type MonthPickerInputProps<M> = PickerInputProps<M, "monthPickerRoot">

export type MonthPickerInputConfig = InputBaseConfig

export const MonthPickerInput = pickerInput("MonthPickerInput", "MonthPicker", "monthPickerRoot", "MMMM YYYY")
