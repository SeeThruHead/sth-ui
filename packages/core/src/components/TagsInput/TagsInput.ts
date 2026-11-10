import * as FoldkitCombobox from "@foldkit/ui/combobox"
import { Effect, Option, Schema, Struct } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { pillsCombobox } from "../MultiSelect/MultiSelect.ts"
import type { MultiSelectConfig, MultiSelectProps } from "../MultiSelect/MultiSelect.ts"
import * as MultiSelect from "../MultiSelect/MultiSelect.ts"
import type { InputConfig } from "../Input/Input.ts"
import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import type { PillConfig, PillGroupConfig } from "../Pill/Pill.ts"

const bundle = FoldkitCombobox.Multi.create()

export const Model = MultiSelect.Model

export type Model = MultiSelect.Model

export const init = MultiSelect.init

export const Message = defineMessageUnion({
  GotCombobox: { message: FoldkitCombobox.Message },
  ClickedBox: {},
  RemovedPill: { value: Schema.String },
  PressedBackspace: {},
  PressedEnter: {},
  PressedSplit: {},
  Cleared: {},
  CompletedClearField: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { values: Schema.Array(Schema.String) } })

export type OutMessage = typeof OutMessage.Type

export type TagsContext = {
  readonly values: ReadonlyArray<string>
  readonly maxTags?: number
  readonly allowDuplicates?: boolean
  readonly splitChars?: ReadonlyArray<string>
  readonly acceptValueOnBlur?: boolean
}

type Update = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage
}

const defaultSplitChars = [","]

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")

const splitTags = (text: string, splitChars: ReadonlyArray<string>) =>
  text
    .split(new RegExp(`[${splitChars.map(escape).join("")}]`))
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")

const isDuplicate = (tags: ReadonlyArray<string>, tag: string) =>
  tags.some((kept) => kept.toLowerCase() === tag.toLowerCase())

const added = (context: TagsContext, incoming: ReadonlyArray<string>) =>
  incoming
    .reduce<ReadonlyArray<string>>(
      (tags, tag) => (context.allowDuplicates !== true && isDuplicate(tags, tag) ? tags : [...tags, tag]),
      context.values
    )
    .slice(0, context.maxTags ?? Infinity)

const emptied = (model: Model): Model => ({
  ...model,
  combobox: { ...model.combobox, inputValue: "", maybeActiveItemIndex: Option.none() }
})

const isInput = (element: HTMLElement): element is HTMLInputElement => element instanceof HTMLInputElement

const fieldOf = (id: string) => Option.filter(Option.fromNullishOr(document.getElementById(id)), isInput)

export const ClearField = Command.define("ClearField", {
  args: { id: Schema.String },
  messages: [Message.CompletedClearField],
  execute: ({ id }) =>
    Effect.sync(() => Option.map(fieldOf(id), (field) => field.setRangeText("", 0, field.value.length))).pipe(
      Effect.as(Message.CompletedClearField())
    )
})

const clearing = (model: Model) => [ClearField({ id: FoldkitCombobox.inputId(model.combobox.id) })]

const withTags = (model: Model, context: TagsContext, incoming: ReadonlyArray<string>): Update => ({
  model: emptied(model),
  commands: clearing(model),
  outMessage: OutMessage.Changed({ values: added(context, incoming) })
})

const lifted = (commands: ReadonlyArray<Command.Command<FoldkitCombobox.Message>> | undefined) =>
  (commands ?? []).map((command) => Command.mapMessage(command, (message) => Message.GotCombobox({ message })))

const typed = (model: Model) => model.combobox.inputValue.trim()

