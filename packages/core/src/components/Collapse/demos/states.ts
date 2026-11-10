import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { isExpanded, Message, togglesDemo } from "./toggles.ts"
import type { Model } from "./toggles.ts"

export { Message, Model } from "./toggles.ts"

export const { init, update } = togglesDemo(3)

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 400,
    mx: "auto",
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { onClick: Message.Toggled({ index: 0 }), children: ["Without fade"] }),
          ui.Button(h, { onClick: Message.Toggled({ index: 1 }), children: ["Unmounted when closed"] }),
          ui.Button(h, { onClick: Message.Toggled({ index: 2 }), children: ["Instant"] })
        ]
      }),
      ui.Collapse(h, {
        expanded: isExpanded(model, 0),
        animateOpacity: false,
        onTransitionStart: Message.Noted({ event: "started" }),
        onTransitionEnd: Message.Noted({ event: "ended" }),
        children: [ui.Text(h, { children: ["Height only, no fade."] })]
      }),
      ui.Collapse(h, {
        expanded: isExpanded(model, 1),
        keepMounted: false,
        onTransitionEnd: Message.Noted({ event: "unmounted ended" }),
        children: [ui.Text(h, { children: ["Only in the page while expanded."] })]
      }),
      ui.Collapse(h, {
        expanded: isExpanded(model, 2),
        transitionDuration: 0,
        onTransitionStart: Message.Noted({ event: "instant started" }),
        children: [ui.Text(h, { children: ["Shown without a transition."] })]
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Events: ${model.events.join(", ")}`] })
    ]
  })
