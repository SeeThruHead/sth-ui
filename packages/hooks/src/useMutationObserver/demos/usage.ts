import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { mutationObserver } from "../../mounts.ts"

export const Model = Schema.Struct({ items: Schema.Int, mutations: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Added: {}, Mutated: { types: Schema.Array(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ items: 1, mutations: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Added: () => ({ model: { ...model, items: model.items + 1 } }),
    Mutated: ({ types }) => ({ model: { ...model, mutations: [...model.mutations, ...types] } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Button(h, { onClick: Message.Added(), children: ["Add item"] }),
      h.div(
        [
          h.OnMount(
            Mount.mapMessage(mutationObserver({ childList: true, subtree: true }), ({ types }) =>
              Message.Mutated({ types })
            )
          )
        ],
        [
          h.ul(
            [],
            Array.from({ length: model.items }, (_item, index) => h.li([], [`Item ${index + 1}`]))
          )
        ]
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Mutations seen: ${model.mutations.length}`] })
    ]
  })
