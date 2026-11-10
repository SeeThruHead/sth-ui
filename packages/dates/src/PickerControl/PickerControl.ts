import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { DaySize } from "../Day/Day.ts"
import { pickerControlVars } from "./pickerControl.stylex.ts"

export type PickerControlPart = "pickerControl"

export type PickerControlOptions = { readonly size?: DaySize; readonly fullWidth?: boolean }

export type PickerControlProps<M> = PickerControlOptions &
  StylesApiProps<PickerControlPart> & {
    readonly children: ReadonlyArray<Child>
    readonly disabled?: boolean
    readonly selected?: boolean
    readonly inRange?: boolean
    readonly firstInRange?: boolean
    readonly lastInRange?: boolean
    readonly ariaLabel?: string
    readonly tabIndex?: number
    readonly value?: string
    readonly onClick?: M
    readonly onMouseEnter?: M
  }

export type PickerControlConfig = ComponentConfig<PickerControlOptions, PickerControlPart>

export const pickerSizes = stylex.create({
  xs: { [pickerControlVars.size]: "30px", [pickerControlVars.fontSize]: fontSize.xs },
  sm: { [pickerControlVars.size]: "36px", [pickerControlVars.fontSize]: fontSize.sm },
  md: { [pickerControlVars.size]: "42px", [pickerControlVars.fontSize]: fontSize.md },
  lg: { [pickerControlVars.size]: "48px", [pickerControlVars.fontSize]: fontSize.lg },
  xl: { [pickerControlVars.size]: "54px", [pickerControlVars.fontSize]: fontSize.xl }
})

const styles = stylex.create({
  control: {
    fontSize: pickerControlVars.fontSize,
    height: pickerControlVars.size,
    width: `calc((${pickerControlVars.size} * 7) / 3 + 1.5px)`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    cursor: "pointer",
    padding: 0,
    borderWidth: 0,
    font: "inherit",
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark5})` },
    color: colors.text,
    opacity: 1,
    borderRadius: radius.default
  },
  fullWidth: { width: "100%" },
  disabled: {
    color: colors.disabledColor,
    cursor: "not-allowed",
    opacity: 0.5,
    backgroundColor: { default: "transparent", ":hover": "transparent" }
  },
  selected: { backgroundColor: { default: accent.filled, ":hover": accent.filledHover }, color: accent.contrast },
  inRange: { backgroundColor: { default: accent.lightHover, ":hover": accent.light }, borderRadius: 0 },
  first: { borderStartStartRadius: radius.default, borderEndStartRadius: radius.default },
  last: { borderStartEndRadius: radius.default, borderEndEndRadius: radius.default }
})

export const PickerControl =
  (config: { readonly PickerControl?: PickerControlConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PickerControlProps<M>): Html => {
    const props = withDefaults(config.PickerControl, input)
    const getStyles = stylesApi<M, PickerControlPart>(h, props, config.PickerControl, "pickerControl")
    const disabled = props.disabled === true
    const selected = !disabled && props.selected === true
    const inRange = !disabled && !selected && props.inRange === true
    const flags: ReadonlyArray<readonly [string, boolean]> = [
      ["picker-control", true],
      ["full-width", props.fullWidth === true],
      ["selected", selected],
      ["disabled", disabled],
      ["in-range", inRange],
      ["first-in-range", !disabled && props.firstInRange === true],
      ["last-in-range", !disabled && props.lastInRange === true]
    ]

    return h.button(
      [
        ...getStyles(
          "pickerControl",
          styles.control,
          pickerSizes[props.size ?? "sm"],
          props.fullWidth === true && styles.fullWidth,
          inRange && styles.inRange,
          inRange && props.firstInRange === true && styles.first,
          inRange && props.lastInRange === true && styles.last,
          selected && styles.selected,
          disabled && styles.disabled
        ),
        ...flags.flatMap(([name, on]) => (on ? [h.DataAttribute(name, "")] : [])),
        h.Type("button"),
        ...(disabled ? [h.Disabled(true)] : []),
        ...(props.value === undefined ? [] : [h.DataAttribute("value", props.value)]),
        ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
        ...(props.tabIndex === undefined ? [] : [h.Tabindex(props.tabIndex)]),
        ...(props.onClick === undefined || disabled ? [] : [h.OnClick(props.onClick)]),
        ...(props.onMouseEnter === undefined ? [] : [h.OnMouseEnter(props.onMouseEnter)])
      ],
      props.children
    )
  }
