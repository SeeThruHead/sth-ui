import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Child } from "../../content.ts"
import { setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { ratingVars } from "./Rating.stylex.ts"

export const Model = Schema.Struct({ id: Schema.String, hovered: Schema.Finite })

export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Hovered: { value: Schema.Finite },
  Left: {},
  Chose: { value: Schema.Finite },
  CompletedFocus: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.Finite },
  Hovered: { value: Schema.Finite }
})

export type OutMessage = typeof OutMessage.Type

export const init = (config: { readonly id: string }): Model => ({ id: config.id, hovered: -1 })

const itemId = (id: string, value: number) => `${id}-${String(value).replace(".", "_")}`

export const FocusItem = Command.define("FocusItem", {
  args: { id: Schema.String, value: Schema.Finite },
  messages: [Message.CompletedFocus],
  execute: ({ id, value }) =>
    Dom.focus(`#${itemId(id, value)}`).pipe(Effect.ignore, Effect.as(Message.CompletedFocus()))
})

export const update = (
  model: Model,
  message: Message
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage
} =>
  Message.match(message, {
    Hovered: ({ value }) => ({
      model: { ...model, hovered: value },
      commands: [],
      outMessage: OutMessage.Hovered({ value })
    }),
    Left: () => ({ model: { ...model, hovered: -1 }, commands: [], outMessage: OutMessage.Hovered({ value: -1 }) }),
    Chose: ({ value }) => ({
      model,
      commands: [FocusItem({ id: model.id, value: Math.max(value, 0) })],
      outMessage: OutMessage.Changed({ value })
    }),
    CompletedFocus: () => ({ model, commands: [] })
  })

export type RatingPart = "root" | "symbolGroup" | "starSymbol" | "symbolBody" | "label"

export type RatingSize = keyof typeof sizes

export type RatingSymbol = Child | ((value: number) => Child)

export type RatingOptions = {
  readonly size?: RatingSize | number
  readonly color?: string
  readonly count?: number
  readonly fractions?: number
  readonly allowClear?: boolean
  readonly highlightSelectedOnly?: boolean
}

export type RatingProps<M> = RatingOptions &
  StylesApiProps<RatingPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: number
    readonly readOnly?: boolean
    readonly emptySymbol?: RatingSymbol
    readonly fullSymbol?: RatingSymbol
    readonly getSymbolLabel?: (value: number) => string
    readonly ariaLabel?: string
    readonly name?: string
  }

export type RatingConfig = ComponentConfig<RatingOptions, RatingPart>

const sizes = stylex.create({
  xs: { [ratingVars.size]: "14px" },
  sm: { [ratingVars.size]: "18px" },
  md: { [ratingVars.size]: "20px" },
  lg: { [ratingVars.size]: "28px" },
  xl: { [ratingVars.size]: "32px" }
})

