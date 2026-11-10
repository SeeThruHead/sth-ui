import * as stylex from "@stylexjs/stylex"
import { Option, Predicate, Schema } from "effect"
import { Effect, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { sliderLook } from "../Slider/Slider.ts"
import type { SliderPart } from "../Slider/Slider.ts"
import { sliderVars } from "../Slider/Slider.stylex.ts"
import { documentDrag } from "../../hooks/drag.ts"
import { Message, positionOf, thumbId, update } from "./model.ts"
import type { Model, RangeContext, RangeRules, RangeValue } from "./model.ts"
import { rangeVars } from "./RangeSlider.stylex.ts"

export { init, Message, Model, OutMessage } from "./model.ts"
export type { InitConfig, OutMessage as RangeSliderOutMessage, RangeValue } from "./model.ts"

export { update }

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragPointer: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: Option.isSome(model.drag) }),
      dependenciesToStream: ({ active }) =>
        Stream.when(
          documentDrag<Message>((x, y) => Message.MovedPointer({ x, y }), Message.ReleasedPointer()),
          Effect.sync(() => active)
        )
    }
  )
}))

export type RangeSliderPart = SliderPart

export type RangeSliderMark = { readonly value: number; readonly label?: Child; readonly hidden?: boolean }

export type RangeSliderOptions = {
  readonly size?: keyof typeof sliderLook.sizes | number
  readonly radius?: StyleValue
  readonly color?: string
  readonly labelAlwaysOn?: boolean
  readonly showLabelOnHover?: boolean
  readonly thumbSize?: number
  readonly orientation?: "horizontal" | "vertical"
  readonly inverted?: boolean
  readonly minRange?: number
  readonly maxRange?: number
  readonly pushOnOverlap?: boolean
}

export type RangeSliderProps<M> = RangeSliderOptions &
  StylesApiProps<RangeSliderPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: RangeValue
    readonly domain?: RangeValue
    readonly label?: ((value: number) => Child) | null
    readonly scale?: (value: number) => number
    readonly marks?: ReadonlyArray<RangeSliderMark>
    readonly restrictToMarks?: boolean
    readonly thumbLabel?: string
    readonly thumbFromLabel?: string
    readonly thumbToLabel?: string
    readonly thumbValueText?: (value: number) => string
    readonly thumbChildren?: ThumbChildren
    readonly disabled?: boolean
    readonly name?: string
  }

export type RangeSliderConfig = ComponentConfig<RangeSliderOptions, RangeSliderPart>

const { sizes, styles: slider } = sliderLook

const half = `calc(${sliderVars.size} / 2)`

const styles = stylex.create({
  track: { position: "relative", touchAction: "none" },
  bar: {
    position: "absolute",
    zIndex: 1,
    top: half,
    height: sliderVars.size,
    insetInlineStart: `calc(${rangeVars.from} - ${sliderVars.size})`,
    width: `calc(${rangeVars.to} - ${rangeVars.from} + 2 * ${sliderVars.size})`,
    backgroundColor: sliderVars.color,
    borderRadius: sliderVars.radius,
    pointerEvents: "none"
  },
  barVertical: {
    top: "auto",
    insetInlineStart: half,
    width: sliderVars.size,
    bottom: `calc(${rangeVars.from} - ${sliderVars.size})`,
    height: `calc(${rangeVars.to} - ${rangeVars.from} + 2 * ${sliderVars.size})`
  },
  barInverted: { backgroundColor: `light-dark(${palette.gray2}, ${palette.dark4})` },
  railInverted: { backgroundColor: sliderVars.color },
  railInvertedDisabled: { backgroundColor: colors.disabledColor },
  thumb: { position: "absolute", insetInlineStart: rangeVars.thumb, translate: "-50% 0" },
  thumbVertical: { insetInlineStart: "50%", bottom: rangeVars.thumb, translate: "-50% 50%" },
  label: {
    opacity: { default: 0, [stylex.when.ancestor(":is(:hover, :focus, [data-dragging])")]: 1 }
  },
  labelWithoutHover: { opacity: { default: 0, [stylex.when.ancestor(":is(:focus, [data-dragging])")]: 1 } },
  labelAlways: { opacity: 1 }
})

