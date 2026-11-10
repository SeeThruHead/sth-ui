import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as ControlSizeDemo from "./demos/control-size.ts"
import * as CustomIconsDemo from "./demos/custom-icons.ts"
import * as DraggableDemo from "./demos/draggable.ts"
import * as RtlDemo from "./demos/rtl.ts"
import * as ScrollAmountDemo from "./demos/scroll-amount.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Miscellaneous/Scroller" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const containerOf = (canvasElement: HTMLElement) =>
  present(canvasElement.querySelector<HTMLElement>("[role=presentation]"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const end = await canvas.findByRole("button", { name: "Scroll right" })
    const start = canvas.getByRole("button", { name: "Scroll left", hidden: true })
    await waitFor(() => expect(end).not.toHaveAttribute("data-hidden"))
    await expect(start).toHaveAttribute("data-hidden")
    await expect(start).toHaveAttribute("tabindex", "-1")
    await expect(css(start).opacity).toBe("0")
    await expect(end).toHaveAttribute("data-position", "end")
    await expect(box(end).width).toBe(50)
    await expect(box(end.querySelector("svg")).width).toBe(16)
    await expect(css(end.firstElementChild).rotate).toBe("-90deg")
    await expect(css(end).backgroundImage).toContain("linear-gradient(to left")
    await expect(canvas.getByText("Badge 20")).toBeInTheDocument()
    await expect(containerOf(canvasElement)).toHaveAttribute("data-draggable")
    await expect(css(containerOf(canvasElement)).cursor).toBe("grab")
  }
}

export const ScrollingWithControls: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Scroll right" }))
    const container = containerOf(canvasElement)
    await waitFor(() => expect(container.scrollLeft).toBe(200))
    const start = canvas.getByRole("button", { name: "Scroll left" })
    await waitFor(() => expect(start).not.toHaveAttribute("data-hidden"))
    await expect(start).toHaveAttribute("tabindex", "0")
    await user.click(start)
    await waitFor(() => expect(container.scrollLeft).toBe(0))
    await waitFor(() => expect(start).toHaveAttribute("data-hidden"))
    container.scrollTo({ left: container.scrollWidth })
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Scroll right", hidden: true })).toHaveAttribute("data-hidden")
    )
  }
}

export const ScrollAmount: StoryObj = {
  render: demoApp(ScrollAmountDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await user.click(await within(canvasElement).findByRole("button", { name: "Scroll right" }))
    await waitFor(() => expect(containerOf(canvasElement).scrollLeft).toBe(300))
  }
}

export const Draggable: StoryObj = {
  render: demoApp(DraggableDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Badge 1")).toBeVisible()
    await expect(containerOf(canvasElement)).toHaveAttribute("data-draggable")
  }
}

export const Dragging: StoryObj = {
  render: demoApp(DraggableDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const badge = await canvas.findByText("Badge 3")
    const container = containerOf(canvasElement)
    const clicked = fn()
    badge.addEventListener("click", clicked)
    const user = userEvent.setup()
    const y = box(badge).top + 5
    const x = box(badge).left + 5
    await user.pointer({ target: badge, coords: { clientX: x + 30, clientY: y, screenX: x + 30, screenY: y } })
    await user.pointer({
      keys: "[MouseLeft>]",
      target: badge,
      coords: { clientX: x, clientY: y, screenX: x, screenY: y }
    })
    await waitFor(() => expect(container).toHaveAttribute("data-dragging"))
    await user.pointer({ target: badge, coords: { clientX: x - 3, clientY: y, screenX: x - 3, screenY: y } })
    await user.pointer({ target: badge, coords: { clientX: x - 60, clientY: y, screenX: x - 60, screenY: y } })
    await user.pointer({ target: badge, coords: { clientX: x - 120, clientY: y, screenX: x - 120, screenY: y } })
    await user.pointer({
      keys: "[/MouseLeft]",
      target: badge,
      coords: { clientX: x - 120, clientY: y, screenX: x - 120, screenY: y }
    })
    await waitFor(() => expect(container.scrollLeft).toBe(120))
    await expect(clicked).not.toHaveBeenCalled()
    await user.click(badge)
    await expect(clicked).toHaveBeenCalledOnce()
  }
}

