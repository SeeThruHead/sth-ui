import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { app, demoApp, story } from "../../stories/harness.ts"
import type { Ui } from "../../Ui.ts"
import * as Transition from "../Transition/Transition.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/LoadingOverlay" }

export default meta

const custom = stylex.create({ dashed: { outlineWidth: "2px", outlineStyle: "dashed", outlineColor: "red" } })

const form = <M>(h: HtmlBuilder<M>, ui: Ui, overlay: Html) =>
  ui.Box(h, {
    pos: "relative",
    maw: 340,
    children: [
      ui.Paper(h, {
        withBorder: true,
        p: "md",
        children: [ui.Text(h, { mb: "sm", children: ["Profile form"] }), ui.Button(h, { children: ["Save profile"] })]
      }),
      overlay
    ]
  })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "First name" })).toBeVisible()
    await expect(canvas.getByLabelText(/^Confirm Password/)).toBeVisible()
    await expect(
      canvas.getByRole("checkbox", { name: "I agree to sell my soul and privacy to this corporation" })
    ).toBeVisible()
    await expect(canvas.getByRole("checkbox", { name: /^I agree/ })).toBeChecked()
    await expect(canvas.getAllByRole("button", { name: "Toggle password visibility" })).toHaveLength(2)
    await expect(canvas.queryByRole("status", { name: "Loading" })).toBeNull()
  }
}

export const TogglingOverlay: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(present((await canvas.findAllByRole("button", { name: "Toggle password visibility" }))[0]))
    await waitFor(() => expect(canvas.getByLabelText(/^Password/)).toHaveAttribute("type", "text"))
    await userEvent.click(canvas.getByRole("checkbox", { name: /^I agree/ }))
    await waitFor(() => expect(canvas.getByRole("checkbox", { name: /^I agree/ })).not.toBeChecked())
    await userEvent.click(present(canvas.getAllByRole("button", { name: "Toggle password visibility" })[1]))
    await waitFor(() => expect(canvas.getByLabelText(/^Confirm Password/)).toHaveAttribute("type", "text"))
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle overlay" }))
    const loader = await canvas.findByRole("status", { name: "Loading" })
    const root = present(loader.parentElement?.parentElement)
    const area = present(root.parentElement)
    await expect(root.getBoundingClientRect().height).toBe(area.getBoundingClientRect().height)
    await expect(getComputedStyle(root).zIndex).toBe("1000")
    const overlay = present(root.lastElementChild)
    await expect(getComputedStyle(overlay).backgroundColor).toBe("color(srgb 1 1 1 / 0.75)")
    await expect(getComputedStyle(overlay).backdropFilter).toBe("blur(2px)")
    await expect(getComputedStyle(overlay).borderTopLeftRadius).toBe("4px")
    await userEvent.click(canvas.getByRole("button", { name: "Toggle overlay" }))
    await waitFor(() => expect(canvas.queryByRole("status", { name: "Loading" })).toBeNull())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle overlay" }))
    const loader = await canvas.findByRole("status", { name: "Loading" })
    const overlay = present(loader.parentElement?.parentElement?.lastElementChild)
    await expect(getComputedStyle(overlay).backgroundColor).toContain("0.231373 0.231373 0.231373 / 0.75")
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, value, set }) =>
    h.div(
      [],
      [
        ui.Button(h, {
          mb: "sm",
          variant: "default",
          onClick: set("loading", value("loading", "no") === "yes" ? "no" : "yes"),
          children: ["Toggle loading"]
        }),
        form(
          h,
          ui,
          ui.LoadingOverlay(h, {
            visible: value("loading", "no") === "yes",
            zIndex: 1000,
            loaderProps: { color: "pink", type: "bars", label: "Saving" },
            overlayProps: { radius: "sm", blur: 2 },
            styles: { overlay: custom.dashed }
          })
        )
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle loading" }))
    const loader = await canvas.findByRole("status", { name: "Saving" })
    const root = present(loader.parentElement?.parentElement)
    await expect(getComputedStyle(root).zIndex).toBe("1000")
    await expect(getComputedStyle(present(loader.parentElement)).zIndex).toBe("1001")
    await expect(getComputedStyle(present(root.lastElementChild)).backdropFilter).toBe("blur(2px)")
    await expect(getComputedStyle(present(root.lastElementChild)).outlineStyle).toBe("dashed")
    await userEvent.click(canvas.getByRole("button", { name: "Toggle loading" }))
    await waitFor(() => expect(canvas.queryByRole("status", { name: "Saving" })).toBeNull())
  }
}

const Model = Schema.Struct({ loading: Transition.Model })
type Model = typeof Model.Type

const Message = defineMessageUnion({ GotTransition: { message: Transition.Message }, Toggled: {} })
type Message = typeof Message.Type

const settle = (result: Transition.Result) => ({
  model: { loading: result.model },
  commands: result.commands.map((command) =>
    Command.mapMessage(command, (message) => Message.GotTransition({ message }))
  )
})

export const Fading: StoryObj = {
  render: app<Model, Message>({
    Model,
    init: () => ({ loading: Transition.init({ id: "saving", mounted: false }) }),
    update: (model, message) =>
      Message.match(message, {
        GotTransition: ({ message: inner }) => settle(Transition.update(model.loading, inner)),
        Toggled: () => settle(Transition.mounted(model.loading, !model.loading.isShowing))
      }),
    view: (model, h, ui) => [
      ui.Button(h, { mb: "sm", variant: "default", onClick: Message.Toggled(), children: ["Toggle fade"] }),
      ui.Box(h, {
        pos: "relative",
        maw: 340,
        children: [
          ui.Paper(h, { withBorder: true, p: "md", children: ["Fading form"] }),
          ui.LoadingOverlay(h, { model: model.loading, transitionProps: { duration: 150 } })
        ]
      })
    ]
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle fade" }))
    const loader = await canvas.findByRole("status", { name: "Loading" })
    await expect(getComputedStyle(present(loader.parentElement?.parentElement)).transitionDuration).toBe("0.15s")
    await userEvent.click(canvas.getByRole("button", { name: "Toggle fade" }))
    await waitFor(() => expect(canvas.queryByRole("status", { name: "Loading" })).toBeNull())
  }
}

export const Unstyled: StoryObj = {
  render: story(({ h, ui }) => form(h, ui, ui.LoadingOverlay(h, { visible: true, unstyled: true }))),
  play: async ({ canvasElement }) => {
    const loader = await within(canvasElement).findByRole("status", { name: "Loading" })
    const root = present(loader.parentElement?.parentElement)
    await expect(getComputedStyle(root).position).toBe("static")
    await expect(getComputedStyle(present(root.lastElementChild)).position).toBe("static")
  }
}
