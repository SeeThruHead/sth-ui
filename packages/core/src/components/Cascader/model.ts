import * as Popover from "@foldkit/ui/popover"
import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export type CascaderOption = {
  readonly value: string
  readonly label?: string
  readonly children?: ReadonlyArray<CascaderOption>
  readonly disabled?: boolean
}

export type CascaderFlatPath = {
  readonly path: ReadonlyArray<string>
  readonly options: ReadonlyArray<CascaderOption>
  readonly leaf: boolean
  readonly disabled: boolean
}

export const hasChildren = (option: CascaderOption): boolean => (option.children ?? []).length > 0

const findOption = (options: ReadonlyArray<CascaderOption>, value: string): Option.Option<CascaderOption> =>
  Arr.findFirst(options, (option) => option.value === value)

const childrenOf = (option: CascaderOption): Option.Option<ReadonlyArray<CascaderOption>> =>
  Option.filter(Option.fromNullishOr(option.children), (children) => children.length > 0)

type Columns = {
  readonly columns: ReadonlyArray<ReadonlyArray<CascaderOption>>
  readonly level: ReadonlyArray<CascaderOption>
  readonly open: boolean
}

export const columnsOf = (
  data: ReadonlyArray<CascaderOption>,
  active: ReadonlyArray<string>
): ReadonlyArray<ReadonlyArray<CascaderOption>> =>
  active.slice(0, -1).reduce<Columns>(
    (state, value) =>
      Option.match(
        Option.flatMap(
          Option.filter(findOption(state.level, value), () => state.open),
          childrenOf
        ),
        {
          onNone: () => ({ ...state, open: false }),
          onSome: (children) => ({ columns: [...state.columns, children], level: children, open: true })
        }
      ),
    { columns: [data], level: data, open: true }
  ).columns

const walk = (
  nodes: ReadonlyArray<CascaderOption>,
  parent: CascaderFlatPath | undefined
): ReadonlyArray<CascaderFlatPath> =>
  nodes.flatMap((node) => {
    const entry = {
      path: [...(parent?.path ?? []), node.value],
      options: [...(parent?.options ?? []), node],
      leaf: !hasChildren(node),
      disabled: parent?.disabled === true || node.disabled === true
    }

    return [entry, ...walk(node.children ?? [], entry)]
  })

export const flattenPaths = (data: ReadonlyArray<CascaderOption>): ReadonlyArray<CascaderFlatPath> =>
  walk(data, undefined)

export const pathOptions = (
  data: ReadonlyArray<CascaderOption>,
  value: ReadonlyArray<string> | null
): ReadonlyArray<CascaderOption> =>
  (value ?? []).reduce<{
    readonly level: ReadonlyArray<CascaderOption>
    readonly options: ReadonlyArray<CascaderOption>
    readonly found: boolean
  }>(
    (state, current) =>
      Option.match(
        Option.filter(findOption(state.level, current), () => state.found),
        {
          onNone: () => ({ ...state, found: false }),
          onSome: (node) => ({ level: node.children ?? [], options: [...state.options, node], found: true })
        }
      ),
    { level: data, options: [], found: true }
  ).options

export const labelOf = (option: CascaderOption): string => option.label ?? option.value

export const defaultFilter = (query: string, options: ReadonlyArray<CascaderOption>): boolean =>
  options.some((option) => labelOf(option).toLowerCase().includes(query.trim().toLowerCase()))

export const Model = Schema.Struct({
  popover: Popover.Model,
  active: Schema.Array(Schema.String),
  search: Schema.String
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string; readonly value?: ReadonlyArray<string> }): Model => ({
  popover: Popover.init({ id: config.id, isAnimated: true }),
  active: config.value ?? [],
  search: ""
})

export const Message = defineMessageUnion({
  GotPopover: { message: Popover.Message },
  ClickedOption: { level: Schema.Int, value: Schema.String },
  HoveredOption: { level: Schema.Int, value: Schema.String },
  PressedKey: { key: Schema.String },
  Searched: { value: Schema.String },
  ChosePath: { path: Schema.Array(Schema.String) },
  Cleared: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.NullOr(Schema.Array(Schema.String)) },
  Opened: {},
  Closed: {},
  SearchChanged: { value: Schema.String }
})

export type OutMessage = typeof OutMessage.Type

