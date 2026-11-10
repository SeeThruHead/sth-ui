import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as ScrollArea from "../../ScrollArea/ScrollArea.ts"
import { accent } from "../../../theme/tokens.stylex.ts"
import type { Ui } from "../../../Ui.ts"
import { elements, headings } from "./elements.ts"

export const Model = Schema.Struct({ selected: Schema.Array(Schema.Finite), scroll: ScrollArea.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Toggled: { position: Schema.Finite, checked: Schema.Boolean },
  GotScroll: { message: ScrollArea.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ selected: [], scroll: ScrollArea.init({ id: "table-scroll" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Toggled: ({ position, checked }) => ({
      model: {
        ...model,
        selected: checked ? [...model.selected, position] : model.selected.filter((item) => item !== position)
      },
      commands: []
    }),
    GotScroll: ({ message: inner }) => {
      const result = ScrollArea.update(model.scroll, inner, {})

      return {
        model: { ...model, scroll: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotScroll({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.TableScrollContainer(h, {
    minWidth: 500,
    scrollArea: { model: model.scroll, toParentMessage: (message) => Message.GotScroll({ message }) },
    children: [
      ui.Table(h, {
        children: (t) => [
          t.thead([t.tr([t.th([]), ...headings.map((heading) => t.th([heading]))])]),
          t.tbody(
            elements.map((element) => {
              const checked = model.selected.includes(element.position)

              return t.tr(
                [
                  t.td([
                    ui.Checkbox(h, {
                      id: `row-${element.position}`,
                      checked,
                      attributes: { input: { "aria-label": `Select ${element.name}` } },
                      onChange: (next) => Message.Toggled({ position: element.position, checked: next })
                    })
                  ]),
                  t.td([String(element.position)]),
                  t.td([element.name]),
                  t.td([element.symbol]),
                  t.td([String(element.mass)])
                ],
                checked ? { bg: accent.light } : {}
              )
            })
          )
        ]
      })
    ]
  })
