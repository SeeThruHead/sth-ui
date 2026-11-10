import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as AxisDemo from "./demos/axis.ts"
import * as DragHandleDemo from "./demos/drag-handle.ts"
import * as EnabledDemo from "./demos/enabled.ts"
import * as ResizeHandleDemo from "./demos/resize-handle.ts"
import * as SetPositionDemo from "./demos/set-position.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/FloatingWindow" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const show = async (canvasElement: HTMLElement, title: string) => {
  await userEvent.click(await within(canvasElement).findByRole("button", { name: "Show floating window" }))

  return present((await screen.findByText(title)).closest<HTMLElement>("[id$='-window']"))
}

const drag = async (element: HTMLElement, dx: number, dy: number) => {
  const start = box(element)
  const x = start.left + 30
  const y = start.top + 12
  await userEvent.pointer([
    { keys: "[MouseLeft>]", target: element, coords: { clientX: x, clientY: y } },
    { target: element, coords: { clientX: x + dx / 2, clientY: y + dy / 2 } },
    { target: element, coords: { clientX: x + dx, clientY: y + dy } },
    { keys: "[/MouseLeft]", target: element, coords: { clientX: x + dx, clientY: y + dy } }
  ])
}

const rendered = async () => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(150))
}

const viewport = () => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight
})

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show floating window" })).toBeVisible()
    await expect(screen.queryByText("Usage demo")).toBeNull()
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const window = await show(canvasElement, "Usage demo")
    await expect(css(window).position).toBe("fixed")
    await expect(css(window).zIndex).toBe("400")
    await expect(box(window).width).toBe(280)
    await expect(css(window).paddingTop).toBe("16px")
    await expect(css(window).borderTopWidth).toBe("1px")
    await waitFor(() => expect(box(window).left).toBe(20))
    await expect(box(window).top).toBe(70)
    await drag(window, 100, 50)
    await waitFor(() => expect(box(window).left).toBe(120))
    await expect(box(window).top).toBe(120)
    await waitFor(() => expect(window).not.toHaveAttribute("data-dragging"))
    await drag(window, 5000, 5000)
    await waitFor(() => expect(Math.round(box(window).right)).toBe(viewport().width))
    await waitFor(() => expect(Math.round(box(window).bottom)).toBe(viewport().height))
    await drag(present(within(window).getByRole("button", { name: "Close" })), -200, -200)
    await waitFor(() => expect(Math.round(box(window).right)).toBe(viewport().width))
    await userEvent.click(within(window).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByText("Usage demo")).toBeNull())
  }
}

export const DragHandle: StoryObj = {
  render: demoApp(DragHandleDemo),
  play: async ({ canvasElement }) => {
    const window = await show(canvasElement, "Drag handle demo")
    await waitFor(() => expect(box(window).left).toBe(20))
    await drag(present(screen.getByText("Only the header drags the window; the text below does not.")), 80, 0)
    await expect(box(window).left).toBe(20)
    await drag(present(screen.getByText("Drag handle demo")), 80, 40)
    await waitFor(() => expect(box(window).left).toBe(100))
    await expect(box(window).top).toBe(110)
  }
}

export const Axis: StoryObj = {
  render: demoApp(AxisDemo),
  play: async ({ canvasElement }) => {
    const window = await show(canvasElement, "Axis demo")
    await waitFor(() => expect(box(window).left).toBe(20))
    await drag(window, 60, 90)
    await waitFor(() => expect(box(window).left).toBe(80))
    await expect(box(window).top).toBe(70)
  }
}

export const Enabled: StoryObj = {
  render: demoApp(EnabledDemo),
  play: async ({ canvasElement }) => {
    const window = await show(canvasElement, "Enabled demo")
    await waitFor(() => expect(box(window).left).toBe(20))
    await userEvent.click(within(canvasElement).getByRole("switch", { name: "Drag enabled" }))
    await rendered()
    await drag(window, 60, 0)
    await expect(box(window).left).toBe(20)
    await userEvent.click(within(canvasElement).getByRole("switch", { name: "Drag enabled" }))
    await rendered()
    await drag(window, 60, 0)
    await waitFor(() => expect(box(window).left).toBe(80))
  }
}

export const SetPosition: StoryObj = {
  render: demoApp(SetPositionDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", { name: "Set position to bottom right corner" })
    )
    const window = await show(canvasElement, "Set position demo")
    await waitFor(() => expect(box(window).left).toBe(20))
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Set position to bottom right corner" }))
    await waitFor(() => expect(Math.round(viewport().width - box(window).right)).toBe(40))
    await expect(Math.round(viewport().height - box(window).bottom)).toBe(40)
  }
}

export const ResizeHandle: StoryObj = {
  render: demoApp(ResizeHandleDemo),
  play: async ({ canvasElement }) => {
    const window = await show(canvasElement, "Resize demo")
    const handle = within(window).getByRole("separator", { name: "Resize floating window" })
    await expect(box(window).width).toBe(260)
    await expect(box(window).height).toBe(260)
    await expect(handle).toHaveAttribute("aria-valuenow", "260")
    await expect(handle).toHaveAttribute("aria-valuemin", "180")
    await expect(handle).toHaveAttribute("aria-valuemax", "500")
    await expect(Math.round(box(window).right - box(handle).right)).toBe(1)
    await drag(handle, 50, 30)
    await waitFor(() => expect(box(window).width).toBe(310))
    await expect(box(window).height).toBe(290)
    await expect(box(window).left).toBe(60)
    handle.focus()
    await userEvent.keyboard("{ArrowRight}{ArrowUp}{Enter}")
    await waitFor(() => expect(box(window).width).toBe(320))
    await waitFor(() => expect(box(window).height).toBe(280))
    await drag(handle, 1000, -1000)
    await waitFor(() => expect(box(window).width).toBe(500))
    await waitFor(() => expect(box(window).height).toBe(220))
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}")
    await waitFor(() => expect(box(window).width).toBe(490))
    await drag(present(screen.getByText("Resize demo")), 30, 0)
    await waitFor(() => expect(box(window).left).toBe(90))
  }
}

export const DragHandleExample: StoryObj = {
  render: demoApp(DragHandleDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show floating window" })).toBeVisible()
  }
}

export const AxisExample: StoryObj = {
  render: demoApp(AxisDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show floating window" })).toBeVisible()
  }
}

export const EnabledExample: StoryObj = {
  render: demoApp(EnabledDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show floating window" })).toBeVisible()
  }
}

export const SetPositionExample: StoryObj = {
  render: demoApp(SetPositionDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show floating window" })).toBeVisible()
  }
}

export const ResizeHandleExample: StoryObj = {
  render: demoApp(ResizeHandleDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show floating window" })).toBeVisible()
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const notes = await within(canvasElement).findByLabelText("Notes")
    await expect(notes.closest("[data-portal]")).toBeNull()
    await expect(css(notes).zIndex).toBe("7")
    const handle = within(notes).getByRole("separator", { name: "Resize window" })
    await expect(handle).not.toHaveAttribute("aria-valuenow")
    await expect(handle).not.toHaveAttribute("aria-valuemin")
    await userEvent.pointer({ keys: "[MouseRight]", target: handle })
    await userEvent.pointer({ keys: "[MouseRight]", target: notes })
    await expect(notes).not.toHaveAttribute("data-dragging")
    await drag(notes, -5000, 40)
    await waitFor(() => expect(box(notes).left).toBeLessThan(-1000))
  }
}
