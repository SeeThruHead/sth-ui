import * as stylex from "@stylexjs/stylex"
import * as FoldkitSlider from "@foldkit/ui/slider"
import { Option, Predicate } from "effect"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { sliderVars } from "./Slider.stylex.ts"

export const { Message, OutMessage, update, subscriptions } = FoldkitSlider

export { restrictedValue, SliderOutMessage, updateWith } from "./model.ts"
export type { SliderContext, SliderResult } from "./model.ts"

export const Model = FoldkitSlider.Model

export type Model = FoldkitSlider.Model

export type Message = FoldkitSlider.Message

export type OutMessage = FoldkitSlider.OutMessage

export type InitConfig = {
  readonly id: string
  readonly min?: number
  readonly max?: number
  readonly step?: number
}

export const init = (config: InitConfig): Model =>
  FoldkitSlider.init({ id: config.id, min: config.min ?? 0, max: config.max ?? 100, step: config.step ?? 1 })

export type SliderPart = "root" | "track" | "rail" | "bar" | "thumb" | "label" | "markWrapper" | "mark" | "markLabel"

export type SliderSize = keyof typeof sizes

export type SliderMark = { readonly value: number; readonly label?: Child }

export type SliderOptions = {
  readonly size?: SliderSize | number
  readonly radius?: StyleValue
  readonly color?: string
  readonly labelAlwaysOn?: boolean
  readonly showLabelOnHover?: boolean
  readonly thumbSize?: number
  readonly orientation?: "horizontal" | "vertical"
  readonly inverted?: boolean
  readonly startPointValue?: number
}

export type SliderProps<M> = SliderOptions &
  StylesApiProps<SliderPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: number
    readonly label?: ((value: number) => Child) | null
    readonly marks?: ReadonlyArray<SliderMark>
    readonly thumbLabel?: string
    readonly thumbValueText?: (value: number) => string
    readonly scale?: (value: number) => number
    readonly thumbChildren?: Child
    readonly disabled?: boolean
    readonly name?: string
  }

export type SliderConfig = ComponentConfig<SliderOptions, SliderPart>

const sizes = stylex.create({
  xs: { [sliderVars.size]: "4px" },
  sm: { [sliderVars.size]: "6px" },
  md: { [sliderVars.size]: "8px" },
  lg: { [sliderVars.size]: "10px" },
  xl: { [sliderVars.size]: "12px" }
})

const half = `calc(${sliderVars.size} / 2)`

