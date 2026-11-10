import * as stylex from "@stylexjs/stylex"
import { Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import * as FoldkitFile from "foldkit/file"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Child } from "../../content.ts"
import { sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { InputClearButton, InputPlaceholder } from "../Input/Input.ts"
import type { InputConfig } from "../Input/Input.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputBaseConfig, InputBaseProps } from "../Input/InputBase.ts"
import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"

export const Model = Schema.Struct({ id: Schema.String, generation: Schema.Int })

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({ id: config.id, generation: 0 })

export const Message = defineMessageUnion({
  Pressed: {},
  Picked: { files: Schema.Array(FoldkitFile.File) },
  Cleared: {},
  CompletedOpen: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { files: Schema.Array(FoldkitFile.File) } })

export type OutMessage = typeof OutMessage.Type

const fieldId = (model: Model) => `${model.id}-files`

export const OpenPicker = Command.define("OpenFilePicker", {
  args: { id: Schema.String },
  messages: [Message.CompletedOpen],
  execute: ({ id }) => Dom.clickElement(`#${id}`).pipe(Effect.ignore, Effect.as(Message.CompletedOpen()))
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
    Pressed: () => ({ model, commands: [OpenPicker({ id: fieldId(model) })] }),
    Picked: ({ files }) => ({ model, commands: [], outMessage: OutMessage.Changed({ files }) }),
    Cleared: () => ({
      model: { ...model, generation: model.generation + 1 },
      commands: [],
      outMessage: OutMessage.Changed({ files: [] })
    }),
    CompletedOpen: () => ({ model, commands: [] })
  })

export type FileInputClearSectionMode = "both" | "rightSection" | "clear"

export type FileInputOptions = { readonly clearSectionMode?: FileInputClearSectionMode }

export type FileInputProps<M> = Omit<InputBaseProps<M>, "id" | "value" | "component" | "onInput" | "onChange"> &
  FileInputOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: ReadonlyArray<FoldkitFile.File>
    readonly multiple?: boolean
    readonly accept?: string
    readonly capture?: "user" | "environment"
    readonly clearable?: boolean
    readonly form?: string
    readonly valueComponent?: (files: ReadonlyArray<FoldkitFile.File>) => Child
  }

export type FileInputConfig = InputBaseConfig

const styles = stylex.create({
  hidden: { display: "none" },
  contents: { display: "contents" },
  value: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sections: { display: "flex", alignItems: "center", gap: "2px" }
})

export const FileInput = (config: {
  readonly FileInput?: FileInputConfig
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
  readonly InputPlaceholder?: ComponentConfig<object, "placeholder">
}) => {
  const base = inputBase("FileInput")(config)
  const clearButton = InputClearButton(config)
  const placeholder = InputPlaceholder(config)

  return <M>(h: HtmlBuilder<M>, input: FileInputProps<M>): Html => {
    const props = withDefaults(config.FileInput, input)
    const {
      model,
      toParentMessage,
      value,
      multiple,
      accept,
      capture,
      clearable,
      clearSectionMode,
      form,
      name,
      valueComponent,
      rightSection,
      placeholder: placeholderText,
      ...rest
    } = props
    const lift = toParentMessage
    const hasValue = value.length > 0
    const clear =
      clearable === true && hasValue && props.readOnly !== true
        ? [clearButton(h, { label: "Clear", size: props.size ?? "sm", onClick: lift(Message.Cleared()) })]
        : []
    const mode = clearSectionMode ?? "both"
    const right = rightSection === undefined || (mode === "clear" && clear.length > 0) ? [] : [rightSection]
    const section = mode === "rightSection" ? right : [...clear, ...right]
    const field = h.keyed("input")(`${model.id}-${model.generation}`, [
      ...sx(h, styles.hidden),
      h.Id(fieldId(model)),
      h.Type("file"),
      h.Tabindex(-1),
      h.AriaHidden(true),
      ...(multiple === true ? [h.Attribute("multiple", "")] : []),
      ...(accept === undefined ? [] : [h.Attribute("accept", accept)]),
      ...(capture === undefined ? [] : [h.Attribute("capture", capture)]),
      ...(name === undefined ? [] : [h.Name(name)]),
      ...(form === undefined ? [] : [h.Attribute("form", form)]),
      ...(props.disabled === true || props.readOnly === true ? [h.Disabled(true)] : []),
      h.OnFileChange((files) => lift(Message.Picked({ files })))
    ])

    return h.div(sx(h, styles.contents), [
      base(h, {
        ...rest,
        id: model.id,
        component: "button",
        multiline: true,
        pointer: true,
        ...(props.readOnly === true || props.disabled === true ? {} : { onClick: lift(Message.Pressed()) }),
        ...(section.length === 0
          ? {}
          : { rightSection: section.length === 1 ? section[0] : h.div(sx(h, styles.sections), section) }),
        ...(clear.length > 0 ? { rightSectionPointerEvents: "all" as const } : {}),
        ...(section.length > 1 ? { rightSectionWidth: combinedWidths[props.size ?? "sm"] } : {}),
        children: [
          hasValue
            ? (valueComponent ?? defaultValue(h))(value)
            : placeholder(h, {
                ...(props.error === undefined || props.error === false ? {} : { error: true }),
                children: placeholderText === undefined ? [] : [placeholderText]
              })
        ]
      }),
      field
    ])
  }
}

const combinedWidths = { xs: 41, sm: 50, md: 60, lg: 72, xl: 89 }

const defaultValue =
  <M>(h: HtmlBuilder<M>) =>
  (files: ReadonlyArray<FoldkitFile.File>): Child =>
    h.div(sx(h, styles.value), [files.map((file) => file.name).join(", ")])
