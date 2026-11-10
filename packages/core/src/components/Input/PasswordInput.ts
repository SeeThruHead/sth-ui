import { EyeIcon } from "@sth-ui/icons/icons/EyeIcon.ts"
import { EyeSlashIcon } from "@sth-ui/icons/icons/EyeSlashIcon.ts"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { mergeStyles, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, PartStyles } from "../../styles/StylesApi.ts"
import { ActionIcon } from "../ActionIcon/ActionIcon.ts"
import type { ActionIconConfig } from "../ActionIcon/ActionIcon.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import type { InputConfig, InputSize } from "./Input.ts"
import { inputBase } from "./InputBase.ts"
import type { InputBaseOptions, InputBasePart, InputBaseProps } from "./InputBase.ts"
import type { InputWrapperConfig } from "./InputWrapper.ts"

export type PasswordInputPart = InputBasePart | "visibilityToggle"

export type PasswordInputOptions = InputBaseOptions & {
  readonly visibilityToggleFocusable?: boolean
}

export type PasswordInputProps<M> = PasswordInputOptions &
  Omit<InputBaseProps<M>, "component" | "multiline" | "type" | "pointer" | "styles"> & {
    readonly styles?: PartStyles<PasswordInputPart>
    readonly visible?: boolean
    readonly onVisibilityChange?: (visible: boolean) => M
    readonly visibilityToggleIcon?: ToggleIcon
  }

export type PasswordInputConfig = ComponentConfig<PasswordInputOptions, PasswordInputPart>

const buttonSizes: { readonly [Size in InputSize]: number } = { xs: 22, sm: 26, md: 28, lg: 32, xl: 40 }

const iconSizes: { readonly [Size in InputSize]: number } = { xs: 16, sm: 20, md: 22, lg: 24, xl: 28 }

export type ToggleIcon = <N>(h: HtmlBuilder<N>, reveal: boolean, size: number) => Html

const defaultIcon: ToggleIcon = (h, reveal, size) => (reveal ? EyeSlashIcon(h, { size }) : EyeIcon(h, { size }))

type Configs = {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
  readonly ActionIcon?: ActionIconConfig
  readonly PasswordInput?: PasswordInputConfig
}

export const PasswordInput = (config: Configs) => {
  const base = inputBase("PasswordInput")(config)
  const actionIcon = ActionIcon(config)
  const toggleParts: ReadonlyArray<"visibilityToggle"> = ["visibilityToggle"]

  return <M>(h: HtmlBuilder<M>, given: PasswordInputProps<M>): Html => {
    const props = withDefaults(config.PasswordInput, given)
    const visible = props.visible === true
    const size = props.size ?? "sm"
    const icon = props.visibilityToggleIcon ?? defaultIcon
    const toggleStyles = mergeStyles(toggleParts, config.PasswordInput?.styles, props.styles).visibilityToggle
    const toggle: Child | undefined =
      props.onVisibilityChange === undefined
        ? undefined
        : actionIcon(h, {
            variant: "subtle",
            color: "gray",
            size: buttonSizes[size],
            disabled: props.disabled === true,
            label: "Toggle password visibility",
            onClick: props.onVisibilityChange(!visible),
            styles: { root: toggleStyles },
            attributes: {
              root: {
                "aria-pressed": String(visible),
                tabindex: props.visibilityToggleFocusable === true ? "0" : "-1"
              }
            },
            children: [icon(h, visible, iconSizes[size])]
          })

    return base(h, {
      ...props,
      type: visible ? "text" : "password",
      autoComplete: props.autoComplete ?? "off",
      rightSectionPointerEvents: props.rightSectionPointerEvents ?? "all",
      ...(props.rightSection === undefined && toggle !== undefined ? { rightSection: toggle } : {})
    })
  }
}
