import type { Meta, StoryObj } from "@storybook/html-vite"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { app, demo, eventsView } from "../../stories/harness.ts"
import * as PresetsDemo from "./demos/presets.ts"
import type { Ui } from "../../Ui.ts"
import * as Transition from "./Transition.ts"
import type { TransitionProps } from "./Transition.ts"
import { present } from "../../stories/dom.ts"

const meta: Meta = { title: "Miscellaneous/Transition" }

export default meta

const Model = Schema.Struct({ transition: Transition.Model, events: Schema.Array(Schema.String) })
type Model = typeof Model.Type

const Message = defineMessageUnion({ GotTransition: { message: Transition.Message }, Toggled: {} })
type Message = typeof Message.Type

const settle = (model: Model, result: Transition.Result) => ({
  model: {
    transition: result.model,
    events: [...model.events, ...result.outMessages.map((out) => out._tag.toLowerCase())]
  },
  commands: Transition.liftCommands(result.commands, (message) => Message.GotTransition({ message }))
})

type Options = Omit<TransitionProps, "model" | "children">

const transitionStory = (options: Options, mounted = false) =>
  app<Model, Message>({
    Model,
    init: () => ({ transition: Transition.init({ id: "dropdown", mounted }), events: [] }),
    update: (model, message) =>
      Message.match(message, {
        GotTransition: ({ message: inner }) => settle(model, Transition.update(model.transition, inner)),
        Toggled: () => settle(model, Transition.mounted(model.transition, !model.transition.isShowing))
      }),
    view: (model, h, ui) => [
      ui.Button(h, {
        mb: "sm",
        onClick: Message.Toggled(),
        children: [model.transition.isShowing ? "Hide dropdown" : "Show dropdown"]
      }),
      ui.Transition(h, { model: model.transition, ...options, children: [card(h, ui, "Dropdown")] }),
      eventsView(h, model.events)
    ]
  })

const card = (h: HtmlBuilder<Message>, ui: Ui, label: string): Html =>
  ui.Paper(h, { withBorder: true, shadow: "md", p: "md", maw: 240, children: [label] })

const events = (canvasElement: HTMLElement) => within(canvasElement).getByRole("status", { name: "Events" })

export const Clicking: StoryObj = {
  render: transitionStory({ transition: "pop-top-left", duration: 120, exitDuration: 200, timingFunction: "linear" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText("Dropdown")).toBeNull()
    await userEvent.click(await canvas.findByRole("button", { name: "Show dropdown" }))
    await waitFor(() => expect(events(canvasElement)).toHaveTextContent("entering, entered"))
    const box = present(canvas.getByText("Dropdown").parentElement)
    await expect(getComputedStyle(box).opacity).toBe("1")
    await expect(getComputedStyle(box).transformOrigin).toContain("0px")
    await expect(getComputedStyle(box).transitionDuration).toBe("0.12s")
    await userEvent.click(canvas.getByRole("button", { name: "Hide dropdown" }))
    await waitFor(() =>
      expect(getComputedStyle(present(canvas.getByText("Dropdown").parentElement)).transitionDuration).toBe("0.2s")
    )
    await waitFor(() => expect(events(canvasElement)).toHaveTextContent("exiting, exited"))
    await expect(canvas.queryByText("Dropdown")).toBeNull()
  }
}

export const KeepMounted: StoryObj = {
  render: transitionStory({ keepMounted: true, enterDelay: 50, exitDelay: 20 }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const hidden = await canvas.findByText("Dropdown")
    await expect(getComputedStyle(present(hidden.parentElement)).display).toBe("none")
    await userEvent.click(canvas.getByRole("button", { name: "Show dropdown" }))
    await waitFor(() => expect(events(canvasElement)).toHaveTextContent("entered"))
    await expect(getComputedStyle(present(canvas.getByText("Dropdown").parentElement)).transitionDelay).toBe("0.05s")
    await userEvent.click(canvas.getByRole("button", { name: "Hide dropdown" }))
    await waitFor(() => expect(events(canvasElement)).toHaveTextContent("exited"))
    await expect(getComputedStyle(present(canvas.getByText("Dropdown").parentElement)).display).toBe("none")
  }
}

export const CustomTransition: StoryObj = {
  render: transitionStory(
    {
      transition: {
        in: { opacity: "1", transform: "scaleY(1)" },
        out: { opacity: "0", transform: "scaleY(0)" },
        common: { transformOrigin: "top" },
        transitionProperty: "transform, opacity"
      },
      duration: 0
    },
    true
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = present((await canvas.findByText("Dropdown")).parentElement)
    await expect(getComputedStyle(box).transform).toBe("matrix(1, 0, 0, 1, 0, 0)")
    await expect(box).not.toHaveAttribute("data-transition")
    await userEvent.click(canvas.getByRole("button", { name: "Hide dropdown" }))
    await waitFor(() => expect(canvas.queryByText("Dropdown")).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Show dropdown" }))
    await userEvent.click(await canvas.findByRole("button", { name: "Hide dropdown" }))
    await waitFor(() => expect(events(canvasElement)).toHaveTextContent("exiting, exited, entering, exiting"))
  }
}

const names = Object.keys(Transition.transitions).filter(
  (name): name is Transition.TransitionName => name in Transition.transitions
)

export const Presets: StoryObj = {
  render: demo(PresetsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("pop-bottom-right")).toBeVisible()
    await expect(names).toHaveLength(21)
    const scale = present(canvas.getByText("scale-x").parentElement)
    await expect(getComputedStyle(scale).opacity).toBe("1")
  }
}
