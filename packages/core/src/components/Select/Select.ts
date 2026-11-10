import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import * as Combobox from "../Combobox/Combobox.ts"
import type { ComboboxOptions, ComboboxPart, ComboboxProps } from "../Combobox/Combobox.ts"
import type { InputWrapperConfig } from "../Input/InputWrapper.ts"

export const Model = Combobox.Model

export type Model = Combobox.Model

export const init = (config: {
  readonly id: string
  readonly inputValue?: string
  readonly allowDeselect?: boolean
}): Model =>
  Combobox.init({
    id: config.id,
    nullable: config.allowDeselect ?? true,
    ...(config.inputValue === undefined ? {} : { inputValue: config.inputValue })
  })

export const Message = defineMessageUnion({ GotCombobox: { message: Combobox.Message }, Cleared: {} })

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { value: Schema.NullOr(Schema.String) } })

export type OutMessage = typeof OutMessage.Type

const changed = (outMessage: Combobox.OutMessage | undefined) =>
  outMessage === undefined
    ? {}
    : { outMessage: OutMessage.Changed({ value: outMessage._tag === "Selected" ? outMessage.value : null }) }

export const update = (
  model: Model,
  message: Message
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage
} =>
  Message.match(message, {
    GotCombobox: ({ message: inner }) => {
      const result = Combobox.update(model, inner)

      return {
        model: result.model,
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotCombobox({ message: lifted }))
        ),
        ...changed(result.outMessage)
      }
    },
    Cleared: () => ({
      model: { ...model, inputValue: "" },
      commands: [],
      outMessage: OutMessage.Changed({ value: null })
    })
  })

export type SelectOptions = ComboboxOptions & { readonly clearable?: boolean }

export type SelectProps<M> = Omit<ComboboxProps<M>, "model" | "toParentMessage" | "clearMessage"> &
  SelectOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
  }

export type SelectConfig = ComponentConfig<SelectOptions, ComboboxPart>

export const Select = (config: { readonly Select?: SelectConfig; readonly InputWrapper?: InputWrapperConfig }) => {
  const combobox = Combobox.comboboxWith(config.Select, config)

  return <M>(h: HtmlBuilder<M>, input: SelectProps<M>): Html => {
    const props = withDefaults(config.Select, input)
    const { clearable, toParentMessage, ...rest } = props
    const clear = clearable === true && props.value != null && props.disabled !== true && props.readOnly !== true

    return combobox(h, {
      ...rest,
      searchable: props.searchable ?? false,
      toParentMessage: (message) => toParentMessage(Message.GotCombobox({ message })),
      ...(clear ? { clearMessage: toParentMessage(Message.Cleared()) } : {})
    })
  }
}
