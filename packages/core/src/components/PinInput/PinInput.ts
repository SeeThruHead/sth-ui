import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mergeStyles, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import { Input } from "../Input/Input.ts"
import type { InputConfig, InputSize } from "../Input/Input.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { pinVars } from "./PinInput.stylex.ts"

export const Model = Schema.Struct({ id: Schema.String })

export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { value: Schema.String, focus: Schema.Int, complete: Schema.Boolean },
  Moved: { focus: Schema.Int },
  CompletedFocus: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { value: Schema.String, complete: Schema.Boolean } })

export type OutMessage = typeof OutMessage.Type

export const init = (config: { readonly id: string }): Model => ({ id: config.id })

const boxId = (id: string, index: number) => `${id}-${index}`

export const FocusBox = Command.define("FocusBox", {
  args: { id: Schema.String, index: Schema.Int },
  messages: [Message.CompletedFocus],
  execute: ({ id, index }) => Dom.focus(`#${boxId(id, index)}`).pipe(Effect.ignore, Effect.as(Message.CompletedFocus()))
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
    Changed: ({ value, focus, complete }) => ({
      model,
      commands: [FocusBox({ id: model.id, index: focus })],
      outMessage: OutMessage.Changed({ value, complete })
    }),
    Moved: ({ focus }) => ({ model, commands: [FocusBox({ id: model.id, index: focus })] }),
    CompletedFocus: () => ({ model, commands: [] })
  })

export type PinInputPart = "root" | "pinInput" | "input"

export type PinInputType = "alphanumeric" | "number" | RegExp

export type PinInputOptions = {
  readonly size?: InputSize
  readonly radius?: StyleValue
  readonly gap?: StyleValue
  readonly length?: number
  readonly type?: PinInputType
  readonly mask?: boolean
  readonly placeholder?: string
  readonly oneTimeCode?: boolean
  readonly manageFocus?: boolean
  readonly ariaLabel?: string
}

export type PinInputProps<M> = PinInputOptions &
  StylesApiProps<PinInputPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: string
    readonly error?: boolean
    readonly success?: boolean
    readonly disabled?: boolean
    readonly readOnly?: boolean
    readonly name?: string
  }

export type PinInputConfig = ComponentConfig<PinInputOptions, PinInputPart>

const styles = stylex.create({
  root: { display: "flex", flexWrap: "nowrap", alignItems: "center", gap: pinVars.gap },
  pinInput: { width: inputVars.height, flexShrink: 0 },
  input: { textAlign: "center", paddingInlineStart: 0, paddingInlineEnd: 0 }
})

const patterns: { readonly [Type in "alphanumeric" | "number"]: RegExp } = {
  alphanumeric: /^[a-zA-Z0-9]$/,
  number: /^[0-9]$/
}

const accepts = (type: PinInputType, character: string) =>
  (Predicate.isRegExp(type) ? type : patterns[type]).test(character)

const pasted = (text: string, previous: string): ReadonlyArray<string> =>
  (text.length > 1 && text.startsWith(previous) ? text.slice(previous.length) : text).split("")

export const PinInput = (config: {
  readonly PinInput?: PinInputConfig
  readonly Input?: InputConfig
  readonly Loader?: LoaderConfig
}) => {
  const input = Input(config)

  return <M>(h: HtmlBuilder<M>, given: PinInputProps<M>): Html => {
    const props = withDefaults(config.PinInput, given)
    const getStyles = stylesApi<M, PinInputPart>(h, props, config.PinInput, "root")
    const length = props.length ?? 4
    const type = props.type ?? "alphanumeric"
    const id = props.model.id
    const boxes = Array.from({ length }, (_, index) => props.value.charAt(index))
    const focusOf = (from: number, to: number) => (props.manageFocus === false ? from : Math.min(to, length - 1))
    const changed = (characters: ReadonlyArray<string>, from: number, to: number) => {
      const value = characters.join("").slice(0, length)

      return props.toParentMessage(
        Message.Changed({ value, focus: focusOf(from, to), complete: value.length === length })
      )
    }
    const typed = (index: number) => (text: string) => {
      const incoming = pasted(text, props.value.charAt(index)).filter((character) => accepts(type, character))
      const after = boxes.slice(index + Math.max(incoming.length, 1))

      return changed([...boxes.slice(0, index), ...incoming, ...after], index, index + incoming.length)
    }
    const erased = (index: number): M => {
      const target = props.value.charAt(index) === "" ? Math.max(index - 1, 0) : index

      return changed([...boxes.slice(0, target), ...boxes.slice(target + 1)], target, target)
    }
    const refused =
      (index: number) =>
      (_inputType: string, data: Option.Option<string>): Option.Option<M> =>
        Option.exists(data, (text) => text !== "" && !text.split("").some((character) => accepts(type, character)))
          ? Option.some(props.toParentMessage(Message.Moved({ focus: index })))
          : Option.none()
    const parts = mergeStyles(["pinInput", "input"], config.PinInput?.styles, props.styles)
    const keyed =
      (index: number) =>
      (key: string): Option.Option<M> => {
        if (key === "ArrowLeft")
          return Option.some(props.toParentMessage(Message.Moved({ focus: Math.max(index - 1, 0) })))
        if (key === "ArrowRight")
          return Option.some(props.toParentMessage(Message.Moved({ focus: Math.min(index + 1, length - 1) })))
        if (key === "Backspace") return Option.some(erased(index))

        return Option.none()
      }

    return h.div(
      [
        ...getStyles("root", styles.root, setVars([pinVars.gap, spacing(props.gap ?? "sm")])),
        h.Role("group"),
        h.AriaLabel(props.ariaLabel ?? "PinInput")
      ],
      [
        ...boxes.map((character, index) =>
          input(h, {
            id: boxId(id, index),
            size: props.size ?? "sm",
            ...(props.radius === undefined ? {} : { radius: props.radius }),
            value: character,
            type: props.mask === true ? "password" : "text",
            inputMode: type === "number" ? "numeric" : "text",
            placeholder: props.placeholder ?? "○",
            autoComplete: props.oneTimeCode === false ? "off" : "one-time-code",
            ...(props.error === true ? { error: true } : {}),
            ...(props.success === true ? { success: true } : {}),
            disabled: props.disabled === true,
            readOnly: props.readOnly === true,
            onInput: typed(index),
            onKeyDown: keyed(index),
            onBeforeInput: refused(index),
            styles: {
              wrapper: [styles.pinInput, ...listOf(parts.pinInput)],
              input: [styles.input, ...listOf(parts.input)]
            },
            attributes: { input: { "aria-label": props.ariaLabel ?? "PinInput" } }
          })
        ),
        ...(props.name === undefined ? [] : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(props.value)])])
      ]
    )
  }
}
