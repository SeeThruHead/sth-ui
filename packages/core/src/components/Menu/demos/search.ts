import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Menu from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

const fruits = ["Apple", "Banana", "Cherry", "Grape", "Lemon", "Mango", "Orange", "Peach"]

export const Model = Schema.Struct({ menu: Menu.Model, query: Schema.String, chosen: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotMenu: { message: Menu.Message }, Searched: { value: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ menu: Menu.init({ id: "search-menu" }), query: "", chosen: "Nothing chosen yet" })

const shown = (query: string) => fruits.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()))

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotMenu: ({ message: inner }) => {
      const result = Menu.update(model.menu, inner, { search: true })
      const closed = model.menu.isOpen && !result.model.isOpen

      return {
        model: {
          menu: result.model,
          query: closed ? "" : model.query,
          chosen: result.outMessage === undefined ? model.chosen : `Chose ${result.outMessage.value}`
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotMenu({ message: lifted }))
        )
      }
    },
    Searched: ({ value }) => ({ model: { ...model, query: value }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Menu(h, {
        model: model.menu,
        toParentMessage: (message) => Message.GotMenu({ message }),
        width: 220,
        search: {
          value: model.query,
          placeholder: "Search fruit",
          onChange: (value) => Message.Searched({ value })
        },
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["Pick a fruit"] }),
        items: shown(model.query).map((fruit) => ({ value: fruit.toLowerCase(), label: fruit }))
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [model.chosen] })
    ]
  })
