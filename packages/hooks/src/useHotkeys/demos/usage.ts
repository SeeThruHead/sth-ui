import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { hotkeys } from "../../browser.ts"
import { hotkeyHandler } from "../../mounts.ts"

export const Model = Schema.Struct({ dark: Schema.Boolean, saved: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Pressed: { hotkey: Schema.String }, Saved: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ dark: false, saved: 0 })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Pressed: () => ({ model: { ...model, dark: !model.dark } }),
    Saved: () => ({ model: { ...model, saved: model.saved + 1 } })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        hotkeys([["mod+J"], ["ctrl+K"]]).pipe(Stream.map((hotkey) => Message.Pressed({ hotkey })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, { children: [`Press Ctrl + K or Mod + J to switch: ${model.dark ? "dark" : "light"}`] }),
      h.div(
        [h.OnMount(Mount.mapMessage(hotkeyHandler(["mod+S"], {}), () => Message.Saved()))],
        [ui.TextInput(h, { id: "hotkeys-note", label: "Note", placeholder: "Press Mod + S to save" })]
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Saved ${model.saved} times`] })
    ]
  })