const sizeStyle = (size: RangeSliderOptions["size"]) => (Predicate.isNumber(size) ? null : sizes[size ?? "md"])

const isElement = (target: EventTarget | null): target is Element => target instanceof Element

const pressed = <M>(props: RangeSliderProps<M>, x: number, y: number, target: EventTarget | null): Option.Option<M> =>
  Option.map(Option.fromNullishOr(document.getElementById(`${props.model.id}-track`)), (track) => {
    const box = track.getBoundingClientRect()
    const thumb = Option.fromNullishOr(target).pipe(
      Option.filter(isElement),
      Option.flatMap((element) => Option.fromNullishOr(element.closest("[data-thumb]"))),
      Option.flatMap((element) => Option.fromNullishOr(element.getAttribute("data-thumb"))),
      Option.map(Number),
      Option.getOrNull
    )

    return props.toParentMessage(
      Message.PressedTrack({
        x,
        y,
        box: { left: box.left, top: box.top, width: box.width, height: box.height },
        thumb
      })
    )
  })

export type RangeSliderRules = Pick<
  RangeSliderProps<unknown>,
  "minRange" | "maxRange" | "pushOnOverlap" | "marks" | "restrictToMarks" | "domain" | "orientation"
>

export const rangeContext = (props: RangeSliderRules & { readonly value: RangeValue }): RangeContext => ({
  value: props.value,
  ...rulesOf(props)
})

const rulesOf = (props: RangeSliderRules): RangeRules => ({
  ...(props.minRange === undefined ? {} : { minRange: props.minRange }),
  ...(props.maxRange === undefined ? {} : { maxRange: props.maxRange }),
  ...(props.pushOnOverlap === undefined ? {} : { pushOnOverlap: props.pushOnOverlap }),
  ...(props.marks === undefined ? {} : { marks: props.marks.map((mark) => mark.value) }),
  ...(props.restrictToMarks === undefined ? {} : { restrictToMarks: props.restrictToMarks }),
  ...(props.domain === undefined ? {} : { domain: props.domain }),
  ...(props.orientation === "vertical" ? { vertical: true } : {})
})

type ThumbChildren = Child | readonly [Child, Child]

const isPair = (children: ThumbChildren): children is readonly [Child, Child] => Array.isArray(children)

const thumbChild = (children: ThumbChildren | undefined, thumb: 0 | 1): ReadonlyArray<Child> => {
  if (children === undefined) return []

  return isPair(children) ? [children[thumb]] : [children]
}

