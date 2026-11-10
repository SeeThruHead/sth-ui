import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Menu from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  menus: Schema.Struct({ mouse: Menu.Model, touch: Menu.Model, off: Menu.Model }),
  chosen: Schema.String,
  shown: Schema.Boolean
})
export type Model = typeof Model.Type

const Name = Schema.Literals(["mouse", "touch", "off"])

export const Message = defineMessageUnion({ GotMenu: { name: Name, message: Menu.Message }, ToggledRegions: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({
  menus: {
    mouse: Menu.init({ id: "context-mouse" }),
    touch: Menu.init({ id: "context-touch" }),
    off: Menu.init({ id: "context-off" })
  },
  chosen: "Nothing chosen yet",
  shown: true
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ToggledRegions: () => ({ model: { ...model, shown: !model.shown }, commands: [] }),
    GotMenu: ({ name, message: inner }) => {
      const result = Menu.update(model.menus[name], inner)

      return {
        model: {
          ...model,
          menus: { ...model.menus, [name]: result.model },
          chosen: result.outMessage === undefined ? model.chosen : `Chose ${result.outMessage.value}`
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotMenu({ name, message: lifted }))
        )
      }
    }
  })

const items = [
  { value: "copy", label: "Copy" },
  { value: "paste", label: "Paste" },
  { value: "delete", label: "Delete", color: "red" }
]

const region = (h: HtmlBuilder<Message>, ui: Ui, text: string) =>
  ui.Paper(h, { withBorder: true, p: "xl", w: 320, ta: "center", children: [text] })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Button(h, {
        variant: "default",
        onClick: Message.ToggledRegions(),
        children: [model.shown ? "Hide regions" : "Show regions"]
      }),
      ...(model.shown ? regions(model, h, ui) : []),
      ui.Text(h, { size: "sm", children: [model.chosen] })
    ]
  })

const regions = (model: Model, h: HtmlBuilder<Message>, ui: Ui): ReadonlyArray<Html> => [
  ui.Menu(h, {
    model: model.menus.mouse,
    toParentMessage: (message) => Message.GotMenu({ name: "mouse", message }),
    width: 180,
    position: "bottom-start",
    offset: 0,
    items,
    contextMenu: { children: [region(h, ui, "Right-click anywhere in this box")] }
  }),
  ui.Menu(h, {
    model: model.menus.touch,
    toParentMessage: (message) => Message.GotMenu({ name: "touch", message }),
    width: 180,
    position: "bottom-start",
    offset: 0,
    items,
    contextMenu: {
      longPressDelay: 300,
      children: [region(h, ui, "A second region: right-click, or press and hold on a touch screen")]
    }
  }),
  ui.Menu(h, {
    model: model.menus.off,
    toParentMessage: (message) => Message.GotMenu({ name: "off", message }),
    items,
    contextMenu: { disabled: true, children: [region(h, ui, "The browser's own menu here")] }
  })
]
