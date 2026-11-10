import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { accent, colors, radius } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { groupPositionStyle, groupStyles, radiusStyle, variants } from "../Button/Button.ts"
import type { ButtonRadius, ButtonVariant, GroupOrientation, GroupPosition } from "../Button/Button.ts"
import { buttonVars } from "../Button/Button.stylex.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig, LoaderProps } from "../Loader/Loader.ts"
import { buttonBehaviour, unstyledButtonStyles } from "../UnstyledButton/UnstyledButton.ts"
import type { ButtonBehaviour } from "../UnstyledButton/UnstyledButton.ts"
import { actionIconVars } from "./ActionIcon.stylex.ts"

export type ActionIconPart = "root" | "icon" | "loader"

export type ActionIconSize = keyof typeof sizes

export type ActionIconOptions = {
  readonly size?: ActionIconSize | number | (string & {})
  readonly color?: string
  readonly variant?: ButtonVariant
  readonly radius?: ButtonRadius | number
  readonly gradient?: Gradient
  readonly autoContrast?: boolean
  readonly loading?: boolean
}

export type ActionIconProps<M> = ActionIconOptions &
  ButtonBehaviour<M> &
  StylesApiProps<ActionIconPart> & {
    readonly loaderProps?: LoaderProps
    readonly groupPosition?: GroupPosition
    readonly groupOrientation?: GroupOrientation
    readonly children: ReadonlyArray<Child>
  }

export type ActionIconConfig = ComponentConfig<ActionIconOptions, ActionIconPart>

const styles = stylex.create({
  root: {
    [actionIconVars.size]: "28px",
    [buttonVars.radius]: radius.default,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    userSelect: "none",
    overflow: "hidden",
    width: actionIconVars.size,
    height: actionIconVars.size,
    minWidth: actionIconVars.size,
    minHeight: actionIconVars.size,
    borderRadius: buttonVars.radius,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer"
  },
  contrast: { color: accent.contrast },
  disabled: {
    cursor: "not-allowed",
    borderColor: "transparent",
    color: colors.disabledColor,
    backgroundColor: { default: colors.disabled, ":hover": colors.disabled },
    backgroundImage: "none",
    transform: "none"
  },
  loading: { cursor: "not-allowed" },
  loader: {
    inset: "-1px",
    position: "absolute",
    borderRadius: buttonVars.radius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.veil
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 150ms ease, opacity 100ms ease",
    width: "100%",
    height: "100%"
  },
  iconLoading: { opacity: 0, transform: "translateY(100%)" }
})

const sizes = stylex.create({
  xs: { [actionIconVars.size]: "18px" },
  sm: { [actionIconVars.size]: "22px" },
  md: { [actionIconVars.size]: "28px" },
  lg: { [actionIconVars.size]: "34px" },
  xl: { [actionIconVars.size]: "44px" },
  "input-xs": { [actionIconVars.size]: "30px" },
  "input-sm": { [actionIconVars.size]: "36px" },
  "input-md": { [actionIconVars.size]: "42px" },
  "input-lg": { [actionIconVars.size]: "50px" },
  "input-xl": { [actionIconVars.size]: "60px" }
})

const isActionIconSize = (size: string): size is ActionIconSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: ActionIconOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([actionIconVars.size, rem(size)])

  return isActionIconSize(size) ? sizes[size] : setVars([actionIconVars.size, size])
}

export const ActionIcon = (config: { readonly ActionIcon?: ActionIconConfig; readonly Loader?: LoaderConfig }) => {
  const loader = Loader(config)

  return <M>(h: HtmlBuilder<M>, input: ActionIconProps<M>): Html => {
    const props = withDefaults(config.ActionIcon, input)
    const getStyles = stylesApi<M, ActionIconPart>(h, props, config.ActionIcon, "root")
    const disabled = props.disabled === true
    const loading = props.loading === true

    return h[props.component ?? "button"](
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          unstyledButtonStyles.root,
          styles.root,
          sizeStyle(props.size),
          radiusStyle(props.radius),
          gradientStyle(props.gradient),
          variants[props.variant ?? "filled"],
          props.autoContrast === true && (props.variant ?? "filled") === "filled" && styles.contrast,
          shared.focusRing,
          !disabled && !loading && shared.active,
          disabled && !loading && styles.disabled,
          loading && styles.loading,
          groupPositionStyle(props.groupPosition, props.groupOrientation),
          props.groupPosition !== undefined && groupStyles.focused
        ),
        ...buttonBehaviour(h, { ...props, disabled: disabled || loading }),
        ...(loading ? [h.AriaBusy(true), h.DataAttribute("loading", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", "")] : [])
      ],
      [
        ...(loading
          ? [
              h.span(
                [...getStyles("loader", styles.loader), h.AriaHidden(true)],
                [
                  loader(h, {
                    color: "currentColor",
                    size: `calc(${actionIconVars.size} * 0.55)`,
                    ...props.loaderProps
                  })
                ]
              )
            ]
          : []),
        h.span(getStyles("icon", styles.icon, loading && styles.iconLoading), props.children)
      ]
    )
  }
}
