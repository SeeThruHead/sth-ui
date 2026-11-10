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

export const init = (config: { readonly id: string; readonly value?: string }): Model =>
  Combobox.init({ id: config.id, ...(config.value === undefined ? {} : { inputValue: config.value }) })

export const Message = defineMessageUnion({ GotCombobox: { message: Combobox.Message }, Cleared: {} })

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { value: Schema.String } })

export type OutMessage = typeof OutMessage.Type

const restingOnTyped = (model: Model, message: Combobox.Message): Combobox.Message =>
  message._tag === "BlurredInput" || message._tag === "Closed" || message._tag === "PressedToggleButton"
    ? { ...message, restingInputValue: model.inputValue }
    : message

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
      const result = Combobox.update(model, restingOnTyped(model, inner))
      const typed = result.model.inputValue

      return {
        model: result.model,
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotCombobox({ message: lifted }))
        ),
        ...(typed === model.inputValue ? {} : { outMessage: OutMessage.Changed({ value: typed }) })
      }
    },
    Cleared: () => ({
      model: { ...model, inputValue: "" },
      commands: [],
      outMessage: OutMessage.Changed({ value: "" })
    })
  })

export type AutocompleteOptions = Omit<ComboboxOptions, "withCheckIcon" | "checkIconPosition" | "searchable"> & {
  readonly clearable?: boolean
}

export type AutocompleteProps<M> = Omit<
  ComboboxProps<M>,
  "model" | "toParentMessage" | "clearMessage" | "freeText" | "value" | "withChevron"
> &
  AutocompleteOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: string
  }

export type AutocompleteConfig = ComponentConfig<AutocompleteOptions, ComboboxPart>

export const Autocomplete = (config: {
  readonly Autocomplete?: AutocompleteConfig
  readonly InputWrapper?: InputWrapperConfig
}) => {
  const combobox = Combobox.comboboxWith(config.Autocomplete, config)

  return <M>(h: HtmlBuilder<M>, input: AutocompleteProps<M>): Html => {
    const props = withDefaults(config.Autocomplete, input)
    const { clearable, toParentMessage, ...rest } = props
    const clear = clearable === true && props.value !== "" && props.disabled !== true && props.readOnly !== true

    return combobox(h, {
      ...rest,
      freeText: true,
      withChevron: false,
      withCheckIcon: false,
      toParentMessage: (message) => toParentMessage(Message.GotCombobox({ message })),
      ...(clear ? { clearMessage: toParentMessage(Message.Cleared()) } : {})
    })
  }
}
