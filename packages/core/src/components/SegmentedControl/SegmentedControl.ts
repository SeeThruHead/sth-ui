import * as stylex from "@stylexjs/stylex"
import * as FoldkitRadioGroup from "@foldkit/ui/radioGroup"
import { Option, Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle, themeColor } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, shadow } from "../../theme/tokens.stylex.ts"
import { segmentedVars } from "./SegmentedControl.stylex.ts"

const bundle = FoldkitRadioGroup.create()

export const { Message, OutMessage } = FoldkitRadioGroup

export const { update } = bundle

export const Model = FoldkitRadioGroup.Model

export type Model = FoldkitRadioGroup.Model

export type Message = FoldkitRadioGroup.Message

export type OutMessage = FoldkitRadioGroup.OutMessage

export const init = (config: FoldkitRadioGroup.InitConfig): Model => FoldkitRadioGroup.init(config)

export type SegmentedControlPart = "root" | "indicator" | "control" | "label" | "innerLabel"

export type SegmentedControlItem = {
  readonly value: string
  readonly label: Child
  readonly disabled?: boolean
}

export type SegmentedControlSize = keyof typeof sizes

export type SegmentedControlOptions = {
  readonly size?: SegmentedControlSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly autoContrast?: boolean
  readonly fullWidth?: boolean
  readonly orientation?: "horizontal" | "vertical"
  readonly withItemsBorders?: boolean
  readonly transitionDuration?: number
  readonly transitionTimingFunction?: string
}

export type SegmentedControlProps<M> = SegmentedControlOptions &
  StylesApiProps<SegmentedControlPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ReadonlyArray<string | SegmentedControlItem>
    readonly value?: string
    readonly disabled?: boolean
    readonly readOnly?: boolean
    readonly name?: string
    readonly ariaLabel?: string
  }

export type SegmentedControlConfig = ComponentConfig<SegmentedControlOptions, SegmentedControlPart>

const sizes = stylex.create({
  xs: {
    [segmentedVars.paddingBlock]: "2px",
    [segmentedVars.paddingInline]: "6px",
    [segmentedVars.fontSize]: fontSize.xs
  },
  sm: {
    [segmentedVars.paddingBlock]: "3px",
    [segmentedVars.paddingInline]: "10px",
    [segmentedVars.fontSize]: fontSize.sm
  },
  md: {
    [segmentedVars.paddingBlock]: "4px",
    [segmentedVars.paddingInline]: "14px",
    [segmentedVars.fontSize]: fontSize.md
  },
  lg: {
    [segmentedVars.paddingBlock]: "7px",
    [segmentedVars.paddingInline]: "16px",
    [segmentedVars.fontSize]: fontSize.lg
  },
  xl: {
    [segmentedVars.paddingBlock]: "10px",
    [segmentedVars.paddingInline]: "20px",
    [segmentedVars.fontSize]: fontSize.xl
  }
})

