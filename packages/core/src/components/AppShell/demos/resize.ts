import { Option, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as AppShell from "../AppShell.ts"
import { appShellAside, appShellFooter, appShellHeader, appShellMain, appShellNavbar } from "../AppShell.ts"
import type { Ui } from "../../../Ui.ts"

const Resize = AppShell.AppShellResize

export const Model = Schema.Struct({ resize: Resize.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotResize: { message: Resize.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  resize: Resize.init({
    id: "resizable-shell",
    navbar: { min: 150, max: 400, collapseThreshold: 120 },
    aside: { min: 120, max: 320 },
    header: { min: 40, max: 120, label: "Header height" },
    footer: { max: 100 }
  }),
  log: "Drag an edge, or focus it and use the arrow keys"
})

const describe = (out: AppShell.AppShellResize.OutMessage): string => {
  if (out._tag === "CollapseChanged") return `navbar ${out.collapsed ? "collapsed" : "expanded"}`
  const navbar = Option.getOrNull(out.sizes.navbar)

  return out._tag === "ResizeEnded"
    ? `Resize ended, navbar ${navbar ?? "auto"}`
    : `Resizing, navbar ${navbar ?? "auto"}`
}

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    GotResize: ({ message: inner }) => {
      const result = Resize.update(model.resize, inner)

      return {
        model: { resize: result.model, log: result.outMessages.map(describe).at(-1) ?? model.log }
      }
    }
  })

export const subscriptions = Subscription.lift(AppShell.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.resize),
  toParentMessage: (message) => Message.GotResize({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Box(h, {
        h: 420,
        bd: "1px solid gray.3",
        children: [
          ui.AppShell(h, {
            mode: "static",
            header: { height: 50 },
            navbar: { width: 220, breakpoint: "sm" },
            aside: { width: 180, breakpoint: "md" },
            footer: { height: 40 },
            padding: "md",
            resize: { model: model.resize, toParentMessage: (message) => Message.GotResize({ message }) },
            children: [
              appShellHeader({ children: [ui.Group(h, { h: "100%", px: "md", children: ["Header"] })] }),
              appShellNavbar({ p: "md", children: ["Navbar"] }),
              appShellAside({ p: "md", children: ["Aside"] }),
              appShellFooter({ p: "sm", ta: "right", children: ["Footer"] }),
              appShellMain({ children: [ui.Paper(h, { withBorder: true, mih: 300, p: "md", children: ["Main"] })] })
            ]
          })
        ]
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
