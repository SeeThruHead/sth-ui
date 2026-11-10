import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { areaDemo, Message as DemoMessage } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("states", {
  sideways: { type: "always" },
  left: { type: "always" },
  right: { type: "always" },
  none: {},
  present: { type: "auto" },
  contained: { type: "auto" }
})

export const { init, update, subscriptions } = demo

const wide = <M>(h: HtmlBuilder<M>, ui: Ui) => [ui.Box(h, { w: 600, children: content(h, ui) })]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 3,
    w: "100%",
    children: [
      ui.Stack(h, {
        gap: "xs",
        children: [
          ui.ScrollArea(h, {
            ...demo.area(model, "sideways"),
            h: 120,
            scrollbars: "x",
            scrollbarSize: "8px",
            offsetScrollbars: "x",
            overscrollBehavior: "contain",
            startScrollPosition: { x: 40 },
            children: wide(h, ui)
          }),
          ui.Button(h, {
            onClick: DemoMessage.ScrolledTo({ name: "sideways", place: "end-x" }),
            children: ["Scroll right"]
          })
        ]
      }),
      ui.ScrollArea(h, {
        ...demo.area(model, "left"),
        h: 120,
        verticalScrollbarPosition: "left",
        children: wide(h, ui)
      }),
      ui.ScrollArea(h, {
        ...demo.area(model, "right"),
        h: 120,
        verticalScrollbarPosition: "right",
        children: wide(h, ui)
      }),
      ui.ScrollArea(h, { ...demo.area(model, "none"), h: 120, scrollbars: false, children: wide(h, ui) }),
      ui.ScrollArea(h, {
        ...demo.area(model, "present"),
        h: 120,
        scrollbars: "y",
        offsetScrollbars: "present",
        overscrollBehavior: "none",
        children: [ui.Text(h, { children: ["Short"] })]
      }),
      ui.ScrollArea(h, {
        ...demo.area(model, "contained"),
        h: 120,
        overscrollBehavior: "contain",
        children: content(h, ui)
      })
    ]
  })
