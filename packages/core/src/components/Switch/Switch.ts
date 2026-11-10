import * as stylex from "@stylexjs/stylex"
import * as FoldkitSwitch from "@foldkit/ui/switch"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontWeight } from "../../theme/tokens.stylex.ts"
import { descriptionIdOf, errorIdOf, hasMessage, inlineInput, inlineInputSizes } from "../InlineInput/InlineInput.ts"
import type { InlineInputPart, InlineInputSize, LabelPosition } from "../InlineInput/InlineInput.ts"
import { isShown } from "../Input/Input.ts"
import { switchVars } from "./Switch.stylex.ts"

export type SwitchPart = InlineInputPart | "track" | "thumb" | "thumbIndicator" | "trackLabel"

export type SwitchOptions = {
  readonly size?: InlineInputSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly labelPosition?: LabelPosition
  readonly withThumbIndicator?: boolean
}

export type SwitchProps<M> = SwitchOptions &
  StylesApiProps<SwitchPart> & {
    readonly id: string
    readonly label?: Child
    readonly description?: Child
    readonly error?: boolean | Child
    readonly checked?: boolean
    readonly disabled?: boolean
    readonly readOnly?: boolean
    readonly onChange: (checked: boolean) => M
    readonly onLabel?: Child
    readonly offLabel?: Child
    readonly thumbIcon?: Child
    readonly name?: string
    readonly value?: string
  }

export type SwitchConfig = ComponentConfig<SwitchOptions, SwitchPart>

const sizes = stylex.create({
  xs: {
    [switchVars.height]: "16px",
    [switchVars.width]: "32px",
    [switchVars.thumbSize]: "12px",
    [switchVars.labelFontSize]: "5px",
    [switchVars.trackLabelPadding]: "2px"
  },
  sm: {
    [switchVars.height]: "20px",
    [switchVars.width]: "38px",
    [switchVars.thumbSize]: "14px",
    [switchVars.labelFontSize]: "6px",
    [switchVars.trackLabelPadding]: "2.5px"
  },
  md: {
    [switchVars.height]: "24px",
    [switchVars.width]: "46px",
    [switchVars.thumbSize]: "18px",
    [switchVars.labelFontSize]: "7px",
    [switchVars.trackLabelPadding]: "3px"
  },
  lg: {
    [switchVars.height]: "30px",
    [switchVars.width]: "56px",
    [switchVars.thumbSize]: "22px",
    [switchVars.labelFontSize]: "9px",
    [switchVars.trackLabelPadding]: "3px"
  },
  xl: {
    [switchVars.height]: "36px",
    [switchVars.width]: "72px",
    [switchVars.thumbSize]: "28px",
    [switchVars.labelFontSize]: "11px",
    [switchVars.trackLabelPadding]: "3.5px"
  }
})

const thumbStart = `calc(100% - ${switchVars.thumbSize} - ${switchVars.trackLabelPadding})`

