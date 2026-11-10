import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Subscription from "foldkit/subscription"
import { documentDrag } from "../../hooks/drag.ts"
import { listOf, mergeStyles, setStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, radius, space } from "../../theme/tokens.stylex.ts"
import { colorSlider, colorSliderOverlays } from "../AlphaSlider/colorSlider.ts"
import type { ColorSliderSize } from "../AlphaSlider/colorSlider.ts"
import { Message as SliderMessage } from "../AlphaSlider/model.ts"
import { ColorSwatch } from "../ColorSwatch/ColorSwatch.ts"
import type { ColorSwatchConfig } from "../ColorSwatch/ColorSwatch.ts"
import { convertHsvaTo, luminance, withAlpha } from "./color.ts"
import type { ColorFormat } from "./color.ts"
import { colorPickerVars } from "./ColorPicker.stylex.ts"
import { Message, saturationKeys, update as updateModel } from "./model.ts"
import type { Box, ColorPickerContext, Model, OutMessage } from "./model.ts"

export { init, Message, Model, OutMessage, setValue } from "./model.ts"
export type { ColorPickerContext } from "./model.ts"
export { convertHsvaTo, hsvaToRgbaObject, isColorValid, luminance, parseColor } from "./color.ts"
export type { ColorFormat, HsvaColor, RgbaColor } from "./color.ts"

export type ColorPickerPart =
  | "wrapper"
  | "preview"
  | "body"
  | "sliders"
  | "slider"
  | "sliderOverlay"
  | "thumb"
  | "saturation"
  | "saturationOverlay"
  | "swatches"
  | "swatch"

export type ColorPickerOptions = {
  readonly format?: ColorFormat
  readonly withPicker?: boolean
  readonly swatchesPerRow?: number
  readonly size?: ColorSliderSize
  readonly fullWidth?: boolean
  readonly focusable?: boolean
  readonly saturationLabel?: string
  readonly hueLabel?: string
  readonly alphaLabel?: string
}

export type ColorPickerProps<M> = ColorPickerOptions &
  StylesApiProps<ColorPickerPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: string
    readonly swatches?: ReadonlyArray<string>
    readonly name?: string
  }

export type ColorPickerConfig = ComponentConfig<ColorPickerOptions, ColorPickerPart>

export const update = (
  model: Model,
  message: Message,
  context: ColorPickerContext
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
} => ({ ...updateModel(model, message, context), commands: [] })

const dragStream = (active: boolean, stream: Stream.Stream<Message>) =>
  Stream.when(
    stream,
    Effect.sync(() => active)
  )

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragSaturation: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: model.dragging }),
      dependenciesToStream: ({ active }) =>
        dragStream(
          active,
          documentDrag<Message>((x, y) => Message.MovedSaturation({ x, y }), Message.ReleasedSaturation())
        )
    }
  ),
  dragHue: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: model.hue.dragging }),
      dependenciesToStream: ({ active }) =>
        dragStream(
          active,
          documentDrag<Message>(
            (x) => Message.GotHue({ message: SliderMessage.Moved({ x }) }),
            Message.GotHue({ message: SliderMessage.Released() })
          )
        )
    }
  ),
  dragAlpha: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: model.alpha.dragging }),
      dependenciesToStream: ({ active }) =>
        dragStream(
          active,
          documentDrag<Message>(
            (x) => Message.GotAlpha({ message: SliderMessage.Moved({ x }) }),
            Message.GotAlpha({ message: SliderMessage.Released() })
          )
        )
    }
  )
}))

const sizes = stylex.create({
  xs: {
    [colorPickerVars.width]: "180px",
    [colorPickerVars.previewSize]: "26px",
    [colorPickerVars.thumbSize]: "8px",
    [colorPickerVars.saturationHeight]: "100px",
    [colorPickerVars.bodySpacing]: space.xs
  },
  sm: {
    [colorPickerVars.width]: "200px",
    [colorPickerVars.previewSize]: "34px",
    [colorPickerVars.thumbSize]: "12px",
    [colorPickerVars.saturationHeight]: "110px",
    [colorPickerVars.bodySpacing]: space.sm
  },
  md: {
    [colorPickerVars.width]: "240px",
    [colorPickerVars.previewSize]: "42px",
    [colorPickerVars.thumbSize]: "16px",
    [colorPickerVars.saturationHeight]: "120px",
    [colorPickerVars.bodySpacing]: space.md
  },
  lg: {
    [colorPickerVars.width]: "280px",
    [colorPickerVars.previewSize]: "50px",
    [colorPickerVars.thumbSize]: "20px",
    [colorPickerVars.saturationHeight]: "140px",
    [colorPickerVars.bodySpacing]: space.lg
  },
  xl: {
    [colorPickerVars.width]: "320px",
    [colorPickerVars.previewSize]: "54px",
    [colorPickerVars.thumbSize]: "22px",
    [colorPickerVars.saturationHeight]: "160px",
    [colorPickerVars.bodySpacing]: space.xl
  }
})