const styles = stylex.create({
  root: { [ratingVars.color]: accent.filled, display: "flex", width: "max-content" },
  symbolGroup: {
    position: "relative",
    transitionProperty: "transform",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease"
  },
  active: { zIndex: 1, transform: "scale(1.1)" },
  starSymbol: {
    width: ratingVars.size,
    height: ratingVars.size,
    display: "block",
    fill: `light-dark(${palette.gray3}, ${palette.dark3})`,
    stroke: `light-dark(${palette.gray3}, ${palette.dark3})`
  },
  filled: { fill: ratingVars.color, stroke: ratingVars.color },
  symbolBody: { display: "flex" },
  full: { position: "absolute", top: 0, left: 0, display: "flex", pointerEvents: "none" },
  label: {
    display: "block",
    cursor: "pointer",
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    WebkitTapHighlightColor: "transparent",
    outline: { default: "none", ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  readOnly: { cursor: "default" }
})

const starPath =
  "M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"

const symbolOf = (symbol: RatingSymbol, value: number): Child => (Predicate.isFunction(symbol) ? symbol(value) : symbol)

export const Rating =
  (config: { readonly Rating?: RatingConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RatingProps<M>): Html => {
    const props = withDefaults(config.Rating, input)
    const getStyles = stylesApi<M, RatingPart>(h, props, config.Rating, "root")
    const count = Math.floor(props.count ?? 5)
    const fractions = Math.floor(props.fractions ?? 1)
    const unit = 1 / fractions
    const round = (value: number) => Math.round(value / unit) * unit
    const value = round(props.value)
    const hovering = props.model.hovered >= 0
    const shown = hovering ? props.model.hovered : value
    const readOnly = props.readOnly === true
    const label = props.getSymbolLabel ?? String
    const lift = props.toParentMessage
    const star = (filled: boolean) =>
      h.svg(
        [
          ...getStyles("starSymbol", styles.starSymbol, filled && styles.filled),
          h.Attribute("viewBox", "0 0 24 24"),
          h.Attribute("stroke-linecap", "round"),
          h.Attribute("stroke-linejoin", "round"),
          ...(filled ? [h.DataAttribute("filled", "")] : [])
        ],
        [h.path([h.Attribute("d", starPath)], [])]
      )
    const step = (key: string): number => {
      if (key === "ArrowRight" || key === "ArrowUp") return Math.min(value + unit, count)
      if (key === "ArrowLeft" || key === "ArrowDown") return Math.max(value - unit, unit)

      return -1
    }
    const keyed = (key: string): Option.Option<M> => {
      const next = step(key)

      return next < 0 ? Option.none() : Option.some(lift(Message.Chose({ value: next })))
    }
    const chosen = (item: number) => (props.allowClear === true && item === value ? 0 : item)
    const focusable = (item: number) => (value === 0 ? item === unit : item === value)
    const group = (index: number): Html => {
      const symbol = index + 1
      const amount =
        props.highlightSelectedOnly === true
          ? Math.ceil(shown) === symbol
            ? 1
            : 0
          : Math.min(Math.max(shown - index, 0), 1)
      const items = Array.from({ length: fractions }, (_, part) => index + (part + 1) * unit)

      return h.div(
        [
          ...getStyles("symbolGroup", styles.symbolGroup, hovering && Math.ceil(shown) === symbol && styles.active),
          ...(hovering && Math.ceil(shown) === symbol ? [h.DataAttribute("active", "")] : [])
        ],
        [
          h.div(getStyles("symbolBody", styles.symbolBody), [
            props.emptySymbol === undefined ? star(false) : symbolOf(props.emptySymbol, symbol)
          ]),
          h.div(
            [
              ...getStyles("symbolBody", styles.symbolBody, styles.full),
              h.Style({ clipPath: `inset(0 ${(1 - amount) * 100}% 0 0)` }),
              h.AriaHidden(true),
              h.DataAttribute("full", "")
            ],
            [props.fullSymbol === undefined ? star(true) : symbolOf(props.fullSymbol, symbol)]
          ),
          ...items.map((item, part) =>
            h.button(
              [
                ...getStyles("label", styles.label, readOnly && styles.readOnly),
                h.Type("button"),
                h.Id(itemId(props.model.id, item)),
                h.Role("radio"),
                h.AriaChecked(item === value),
                h.AriaLabel(label(item)),
                h.Tabindex(focusable(item) ? 0 : -1),
                h.Style({ width: `${((part + 1) / fractions) * 100}%`, zIndex: String(fractions - part) }),
                ...(readOnly
                  ? [h.AriaReadonly(true), h.DataAttribute("read-only", "")]
                  : [
                      h.OnClick(lift(Message.Chose({ value: chosen(item) }))),
                      h.OnMouseEnter(lift(Message.Hovered({ value: item }))),
                      h.OnKeyDownPreventDefault(keyed)
                    ])
              ],
              []
            )
          )
        ]
      )
    }

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          Predicate.isNumber(props.size) ? null : sizes[props.size ?? "sm"],
          setVars(
            [ratingVars.color, themeColor(props.color ?? "yellow")],
            ...(Predicate.isNumber(props.size) ? [[ratingVars.size, rem(props.size)] as const] : [])
          )
        ),
        h.Role("radiogroup"),
        h.AriaLabel(props.ariaLabel ?? "Rating"),
        ...(readOnly ? [] : [h.OnMouseLeave(lift(Message.Left()))])
      ],
      [
        ...Array.from({ length: count }, (_, index) => group(index)),
        ...(props.name === undefined ? [] : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(String(value))])])
      ]
    )
  }
