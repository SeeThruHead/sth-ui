import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { isExpanded, Message, togglesDemo } from "./toggles.ts"
import type { Model } from "./toggles.ts"

export { Message, Model } from "./toggles.ts"

export const { init, update } = togglesDemo(2)

const lorem =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const section = (index: number, button: Html, title: string, inner: ReadonlyArray<Html>) =>
    ui.Box(h, {
      children: [
        button,
        ui.Collapse(h, {
          expanded: isExpanded(model, index),
          children: [
            ui.Text(h, { mt: "md", size: "lg", fw: 700, children: [title] }),
            ui.Text(h, { mt: "xs", children: [lorem] }),
            ...inner
          ]
        })
      ]
    })

  return ui.Box(h, {
    maw: 400,
    mx: "auto",
    children: [
      section(
        0,
        ui.Button(h, { onClick: Message.Toggled({ index: 0 }), children: ["Root collapse"] }),
        "This collapse contains another collapse",
        [
          section(
            1,
            ui.Button(h, {
              mt: "md",
              variant: "outline",
              onClick: Message.Toggled({ index: 1 }),
              children: ["Inner collapse"]
            }),
            "This collapse is inside another collapse",
            []
          )
        ]
      )
    ]
  })
}
