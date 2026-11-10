import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { accent, colors, fontWeight, gradient } from "../../theme/tokens.stylex.ts"
import { Button, groupPositionStyle, radiusStyle, sizes } from "./Button.ts"
import type { ButtonConfig, ButtonProps, ButtonRadius, ButtonSize, GroupOrientation, GroupPosition } from "./Button.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { buttonVars } from "./Button.stylex.ts"
import { sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"

export type ButtonGroupPart = "group"

export type ButtonGroupSectionPart = "groupSection"

export type SectionVariant = keyof typeof sectionVariants

export type ButtonGroupSectionOptions = {
  readonly size?: ButtonSize
  readonly radius?: ButtonRadius | number
  readonly color?: string
  readonly variant?: SectionVariant
  readonly gradient?: Gradient
  readonly autoContrast?: boolean
}

export type ButtonGroupSectionProps = ButtonGroupSectionOptions &
  StylesApiProps<ButtonGroupSectionPart> & { readonly children: ReadonlyArray<Child> }

export type ButtonGroupItem<M> =
  | { readonly _tag: "Button"; readonly props: ButtonProps<M> }
  | { readonly _tag: "Section"; readonly props: ButtonGroupSectionProps }

export const groupButton = <M>(props: ButtonProps<M>): ButtonGroupItem<M> => ({ _tag: "Button", props })

export const groupSection = <M>(props: ButtonGroupSectionProps): ButtonGroupItem<M> => ({ _tag: "Section", props })

export type ButtonGroupOptions = {
  readonly orientation?: GroupOrientation
  readonly borderWidth?: number | string
}

export type ButtonGroupProps<M> = ButtonGroupOptions &
  StylesApiProps<ButtonGroupPart> & { readonly children: ReadonlyArray<ButtonGroupItem<M>> }

export type ButtonGroupConfig = ComponentConfig<ButtonGroupOptions, ButtonGroupPart>

export type ButtonGroupSectionConfig = ComponentConfig<ButtonGroupSectionOptions, ButtonGroupSectionPart>

const styles = stylex.create({
  group: { display: "flex", flexDirection: "row" },
  vertical: { flexDirection: "column" },
  section: {
    fontWeight: fontWeight.medium,
    width: "auto",
    borderRadius: buttonVars.radius,
    fontSize: buttonVars.fontSize,
    height: buttonVars.height,
    paddingInline: buttonVars.paddingX,
    verticalAlign: "middle",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent"
  },
  contrast: { color: accent.contrast }
})

const sectionVariants = stylex.create({
  filled: { backgroundColor: accent.filled, color: colors.white },
  light: { backgroundColor: accent.light, color: accent.lightColor },
  outline: { backgroundColor: "transparent", color: accent.outline, borderColor: accent.outline },
  subtle: { backgroundColor: "transparent", color: accent.lightColor },
  transparent: { backgroundColor: "transparent", color: accent.lightColor },
  white: { backgroundColor: colors.white, color: accent.filled },
  default: { backgroundColor: colors.default, color: colors.defaultColor, borderColor: colors.defaultBorder },
  gradient: {
    backgroundImage: `linear-gradient(${gradient.angle}, ${gradient.from} 0%, ${gradient.to} 100%)`,
    color: colors.white,
    borderWidth: 0
  }
})

export const positionOf = (index: number, count: number): GroupPosition => {
  if (count === 1) return "only"
  if (index === 0) return "first"

  return index === count - 1 ? "last" : "middle"
}

export const ButtonGroupSection =
  (config: { readonly ButtonGroupSection?: ButtonGroupSectionConfig }) =>
  <M>(
    h: HtmlBuilder<M>,
    input: ButtonGroupSectionProps & {
      readonly groupPosition?: GroupPosition
      readonly groupOrientation?: GroupOrientation
    }
  ): Html => {
    const props = withDefaults(config.ButtonGroupSection, input)
    const getStyles = stylesApi<M, ButtonGroupSectionPart>(h, props, config.ButtonGroupSection, "groupSection")

    return h.div(
      getStyles(
        "groupSection",
        ...accentStyle(props.color, customAccent),
        styles.section,
        props.size === undefined ? null : sizes[props.size],
        radiusStyle(props.radius),
        gradientStyle(props.gradient),
        sectionVariants[props.variant ?? "filled"],
        props.autoContrast === true && (props.variant ?? "filled") === "filled" && styles.contrast,
        groupPositionStyle(props.groupPosition, props.groupOrientation)
      ),
      props.children
    )
  }

export const ButtonGroup = (config: {
  readonly ButtonGroup?: ButtonGroupConfig
  readonly ButtonGroupSection?: ButtonGroupSectionConfig
  readonly Button?: ButtonConfig
  readonly Loader?: LoaderConfig
}) => {
  const button = Button(config)
  const section = ButtonGroupSection(config)

  return <M>(h: HtmlBuilder<M>, input: ButtonGroupProps<M>): Html => {
    const props = withDefaults(config.ButtonGroup, input)
    const getStyles = stylesApi<M, ButtonGroupPart>(h, props, config.ButtonGroup, "group")
    const orientation = props.orientation ?? "horizontal"
    const count = props.children.length
    const item = (child: ButtonGroupItem<M>, index: number): Html => {
      const placed = { groupPosition: positionOf(index, count), groupOrientation: orientation }

      return child._tag === "Button"
        ? button(h, { ...child.props, ...placed })
        : section(h, { ...child.props, ...placed })
    }

    return h.div(
      [
        ...getStyles(
          "group",
          styles.group,
          orientation === "vertical" && styles.vertical,
          setDefinedVars([buttonVars.groupBorderWidth, mapDefined(props.borderWidth, sizeValue)])
        ),
        h.Role("group"),
        h.DataAttribute("orientation", orientation)
      ],
      props.children.map(item)
    )
  }
}
