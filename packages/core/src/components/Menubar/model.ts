import * as FoldkitMenu from "@foldkit/ui/menu"
import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

const bundle = FoldkitMenu.create()

export const Model = Schema.Struct({
  id: Schema.String,
  menus: Schema.Array(FoldkitMenu.Model),
  focused: Schema.Int
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string; readonly count: number }): Model => ({
  id: config.id,
  menus: Array.from({ length: config.count }, (_, index) =>
    FoldkitMenu.init({ id: `${config.id}-${index}`, isAnimated: true, isModal: false })
  ),
  focused: 0
})

export const Message = defineMessageUnion({
  GotMenu: { index: Schema.Int, message: FoldkitMenu.Message },
  PressedKey: { index: Schema.Int, key: Schema.String },
  Hovered: { index: Schema.Int },
  Focused: { index: Schema.Int },
  CompletedFocus: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Selected: { menu: Schema.Int, value: Schema.String } })

export type OutMessage = typeof OutMessage.Type

export type MenubarEntry = {
  readonly label: string
  readonly first: number
  readonly last: number
  readonly disabled: boolean
}

export type MenubarContext = {
  readonly entries: ReadonlyArray<MenubarEntry>
  readonly loop?: boolean
  readonly trigger?: "click" | "hover"
  readonly dir?: "ltr" | "rtl"
  readonly focusTarget: (selector: string) => Command.Command<Message>
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const targetId = (model: Model, index: number): string =>
  FoldkitMenu.buttonId(Option.getOrThrow(Arr.get(model.menus, index)).id)

export const gotMenu =
  (index: number) =>
  (message: FoldkitMenu.Message): Message =>
    Message.GotMenu({ index, message })

const still = (model: Model): Result => ({ model, commands: [], outMessages: [] })

type MenuResult = ReturnType<typeof bundle.update>

const routed = (model: Model, index: number, result: MenuResult): Result => ({
  model: { ...model, menus: model.menus.map((menu, position) => (position === index ? result.model : menu)) },
  commands: (result.commands ?? []).map((command) => Command.mapMessage(command, gotMenu(index))),
  outMessages:
    result.outMessage === undefined ? [] : [OutMessage.Selected({ menu: index, value: result.outMessage.value })]
})

const menuAt = (model: Model, index: number): FoldkitMenu.Model => Option.getOrThrow(Arr.get(model.menus, index))

const opened = (model: Model, index: number, active: Option.Option<number>): Result => {
  const result = routed(
    model,
    index,
    bundle.update(menuAt(model, index), FoldkitMenu.Message.Opened({ maybeActiveItemIndex: active }))
  )

  return { ...result, model: { ...result.model, focused: index } }
}

const focusedAt = (model: Model, context: MenubarContext, index: number): Result => ({
  model: { ...model, focused: index },
  commands: [context.focusTarget(`#${targetId(model, index)}`)],
  outMessages: []
})

const isEnabled =
  (context: MenubarContext) =>
  (index: number): boolean =>
    Option.exists(Arr.get(context.entries, index), (entry) => !entry.disabled)

const stepped = (context: MenubarContext, from: number, step: number): Option.Option<number> => {
  const count = context.entries.length
  const order = Array.from({ length: count - 1 }, (_, offset) => from + step * (offset + 1))
  const reachable = context.loop === false ? order.filter((index) => index >= 0 && index < count) : order

  return Arr.findFirst(
    reachable.map((index) => (index + count) % count),
    isEnabled(context)
  )
}

const edge = (context: MenubarContext, last: boolean): Option.Option<number> => {
  const indexes = context.entries.map((_, index) => index).filter(isEnabled(context))

  return last ? Arr.last(indexes) : Arr.head(indexes)
}

const anyOpen = (model: Model): boolean => model.menus.some((menu) => menu.isOpen)

const moved = (model: Model, context: MenubarContext, target: Option.Option<number>): Result =>
  Option.match(
    Option.flatMap(target, (index) => Option.map(Arr.get(context.entries, index), (entry) => ({ index, entry }))),
    {
      onNone: () => still(model),
      onSome: ({ index, entry }) =>
        anyOpen(model) ? opened(model, index, Option.some(entry.first)) : focusedAt(model, context, index)
    }
  )

const startsWith =
  (context: MenubarContext, key: string) =>
  (index: number): boolean => {
    if (!isEnabled(context)(index)) return false

    return Option.exists(Arr.get(context.entries, index), (entry) =>
      entry.label.toLowerCase().startsWith(key.toLowerCase())
    )
  }

const typedTo = (context: MenubarContext, from: number, key: string): Option.Option<number> => {
  const count = context.entries.length
  const order = Array.from({ length: count }, (_, offset) => (from + offset + 1) % count)

  return Arr.findFirst(order, startsWith(context, key))
}

const entryOf = (context: MenubarContext, index: number) => Arr.get(context.entries, index)

const pressed = (model: Model, context: MenubarContext, index: number, key: string): Result => {
  const forward = context.dir === "rtl" ? "ArrowLeft" : "ArrowRight"
  const backward = context.dir === "rtl" ? "ArrowRight" : "ArrowLeft"
  if (key === forward) return moved(model, context, stepped(context, index, 1))
  if (key === backward) return moved(model, context, stepped(context, index, -1))
  if (key === "Home") return moved(model, context, edge(context, false))
  if (key === "End") return moved(model, context, edge(context, true))
  if (key === "ArrowUp")
    return opened(
      model,
      index,
      Option.map(entryOf(context, index), (entry) => entry.last)
    )
  if (["ArrowDown", "Enter", " "].includes(key))
    return opened(
      model,
      index,
      Option.map(entryOf(context, index), (entry) => entry.first)
    )
  if (key.length === 1) return moved(model, context, typedTo(context, index, key))

  return still(model)
}

const hovered = (model: Model, context: MenubarContext, index: number): Result => {
  if (menuAt(model, index).isOpen) return still(model)
  if (context.trigger !== "hover" && !anyOpen(model)) return still(model)

  return opened(model, index, Option.none())
}

export const update = (model: Model, message: Message, context: MenubarContext): Result =>
  Message.match(message, {
    GotMenu: ({ index, message: inner }) => routed(model, index, bundle.update(menuAt(model, index), inner)),
    PressedKey: ({ index, key }) => pressed(model, context, index, key),
    Hovered: ({ index }) => hovered(model, context, index),
    Focused: ({ index }) => still({ ...model, focused: index }),
    CompletedFocus: () => still(model)
  })
