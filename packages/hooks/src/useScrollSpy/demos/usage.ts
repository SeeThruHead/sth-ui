import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { scrollSpy, ScrollSpyMessage } from "../scrollSpy.ts"

export const Model = Schema.Struct({ headings: Schema.Array(Schema.String), active: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { message: ScrollSpyMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ headings: [], active: -1 })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  ScrollSpyMessage.match(message.message, {
    Scanned: ({ headings, active }) => ({ model: { headings: headings.map((heading) => heading.value), active } }),
    Scrolled: ({ active }) => ({ model: { ...model, active } }),
    ScrolledTo: () => ({ model }),
    Reinitialized: () => ({ model }),
    CompletedScroll: () => ({ model })
  })

const sections = ["Introduction", "Installation", "Usage", "Options", "Examples"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    children: [
      h.div(
        [h.Style({ position: "sticky", top: "0", width: "180px" })],
        model.headings.map((heading, index) =>
          ui.Text(h, { fw: index === model.active ? 700 : 400, children: [heading] })
        )
      ),
      h.div(
        [
          h.OnMount(
            Mount.mapMessage(scrollSpy({ selector: "[data-spy-heading]" }), (got) => Message.Got({ message: got }))
          )
        ],
        sections.flatMap((section) => [
          h.h3([h.DataAttribute("spy-heading", "")], [section]),
          h.div([h.Style({ height: "60vh" })], [])
        ])
      )
    ]
  })
