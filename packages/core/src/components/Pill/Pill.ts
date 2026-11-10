import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mapDefined, mergeStyles, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { pillVars } from "./Pill.stylex.ts"

export type PillPart = "root" | "label" | "remove"

export type PillSize = keyof typeof sizes

export type PillVariant = "default" | "contrast"

export type PillOptions = {
  readonly size?: PillSize
  readonly radius?: StyleValue
  readonly variant?: PillVariant
}

export type PillProps<M> = PillOptions &
  StylesApiProps<PillPart> & {
    readonly children: ReadonlyArray<Child>
    readonly withRemoveButton?: boolean
    readonly onRemove?: M
    readonly disabled?: boolean
  }

export type PillConfig = ComponentConfig<PillOptions, PillPart>

const sizes = stylex.create({
  xs: { [pillVars.fz]: "10px", [pillVars.height]: "18px" },
  sm: { [pillVars.fz]: "12px", [pillVars.height]: "22px" },
  md: { [pillVars.fz]: "14px", [pillVars.height]: "25px" },
  lg: { [pillVars.fz]: "16px", [pillVars.height]: "28px" },
  xl: { [pillVars.fz]: "18px", [pillVars.height]: "32px" }
})

const variants = stylex.create({
  default: { backgroundColor: `light-dark(${palette.gray1}, ${palette.dark7})` },
  contrast: { backgroundColor: `light-dark(${palette.white}, ${palette.dark7})` }
})

const styles = stylex.create({
  root: {
    fontSize: pillVars.fz,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    height: pillVars.height,
    paddingInline: "0.8em",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: pillVars.radius,
    lineHeight: 1,
    whiteSpace: "nowrap",
    userSelect: "none",
    maxWidth: "100%",
    position: "relative",
    color: `light-dark(${palette.black}, ${palette.dark0})`
  },
  withRemove: { paddingInlineEnd: 0 },
  disabled: { cursor: "not-allowed", backgroundColor: `light-dark(${colors.disabled}, ${palette.dark7})` },
  label: {
    cursor: "inherit",
    display: "block",
    overflow: "hidden",
    height: "100%",
    lineHeight: pillVars.height,
    textOverflow: "ellipsis"
  },
  remove: {
    color: "inherit",
    fontSize: "inherit",
    height: "100%",
    minHeight: "unset",
    minWidth: "2em",
    width: "unset",
    borderRadius: 0,
    paddingInlineStart: "0.1em",
    paddingInlineEnd: "0.3em",
    flexGrow: 0,
    flexShrink: 0,
    borderEndEndRadius: pillVars.radius,
    borderStartEndRadius: pillVars.radius
  }
})

export const Pill = (config: { readonly Pill?: PillConfig; readonly CloseButton?: CloseButtonConfig }) => {
  const closeButton = CloseButton(config)

  return <M>(h: HtmlBuilder<M>, input: PillProps<M>): Html => {
    const props = withDefaults(config.Pill, input)
    const getStyles = stylesApi<M, PillPart>(h, props, config.Pill, "root")
    const disabled = props.disabled === true
    const removable = props.withRemoveButton === true && !disabled
    const variant = props.variant ?? "default"
    const parts = mergeStyles(["remove"], config.Pill?.styles, props.styles)

    return h.span(
      [
        ...getStyles(
          "root",
          styles.root,
          sizes[props.size ?? "sm"],
          variants[variant],
          removable && styles.withRemove,
          disabled && styles.disabled,
          setDefinedVars([pillVars.radius, mapDefined(props.radius, radiusValue)])
        ),
        h.DataAttribute("variant", variant),
        ...(removable ? [h.DataAttribute("with-remove", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", "")] : [])
      ],
      [
        h.span(getStyles("label", styles.label), props.children),
        ...(removable
          ? [
              closeButton(h, {
                variant: "transparent",
                ...(props.onRemove === undefined ? {} : { onClick: props.onRemove }),
                styles: { root: [styles.remove, ...listOf(parts.remove)] },
                attributes: { root: { tabindex: "-1", "aria-hidden": "true" } }
              })
            ]
          : [])
      ]
    )
  }
}

export type PillGroupPart = "group"

export type PillGroupOptions = { readonly size?: PillSize; readonly gap?: StyleValue }

export type PillGroupProps = PillGroupOptions &
  StylesApiProps<PillGroupPart> & { readonly children: ReadonlyArray<Child>; readonly disabled?: boolean }

export type PillGroupConfig = ComponentConfig<PillGroupOptions, PillGroupPart>

const gaps = stylex.create({
  xs: { [pillVars.gap]: "6px" },
  sm: { [pillVars.gap]: "8px" },
  md: { [pillVars.gap]: "10px" },
  lg: { [pillVars.gap]: "12px" },
  xl: { [pillVars.gap]: "12px" }
})

const groupStyles = stylex.create({
  group: { display: "flex", alignItems: "center", gap: pillVars.gap, flexWrap: "wrap" }
})

export const PillGroup =
  (config: { readonly PillGroup?: PillGroupConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PillGroupProps): Html => {
    const props = withDefaults(config.PillGroup, input)
    const getStyles = stylesApi<M, PillGroupPart>(h, props, config.PillGroup, "group")

    return h.div(
      [
        ...getStyles(
          "group",
          groupStyles.group,
          gaps[props.size ?? "sm"],
          setDefinedVars([pillVars.gap, mapDefined(props.gap, spacing)])
        ),
        ...(props.disabled === true ? [h.DataAttribute("disabled", "")] : [])
      ],
      props.children
    )
  }