const styles = stylex.create({
  root: {
    [sliderVars.color]: accent.filled,
    [sliderVars.thumbSize]: `calc(${sliderVars.size} * 2)`,
    WebkitTapHighlightColor: "transparent",
    outline: "none",
    paddingInline: sliderVars.size,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    touchAction: "none",
    position: "relative"
  },
  rootVertical: {
    width: `calc(${sliderVars.size} * 2)`,
    height: "200px",
    paddingInline: 0,
    paddingBlock: sliderVars.size
  },
  track: { width: "100%", height: `calc(${sliderVars.size} * 2)`, cursor: "pointer" },
  trackVertical: { width: `calc(${sliderVars.size} * 2)`, height: "100%" },
  trackDisabled: { cursor: "not-allowed" },
  rail: {
    position: "absolute",
    top: `calc(50% - ${half})`,
    height: sliderVars.size,
    insetInlineStart: `calc(${sliderVars.size} * -1)`,
    insetInlineEnd: `calc(${sliderVars.size} * -1)`,
    borderRadius: sliderVars.radius,
    backgroundColor: `light-dark(${palette.gray2}, ${palette.dark4})`,
    pointerEvents: "none"
  },
  railVertical: {
    top: `calc(${sliderVars.size} * -1)`,
    bottom: `calc(${sliderVars.size} * -1)`,
    height: "auto",
    insetInlineStart: `calc(50% - ${half})`,
    insetInlineEnd: "auto",
    width: sliderVars.size
  },
  bar: {
    zIndex: 1,
    boxSizing: "content-box",
    marginBlock: half,
    marginInlineStart: `calc(${sliderVars.size} * -1)`,
    paddingInlineStart: sliderVars.size,
    backgroundColor: sliderVars.color,
    borderRadius: sliderVars.radius
  },
  barVertical: {
    marginBlock: 0,
    marginInlineStart: half,
    marginInlineEnd: half,
    paddingInlineStart: 0,
    marginBottom: `calc(${sliderVars.size} * -1)`,
    paddingBottom: sliderVars.size
  },
  barDisabled: { backgroundColor: colors.disabledColor },
  thumb: {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: sliderVars.thumbSize,
    width: sliderVars.thumbSize,
    top: "50%",
    marginTop: `calc(${sliderVars.thumbSize} / -2)`,
    borderWidth: "4px",
    borderStyle: "solid",
    borderRadius: sliderVars.radius,
    cursor: "pointer",
    zIndex: 3,
    userSelect: "none",
    transitionProperty: "box-shadow, scale",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease",
    color: `light-dark(${sliderVars.color}, ${palette.white})`,
    borderColor: `light-dark(${sliderVars.color}, ${palette.white})`,
    backgroundColor: `light-dark(${palette.white}, ${sliderVars.color})`,
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px",
    scale: { default: null, [stylex.when.ancestor(":is([data-dragging])")]: 1.05 },
    boxShadow: {
      default: null,
      [stylex.when.ancestor(":is([data-dragging])")]: "0 1px 3px rgb(0 0 0 / 5%), 0 1px 2px rgb(0 0 0 / 10%)"
    }
  },
  thumbVertical: { top: "auto", marginTop: 0 },
  thumbDisabled: { display: "none" },
  label: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    fontSize: fontSize.xs,
    color: palette.white,
    padding: `calc(${space.xs} / 2)`,
    borderRadius: radius.sm,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    userSelect: "none",
    backgroundColor: `light-dark(${palette.gray9}, ${palette.dark4})`,
    opacity: { default: 0, [stylex.when.ancestor(":is(:hover, :focus-within, [data-dragging])")]: 1 }
  },
  labelVertical: { bottom: "auto", insetInlineStart: "calc(100% + 8px)" },
  labelAlways: { opacity: 1 },
  labelWithoutHover: { opacity: { default: 0, [stylex.when.ancestor(":is(:focus-within, [data-dragging])")]: 1 } },
  markWrapper: {
    position: "absolute",
    top: `calc(50% - ${half})`,
    left: sliderVars.markOffset,
    zIndex: 2,
    height: 0,
    pointerEvents: "none"
  },
  markWrapperVertical: { top: "auto", bottom: sliderVars.markOffset, left: "50%" },
  mark: {
    boxSizing: "border-box",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`,
    height: sliderVars.size,
    width: sliderVars.size,
    borderRadius: "1000px",
    backgroundColor: palette.white,
    marginInlineStart: `calc(${sliderVars.size} / -2)`
  },
  markFilled: { borderColor: sliderVars.color },
  markFilledDisabled: { borderColor: colors.disabledBorder },
  markLabel: {
    translate: `-50% calc(${space.xs} / 2)`,
    fontSize: fontSize.sm,
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    color: `light-dark(${palette.gray6}, ${palette.dark2})`,
    width: "max-content"
  },
  markLabelVertical: { translate: `calc(${sliderVars.size} + ${space.xs} / 2) -50%` }
})

export const sliderLook = { sizes, styles }

const past = `calc(${sliderVars.size} * -1)`

const invertedBar = (vertical: boolean, at: string): Readonly<Record<string, string>> =>
  vertical
    ? { position: "absolute", left: "0", right: "0", top: past, bottom: at, pointerEvents: "none" }
    : { position: "absolute", top: "0", bottom: "0", left: at, right: past, pointerEvents: "none" }

const percent = (value: number, min: number, max: number) => `${((value - min) / (max - min)) * 100}%`

const rangeBar = (vertical: boolean, from: string, to: string): Readonly<Record<string, string>> =>
  vertical
    ? { position: "absolute", left: "0", right: "0", bottom: from, top: `calc(100% - ${to})`, pointerEvents: "none" }
    : { position: "absolute", top: "0", bottom: "0", left: from, right: `calc(100% - ${to})`, pointerEvents: "none" }

const isFilled = (value: number, mark: number, inverted: boolean, start: number | undefined): boolean => {
  if (start !== undefined) return mark >= Math.min(start, value) && mark <= Math.max(start, value)

  return inverted ? mark >= value : mark <= value
}

const scaledText = (format: (value: number) => string, scale: (value: number) => number) => (value: number) =>
  format(scale(value))

const sizeStyle = (size: SliderOptions["size"]) => (Predicate.isNumber(size) ? null : sizes[size ?? "md"])

export const Slider =
  (config: { readonly Slider?: SliderConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SliderProps<M>): Html => {
    const props = withDefaults(config.Slider, input)
    const getStyles = stylesApi<M, SliderPart>(h, props, config.Slider, "root")
    const vertical = props.orientation === "vertical"
    const disabled = props.disabled === true
    const inverted = props.inverted === true
    const { min, max } = props.model
    const label = props.label === undefined ? (value: number): Child => String(value) : props.label
    const scale = props.scale ?? ((value: number) => value)
    const start = inverted ? undefined : props.startPointValue
    const barAttributes = (filledTrack: ReadonlyArray<ChildAttribute>) => {
      if (inverted) return [h.Style(invertedBar(vertical, percent(props.value, min, max)))]

      return Option.match(Option.fromNullishOr(start), {
        onNone: () => filledTrack,
        onSome: (from) => [
          h.Style(
            rangeBar(
              vertical,
              percent(Math.min(from, props.value), min, max),
              percent(Math.max(from, props.value), min, max)
            )
          )
        ]
      })
    }
    const marks = props.marks ?? []
    const markView = (mark: SliderMark): Html => {
      const filled = isFilled(props.value, mark.value, inverted, start)

      return h.div(
        [
          ...getStyles(
            "markWrapper",
            styles.markWrapper,
            vertical && styles.markWrapperVertical,
            setVars([sliderVars.markOffset, percent(mark.value, min, max)])
          )
        ],
        [
          h.div(
            [
              ...getStyles(
                "mark",
                styles.mark,
                filled && styles.markFilled,
                filled && disabled && styles.markFilledDisabled
              ),
              ...(filled ? [h.DataAttribute("filled", "")] : []),
              ...(disabled ? [h.DataAttribute("disabled", "")] : [])
            ],
            []
          ),
          ...(mark.label === undefined
            ? []
            : [h.div(getStyles("markLabel", styles.markLabel, vertical && styles.markLabelVertical), [mark.label])])
        ]
      )
    }

    return h.submodel({
      slotId: props.model.id,
      model: props.model,
      view: FoldkitSlider.view,
      toParentMessage: props.toParentMessage,
      viewInputs: {
        value: props.value,
        orientation: vertical ? "Vertical" : "Horizontal",
        thumbAlignment: "Center",
        isDisabled: disabled,
        ...(props.thumbLabel === undefined ? {} : { ariaLabel: props.thumbLabel }),
        ...(props.thumbValueText === undefined ? {} : { formatValue: scaledText(props.thumbValueText, scale) }),
        ...(props.name === undefined ? {} : { name: props.name }),
        toView: (attributes) =>
          h.div(
            [
              ...attributes.root,
              h.DataAttribute("orientation", vertical ? "vertical" : "horizontal"),
              ...getStyles(
                "root",
                styles.root,
                sizeStyle(props.size),
                vertical && styles.rootVertical,
                stylex.defaultMarker(),
                setDefinedVars(
                  [sliderVars.size, Predicate.isNumber(props.size) ? rem(props.size) : undefined],
                  [sliderVars.radius, mapDefined(props.radius ?? "xl", radiusValue)],
                  [sliderVars.color, mapDefined(props.color, themeColor)],
                  [sliderVars.thumbSize, mapDefined(props.thumbSize, rem)]
                )
              )
            ],
            [
              h.div(
                [
                  ...attributes.track,
                  ...getStyles(
                    "track",
                    styles.track,
                    vertical && styles.trackVertical,
                    disabled && styles.trackDisabled
                  ),
                  ...(inverted ? [h.DataAttribute("inverted", "")] : [])
                ],
                [
                  h.div(getStyles("rail", styles.rail, vertical && styles.railVertical), []),
                  h.div(
                    [
                      ...barAttributes(attributes.filledTrack),
                      ...getStyles("bar", styles.bar, vertical && styles.barVertical, disabled && styles.barDisabled),
                      ...(inverted ? [h.DataAttribute("inverted", "")] : []),
                      ...(disabled ? [h.DataAttribute("disabled", "")] : [])
                    ],
                    []
                  ),
                  ...marks.map(markView),
                  h.div(
                    [
                      ...attributes.thumb,
                      ...getStyles(
                        "thumb",
                        styles.thumb,
                        vertical && styles.thumbVertical,
                        disabled && styles.thumbDisabled
                      ),
                      ...(props.model.dragState._tag === "Dragging" ? [h.DataAttribute("dragging", "")] : [])
                    ],
                    [
                      ...(props.thumbChildren === undefined ? [] : [props.thumbChildren]),
                      ...(label === null
                        ? []
                        : [
                            h.div(
                              [
                                ...getStyles(
                                  "label",
                                  styles.label,
                                  vertical && styles.labelVertical,
                                  props.showLabelOnHover === false && styles.labelWithoutHover,
                                  props.labelAlwaysOn === true && styles.labelAlways
                                ),
                                h.AriaHidden(true)
                              ],
                              [label(scale(props.value))]
                            )
                          ])
                    ]
                  )
                ]
              ),
              ...(props.name === undefined ? [] : [h.input(attributes.hiddenInput)])
            ]
          )
      }
    })
  }
