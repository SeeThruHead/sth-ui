import { Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { network } from "../../browser.ts"
import { Network } from "../network.ts"

export const Model = Network
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { network: Network } })
export type Message = typeof Message.Type

export const init = (): Model => ({ online: true })

export const update = (_model: Model, message: Message) =>
  Message.match(message, { Changed: (changed) => ({ model: changed.network }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => network.pipe(Stream.map((current) => Message.Changed({ network: current })))
    }
  )
}))

const rows = (model: Model): ReadonlyArray<readonly [string, string]> => [
  ["Online", String(model.online)],
  ["rtt", String(model.rtt ?? "unknown")],
  ["downlink", String(model.downlink ?? "unknown")],
  ["effectiveType", model.effectiveType ?? "unknown"],
  ["saveData", String(model.saveData ?? "unknown")]
]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 280,
    mx: "auto",
    gap: 4,
    children: rows(model).map(([name, value]) =>
      ui.Group(h, {
        justify: "space-between",
        children: [ui.Text(h, { children: [name] }), ui.Text(h, { children: [value] })]
      })
    )
  })
