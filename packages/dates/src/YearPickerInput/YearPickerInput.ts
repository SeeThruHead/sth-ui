import type { InputBaseConfig } from "@sth-ui/core/components/Input/InputBase.ts"
import { pickerInput } from "../picker/PickerInput.ts"
import type { PickerInputProps } from "../picker/PickerInput.ts"

export type YearPickerInputProps<M> = PickerInputProps<M, "yearPickerRoot">

export type YearPickerInputConfig = InputBaseConfig

export const YearPickerInput = pickerInput("YearPickerInput", "YearPicker", "yearPickerRoot", "YYYY")
