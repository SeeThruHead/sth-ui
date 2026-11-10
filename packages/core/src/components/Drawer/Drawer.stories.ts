import type { Meta, StoryObj } from "@storybook/html-vite"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { app, demoApp, eventsView } from "../../stories/harness.ts"
import * as TopDemo from "./demos/top.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as Drawer from "./Drawer.ts"
import type { DrawerProps } from "./Drawer.ts"

const meta: Meta = { title: "Overlays/Drawer", parameters: { layout: "fullscreen" } }

export default meta

const Model = Schema.Struct({ drawer: Drawer.Model, events: Schema.Array(Schema.String) })
type Model = typeof Model.Type

const Message = defineMessageUnion({ GotDrawer: { message: Drawer.Message }, PressedOpen: {} })
type Message = typeof Message.Type

const settle = (model: Model, result: Drawer.Result) => ({
  model: { drawer: result.model, events: [...model.events, ...result.outMessages.map((out) => out._tag)] },
  commands: result.commands.map((command) => Command.mapMessage(command, (message) => Message.GotDrawer({ message })))
})

type Options = Omit<DrawerProps<Message>, "model" | "toParentMessage" | "children">

const drawerStory = (options: Options, opened = false, centered = false) =>
  app<Model, Message>(
    {
      Model,
      init: () => ({ drawer: Drawer.init({ id: "menu", opened }), events: [] }),
      update: (model, message) =>
        Message.match(message, {
          GotDrawer: ({ message: inner }) => settle(model, Drawer.update(model.drawer, inner)),
          PressedOpen: () => settle(model, Drawer.open(model.drawer))
        }),
      view: (model, h, ui) => [
        ui.Button(h, { variant: "default", onClick: Message.PressedOpen(), children: ["Open Drawer"] }),
        ui.Drawer(h, {
          model: model.drawer,
          toParentMessage: (message) => Message.GotDrawer({ message }),
          ...options,
          children: [ui.Text(h, { children: ["Drawer content"] })]
        }),
        eventsView(h, model.events)
      ]
    },
    undefined,
    "document",
    centered
  )

const panel = (name: string) => within(document.body).findByRole("dialog", { name })

const box = (element: Element) => element.getBoundingClientRect()

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const opener = await within(canvasElement).findByRole("button", { name: "Open Drawer" })
    await expect(getComputedStyle(opener).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(within(document.body).queryByRole("dialog")).toBeNull()
  }
}

export const Opened: StoryObj = {
  render: drawerStory({ title: "Navigation" }, true),
  play: async () => {
    const content = await panel("Navigation")
    await expect(box(content).left).toBe(0)
    await expect(box(content).top).toBe(0)
    await expect(box(content).width).toBe(440)
    await expect(box(content).height).toBe(window.innerHeight)
    await expect(getComputedStyle(content).borderTopRightRadius).toBe("0px")
  }
}

export const Right: StoryObj = {
  render: drawerStory({ title: "Right", position: "right", size: "xs" }, true),
  play: async () => {
    const content = await panel("Right")
    await expect(box(content).right).toBe(window.innerWidth)
    await expect(box(content).width).toBe(320)
  }
}

export const Top: StoryObj = {
  render: demoApp(TopDemo),
  play: async () => {
    const content = await panel("Top")
    await expect(box(content).top).toBe(8)
    await expect(box(content).height).toBe(200)
    await expect(box(content).width).toBe(window.innerWidth - 16)
    await expect(getComputedStyle(content).borderTopLeftRadius).toBe("8px")
  }
}

export const Bottom: StoryObj = {
  render: drawerStory({ title: "Bottom", position: "bottom", size: "30%", offset: "1rem" }, true),
  play: async () => {
    const content = await panel("Bottom")
    await expect(box(content).bottom).toBe(window.innerHeight - 16)
    await expect(box(content).height).toBeCloseTo(window.innerHeight * 0.3, 0)
  }
}

export const Clicking: StoryObj = {
  render: drawerStory({ title: "Navigation", transitionProps: { duration: 50 } }),
  play: async ({ canvasElement }) => {
    const opener = await within(canvasElement).findByRole("button", { name: "Open Drawer" })
    await userEvent.click(opener)
    const content = await panel("Navigation")
    await waitFor(() => expect(content.contains(document.activeElement)).toBe(true))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await expect(document.activeElement).toBe(opener)
  }
}

export const ClosingUsageDemo: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Open Drawer" }))
    const dialog = await within(document.body).findByRole("dialog", { name: "Authentication" })
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await expect(canvasElement).toBeInTheDocument()
  }
}

export const ClosingTopDemo: StoryObj = {
  render: demoApp(TopDemo),
  play: async ({ canvasElement }) => {
    const dialog = await within(document.body).findByRole("dialog", { name: "Top" })
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open Drawer" }))
    await waitFor(() => expect(within(document.body).getByRole("dialog", { name: "Top" })).toBeVisible())
  }
}