const styles = stylex.create({
  wrapper: { width: colorPickerVars.width, padding: "1px", boxSizing: "border-box" },
  fullWidth: { width: "100%" },
  body: { display: "flex", paddingTop: `calc(${colorPickerVars.bodySpacing} / 2)` },
  sliders: { flexGrow: 1, flexShrink: 1, flexBasis: 0, display: "flex", flexDirection: "column", gap: "6px" },
  slidersBeside: { marginInlineEnd: space.xs },
  saturation: {
    WebkitTapHighlightColor: "transparent",
    position: "relative",
    height: colorPickerVars.saturationHeight,
    borderRadius: radius.sm,
    margin: `calc(${colorPickerVars.thumbSize} / 2)`,
    outline: "none",
    touchAction: "none"
  },
  saturationOverlay: {
    position: "absolute",
    borderRadius: radius.sm,
    inset: `calc(${colorPickerVars.thumbSize} * -1 / 2 - 1px)`
  },
  whiteFade: { backgroundImage: "linear-gradient(90deg, #fff, transparent)" },
  blackFade: { backgroundImage: "linear-gradient(0deg, #000, transparent)" },
  thumb: {
    overflow: "hidden",
    position: "absolute",
    boxShadow: "0 0 1px rgba(0, 0, 0, 0.6)",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: palette.white,
    width: colorPickerVars.thumbSize,
    height: colorPickerVars.thumbSize,
    borderRadius: colorPickerVars.thumbSize,
    boxSizing: "border-box",
    left: `calc(${colorPickerVars.thumbX} - ${colorPickerVars.thumbSize} / 2)`,
    top: `calc(${colorPickerVars.thumbY} - ${colorPickerVars.thumbSize} / 2)`,
    outline: { default: null, [stylex.when.ancestor(":focus-visible")]: `2px solid ${accent.filled}` }
  },
  swatches: { marginTop: "5px", marginInline: "-2px", display: "flex", flexWrap: "wrap" },
  swatchesAlone: { marginTop: 0 },
  swatch: {
    height: "unset",
    width: "unset",
    minWidth: 0,
    minHeight: 0,
    margin: "2px",
    cursor: "pointer",
    paddingBottom: `calc(${colorPickerVars.swatchSize} - 4px)`,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: `calc(${colorPickerVars.swatchSize} - 4px)`
  },
  check: { width: "35%", height: "35%" }
})

const checkPath =
  "M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"

const label = (value: string | undefined) => (value === undefined ? {} : { "aria-label": value })

const boxOf = (target: EventTarget | null): Option.Option<Box> =>
  Option.fromNullishOr(target).pipe(
    Option.filter((found): found is Element => found instanceof Element),
    Option.flatMap((element) => Option.fromNullishOr(element.closest("[data-saturation]"))),
    Option.map((element) => {
      const rect = element.getBoundingClientRect()

      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    })
  )

