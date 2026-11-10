import * as stylex from "@stylexjs/stylex"
import { Struct } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { listOf, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import { font } from "../../theme/tokens.stylex.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputBaseOptions, InputBasePart, InputBaseProps } from "../Input/InputBase.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import type { InputConfig } from "../Input/Input.ts"
import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { Message } from "./model.ts"
import type { Deserialize, JsonInputContext, Model, Serialize } from "./model.ts"

export { init, Message, Model, OutMessage, update, validateJson } from "./model.ts"
export type { Deserialize, JsonInputContext, Serialize } from "./model.ts"

export type JsonInputPart = InputBasePart

export type JsonInputOptions = InputBaseOptions & {
  readonly formatOnBlur?: boolean
  readonly indentSpaces?: number
  readonly serialize?: Serialize
  readonly deserialize?: Deserialize
}

export type JsonInputProps<M> = Omit<
  InputBaseProps<M>,
  "component" | "multiline" | "type" | "value" | "onInput" | "onChange" | "onFocus" | "onBlur"
> &
  JsonInputOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: string
    readonly validationError?: Child
  }

export type JsonInputConfig = ComponentConfig<JsonInputOptions, JsonInputPart>

const contextKeys = ["formatOnBlur", "readOnly", "serialize", "deserialize", "indentSpaces"] as const

export const jsonInputContext = (
  props: Pick<JsonInputProps<never>, "value" | (typeof contextKeys)[number]>
): JsonInputContext => ({ ...Struct.pick(props, contextKeys), value: props.value })

export const contextOptions = <Setup extends Partial<Pick<JsonInputContext, (typeof contextKeys)[number]>>>(
  setup: Setup
) => Struct.pick(setup, contextKeys)

const styles = stylex.create({
  monospace: { fontFamily: font.mono, fontSize: `calc(${inputVars.fz} - 0.125rem)` }
})

const ownKeys = [
  "model",
  "toParentMessage",
  "validationError",
  "formatOnBlur",
  "indentSpaces",
  "serialize",
  "deserialize"
] as const

export const JsonInput = (config: {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
  readonly JsonInput?: JsonInputConfig
}) => {
  const base = inputBase("JsonInput")({
    ...Struct.omit(config, ["JsonInput"]),
    ...(config.JsonInput?.styles === undefined ? {} : { JsonInput: { styles: config.JsonInput.styles } })
  })

  return <M>(h: HtmlBuilder<M>, input: JsonInputProps<M>): Html => {
    const props = withDefaults<JsonInputOptions, JsonInputProps<M>>(config.JsonInput, input)
    const lift = props.toParentMessage

    return base(h, {
      ...Struct.omit(props, ownKeys),
      component: "textarea",
      multiline: true,
      autoComplete: "off",
      onInput: (value) => lift(Message.Typed({ value })),
      onFocus: lift(Message.Focused()),
      onBlur: lift(Message.Blurred()),
      ...(props.model.valid
        ? props.error === undefined
          ? {}
          : { error: props.error }
        : { error: props.validationError ?? true }),
      attributes: { ...props.attributes, input: { ...props.attributes?.input, "data-monospace": "" } },
      styles: { ...props.styles, input: [styles.monospace, ...listOf(props.styles?.input)] }
    })
  }
}