const styles = stylex.create({
  root: {
    [segmentedVars.color]: `light-dark(${palette.white}, ${palette.dark5})`,
    [segmentedVars.labelColor]: `light-dark(${palette.black}, ${palette.white})`,
    [segmentedVars.shadow]: shadow.xs,
    position: "relative",
    display: "inline-flex",
    flexDirection: "row",
    width: "auto",
    borderRadius: segmentedVars.radius,
    overflow: "hidden",
    padding: "4px",
    backgroundColor: `light-dark(${palette.gray1}, ${palette.dark8})`
  },
  fullWidth: { display: "flex" },
  vertical: { display: "flex", flexDirection: "column", width: "max-content" },
  verticalFullWidth: { width: "auto" },
  colored: { [segmentedVars.labelColor]: palette.white, [segmentedVars.shadow]: "none" },
  contrast: { [segmentedVars.labelColor]: accent.contrast },
  indicator: {
    position: "absolute",
    display: "block",
    zIndex: 1,
    positionAnchor: segmentedVars.anchor,
    top: "anchor(top)",
    left: "anchor(left)",
    width: "anchor-size(width)",
    height: "anchor-size(height)",
    borderRadius: `max(calc(${segmentedVars.radius} - 4px), calc(${segmentedVars.radius} / 4))`,
    boxShadow: `light-dark(${segmentedVars.shadow}, none)`,
    backgroundColor: segmentedVars.color,
    transitionProperty: "top, left, width, height",
    transitionDuration: segmentedVars.duration,
    transitionTimingFunction: segmentedVars.timing
  },
  control: {
    position: "relative",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    zIndex: 2,
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    transitionProperty: "border-color",
    transitionDuration: segmentedVars.duration,
    transitionTimingFunction: segmentedVars.timing
  },
  controlVertical: {
    borderInlineStartWidth: 0,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  withoutSeparator: { borderInlineStartColor: "transparent", borderTopColor: "transparent" },
  anchor: { anchorName: segmentedVars.anchor },
  label: {
    WebkitTapHighlightColor: "transparent",
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    display: "block",
    width: "100%",
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    userSelect: "none",
    borderRadius: `calc(${segmentedVars.radius} - 4px)`,
    fontSize: segmentedVars.fontSize,
    paddingBlock: segmentedVars.paddingBlock,
    paddingInline: segmentedVars.paddingInline,
    transitionProperty: "color",
    transitionDuration: segmentedVars.duration,
    transitionTimingFunction: segmentedVars.timing,
    cursor: "pointer",
    color: {
      default: `light-dark(${palette.gray7}, ${palette.dark1})`,
      ":hover": `light-dark(${palette.black}, ${palette.white})`
    },
    outline: { default: "none", ":focus-visible": `2px solid ${accent.filled}` }
  },
  active: { color: { default: segmentedVars.labelColor, ":hover": segmentedVars.labelColor } },
  readOnly: { cursor: "default" },
  disabled: { cursor: "not-allowed", color: { default: colors.disabledColor, ":hover": colors.disabledColor } },
  innerLabel: { position: "relative", zIndex: 2 }
})

const toItem = (item: string | SegmentedControlItem): SegmentedControlItem =>
  Predicate.isString(item) ? { value: item, label: item } : item

export const SegmentedControl =
  (config: { readonly SegmentedControl?: SegmentedControlConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SegmentedControlProps<M>): Html => {
    const props = withDefaults(config.SegmentedControl, input)
    const getStyles = stylesApi<M, SegmentedControlPart>(h, props, config.SegmentedControl, "root")
    const items = props.data.map(toItem)
    const itemAt = (index: number) => Option.getOrThrow(Option.fromNullishOr(items[index]))
    const firstChoice = Option.getOrThrow(
      Option.fromNullishOr([...items.filter((item) => item.disabled !== true), ...items][0])
    )
    const selected = props.value ?? firstChoice.value
    const activeIndex = items.findIndex((item) => item.value === selected)
    const vertical = props.orientation === "vertical"
    const disabled = props.disabled === true
    const colored = props.color !== undefined
    const separators = props.withItemsBorders !== false

    return h.submodel({
      slotId: props.model.id,
      model: props.model,
      view: bundle.view,
      toParentMessage: props.toParentMessage,
      viewInputs: {
        options: items.map((item) => item.value),
        selectedValue: Option.some(selected),
        ariaLabel: props.ariaLabel ?? "",
        orientation: vertical ? "Vertical" : "Horizontal",
        isOptionDisabled: (_value, index) => itemAt(index).disabled === true,
        isDisabled: disabled,
        isReadOnly: props.readOnly === true,
        ...(props.name === undefined ? {} : { name: props.name }),
        toView: (render) =>
          h.div(
            [
              ...render.group,
              ...getStyles(
                "root",
                ...accentStyle(props.color, customAccent),
                styles.root,
                sizes[props.size ?? "sm"],
                props.fullWidth === true && styles.fullWidth,
                vertical && styles.vertical,
                vertical && props.fullWidth === true && styles.verticalFullWidth,
                colored && styles.colored,
                colored && props.autoContrast === true && styles.contrast,
                setVars([segmentedVars.anchor, `--sc-${props.model.id}`]),
                setDefinedVars(
                  [segmentedVars.radius, mapDefined(props.radius, radiusValue)],
                  [segmentedVars.color, mapDefined(props.color, themeColor)],
                  [segmentedVars.duration, mapDefined(props.transitionDuration, (duration) => `${duration}ms`)],
                  [segmentedVars.timing, props.transitionTimingFunction]
                )
              ),
              h.DataAttribute("orientation", vertical ? "vertical" : "horizontal"),
              ...(props.fullWidth === true ? [h.DataAttribute("full-width", "")] : []),
              ...(disabled ? [h.DataAttribute("disabled", "")] : []),
              ...(separators ? [h.DataAttribute("with-items-borders", "")] : [])
            ],
            [
              h.div([...getStyles("indicator", styles.indicator), h.AriaHidden(true)], []),
              ...render.options.map((option) => {
                const active = option.index === activeIndex
                const quiet = option.index === 0 || option.index === activeIndex || option.index === activeIndex + 1

                return h.div(
                  [
                    ...getStyles(
                      "control",
                      styles.control,
                      vertical && styles.controlVertical,
                      (!separators || quiet) && styles.withoutSeparator,
                      active && styles.anchor
                    ),
                    ...(active ? [h.DataAttribute("active", "")] : [])
                  ],
                  [
                    h.button(
                      [
                        ...option.option,
                        ...getStyles(
                          "label",
                          styles.label,
                          active && styles.active,
                          props.readOnly === true && styles.readOnly,
                          option.isDisabled && styles.disabled
                        ),
                        ...(active ? [h.DataAttribute("active", "")] : []),
                        ...(props.readOnly === true ? [h.DataAttribute("read-only", "")] : [])
                      ],
                      [
                        h.span(
                          [...option.label, ...getStyles("innerLabel", styles.innerLabel)],
                          [itemAt(option.index).label]
                        )
                      ]
                    )
                  ]
                )
              }),
              ...(props.name === undefined ? [] : [h.input([h.Type("hidden"), ...render.hiddenInput])])
            ]
          )
      }
    })
  }
