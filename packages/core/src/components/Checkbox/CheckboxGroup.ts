import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import { inputsGroup } from "../InlineInput/InputsGroup.ts"
import type { GroupControl, InputsGroupConfig, InputsGroupProps } from "../InlineInput/InputsGroup.ts"
import { Checkbox } from "./Checkbox.ts"
import type { CheckboxConfig, CheckboxProps } from "./Checkbox.ts"

export type GroupCheckboxProps = Omit<CheckboxProps<never>, "id" | "checked" | "onChange" | "value" | "size">

export type GroupCheckbox = GroupControl<GroupCheckboxProps>

export type CheckboxGroupProps<M> = InputsGroupProps<M, GroupCheckboxProps>

export type CheckboxGroupConfig = InputsGroupConfig

export const CheckboxGroup = (config: {
  readonly CheckboxGroup?: CheckboxGroupConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Checkbox?: CheckboxConfig
}) => inputsGroup("CheckboxGroup")<GroupCheckboxProps>(config, Checkbox(config))
