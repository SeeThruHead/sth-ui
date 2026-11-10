import * as stylex from "@stylexjs/stylex"
import { Effect, Schema } from "effect"
import type { Option } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Child } from "../../content.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mergeStyles, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { StylesApiProps } from "../../styles/StylesApi.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import { isShown } from "../Input/Input.ts"
import type { InputConfig, InputPart, InputSize, InputVariant } from "../Input/Input.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputBaseConfig } from "../Input/InputBase.ts"
import type { InputWrapperConfig, InputWrapperOptions } from "../Input/InputWrapper.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { PillGroup } from "../Pill/Pill.ts"
import type { PillGroupConfig } from "../Pill/Pill.ts"

export const Model = Schema.Struct({ id: Schema.String })

export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Clicked: {}, CompletedFocus: {} })

export type Message = typeof Message.Type

export const init = (config: { readonly id: string }): Model => ({ id: config.id })

export const fieldId = (model: Model) => `${model.id}-field`

export const FocusField = Command.define("FocusField", {
  args: { id: Schema.String },
  messages: [Message.CompletedFocus],
  execute: ({ id }) => Dom.focus(`#${id}`).pipe(Effect.ignore, Effect.as(Message.CompletedFocus()))
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Clicked: () => ({ model, commands: [FocusField({ id: fieldId(model) })] }),
    CompletedFocus: () => ({ model, commands: [] })
  })

export type PillsInputFieldType = "auto" | "visible" | "hidden"

export type PillsInputField<M> = {
  readonly value?: string
  readonly placeholder?: string
  readonly type?: PillsInputFieldType
  readonly pointer?: boolean
  readonly onInput?: (value: string) => M
  readonly onKeyDown?: (key: string) => Option.Option<M>
  readonly onFocus?: M
  readonly onBlur?: M
  readonly attributes?: ReadonlyArray<ChildAttribute<M>>
}

type ChildAttribute<M> = ReturnType<HtmlBuilder<M>["Attribute"]>

export type PillsInputPart = InputPart | "field"

export type PillsInputOptions = InputWrapperOptions & {
  readonly size?: InputSize
  readonly radius?: StyleValue
  readonly variant?: InputVariant
}

export type PillsInputProps<M> = PillsInputOptions &
  StylesApiProps<PillsInputPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly pills: ReadonlyArray<Child>
    readonly field?: PillsInputField<M>
    readonly label?: Child
    readonly description?: Child
    readonly error?: boolean | Child
    readonly required?: boolean
    readonly withAsterisk?: boolean
    readonly disabled?: boolean
    readonly leftSection?: Child
    readonly rightSection?: Child
    readonly pointer?: boolean
  }

export type PillsInputConfig = InputBaseConfig

const styles = stylex.create({
  field: {
    backgroundColor: "transparent",
    appearance: "none",
    minWidth: "100px",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    borderWidth: 0,
    fontSize: "inherit",
    height: "1.6em",
    color: "inherit",
    padding: 0,
    outline: { default: null, ":focus": "none" },
    "::placeholder": { color: inputVars.placeholder, opacity: 1 }
  },
  offscreen: {
    height: "1px",
    width: "1px",
    minWidth: 0,
    top: 0,
    left: 0,
    pointerEvents: "none",
    position: "absolute",
    opacity: 0
  },
  auto: {
    height: { default: "1px", ":focus": "1.6em" },
    width: { default: "1px", ":focus": "auto" },
    minWidth: { default: 0, ":focus": "100px" },
    top: 0,
    left: 0,
    opacity: { default: 0, ":focus": 1 },
    position: { default: "absolute", ":focus": "static" },
    pointerEvents: { default: "none", ":focus": "auto" }
  },
  pointer: { cursor: "pointer" },
  disabled: { cursor: "not-allowed" }
})

export const PillsInput = (config: {
  readonly PillsInput?: PillsInputConfig
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly PillGroup?: PillGroupConfig
}) => {
  const base = inputBase("PillsInput")(config)
  const group = PillGroup(config)

  return <M>(h: HtmlBuilder<M>, input: PillsInputProps<M>): Html => {
    const props = withDefaults(config.PillsInput, input)
    const { model, toParentMessage, pills, field, ...rest } = props
    const id = fieldId(model)
    const disabled = props.disabled === true
    const type = field?.type ?? "visible"
    const parts = mergeStyles(["field"], undefined, props.styles)
    const describedBy = [
      isShown(props.error) ? `${id}-error` : "",
      props.description === undefined ? "" : `${id}-description`
    ]
      .filter((part) => part !== "")
      .join(" ")
    const fieldView = h.input([
      ...sx(
        h,
        styles.field,
        type === "hidden" && styles.offscreen,
        type === "auto" && styles.auto,
        field?.pointer === true && !disabled && styles.pointer,
        disabled && styles.disabled,
        ...listOf(parts.field)
      ),
      h.Id(id),
      h.Type("text"),
      h.DataAttribute("type", type),
      h.Disabled(disabled),
      ...(disabled ? [h.DataAttribute("disabled", "")] : []),
      ...(isShown(props.error) ? [h.AriaInvalid(true)] : []),
      ...(describedBy === "" ? [] : [h.AriaDescribedBy(describedBy)]),
      ...(field?.value === undefined ? [] : [h.Value(field.value)]),
      ...(field?.placeholder === undefined ? [] : [h.Placeholder(field.placeholder)]),
      ...(field?.onInput === undefined ? [] : [h.OnInput(field.onInput)]),
      ...(field?.onKeyDown === undefined ? [] : [h.OnKeyDownPreventDefault(field.onKeyDown)]),
      ...(field?.onFocus === undefined ? [] : [h.OnFocus(field.onFocus)]),
      ...(field?.onBlur === undefined ? [] : [h.OnBlur(field.onBlur)]),
      ...(field?.attributes ?? [])
    ])

    return base(h, {
      ...rest,
      id,
      component: "div",
      multiline: true,
      withAria: false,
      ...(disabled ? {} : { onClick: toParentMessage(Message.Clicked()) }),
      children: [
        group(h, { size: props.size ?? "sm", children: [...pills, ...(field === undefined ? [] : [fieldView])] })
      ]
    })
  }
}