export const ColorPicker = (config: {
  readonly ColorPicker?: ColorPickerConfig
  readonly ColorSwatch?: ColorSwatchConfig
}) => {
  const swatch = ColorSwatch(config)

  return <M>(h: HtmlBuilder<M>, input: ColorPickerProps<M>): Html => {
    const props = withDefaults(config.ColorPicker, input)
    const getStyles = stylesApi<M, ColorPickerPart>(h, props, config.ColorPicker, "wrapper")
    const lift = props.toParentMessage
    const model = props.model
    const color = model.color
    const format = props.format ?? "hex"
    const size = props.size ?? "md"
    const focusable = props.focusable !== false
    const alpha = withAlpha(format)
    const parts = mergeStyles(
      ["slider", "sliderOverlay", "thumb", "preview", "swatch"],
      config.ColorPicker?.styles,
      props.styles
    )
    const sliderStyles = {
      slider: listOf(parts.slider),
      sliderOverlay: listOf(parts.sliderOverlay),
      thumb: listOf(parts.thumb)
    }
    const hex = convertHsvaTo("hex", color)
    const hue = colorSlider(undefined, {
      name: "hue",
      maxValue: 360,
      thumbColor: `hsl(${color.h}, 100%, 50%)`,
      overlays: [colorSliderOverlays.hue, colorSliderOverlays.inset]
    })
    const alphaSlider = colorSlider(undefined, {
      name: "alpha",
      maxValue: 1,
      thumbColor: "transparent",
      overlays: [
        colorSliderOverlays.checkers,
        setStyle(["backgroundImage", `linear-gradient(90deg, transparent, ${hex})`]),
        colorSliderOverlays.inset
      ]
    })
    const saturation = h.div(
      [
        ...getStyles("saturation", styles.saturation, stylex.defaultMarker()),
        h.Role("slider"),
        h.DataAttribute("saturation", ""),
        ...(props.saturationLabel === undefined ? [] : [h.AriaLabel(props.saturationLabel)]),
        h.AriaValuenow(color.s / 100),
        h.AriaValuetext(convertHsvaTo("rgba", color)),
        h.Tabindex(focusable ? 0 : -1),
        h.OnPointerDown((_type, button, _sx, _sy, _t, x, y, _pointer, target) =>
          Option.filter(boxOf(target), () => button === 0).pipe(
            Option.map((box) => lift(Message.PressedSaturation({ x, y, box })))
          )
        ),
        h.OnKeyDownPreventDefault((key) =>
          Option.liftPredicate(key, (pressed) => saturationKeys.has(pressed)).pipe(
            Option.map((pressed) => lift(Message.PressedSaturationKey({ key: pressed })))
          )
        )
      ],
      [
        h.div(
          getStyles(
            "saturationOverlay",
            styles.saturationOverlay,
            setStyle(["backgroundColor", `hsl(${color.h}, 100%, 50%)`])
          ),
          []
        ),
        h.div(getStyles("saturationOverlay", styles.saturationOverlay, styles.whiteFade), []),
        h.div(getStyles("saturationOverlay", styles.saturationOverlay, styles.blackFade), []),
        h.div(
          getStyles(
            "thumb",
            styles.thumb,
            setVars([colorPickerVars.thumbX, `${color.s}%`], [colorPickerVars.thumbY, `${100 - color.v}%`]),
            setStyle(["backgroundColor", props.value])
          ),
          []
        )
      ]
    )
    const sliders = h.div(getStyles("sliders", styles.sliders, alpha && styles.slidersBeside), [
      hue(h, {
        model: model.hue,
        toParentMessage: (message) => lift(Message.GotHue({ message })),
        value: color.h,
        size,
        focusable,
        styles: sliderStyles,
        attributes: { slider: label(props.hueLabel) }
      }),
      ...(alpha
        ? [
            alphaSlider(h, {
              model: model.alpha,
              toParentMessage: (message) => lift(Message.GotAlpha({ message })),
              value: color.a,
              size,
              focusable,
              styles: sliderStyles,
              attributes: { slider: label(props.alphaLabel) }
            })
          ]
        : [])
    ])
    const picker =
      props.withPicker === false
        ? []
        : [
            saturation,
            h.div(getStyles("body", styles.body), [
              sliders,
              ...(alpha
                ? [
                    swatch(h, {
                      color: props.value,
                      radius: "sm",
                      size: colorPickerVars.previewSize,
                      styles: { root: listOf(parts.preview) },
                      attributes: { root: { "data-preview": "" } }
                    })
                  ]
                : [])
            ])
          ]
    const swatches = Option.match(Option.fromNullishOr(props.swatches), {
      onNone: () => [],
      onSome: (list) => [
        h.div(
          getStyles("swatches", styles.swatches, props.withPicker === false && styles.swatchesAlone),
          list.map((item) =>
            swatch(h, {
              color: item,
              radius: "sm",
              component: "button",
              ariaLabel: item,
              onClick: lift(Message.PickedSwatch({ color: item })),
              styles: { root: [styles.swatch, ...listOf(parts.swatch)] },
              attributes: { root: { tabindex: focusable ? "0" : "-1", "data-swatch": "" } },
              children:
                props.value === item
                  ? [
                      h.svg(
                        [
                          ...sx(h, styles.check),
                          h.Attribute("viewBox", "0 0 10 7"),
                          h.Attribute("fill", "none"),
                          h.AriaHidden(true),
                          h.Style({ color: luminance(item) < 0.5 ? "white" : "black" })
                        ],
                        [h.path([h.Attribute("d", checkPath), h.Attribute("fill", "currentColor")], [])]
                      )
                    ]
                  : []
            })
          )
        )
      ]
    })

    return h.div(
      [
        ...getStyles(
          "wrapper",
          styles.wrapper,
          sizes[size],
          props.fullWidth === true && styles.fullWidth,
          setVars([colorPickerVars.swatchSize, `${100 / (props.swatchesPerRow ?? 7)}%`])
        ),
        ...(props.fullWidth === true ? [h.DataAttribute("full-width", "")] : [])
      ],
      [
        ...(props.name === undefined ? [] : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(props.value)])]),
        ...picker,
        ...swatches
      ]
    )
  }
}