const styles = stylex.create({
  root: { position: "relative", [switchVars.color]: accent.filled },
  track: {
    WebkitTapHighlightColor: "transparent",
    cursor: "pointer",
    overflow: "hidden",
    position: "relative",
    borderRadius: switchVars.radius,
    borderWidth: 0,
    padding: 0,
    backgroundColor: `light-dark(${palette.gray3}, ${palette.dark5})`,
    color: `light-dark(${palette.gray6}, ${palette.dark1})`,
    height: switchVars.height,
    minWidth: switchVars.width,
    flexShrink: 0,
    margin: 0,
    transitionProperty: "background-color, border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    appearance: "none",
    display: "flex",
    alignItems: "center",
    fontSize: switchVars.labelFontSize,
    fontWeight: fontWeight.medium,
    userSelect: "none",
    zIndex: 0,
    lineHeight: 0,
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  control: { display: "flex" },
  trackLeft: { order: 2 },
  trackRight: { order: 1 },
  withoutLabels: { width: switchVars.width },
  checked: { backgroundColor: switchVars.color, color: palette.white },
  disabled: { backgroundColor: colors.disabled, cursor: "not-allowed" },
  readOnly: { cursor: "default" },
  thumb: {
    position: "absolute",
    zIndex: 1,
    borderRadius: switchVars.radius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
    height: switchVars.thumbSize,
    width: switchVars.thumbSize,
    insetInlineStart: switchVars.trackLabelPadding,
    transitionProperty: "inset-inline-start",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease"
  },
  thumbChecked: { insetInlineStart: thumbStart },
  thumbDisabled: { backgroundColor: `light-dark(${palette.gray0}, ${palette.dark3})` },
  thumbIndicator: {
    width: "40%",
    height: "40%",
    borderRadius: switchVars.radius,
    backgroundColor: `light-dark(${palette.gray3}, ${palette.dark5})`,
    transitionProperty: "background-color",
    transitionDuration: "150ms"
  },
  indicatorChecked: { backgroundColor: switchVars.color },
  indicatorDisabled: { backgroundColor: colors.disabled },
  trackLabel: {
    height: "100%",
    display: "grid",
    placeContent: "center",
    minWidth: `calc(${switchVars.width} - ${switchVars.thumbSize})`,
    paddingInline: switchVars.trackLabelPadding,
    marginInlineStart: `calc(${switchVars.thumbSize} + ${switchVars.trackLabelPadding})`,
    marginInlineEnd: 0,
    transitionProperty: "margin",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease"
  },
  trackLabelChecked: {
    marginInlineStart: 0,
    marginInlineEnd: `calc(${switchVars.thumbSize} + ${switchVars.trackLabelPadding})`
  }
})

const trackOrder = { left: styles.trackLeft, right: styles.trackRight }

const describedBy = (props: { readonly id: string; readonly description?: Child; readonly error?: boolean | Child }) =>
  [
    ...(props.description === undefined ? [] : [descriptionIdOf(props.id)]),
    ...(hasMessage(props.error) ? [errorIdOf(props.id)] : [])
  ].join(" ")

export const Switch =
  (config: { readonly Switch?: SwitchConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SwitchProps<M>): Html => {
    const props = withDefaults(config.Switch, input)
    const { id: _id, ...rootProps } = props
    const getStyles = stylesApi<M, SwitchPart>(h, rootProps, config.Switch, "root")
    const size = props.size ?? "sm"
    const labelPosition = props.labelPosition ?? "right"
    const checked = props.checked === true
    const disabled = props.disabled === true
    const withLabels = props.onLabel !== undefined || props.offLabel !== undefined
    const trackLabel = checked ? props.onLabel : props.offLabel
    const indicator = props.withThumbIndicator !== false && props.thumbIcon === undefined
    const description = describedBy(props)
    const thumbIcon = props.thumbIcon === undefined ? [] : [props.thumbIcon]
    const indicatorView = h.span(
      getStyles(
        "thumbIndicator",
        styles.thumbIndicator,
        checked && styles.indicatorChecked,
        disabled && styles.indicatorDisabled
      ),
      []
    )

    return FoldkitSwitch.view(
      {
        id: props.id,
        isChecked: checked,
        onToggle: props.onChange,
        isDisabled: disabled,
        isReadOnly: props.readOnly === true,
        ...(props.name === undefined ? {} : { name: props.name }),
        ...(props.value === undefined ? {} : { value: props.value }),
        toView: (attributes) =>
          inlineInput(h, getStyles, {
            id: props.id,
            size,
            labelPosition,
            ...(props.label === undefined ? {} : { label: props.label }),
            ...(props.description === undefined ? {} : { description: props.description }),
            ...(props.error === undefined ? {} : { error: props.error }),
            disabled,
            rootAttributes: [
              ...getStyles(
                "root",
                inlineInputSizes[size],
                styles.root,
                sizes[size],
                setDefinedVars(
                  [switchVars.radius, mapDefined(props.radius, radiusValue)],
                  [switchVars.color, mapDefined(props.color, themeColor)]
                )
              ),
              ...(checked ? [h.DataAttribute("checked", "")] : [])
            ],
            labelAttributes: attributes.label,
            control: h.div(sx(h, styles.control, trackOrder[labelPosition]), [
              h.button(
                [
                  ...attributes.button,
                  ...getStyles(
                    "track",
                    styles.track,
                    !withLabels && styles.withoutLabels,
                    checked && styles.checked,
                    disabled && styles.disabled,
                    props.readOnly === true && styles.readOnly
                  ),
                  h.Id(props.id),
                  h.DataAttribute("label-position", labelPosition),
                  ...(withLabels ? [] : [h.DataAttribute("without-labels", "")]),
                  ...(description === "" ? [] : [h.AriaDescribedBy(description)]),
                  ...(isShown(props.error) ? [h.AriaInvalid(true), h.DataAttribute("error", "")] : [])
                ],
                [
                  h.span(
                    [
                      ...getStyles(
                        "thumb",
                        styles.thumb,
                        checked && styles.thumbChecked,
                        disabled && styles.thumbDisabled
                      ),
                      ...(indicator ? [h.DataAttribute("with-thumb-indicator", "")] : [])
                    ],
                    indicator ? [indicatorView] : thumbIcon
                  ),
                  h.span(
                    [
                      ...getStyles("trackLabel", styles.trackLabel, checked && styles.trackLabelChecked),
                      h.AriaHidden(true)
                    ],
                    trackLabel === undefined ? [] : [trackLabel]
                  )
                ]
              ),
              ...(props.name === undefined ? [] : [h.input(attributes.hiddenInput)])
            ])
          })
      },
      h
    )
  }
