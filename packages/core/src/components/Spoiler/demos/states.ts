import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Spoiler from "../Spoiler.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Spoiler.Model, second: Spoiler.Model, third: Spoiler.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Spoiler.Message },
  GotSecond: { message: Spoiler.Message },
  GotThird: { message: Spoiler.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Spoiler.init({ id: "no-hide" }),
  second: Spoiler.init({ id: "open", expanded: true }),
  third: Spoiler.init({ id: "short" })
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Spoiler.update(model.first, inner)

      return { model: { ...model, first: result.model }, commands: [] }
    },
    GotSecond: ({ message: inner }) => {
      const result = Spoiler.update(model.second, inner)

      return { model: { ...model, second: result.model }, commands: [] }
    },
    GotThird: ({ message: inner }) => {
      const result = Spoiler.update(model.third, inner)

      return { model: { ...model, third: result.model }, commands: [] }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  toParentMessage: (message: Spoiler.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  toParentMessage: (message: Spoiler.Message) => Message.GotSecond({ message })
})

const third = (model: Model) => ({
  model: model.third,
  toParentMessage: (message: Spoiler.Message) => Message.GotThird({ message })
})

const text =
  "Deserts cover about one third of the land surface of the Earth. They are defined by low rainfall rather than by heat: some of the largest deserts, such as Antarctica and the Gobi, are cold for most of the year. Sand dunes are the most familiar desert landscape, yet they cover only a small part of desert areas. Most deserts are rocky plains, gravel fields and dry mountain ranges. Plants and animals that live there have adapted to save water: cacti store it in their thick stems, and many animals are active only at night when the air is cooler."

const content = (h: HtmlBuilder<Message>, ui: Ui) =>
  h.div(
    [],
    [
      h.img([
        h.Src("https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-1.png"),
        h.Alt("Desert dunes at sunset"),
        h.Style({ float: "right", height: "150px", marginLeft: "20px", marginTop: "5px", maxWidth: "100%" })
      ]),
      ui.Text(h, { children: [text] })
    ]
  )

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 520,
    children: [
      ui.Spoiler(h, {
        ...first(model),
        maxHeight: 60,
        showLabel: "Read all",
        hideLabel: null,
        showAriaLabel: "Read the whole story",
        children: [content(h, ui)]
      }),
      ui.Spoiler(h, {
        ...second(model),
        maxHeight: 60,
        showLabel: "Show more",
        hideLabel: "Hide",
        hideAriaLabel: "Hide the story",
        children: [content(h, ui)]
      }),
      ui.Spoiler(h, {
        ...third(model),
        showLabel: "Show more",
        hideLabel: "Hide",
        children: [ui.Text(h, { children: ["A short note."] })]
      })
    ]
  })
