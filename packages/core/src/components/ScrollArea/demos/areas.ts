import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ScrollArea from "../ScrollArea.ts"
import type { ScrollAreaContext } from "../ScrollArea.ts"

const Entry = Schema.Struct({
  area: ScrollArea.Model,
  x: Schema.Finite,
  y: Schema.Finite,
  top: Schema.Int,
  bottom: Schema.Int,
  left: Schema.Int,
  right: Schema.Int,
  overflowing: Schema.NullOr(Schema.Boolean)
})

type Entry = typeof Entry.Type

export const Model = Schema.Struct({
  areas: Schema.Record(Schema.String, Entry),
  active: Schema.String,
  count: Schema.Int
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Got: { name: Schema.String, message: ScrollArea.Message },
  GotActive: { message: ScrollArea.Message },
  ScrolledTo: { name: Schema.String, place: Schema.Literals(["top", "center", "bottom", "end-x"]) },
  Counted: { delta: Schema.Int }
})
export type Message = typeof Message.Type

type Result = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const counted = (entry: Entry, outMessage: ScrollArea.OutMessage): Entry =>
  ScrollArea.OutMessage.match(outMessage, {
    ScrollPositionChanged: ({ x, y }) => ({ ...entry, x, y }),
    TopReached: () => ({ ...entry, top: entry.top + 1 }),
    BottomReached: () => ({ ...entry, bottom: entry.bottom + 1 }),
    LeftReached: () => ({ ...entry, left: entry.left + 1 }),
    RightReached: () => ({ ...entry, right: entry.right + 1 }),
    OverflowChanged: ({ overflowing }) => ({ ...entry, overflowing })
  })

const scrollHeight = (entry: Entry) =>
  Option.match(entry.area.metrics, { onNone: () => 0, onSome: (metrics) => metrics.scrollHeight })

export const areaDemo = (prefix: string, specs: Readonly<Record<string, ScrollAreaContext>>, count = 0) => {
  const init = (): Model => ({
    active: "",
    count,
    areas: Object.fromEntries(
      Object.keys(specs).map((name) => [
        name,
        {
          area: ScrollArea.init({ id: `${prefix}-${name}` }),
          x: 0,
          y: 0,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          overflowing: null
        }
      ])
    )
  })

  const lift = (name: string) => (command: Command.Command<ScrollArea.Message>) =>
    Command.mapMessage(command, (lifted) => Message.Got({ name, message: lifted }))

  const route = (model: Model, name: string, message: ScrollArea.Message): Result =>
    Option.match(Option.fromNullishOr(model.areas[name]), {
      onNone: () => ({ model, commands: [] }),
      onSome: (entry) => {
        const result = ScrollArea.update(entry.area, message, specs[name] ?? {})

        return {
          model: {
            ...model,
            active: message._tag === "PressedScrollbar" ? name : model.active,
            areas: { ...model.areas, [name]: result.outMessages.reduce(counted, { ...entry, area: result.model }) }
          },
          commands: result.commands.map(lift(name))
        }
      }
    })

  const update = (model: Model, message: Message): Result =>
    Message.match(message, {
      Got: ({ name, message: inner }) => route(model, name, inner),
      GotActive: ({ message: inner }) => route(model, model.active, inner),
      ScrolledTo: ({ name, place }) =>
        Option.match(Option.fromNullishOr(model.areas[name]), {
          onNone: () => ({ model, commands: [] }),
          onSome: (entry) => {
            const top = { top: 0, center: scrollHeight(entry) / 2, bottom: scrollHeight(entry), "end-x": 0 }[place]
            const scroll =
              place === "end-x"
                ? ScrollArea.scrollTo(entry.area, { left: 100000 })
                : ScrollArea.scrollTo(entry.area, { top, behavior: "instant" })

            return { model, commands: [lift(name)(scroll)] }
          }
        }),
      Counted: ({ delta }) => ({
        model: { ...model, count: Math.min(Math.max(model.count + delta, 0), 10) },
        commands: []
      })
    })

  const subscriptions = Subscription.lift(ScrollArea.subscriptions)<Model, Message>({
    read: (model) => Option.map(Option.fromNullishOr(model.areas[model.active]), (entry) => entry.area),
    toParentMessage: (message) => Message.GotActive({ message })
  })

  const area = (model: Model, name: string) => ({
    ...specs[name],
    model: model.areas[name]?.area ?? ScrollArea.init({ id: `${prefix}-${name}` }),
    toParentMessage: (message: ScrollArea.Message) => Message.Got({ name, message })
  })

  const entry = (model: Model, name: string) => model.areas[name]

  return { init, update, subscriptions, area, entry }
}
