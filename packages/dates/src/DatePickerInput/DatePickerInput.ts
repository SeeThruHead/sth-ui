import type { InputBaseConfig } from "@sth-ui/core/components/Input/InputBase.ts"
import { pickerInput } from "../picker/PickerInput.ts"
import type { PickerInputProps } from "../picker/PickerInput.ts"

export type DatePickerInputProps<M> = PickerInputProps<M, "datePickerRoot">

export type DatePickerInputConfig = InputBaseConfig

export const DatePickerInput = pickerInput("DatePickerInput", "DatePicker", "datePickerRoot", "MMMM D, YYYY")
