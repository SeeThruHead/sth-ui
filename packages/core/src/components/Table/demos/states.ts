import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as ScrollArea from "../../ScrollArea/ScrollArea.ts"
import type { Ui } from "../../../Ui.ts"
import { elementsLong } from "./elements.ts"

export const Model = Schema.Struct({ scroll: ScrollArea.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotScroll: { message: ScrollArea.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ scroll: ScrollArea.init({ id: "states-scroll" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = ScrollArea.update(model.scroll, message.message, {})

  return {
    model: { scroll: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.GotScroll({ message: lifted }))
    )
  }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.TableScrollContainer(h, {
        minWidth: "25rem",
        maxHeight: 160,
        scrollArea: { model: model.scroll, toParentMessage: (message) => Message.GotScroll({ message }) },
        children: [
          ui.Table(h, {
            striped: "odd",
            attributes: { table: { "aria-label": "Spans" } },
            children: (t) => [
              t.tbody(
                elementsLong.map((element, index) =>
                  t.tr(
                    [
                      ...(index % 2 === 0
                        ? [t.th([element.symbol], { rowSpan: 2, attributes: [h.Attribute("scope", "row")] })]
                        : []),
                      t.td([element.name])
                    ],
                    { attributes: [h.DataAttribute("position", String(element.position))] }
                  )
                )
              )
            ]
          })
        ]
      }),
      ui.Table(h, {
        striped: false,
        stripedColor: "red.1",
        attributes: { table: { "aria-label": "Body only" } },
        data: { body: [["Only", "a body"]] }
      }),
      ui.Table(h, { attributes: { table: { "aria-label": "Empty" } } })
    ]
  })
