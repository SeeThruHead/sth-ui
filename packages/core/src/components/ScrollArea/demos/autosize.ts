import type { Html, HtmlBuilder } from "foldkit/html"
import { Message as DemoMessage } from "./areas.ts"
import { lorem } from "./content.ts"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("autosize", { area: {} }, 3)

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    children: [
      ui.ScrollAreaAutosize(h, {
        ...demo.area(model, "area"),
        mah: 300,
        maw: 400,
        mx: "auto",
        children: Array.from({ length: model.count }, () => h.p([], [lorem]))
      }),
      ui.Group(h, {
        justify: "center",
        mt: "md",
        children: [
          ui.Button(h, { color: "red", onClick: DemoMessage.Counted({ delta: -1 }), children: ["Remove paragraph"] }),
          ui.Button(h, { onClick: DemoMessage.Counted({ delta: 1 }), children: ["Add paragraph"] })
        ]
      }),
      ui.Text(h, {
        ta: "center",
        size: "sm",
        mt: "xs",
        children: [`Overflowing: ${String(demo.entry(model, "area")?.overflowing ?? false)}`]
      })
    ]
  })
