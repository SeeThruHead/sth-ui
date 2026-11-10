import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/ResourcesMonthView" }

export default meta

const centre = (element: Element) => {
  const box = element.getBoundingClientRect()

  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
}

const pointer = (target: EventTarget, type: string, point: { readonly clientX: number; readonly clientY: number }) =>
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, ...point })
  )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 2025")).toBeVisible()
    await expect(canvas.getAllByText("First floor")[0]).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Conference" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: "+1 more" })).toBeInTheDocument()
    await expect(canvas.getByText("Closed")).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Studio January 22, 2025" }))
    await expect(await canvas.findByText("Cell 3 2025-01-22")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Shoot" }))
    await expect(await canvas.findByText("Opened Shoot")).toBeVisible()
    canvas.getByRole("button", { name: "Orion January 1, 2025" }).focus()
    await userEvent.keyboard("{ArrowRight}{ArrowDown}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Lyra January 2, 2025" })).toHaveFocus())
    await userEvent.click(canvas.getByRole("button", { name: "+1 more" }))
    await userEvent.click(canvas.getByRole("button", { name: "+1 more" }))
    await userEvent.click(await within(document.body).findByRole("button", { name: "Audit" }))
    await expect(await canvas.findByText("Opened Audit")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("Month of 2025-02-15")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to week view" }))
    await expect(await canvas.findByText("View week")).toBeVisible()
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const shoot = await canvas.findByRole("button", { name: "Shoot" })
    const target = canvas.getByRole("button", { name: "Hot desk January 23, 2025" })
    pointer(shoot, "pointerdown", centre(shoot))
    pointer(document, "pointermove", centre(target))
    await waitFor(() => expect(target).toHaveAttribute("data-marked"))
    pointer(document, "pointerup", centre(target))
    await expect(await canvas.findByText("Moved to 2025-01-23 10:00:00")).toBeVisible()
    const handle = canvasElement.querySelector('[data-event-id="5"] > [data-resize-edge="end"]')
    if (handle === null) throw new Error("no handle")
    pointer(handle, "pointerdown", centre(handle))
    pointer(document, "pointermove", centre(canvas.getByRole("button", { name: "Hot desk January 27, 2025" })))
    await waitFor(() => expect(canvasElement.querySelector('[data-event-id="5"]')).toHaveAttribute("data-resizing"))
    pointer(document, "pointerup", centre(canvas.getByRole("button", { name: "Hot desk January 27, 2025" })))
    await expect(await canvas.findByText("Now until 2025-01-27 16:00:00")).toBeVisible()
    const from = canvas.getByRole("button", { name: "Studio January 2, 2025" })
    pointer(from, "pointerdown", centre(from))
    pointer(document, "pointermove", centre(canvas.getByRole("button", { name: "Studio January 4, 2025" })))
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Studio January 3, 2025" })).toHaveAttribute("data-marked")
    )
    pointer(document, "pointerup", centre(canvas.getByRole("button", { name: "Studio January 4, 2025" })))
    await expect(await canvas.findByText("Selected 2025-01-02 00:00:00 to 2025-01-04 23:59:59")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Bookings in 2025-01")).toBeVisible()
    await expect(canvas.getByText("UPSTAIRS")).toBeVisible()
    await expect(canvas.getAllByText("Room Orion")[0]).toBeVisible()
    await expect(canvas.getAllByText("• Conference")[0]).toBeInTheDocument()
    await expect(canvas.queryByRole("button", { name: "Orion January 4, 2025" })).toBeNull()
    await expect(canvasElement.querySelector('[data-custom="x"]')).not.toBeNull()
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]').length).toBeGreaterThan(0)
  }
}
