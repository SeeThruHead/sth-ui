import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { filesDemo, Message } from "./files.ts"
import type { Model } from "./files.ts"

export { Message, Model } from "./files.ts"

export const { init, update } = filesDemo("multiple-upload")

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: 0,
    children: [
      ui.Group(h, {
        justify: "center",
        children: [
          ui.FileButton(h, {
            model: model.button,
            toParentMessage: (message) => Message.GotButton({ message }),
            accept: "image/png,image/jpeg",
            multiple: true,
            children: (open) => ui.Button(h, { onClick: open, children: ["Upload image"] })
          })
        ]
      }),
      ...(model.files.length > 0 ? [ui.Text(h, { size: "sm", mt: "sm", children: ["Picked files:"] })] : []),
      h.ul(
        [],
        model.files.map((file) => h.li([], [file]))
      )
    ]
  })
