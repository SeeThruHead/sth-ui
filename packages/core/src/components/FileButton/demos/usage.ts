import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { filesDemo, Message } from "./files.ts"
import type { Model } from "./files.ts"

export { Message, Model } from "./files.ts"

export const { init, update } = filesDemo("usage-upload")

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
            children: (open) => ui.Button(h, { onClick: open, children: ["Upload image"] })
          })
        ]
      }),
      ...model.files
        .slice(0, 1)
        .map((file) => ui.Text(h, { size: "sm", ta: "center", mt: "sm", children: [`Picked file: ${file}`] }))
    ]
  })
