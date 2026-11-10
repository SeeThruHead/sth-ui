import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { radius } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { buttonBehaviour, unstyledButtonStyles } from "../UnstyledButton/UnstyledButton.ts"
import type { ButtonBehaviour } from "../UnstyledButton/UnstyledButton.ts"
import { closeButtonVars } from "./CloseButton.stylex.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"

export type CloseButtonPart = "root"

export type CloseButtonSize = keyof typeof sizes

export type CloseButtonOptions = {
  readonly size?: CloseButtonSize | number
  readonly radius?: string | number
  readonly iconSize?: number | string
  readonly variant?: "subtle" | "transparent"
}

export type CloseButtonProps<M> = CloseButtonOptions &
  ButtonBehaviour<M> &
  StylesApiProps<CloseButtonPart> & {
    readonly icon?: Child
    readonly children?: ReadonlyArray<Child>
  }

export type CloseButtonConfig = ComponentConfig<CloseButtonOptions, CloseButtonPart>

const styles = stylex.create({
  root: {
    [closeButtonVars.size]: "28px",
    [closeButtonVars.iconSize]: "70%",
    [closeButtonVars.radius]: radius.default,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    userSelect: "none",
    width: closeButtonVars.size,
    height: closeButtonVars.size,
    minWidth: closeButtonVars.size,
    minHeight: closeButtonVars.size,
    borderRadius: closeButtonVars.radius,
    color: `light-dark(${palette.gray7}, ${palette.dark1})`
  },
  subtle: {
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark6})` }
  },
  disabled: { cursor: "not-allowed", opacity: 0.6, backgroundColor: "transparent" },
  icon: { width: closeButtonVars.iconSize, height: closeButtonVars.iconSize }
})

const sizes = stylex.create({
  xs: { [closeButtonVars.size]: "18px" },
  sm: { [closeButtonVars.size]: "22px" },
  md: { [closeButtonVars.size]: "28px" },
  lg: { [closeButtonVars.size]: "34px" },
  xl: { [closeButtonVars.size]: "44px" }
})

const closePath =
  "M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"

export const closeIcon = <M>(h: HtmlBuilder<M>): Html =>
  h.svg(
    [...sx(h, styles.icon), h.Attribute("viewBox", "0 0 15 15"), h.Attribute("fill", "none"), h.AriaHidden(true)],
    [
      h.path(
        [
          h.Attribute("d", closePath),
          h.Attribute("fill", "currentColor"),
          h.Attribute("fill-rule", "evenodd"),
          h.Attribute("clip-rule", "evenodd")
        ],
        []
      )
    ]
  )

const sizeStyle = (size: CloseButtonOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([closeButtonVars.size, rem(size)])

  return sizes[size]
}

export const CloseButton =
  (config: { readonly CloseButton?: CloseButtonConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CloseButtonProps<M>): Html => {
    const props = withDefaults(config.CloseButton, input)
    const getStyles = stylesApi<M, CloseButtonPart>(h, props, config.CloseButton, "root")
    const disabled = props.disabled === true

    return h[props.component ?? "button"](
      [
        ...getStyles(
          "root",
          unstyledButtonStyles.root,
          styles.root,
          sizeStyle(props.size),
          setDefinedVars(
            [closeButtonVars.radius, mapDefined(props.radius, radiusValue)],
            [closeButtonVars.iconSize, mapDefined(props.iconSize, sizeValue)]
          ),
          (props.variant ?? "subtle") === "subtle" && styles.subtle,
          shared.focusRing,
          !disabled && shared.active,
          disabled && styles.disabled
        ),
        ...buttonBehaviour(h, props),
        ...(disabled ? [h.DataAttribute("disabled", "")] : [])
      ],
      [props.icon ?? closeIcon(h), ...(props.children ?? [])]
    )
  }
