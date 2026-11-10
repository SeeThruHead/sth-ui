import type { Html, HtmlBuilder } from "foldkit/html"
import { Option } from "effect"
import { CaretRightIcon } from "@sth-ui/icons/icons/CaretRightIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [{ id: "render-expand-select" }])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.TreeSelect(h, {
    ...demo.select(model, 0),
    label: "Your favorite item",
    placeholder: "Pick value",
    renderNode: ({ node, hasChildren, expanded, expand }) =>
      ui.Group(h, {
        gap: "xs",
        wrap: "nowrap",
        children: [
          hasChildren
            ? h.span(
                [
                  h.Role("button"),
                  h.AriaLabel(expanded ? "Collapse" : "Expand"),
                  h.OnPointerDown(() => Option.some(expand)),
                  h.Style({
                    display: "inline-flex",
                    cursor: "pointer",
                    transform: expanded ? "rotate(90deg)" : "none",
                    transition: "transform 150ms ease"
                  })
                ],
                [CaretRightIcon(h, { size: 14 })]
              )
            : h.span([h.Style({ display: "inline-block", width: "14px" })], []),
          h.span([], [node.label])
        ]
      }),
    w: "100%",
    maw: 340
  })
