import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { staticVariants } from "../../theme/staticVariants.ts"
import type { StaticVariant } from "../../theme/staticVariants.ts"
import { accent, radius } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { themeIconVars } from "./ThemeIcon.stylex.ts"

export type ThemeIconPart = "root"

export type ThemeIconVariant = StaticVariant

export type ThemeIconSize = keyof typeof sizes

export type ThemeIconOptions = {
  readonly size?: ThemeIconSize | number | (string & {})
  readonly variant?: ThemeIconVariant
  readonly color?: string
  readonly radius?: string | number
  readonly gradient?: Gradient
  readonly autoContrast?: boolean
}

export type ThemeIconProps = ThemeIconOptions &
  StylesApiProps<ThemeIconPart> & { readonly children: ReadonlyArray<Child> }

export type ThemeIconConfig = ComponentConfig<ThemeIconOptions, ThemeIconPart>

const styles = stylex.create({
  root: {
    [themeIconVars.radius]: radius.default,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    userSelect: "none",
    width: themeIconVars.size,
    height: themeIconVars.size,
    minWidth: themeIconVars.size,
    minHeight: themeIconVars.size,
    borderRadius: themeIconVars.radius,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent"
  },
  contrast: { color: accent.contrast }
})

const sizes = stylex.create({
  xs: { [themeIconVars.size]: "18px" },
  sm: { [themeIconVars.size]: "22px" },
  md: { [themeIconVars.size]: "28px" },
  lg: { [themeIconVars.size]: "34px" },
  xl: { [themeIconVars.size]: "44px" }
})

const isThemeIconSize = (size: string): size is ThemeIconSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: ThemeIconOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([themeIconVars.size, rem(size)])

  return isThemeIconSize(size) ? sizes[size] : setVars([themeIconVars.size, size])
}

export const ThemeIcon =
  (config: { readonly ThemeIcon?: ThemeIconConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ThemeIconProps): Html => {
    const props = withDefaults(config.ThemeIcon, input)
    const getStyles = stylesApi<M, ThemeIconPart>(h, props, config.ThemeIcon, "root")
    const variant = props.variant ?? "filled"

    return h.div(
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          styles.root,
          sizeStyle(props.size),
          setDefinedVars([themeIconVars.radius, mapDefined(props.radius, radiusValue)]),
          gradientStyle(props.gradient),
          staticVariants[variant],
          props.autoContrast === true && variant === "filled" && styles.contrast
        ),
        h.DataAttribute("variant", variant)
      ],
      props.children
    )
  }