const fromCombobox = (model: Model, inner: FoldkitCombobox.Message, context: TagsContext): Update => {
  const splitChars = context.splitChars ?? defaultSplitChars
  const result = bundle.update(model.combobox, inner)
  const next = { ...model, combobox: result.model }
  const commands = lifted(result.commands)

  if (result.outMessage?._tag === "Selected")
    return { ...withTags(next, context, [result.outMessage.value]), commands: [...commands, ...clearing(model)] }
  if (inner._tag === "UpdatedInputValue" && splitChars.some((char) => inner.value.includes(char)))
    return {
      ...withTags(next, context, splitTags(inner.value, splitChars)),
      commands: [...commands, ...clearing(model)]
    }
  if (inner._tag === "Closed")
    return { model: { ...next, combobox: { ...next.combobox, inputValue: model.combobox.inputValue } }, commands }
  if (inner._tag === "UpdatedInputValue")
    return { model: { ...next, combobox: { ...next.combobox, maybeActiveItemIndex: Option.none() } }, commands }
  if (inner._tag === "BlurredInput" && context.acceptValueOnBlur !== false && typed(model) !== "")
    return { ...withTags(next, context, [typed(model)]), commands: [...commands, ...clearing(model)] }

  return { model: next, commands }
}

const pickingOption = (model: Model) => {
  if (typed(model) === "") return true
  if (!model.combobox.isOpen) return false

  return Option.isSome(model.combobox.maybeActiveItemIndex)
}

export const update = (model: Model, message: Message, context: TagsContext): Update =>
  Message.match(message, {
    GotCombobox: ({ message: inner }) => fromCombobox(model, inner, context),
    ClickedBox: () =>
      model.ignoreClick
        ? { model: { ...model, ignoreClick: false }, commands: [] }
        : fromCombobox(model, toggleMessage, context),
    RemovedPill: ({ value }) => ({
      model: { ...model, ignoreClick: true },
      commands: [],
      outMessage: OutMessage.Changed({ values: context.values.filter((kept) => kept !== value) })
    }),
    PressedBackspace: () => ({
      model,
      commands: [],
      outMessage: OutMessage.Changed({ values: context.values.slice(0, -1) })
    }),
    PressedEnter: () => (pickingOption(model) ? { model, commands: [] } : withTags(model, context, [typed(model)])),
    PressedSplit: () =>
      withTags(model, context, splitTags(model.combobox.inputValue, context.splitChars ?? defaultSplitChars)),
    Cleared: () => ({
      model: emptied(model),
      commands: clearing(model),
      outMessage: OutMessage.Changed({ values: [] })
    }),
    CompletedClearField: () => ({ model, commands: [] })
  })

const toggleMessage = FoldkitCombobox.Message.PressedToggleButton({ restingInputValue: "", isClearable: false })

export type TagsInputProps<M> = Omit<
  MultiSelectProps<M>,
  "toParentMessage" | "data" | "searchable" | "hidePickedOptions" | "withCheckIcon" | "checkIconPosition"
> & {
  readonly toParentMessage: (message: Message) => M
  readonly data?: MultiSelectProps<M>["data"]
  readonly splitChars?: ReadonlyArray<string>
}

export type TagsInputConfig = MultiSelectConfig

export const TagsInput = (config: {
  readonly TagsInput?: TagsInputConfig
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly Pill?: PillConfig
  readonly PillGroup?: PillGroupConfig
  readonly CloseButton?: CloseButtonConfig
}) => {
  const view = pillsCombobox(config.TagsInput, config)

  return <M>(h: HtmlBuilder<M>, props: TagsInputProps<M>): Html => {
    const lift = props.toParentMessage
    const query = props.model.combobox.inputValue
    const splitChars = props.splitChars ?? defaultSplitChars
    const keyDown = (key: string): Option.Option<M> => {
      if (key === "Enter") return Option.some(lift(Message.PressedEnter()))
      if (splitChars.includes(key)) return Option.some(lift(Message.PressedSplit()))
      if (key === "Backspace" && query === "" && props.value.length > 0)
        return Option.some(lift(Message.PressedBackspace()))

      return Option.none()
    }

    return view(
      h,
      {
        ...Struct.omit(props, ["toParentMessage", "splitChars"]),
        data: props.data ?? [],
        searchable: true,
        hidePickedOptions: true,
        withCheckIcon: false,
        withChevron: false
      },
      {
        gotCombobox: (message) => lift(Message.GotCombobox({ message })),
        clickedBox: lift(Message.ClickedBox()),
        removedPill: (value) => lift(Message.RemovedPill({ value })),
        cleared: lift(Message.Cleared()),
        keyDown
      }
    )
  }
}