export type CascaderContext = {
  readonly data: ReadonlyArray<CascaderOption>
  readonly value: ReadonlyArray<string> | null
  readonly changeOnSelect?: boolean
  readonly closeOnSelect?: boolean
  readonly allowDeselect?: boolean
  readonly expandTrigger?: "click" | "hover"
  readonly dir?: "ltr" | "rtl"
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const gotPopover = (message: Popover.Message): Message => Message.GotPopover({ message })

const still = (model: Model, outMessages: ReadonlyArray<OutMessage> = []): Result => ({
  model,
  commands: [],
  outMessages
})

const lifted = (model: Model, result: ReturnType<typeof Popover.update>, context: CascaderContext): Result => {
  const commands = (result.commands ?? []).map((command) => Command.mapMessage(command, gotPopover))
  const next = { ...model, popover: result.model }
  if (result.outMessage?._tag === "Opened")
    return { model: { ...next, active: context.value ?? [] }, commands, outMessages: [OutMessage.Opened()] }
  if (result.outMessage?._tag === "Closed")
    return { model: { ...next, search: "" }, commands, outMessages: [OutMessage.Closed()] }

  return { model: next, commands, outMessages: [] }
}

const samePath = (a: ReadonlyArray<string> | null, b: ReadonlyArray<string>): boolean => {
  if (a === null) return false
  if (a.length !== b.length) return false

  return a.every((item, index) => item === b[index])
}

const selected = (context: CascaderContext, path: ReadonlyArray<string>): OutMessage =>
  OutMessage.Changed({ value: context.allowDeselect !== false && samePath(context.value, path) ? null : path })

const expanded = (active: ReadonlyArray<string>, level: number, option: CascaderOption): ReadonlyArray<string> => {
  const path = [...active.slice(0, level), option.value]

  return Option.match(
    Option.flatMap(childrenOf(option), (children) => Arr.findFirst(children, (child) => child.disabled !== true)),
    { onNone: () => path, onSome: (child) => [...path, child.value] }
  )
}

const leafChosen = (model: Model, context: CascaderContext, outMessages: ReadonlyArray<OutMessage>): Result => {
  if (context.closeOnSelect === false) return still(model, outMessages)
  const closed = lifted(model, Popover.close(model.popover), context)

  return { ...closed, outMessages: [...outMessages, ...closed.outMessages] }
}

const chosen = (model: Model, context: CascaderContext, level: number, option: CascaderOption): Result => {
  const path = [...model.active.slice(0, level), option.value]
  if (!hasChildren(option)) return leafChosen({ ...model, active: path }, context, [selected(context, path)])
  const opened = { ...model, active: expanded(model.active, level, option) }
  if (context.changeOnSelect !== true) return still(opened)

  return leafChosen(opened, context, [selected(context, path)])
}

const optionAt = (
  model: Model,
  context: CascaderContext,
  level: number,
  value: string
): Option.Option<CascaderOption> =>
  Option.flatMap(Arr.get(columnsOf(context.data, [...model.active.slice(0, level), value]), level), (column) =>
    findOption(column, value)
  )

const enabledFrom = (column: ReadonlyArray<CascaderOption>, from: number, step: 1 | -1): Option.Option<number> => {
  const order =
    step === 1
      ? column.map((_, index) => index).filter((index) => index > from)
      : column
          .map((_, index) => index)
          .filter((index) => index < from)
          .toReversed()

  return Arr.findFirst(order, (index) => column[index]?.disabled !== true)
}

const keyed = (model: Model, context: CascaderContext, key: string): Result => {
  const columns = columnsOf(context.data, model.active)
  const level = Math.max(0, model.active.length - 1)
  const column = columns[level] ?? []
  const index = column.findIndex((option) => option.value === model.active[level])
  const focused = Arr.get(column, index)
  const moveTo = (target: Option.Option<number>) =>
    Option.match(
      Option.flatMap(target, (position) => Arr.get(column, position)),
      {
        onNone: () => still(model),
        onSome: (option) => still({ ...model, active: [...model.active.slice(0, level), option.value] })
      }
    )
  const expandKey = context.dir === "rtl" ? "ArrowLeft" : "ArrowRight"
  const collapseKey = context.dir === "rtl" ? "ArrowRight" : "ArrowLeft"
  if (key === "ArrowDown") return moveTo(enabledFrom(column, index, 1))
  if (key === "ArrowUp") return moveTo(enabledFrom(column, index < 0 ? column.length : index, -1))
  if (key === expandKey)
    return Option.match(Option.filter(focused, hasChildren), {
      onNone: () => still(model),
      onSome: (option) => still({ ...model, active: expanded(model.active, level, option) })
    })
  if (key === collapseKey)
    return still(model.active.length > 1 ? { ...model, active: model.active.slice(0, -1) } : model)
  if (key !== "Enter") return still(model)

  return Option.match(focused, {
    onNone: () => still(model),
    onSome: (option) => chosen(model, context, level, option)
  })
}

export const isCascaderKey = (key: string): boolean =>
  ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"].includes(key)

export const update = (model: Model, message: Message, context: CascaderContext): Result =>
  Message.match(message, {
    GotPopover: ({ message: inner }) => lifted(model, Popover.update(model.popover, inner), context),
    ClickedOption: ({ level, value }) =>
      Option.match(optionAt(model, context, level, value), {
        onNone: () => still(model),
        onSome: (option) => chosen(model, context, level, option)
      }),
    HoveredOption: ({ level, value }) => {
      if (context.expandTrigger !== "hover") return still(model)

      return Option.match(optionAt(model, context, level, value), {
        onNone: () => still(model),
        onSome: (option) =>
          still({
            ...model,
            active: hasChildren(option)
              ? expanded(model.active, level, option)
              : [...model.active.slice(0, level), option.value]
          })
      })
    },
    PressedKey: ({ key }) => keyed(model, context, key),
    Searched: ({ value }) => still({ ...model, search: value }, [OutMessage.SearchChanged({ value })]),
    ChosePath: ({ path }) => leafChosen({ ...model, active: path }, context, [selected(context, path)]),
    Cleared: () => still({ ...model, active: [] }, [OutMessage.Changed({ value: null })])
  })
