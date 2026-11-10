import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { ElementMessage, rovingIndex } from "../../mounts.ts"

const labels = ["Bold", "Italic", "Underline", "Strike", "Code"]

export const Model = Schema.Struct({ focused: Schema.Int, cell: Schema.Int, clicked: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Got: { message: ElementMessage },
  GotCell: { message: ElementMessage },
  Clicked: { index: Schema.Int }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ focused: 0, cell: 0, clicked: -1 })

const focusedOf = (got: ElementMessage, fallback: number) => (got._tag === "RovingFocused" ? got.index : fallback)

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Got: (got) => ({ model: { ...model, focused: focusedOf(got.message, model.focused) } }),
    GotCell: (got) => ({ model: { ...model, cell: focusedOf(got.message, model.cell) } }),
    Clicked: ({ index }) => ({ model: { ...model, clicked: index } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.Role("toolbar"),
          h.AriaLabel("Formatting"),
          h.Style({ display: "flex", gap: "4px" }),
          h.OnMount(Mount.mapMessage(rovingIndex({}), (got) => Message.Got({ message: got })))
        ],
        labels.map((label, index) =>
          h.button(
            [
              h.Type("button"),
              h.DataAttribute("roving-index", String(index)),
              h.Tabindex(index === model.focused ? 0 : -1),
              ...(label === "Strike" ? [h.AriaDisabled(true)] : [])
            ],
            [label]
          )
        )
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Focused: ${labels[model.focused] ?? ""}`] }),
      h.div(
        [
          h.Role("grid"),
          h.AriaLabel("Days"),
          h.Style({ display: "grid", gridTemplateColumns: "repeat(3, 48px)", gap: "4px" }),
          h.OnMount(
            Mount.mapMessage(rovingIndex({ columns: 3, activateOnFocus: true }), (got) =>
              Message.GotCell({ message: got })
            )
          )
        ],
        Array.from({ length: 7 }, (_cell, index) =>
          h.button(
            [
              h.Type("button"),
              h.DataAttribute("roving-index", String(index)),
              h.Tabindex(index === model.cell ? 0 : -1),
              h.OnClick(Message.Clicked({ index }))
            ],
            [String(index + 1)]
          )
        )
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Day ${model.clicked + 1} chosen`] })
    ]
  })
