import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalDemo from "./demos/vertical.ts"

const meta: Meta = { title: "Extensions/Carousel" }

export default meta

const status = (canvas: ReturnType<typeof within>, text: string) =>
  waitFor(() => expect(canvas.getAllByRole("status")[0]).toHaveTextContent(text))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await status(canvas, "Slide 1 of 5")
    await expect(canvas.getByText("Slide 1")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Previous slide" })).toHaveAttribute("aria-disabled", "true")
    await expect(canvas.getAllByRole("tab")).toHaveLength(5)
  }
}

export const Sliding: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await status(canvas, "Slide 1 of 5")
    await userEvent.click(canvas.getByRole("button", { name: "Next slide" }))
    await status(canvas, "Slide 2 of 5")
    await expect(await canvas.findByText("On slide 2")).toBeVisible()
    await userEvent.keyboard("{ArrowRight}")
    await status(canvas, "Slide 3 of 5")
    await userEvent.keyboard("{End}")
    await status(canvas, "Slide 5 of 5")
    await expect(canvas.getByRole("button", { name: "Next slide" })).toHaveAttribute("aria-disabled", "true")
    await userEvent.keyboard("{Home}")
    await status(canvas, "Slide 1 of 5")
    await userEvent.click(canvas.getByRole("button", { name: "Next slide" }))
    await status(canvas, "Slide 2 of 5")
    await userEvent.keyboard("{ArrowLeft}{a}")
    await status(canvas, "Slide 1 of 5")
    await userEvent.click(canvas.getByRole("tab", { name: "Go to slide 4" }))
    await status(canvas, "Slide 4 of 5")
    await expect(canvas.getByRole("tab", { name: "Go to slide 4" })).toHaveAttribute("aria-selected", "true")
    await userEvent.keyboard("{ArrowLeft}")
    await status(canvas, "Slide 3 of 5")
    await waitFor(() => expect(canvas.getByRole("tab", { name: "Go to slide 3" })).toHaveFocus())
    await userEvent.keyboard("{x}{ArrowRight}")
    await status(canvas, "Slide 4 of 5")
    const slide = canvas.getByText("Slide 4")
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: slide, coords: { clientX: 600, clientY: 100 } },
      { target: slide, coords: { clientX: 400, clientY: 100 } },
      { keys: "[/MouseLeft]", target: slide, coords: { clientX: 400, clientY: 100 } }
    ])
    await status(canvas, "Slide 5 of 5")
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: canvas.getByText("Slide 5"), coords: { clientX: 600, clientY: 100 } },
      { keys: "[/MouseLeft]", target: canvas.getByText("Slide 5"), coords: { clientX: 600, clientY: 100 } }
    ])
    await userEvent.pointer({ keys: "[MouseRight]", target: canvas.getByText("Slide 5") })
    await status(canvas, "Slide 5 of 5")
  }
}

export const Multiple: StoryObj = {
  render: demoApp(MultipleDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await status(canvas, "Slide 1 of 6")
    await expect(canvas.getByRole("button", { name: "Previous slide" })).toHaveAttribute("aria-disabled", "false")
  }
}

export const Looping: StoryObj = {
  render: demoApp(MultipleDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await status(canvas, "Slide 1 of 6")
    await userEvent.click(canvas.getByRole("button", { name: "Previous slide" }))
    await status(canvas, "Slide 6 of 6")
    await waitFor(() => expect(canvas.getByText("Slide 6")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Next slide" }))
    await status(canvas, "Slide 1 of 6")
  }
}

export const Vertical: StoryObj = {
  render: demoApp(VerticalDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await status(canvas, "Slide 2 of 4")
    await expect(canvas.getByRole("button", { name: "Show the next slide" })).toBeVisible()
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(VerticalDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await status(canvas, "Slide 2 of 4")
    await userEvent.click(canvas.getByRole("button", { name: "Show the next slide" }))
    await status(canvas, "Slide 3 of 4")
    await userEvent.keyboard("{ArrowRight}")
    await status(canvas, "Slide 3 of 4")
    await userEvent.click(canvas.getByRole("tab", { name: "Go to slide 1" }))
    await userEvent.keyboard("{ArrowDown}")
    await status(canvas, "Slide 2 of 4")
    await userEvent.keyboard("{ArrowUp}")
    await status(canvas, "Slide 1 of 4")
    const slide = canvas.getByText("Slide 1")
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: slide, coords: { clientX: 100, clientY: 200 } },
      { target: slide, coords: { clientX: 100, clientY: 120 } },
      { keys: "[/MouseLeft]", target: slide, coords: { clientX: 100, clientY: 120 } }
    ])
    await waitFor(() => expect(canvas.getAllByRole("status")[0]).not.toHaveTextContent("Slide 1 of 4"))
    const caption = canvas.getByRole("textbox", { name: "Caption" })
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: caption, coords: { clientX: 500, clientY: 100 } },
      { target: caption, coords: { clientX: 300, clientY: 100 } },
      { keys: "[/MouseLeft]", target: caption, coords: { clientX: 300, clientY: 100 } }
    ])
    await status(within(canvas.getAllByRole("region")[1] ?? canvasElement), "Slide 1 of 2")
    await userEvent.click(caption)
    await userEvent.keyboard("ok")
    await expect(caption).toHaveValue("ok")
    const viewport = caption.closest("[data-type]") ?? canvasElement
    await fireEvent.pointerDown(viewport, { button: 0, clientX: 500, pointerId: 3 })
    await fireEvent.pointerMove(viewport, { clientX: 500, pointerId: 3 })
    await fireEvent.pointerMove(viewport, { clientX: 495, pointerId: 3 })
    await fireEvent.pointerMove(viewport, { clientX: 470, pointerId: 3 })
    const paused = performance.now()
    await waitFor(() => expect(performance.now()).toBeGreaterThan(paused + 220))
    await fireEvent.pointerMove(viewport, { clientX: 469, pointerId: 3 })
    await fireEvent.pointerCancel(viewport, { clientX: 469, pointerId: 3 })
    await fireEvent.pointerDown(viewport, { button: 0, clientX: 500, pointerId: 4 })
    await fireEvent.pointerMove(viewport, { clientX: 350, pointerId: 4 })
    const waited = performance.now()
    await waitFor(() => expect(performance.now()).toBeGreaterThan(waited + 220))
    await fireEvent.pointerUp(viewport, { clientX: 350, pointerId: 4 })
    await fireEvent.click(viewport)
    await fireEvent.pointerUp(viewport, { clientX: 400, pointerId: 5 })
    await status(within(canvas.getAllByRole("region")[1] ?? canvasElement), "Slide 2 of 2")
    await fireEvent.dragStart(viewport)
    await userEvent.click(canvas.getByRole("button", { name: "Add a slide" }))
    await status(within(canvas.getAllByRole("region")[1] ?? canvasElement), "Slide 2 of 3")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Slide 1")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Next slide" })).toBeVisible()
  }
}