export const RangeSlider =
  (config: { readonly RangeSlider?: RangeSliderConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RangeSliderProps<M>): Html => {
    const props = withDefaults(config.RangeSlider, input)
    const getStyles = stylesApi<M, RangeSliderPart>(h, props, config.RangeSlider, "root")
    const { model, value } = props
    const vertical = props.orientation === "vertical"
    const disabled = props.disabled === true
    const inverted = props.inverted === true
    const [low, high] = props.domain ?? [model.min, model.max]
    const scale = props.scale ?? ((raw: number) => raw)
    const label = props.label === undefined ? (shown: number): Child => String(shown) : props.label
    const dragged = Option.map(model.drag, (drag) => drag.thumb)
    const position = (raw: number) => `${positionOf(raw, low, high)}%`
    const filled = (mark: number) =>
      inverted ? mark <= value[0] || mark >= value[1] : mark >= value[0] && mark <= value[1]
    const markView = (mark: RangeSliderMark): Html =>
      h.div(
        getStyles(
          "markWrapper",
          slider.markWrapper,
          vertical && slider.markWrapperVertical,
          setVars([sliderVars.markOffset, position(mark.value)])
        ),
        [
          h.div(
            [
              ...getStyles(
                "mark",
                slider.mark,
                filled(mark.value) && slider.markFilled,
                filled(mark.value) && disabled && slider.markFilledDisabled
              ),
              ...(filled(mark.value) ? [h.DataAttribute("filled", "")] : [])
            ],
            []
          ),
          ...(mark.label === undefined
            ? []
            : [h.div(getStyles("markLabel", slider.markLabel, vertical && slider.markLabelVertical), [mark.label])])
        ]
      )
    const thumbView = (thumb: 0 | 1): Html => {
      const shown = scale(value[thumb])
      const name = (thumb === 0 ? props.thumbFromLabel : props.thumbToLabel) ?? props.thumbLabel

      return h.div(
        [
          ...getStyles(
            "thumb",
            slider.thumb,
            styles.thumb,
            vertical && slider.thumbVertical,
            vertical && styles.thumbVertical,
            disabled && slider.thumbDisabled,
            stylex.defaultMarker(),
            setVars([rangeVars.thumb, position(value[thumb])])
          ),
          h.Id(thumbId(model, thumb)),
          h.DataAttribute("thumb", String(thumb)),
          h.Role("slider"),
          h.Tabindex(0),
          h.AriaValuemin(model.min),
          h.AriaValuemax(model.max),
          h.AriaValuenow(value[thumb]),
          h.AriaOrientation(vertical ? "vertical" : "horizontal"),
          ...(name === undefined ? [] : [h.AriaLabel(name)]),
          ...(props.thumbValueText === undefined ? [] : [h.AriaValuetext(props.thumbValueText(shown))]),
          ...(disabled ? [h.AriaDisabled(true)] : []),
          ...(Option.contains(dragged, thumb) ? [h.DataAttribute("dragging", "")] : []),
          h.OnKeyDownPreventDefault((key) =>
            Option.some(props.toParentMessage(Message.PressedKey({ thumb, key }))).pipe(
              Option.filter(() => !disabled && key.startsWith("Arrow"))
            )
          )
        ],
        [
          ...thumbChild(props.thumbChildren, thumb),
          ...(label === null
            ? []
            : [
                h.div(
                  [
                    ...getStyles(
                      "label",
                      slider.label,
                      vertical && slider.labelVertical,
                      styles.label,
                      props.showLabelOnHover === false && styles.labelWithoutHover,
                      props.labelAlwaysOn === true && styles.labelAlways
                    ),
                    h.AriaHidden(true)
                  ],
                  [label(shown)]
                )
              ])
        ]
      )
    }

    return h.div(
      [
        ...getStyles(
          "root",
          slider.root,
          sizeStyle(props.size),
          vertical && slider.rootVertical,
          stylex.defaultMarker(),
          setDefinedVars(
            [sliderVars.size, Predicate.isNumber(props.size) ? rem(props.size) : undefined],
            [sliderVars.radius, mapDefined(props.radius ?? "xl", radiusValue)],
            [sliderVars.color, mapDefined(props.color, themeColor)],
            [sliderVars.thumbSize, mapDefined(props.thumbSize, rem)]
          )
        ),
        h.DataAttribute("orientation", vertical ? "vertical" : "horizontal"),
        ...(disabled ? [h.DataAttribute("disabled", "")] : []),
        h.OnPointerDown((_type, button, _sx, _sy, _t, x, y, _pointer, target) =>
          button === 0 && !disabled ? pressed(props, x, y, target) : Option.none()
        )
      ],
      [
        h.div(
          [
            ...getStyles(
              "track",
              slider.track,
              styles.track,
              vertical && slider.trackVertical,
              disabled && slider.trackDisabled
            ),
            h.Id(`${model.id}-track`),
            ...(inverted ? [h.DataAttribute("inverted", "")] : [])
          ],
          [
            h.div(
              getStyles(
                "rail",
                slider.rail,
                vertical && slider.railVertical,
                inverted && styles.railInverted,
                inverted && disabled && styles.railInvertedDisabled
              ),
              []
            ),
            h.div(
              getStyles(
                "bar",
                styles.bar,
                vertical && styles.barVertical,
                disabled && slider.barDisabled,
                inverted && styles.barInverted,
                setVars([rangeVars.from, position(value[0])], [rangeVars.to, position(value[1])])
              ),
              []
            ),
            ...(props.marks ?? []).filter((mark) => mark.hidden !== true).map(markView),
            thumbView(0),
            thumbView(1)
          ]
        ),
        ...(props.name === undefined
          ? []
          : [
              h.input([h.Type("hidden"), h.Name(`${props.name}_from`), h.Value(String(value[0]))]),
              h.input([h.Type("hidden"), h.Name(`${props.name}_to`), h.Value(String(value[1]))])
            ])
      ]
    )
  }
