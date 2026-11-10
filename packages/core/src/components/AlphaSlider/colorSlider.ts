import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Schema, Stream } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Subscription from "foldkit/subscription"
import { documentDrag } from "../../hooks/drag.ts"
import { setStyle, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors } from "../../theme/tokens.stylex.ts"
import { colorSliderVars } from "./colorSlider.stylex.ts"
import { handledKeys, Message, update as updateModel } from "./model.ts"
import type { ColorSliderContext, Model, OutMessage, Track } from "./model.ts"

export type ColorSliderPart = "slider" | "sliderOverlay" | "thumb"

export type ColorSliderSize = "xs" | "sm" | "md" | "lg" | "xl"

export type ColorSliderOptions = {
  readonly size?: ColorSliderSize
  readonly focusable?: boolean
}

export type ColorSliderProps<M> = ColorSliderOptions &
  StylesApiProps<ColorSliderPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: number
  }

export type ColorSliderConfig = ComponentConfig<ColorSliderOptions, ColorSliderPart>

export type ColorSliderShape = {
  readonly name: string
  readonly maxValue: number
  readonly overlays: ReadonlyArray<Sx>
  readonly thumbColor: string
}

export const colorSliderUpdate = (
  model: Model,
  message: Message,
  context: ColorSliderContext
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
} => ({ ...updateModel(model, message, context), commands: [] })

export const colorSliderSubscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragPointer: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: model.dragging }),
      dependenciesToStream: ({ active }) =>
        Stream.when(
          documentDrag<Message>((x) => Message.Moved({ x }), Message.Released()),
          Effect.sync(() => active)
        )
    }
  )
}))

const thumbSizes = stylex.create({
  xs: { [colorSliderVars.thumbSize]: "8px" },
  sm: { [colorSliderVars.thumbSize]: "12px" },
  md: { [colorSliderVars.thumbSize]: "16px" },
  lg: { [colorSliderVars.thumbSize]: "20px" },
  xl: { [colorSliderVars.thumbSize]: "22px" }
})

const styles = stylex.create({
  slider: {
    position: "relative",
    height: `calc(${colorSliderVars.thumbSize} + 2px)`,
    marginInline: `calc(${colorSliderVars.thumbSize} / 2)`,
    outline: "none",
    touchAction: "none",
    WebkitTapHighlightColor: "transparent",
    [colorSliderVars.checkers]: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  sliderOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    insetInline: `calc(${colorSliderVars.thumbSize} * -1 / 2 - 1px)`,
    borderRadius: "10000rem"
  },
  thumb: {
    overflow: "hidden",
    position: "absolute",
    boxShadow: "0 0 1px rgba(0, 0, 0, 0.6)",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: palette.white,
    width: colorSliderVars.thumbSize,
    height: colorSliderVars.thumbSize,
    borderRadius: colorSliderVars.thumbSize,
    top: "1px",
    left: `calc(${colorSliderVars.thumbX} - ${colorSliderVars.thumbSize} / 2)`,
    boxSizing: "border-box",
    outline: { default: null, [stylex.when.ancestor(":focus-visible")]: `2px solid ${accent.filled}` }
  },
  disabledFocus: { outline: "none" }
})

export const colorSliderOverlays = stylex.create({
  checkers: {
    backgroundImage: `linear-gradient(45deg, ${colorSliderVars.checkers} 25%, transparent 25%), linear-gradient(-45deg, ${colorSliderVars.checkers} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${colorSliderVars.checkers} 75%), linear-gradient(-45deg, ${colors.body} 75%, ${colorSliderVars.checkers} 75%)`,
    backgroundSize: "0.5rem 0.5rem",
    backgroundPosition: "0 0, 0 0.25rem, 0.25rem -0.25rem, -0.25rem 0"
  },
  hue: {
    backgroundImage:
      "linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(170, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))"
  },
  inset: { boxShadow: "rgba(0, 0, 0, 0.1) 0 0 0 1px inset, rgba(0, 0, 0, 0.15) 0 0 4px inset" }
})

const trackOf = (target: EventTarget | null): Option.Option<Track> =>
  Option.fromNullishOr(target).pipe(
    Option.filter((found): found is Element => found instanceof Element),
    Option.flatMap((element) => Option.fromNullishOr(element.closest("[data-color-slider]"))),
    Option.map((slider) => {
      const box = slider.getBoundingClientRect()

      return { left: box.left, width: box.width }
    })
  )

export const colorSlider =
  (own: ColorSliderConfig | undefined, shape: ColorSliderShape) =>
  <M>(h: HtmlBuilder<M>, input: ColorSliderProps<M>): Html => {
    const props = withDefaults(own, input)
    const getStyles = stylesApi<M, ColorSliderPart>(h, props, own, "slider")
    const lift = props.toParentMessage
    const focusable = props.focusable !== false
    const position = Math.min(1, Math.max(0, props.value / shape.maxValue))

    return h.div(
      [
        ...getStyles("slider", styles.slider, thumbSizes[props.size ?? "md"], stylex.defaultMarker()),
        h.Role("slider"),
        h.AriaValuenow(props.value),
        h.AriaValuemax(shape.maxValue),
        h.AriaValuemin(0),
        h.Tabindex(focusable ? 0 : -1),
        h.DataAttribute("color-slider", ""),
        h.DataAttribute(shape.name, ""),
        h.OnPointerDown((_type, button, _sx, _sy, _t, x, _y, _pointer, target) =>
          Option.filter(trackOf(target), () => button === 0).pipe(
            Option.map((track) => lift(Message.Pressed({ x, track })))
          )
        ),
        h.OnKeyDownPreventDefault((key) =>
          Option.liftPredicate(key, (pressed) => handledKeys.has(pressed)).pipe(
            Option.map((pressed) => lift(Message.PressedKey({ key: pressed })))
          )
        )
      ],
      [
        ...shape.overlays.map((overlay) => h.div(getStyles("sliderOverlay", styles.sliderOverlay, overlay), [])),
        h.div(
          [
            ...getStyles(
              "thumb",
              styles.thumb,
              !focusable && styles.disabledFocus,
              setVars([colorSliderVars.thumbX, `${position * 100}%`]),
              setStyle(["backgroundColor", shape.thumbColor])
            )
          ],
          []
        )
      ]
    )
  }
