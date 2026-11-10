import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Schema, Stream } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { documentDrag } from "../../hooks/drag.ts"
import { mapDefined, setDefinedVars, setStyle, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, fontSize } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { angleSliderVars } from "./AngleSlider.stylex.ts"
import { handledKeys, Message, update as updateModel } from "./model.ts"
import type { AngleSliderContext, Model, OutMessage, Point } from "./model.ts"

export { findClosestNumber, init, Message, Model, normalizeRadialValue, OutMessage } from "./model.ts"
export type { AngleSliderContext } from "./model.ts"

export type AngleSliderPart = "root" | "label" | "marks" | "mark" | "thumb"

export type AngleSliderMark = { readonly value: number; readonly label?: string }

export type AngleSliderOptions = {
  readonly size?: number
  readonly thumbSize?: number
  readonly withLabel?: boolean
  readonly step?: number
  readonly restrictToMarks?: boolean
  readonly disabled?: boolean
}

export type AngleSliderProps<M> = AngleSliderOptions &
  StylesApiProps<AngleSliderPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: number
    readonly marks?: ReadonlyArray<AngleSliderMark>
    readonly formatLabel?: (value: number) => Child
    readonly ariaLabel?: string
    readonly name?: string
  }

export type AngleSliderConfig = ComponentConfig<AngleSliderOptions, AngleSliderPart>

export const angleSliderContext = <M>(
  props: Pick<AngleSliderProps<M>, "value" | "step" | "marks" | "restrictToMarks" | "disabled">
): AngleSliderContext => ({
  value: props.value,
  ...(props.step === undefined ? {} : { step: props.step }),
  ...(props.marks === undefined ? {} : { marks: props.marks.map((mark) => mark.value) }),
  ...(props.restrictToMarks === undefined ? {} : { restrictToMarks: props.restrictToMarks }),
  ...(props.disabled === undefined ? {} : { disabled: props.disabled })
})

export const update = (
  model: Model,
  message: Message,
  context: AngleSliderContext
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
} => ({ ...updateModel(model, message, context), commands: [] })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragAngle: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: model.dragging }),
      dependenciesToStream: ({ active }) =>
        Stream.when(
          documentDrag<Message>((x, y) => Message.Moved({ x, y }), Message.Released()),
          Effect.sync(() => active)
        )
    }
  )
}))

const styles = stylex.create({
  root: {
    width: angleSliderVars.size,
    height: angleSliderVars.size,
    position: "relative",
    borderRadius: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    touchAction: "none",
    backgroundColor: `light-dark(${palette.gray1}, ${palette.dark5})`,
    outline: { default: null, ":focus-within": `2px solid ${accent.filled}` },
    outlineOffset: { default: null, ":focus-within": "2px" }
  },
  marks: { position: "absolute", inset: "1px", borderRadius: angleSliderVars.size, pointerEvents: "none" },
  mark: {
    width: "2px",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "calc(50% - 1px)",
    transform: `rotate(${angleSliderVars.angle})`,
    "::before": {
      content: "''",
      position: "absolute",
      top: `calc(${angleSliderVars.thumbSize} / 3)`,
      left: "0.5px",
      width: "1px",
      height: `calc(${angleSliderVars.thumbSize} / 1.5)`,
      transform: "translate(-50%, -50%)",
      backgroundColor: `light-dark(${palette.gray4}, ${palette.dark3})`
    }
  },
  markLabel: {
    "::after": {
      minWidth: "18px",
      textAlign: "center",
      content: "attr(data-label)",
      position: "absolute",
      top: "-24px",
      left: "-7px",
      transform: `rotate(calc(360deg - ${angleSliderVars.angle}))`,
      fontSize: fontSize.xs
    }
  },
  thumb: {
    position: "absolute",
    insetBlock: 0,
    insetInlineStart: "calc(50% - 1.5px)",
    insetInlineEnd: 0,
    height: "100%",
    width: "3px",
    outline: "none",
    pointerEvents: "none",
    "::before": {
      content: "''",
      position: "absolute",
      right: 0,
      top: 0,
      height: `min(${angleSliderVars.thumbSize}, calc(${angleSliderVars.size} / 2))`,
      width: "3px",
      backgroundColor: `light-dark(${palette.gray7}, ${palette.dark1})`
    }
  },
  label: { fontSize: fontSize.xs }
})

const centerOf = (target: EventTarget | null): Option.Option<Point> =>
  Option.fromNullishOr(target).pipe(
    Option.filter((found): found is Element => found instanceof Element),
    Option.flatMap((element) => Option.fromNullishOr(element.closest("[data-angle-slider]"))),
    Option.map((root) => {
      const rect = root.getBoundingClientRect()

      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })
  )

export const AngleSlider =
  (config: { readonly AngleSlider?: AngleSliderConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AngleSliderProps<M>): Html => {
    const props = withDefaults(config.AngleSlider, input)
    const getStyles = stylesApi<M, AngleSliderPart>(h, props, config.AngleSlider, "root")
    const lift = props.toParentMessage
    const disabled = props.disabled === true
    const marks = props.marks ?? []

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedVars(
            [angleSliderVars.size, mapDefined(props.size, rem)],
            [angleSliderVars.thumbSize, mapDefined(props.thumbSize, rem)]
          )
        ),
        h.DataAttribute("angle-slider", ""),
        ...(disabled ? [h.DataAttribute("disabled", "")] : []),
        h.OnPointerDown((_type, button, _sx, _sy, _t, x, y, _pointer, target) =>
          Option.filter(centerOf(target), () => button === 0).pipe(
            Option.map((center) => lift(Message.Pressed({ x, y, center })))
          )
        )
      ],
      [
        ...(marks.length === 0
          ? []
          : [
              h.div(
                getStyles("marks", styles.marks),
                marks.map((mark) =>
                  h.div(
                    [
                      ...getStyles(
                        "mark",
                        styles.mark,
                        mark.label !== undefined && styles.markLabel,
                        setVars([angleSliderVars.angle, `${mark.value}deg`])
                      ),
                      ...(mark.label === undefined ? [] : [h.DataAttribute("label", mark.label)])
                    ],
                    []
                  )
                )
              )
            ]),
        ...(props.withLabel === false
          ? []
          : [h.div(getStyles("label", styles.label), [props.formatLabel?.(props.value) ?? String(props.value)])]),
        h.div(
          [
            ...getStyles("thumb", styles.thumb, setStyle(["transform", `rotate(${props.value}deg)`])),
            h.Role("slider"),
            h.Tabindex(disabled ? -1 : 0),
            h.AriaValuemax(360),
            h.AriaValuemin(0),
            h.AriaValuenow(props.value),
            h.AriaDisabled(disabled),
            ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
            h.OnKeyDownPreventDefault((key) =>
              Option.liftPredicate(key, (pressed) => handledKeys.has(pressed)).pipe(
                Option.map((pressed) => lift(Message.PressedKey({ key: pressed })))
              )
            )
          ],
          []
        ),
        h.input([
          h.Type("hidden"),
          ...(props.name === undefined ? [] : [h.Name(props.name)]),
          h.Value(String(props.value))
        ])
      ]
    )
  }
