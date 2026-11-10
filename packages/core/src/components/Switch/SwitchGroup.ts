import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import { inputsGroup } from "../InlineInput/InputsGroup.ts"
import type { GroupControl, InputsGroupConfig, InputsGroupProps } from "../InlineInput/InputsGroup.ts"
import { Switch } from "./Switch.ts"
import type { SwitchConfig, SwitchProps } from "./Switch.ts"

export type GroupSwitchProps = Omit<SwitchProps<never>, "id" | "checked" | "onChange" | "value" | "size">

export type GroupSwitch = GroupControl<GroupSwitchProps>

export type SwitchGroupProps<M> = InputsGroupProps<M, GroupSwitchProps>

export type SwitchGroupConfig = InputsGroupConfig

export const SwitchGroup = (config: {
  readonly SwitchGroup?: SwitchGroupConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Switch?: SwitchConfig
}) => inputsGroup("SwitchGroup")<GroupSwitchProps>(config, Switch(config))