export const ControlSize: StoryObj = {
  render: demoApp(ControlSizeDemo),
  play: async ({ canvasElement }) => {
    const end = await within(canvasElement).findByRole("button", { name: "Scroll right" })
    await expect(box(end).width).toBe(70)
  }
}

export const CustomIcons: StoryObj = {
  render: demoApp(CustomIconsDemo),
  play: async ({ canvasElement }) => {
    const end = await within(canvasElement).findByRole("button", { name: "Scroll right" })
    await expect(end.querySelector("svg")).not.toBeNull()
    await expect(end.querySelector("span")).toBeNull()
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const back = await canvas.findByRole("button", { name: "Back" })
    await expect(back).not.toHaveAttribute("data-hidden")
    await expect(box(back).width).toBe(48)
    await expect(canvas.getByRole("button", { name: "Forward" })).not.toHaveAttribute("data-hidden")
    await expect(css(back).backgroundImage).toContain("rgb(190, 75, 219)")
    await expect(containerOf(canvasElement)).not.toHaveAttribute("data-draggable")
  }
}

export const ClickingInside: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const first = await canvas.findByRole("button", { name: "Badge 1" })
    await user.pointer([
      { keys: "[MouseLeft>]", target: first },
      { target: first, coords: { screenX: 0, screenY: 0 } },
      { keys: "[/MouseLeft]", target: first }
    ])
    await waitFor(() => expect(canvas.getByText("Clicked 1 times")).toBeVisible())
    await expect(containerOf(canvasElement).scrollLeft).toBe(0)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const end = await within(canvasElement).findByRole("button", { name: "Scroll right" })
    await expect(css(end).backgroundImage).toContain("rgb(36, 36, 36)")
  }
}

export const LeavingWhileDragging: StoryObj = {
  render: demoApp(DraggableDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const badge = await canvas.findByText("Badge 2")
    const container = containerOf(canvasElement)
    const clicked = fn()
    badge.addEventListener("click", clicked)
    const user = userEvent.setup()
    const y = box(badge).top + 5
    const x = box(badge).left + 5
    const outside = document.body
    await user.pointer({
      keys: "[MouseLeft>]",
      target: badge,
      coords: { clientX: x, clientY: y, screenX: x, screenY: y }
    })
    await waitFor(() => expect(container).toHaveAttribute("data-dragging"))
    await user.pointer({ target: badge, coords: { clientX: x - 40, clientY: y, screenX: x - 40, screenY: y } })
    await user.pointer({
      target: outside,
      coords: { clientX: x - 40, clientY: y + 200, screenX: x - 40, screenY: y + 200 }
    })
    await waitFor(() => expect(container).not.toHaveAttribute("data-dragging"))
    await user.pointer({
      keys: "[/MouseLeft]",
      target: badge,
      coords: { clientX: x - 40, clientY: y, screenX: x - 40, screenY: y }
    })
    await expect(clicked).not.toHaveBeenCalled()
    await user.click(badge)
    await expect(clicked).toHaveBeenCalledOnce()
  }
}

export const RightToLeft: StoryObj = {
  render: demoApp(RtlDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const end = await canvas.findByRole("button", { name: "Scroll right" })
    await waitFor(() => expect(end).not.toHaveAttribute("data-hidden"))
    const container = containerOf(canvasElement)
    await expect(Math.round(box(end).left)).toBe(Math.round(box(container.parentElement).left))
    await userEvent.setup().click(end)
    await waitFor(() => expect(container.scrollLeft).toBe(-200))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Scroll left" })).not.toHaveAttribute("data-hidden"))
  }
}
