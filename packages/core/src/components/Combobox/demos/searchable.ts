import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Combobox from "../Combobox.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Combobox.Model, firstValue: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Combobox.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Combobox.init({ id: "grocery-search" }),
  firstValue: null
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Combobox.update(model.first, inner)
      const chosen = result.outMessage?._tag === "Selected" ? result.outMessage.value : model.firstValue

      return {
        model: { ...model, first: result.model, firstValue: chosen },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Combobox.Message) => Message.GotFirst({ message })
})

const groceries = [
  "🍎 Apples",
  "🍌 Bananas",
  "🥦 Broccoli",
  "🥕 Carrots",
  "🍫 Chocolate",
  "🍇 Grapes",
  "🍋 Lemon",
  "🥬 Lettuce",
  "🍄 Mushrooms",
  "🍊 Oranges",
  "🥔 Potatoes",
  "🍅 Tomatoes",
  "🥚 Eggs",
  "🥛 Milk",
  "🍞 Bread",
  "🍗 Chicken",
  "🍔 Hamburger",
  "🧀 Cheese",
  "🥩 Steak",
  "🍟 French Fries",
  "🍕 Pizza",
  "🥦 Cauliflower",
  "🥜 Peanuts",
  "🍦 Ice Cream",
  "🍯 Honey",
  "🥖 Baguette",
  "🍣 Sushi",
  "🥝 Kiwi",
  "🍓 Strawberries"
]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Combobox(h, {
    ...first(model),
    w: "100%",
    maw: 340,
    label: "Grocery",
    placeholder: "Search value",
    nothingFoundMessage: "Nothing found",
    data: groceries
  })
