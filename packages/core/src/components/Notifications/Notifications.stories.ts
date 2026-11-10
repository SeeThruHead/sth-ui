import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "../../stories/harness.ts"
import * as PositionsDemo from "./demos/positions.ts"
import * as StackedDemo from "./demos/stacked.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Extensions/Notifications" }

export default meta

const page = within(document.body)

const shown = (text: string) => waitFor(() => expect(page.getByText(text)).toBeVisible())

const gone = (text: string) => waitFor(() => expect(page.queryByText(text)).toBeNull(), { timeout: 6000 })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Show notification" })).toBeVisible()
    await expect(canvas.getByText("No notifications yet")).toBeVisible()
    await expect(page.queryByRole("alert")).toBeNull()
  }
}

export const Showing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Start upload" }))
    await shown("Uploading your data")
    await expect(page.queryByRole("button", { name: "Close notification" })).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Finish upload" }))
    await shown("Data was loaded")
    await expect(page.getByText("✓")).toBeVisible()
    await expect(page.getByRole("button", { name: "Close notification" })).toBeVisible()
    await gone("Data was loaded")
    await expect(await canvas.findByText(/Closed upload/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Show notification" }))
    await shown("Do not forget to star the repo")
    await userEvent.hover(page.getByText("Do not forget to star the repo"))
    await waitFor(() => expect(page.getByRole("alert").querySelector("[data-paused]")).not.toBeNull())
    await userEvent.unhover(page.getByText("Do not forget to star the repo"))
    await waitFor(() => expect(page.getByRole("alert").querySelector("[data-paused]")).toBeNull())
    await userEvent.click(page.getByRole("button", { name: "Close notification" }))
    await gone("Do not forget to star the repo")
  }
}

export const Queueing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sticky = await canvas.findByRole("button", { name: "Show sticky" })
    await userEvent.click(sticky)
    await userEvent.click(sticky)
    await userEvent.click(sticky)
    await userEvent.click(sticky)
    await waitFor(() => expect(page.getAllByText("Pinned until closed")).toHaveLength(3))
    await userEvent.click(page.getAllByRole("button", { name: "Close notification" })[0] ?? sticky)
    await waitFor(() => expect(canvas.getByText(/Closed notifications-0; Opened notifications-3/)).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Show sticky" }))
    await userEvent.click(canvas.getByRole("button", { name: "Clean queue" }))
    await userEvent.click(canvas.getByRole("button", { name: "Clean all" }))
    await waitFor(() => expect(page.queryByText("Pinned until closed")).toBeNull())
  }
}

export const Swiping: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sticky = await canvas.findByRole("button", { name: "Show sticky" })
    await userEvent.click(sticky)
    await shown("Pinned until closed")
    const first = page.getByText("Pinned until closed")
    await userEvent.pointer({ keys: "[MouseRight]", target: first, coords: { clientX: 1000, clientY: 40 } })
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: first, coords: { clientX: 1000, clientY: 40 } },
      { target: first, coords: { clientX: 1003, clientY: 40 } },
      { keys: "[/MouseLeft]", target: first, coords: { clientX: 1003, clientY: 40 } }
    ])
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: first, coords: { clientX: 1000, clientY: 40 } },
      { target: first, coords: { clientX: 1050, clientY: 40 } }
    ])
    await fireEvent.pointerCancel(first, { clientX: 1050 })
    await userEvent.pointer({ keys: "[/MouseLeft]", target: first, coords: { clientX: 1050, clientY: 40 } })
    await waitFor(() => expect(first.closest("[data-position]")?.getAttribute("style")).toContain("translate3d(0px"))
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: first, coords: { clientX: 1000, clientY: 40 } },
      { target: first, coords: { clientX: 1010, clientY: 40 } },
      { target: first, coords: { clientX: 1020, clientY: 40 } },
      { keys: "[/MouseLeft]", target: first, coords: { clientX: 1020, clientY: 40 } }
    ])
    await shown("Pinned until closed")
    await userEvent.pointer({ keys: "[MouseLeft]", target: first, coords: { clientX: 1000, clientY: 40 } })
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: first, coords: { clientX: 1000, clientY: 40 } },
      { target: first, coords: { clientX: 1300, clientY: 40 } },
      { keys: "[/MouseLeft]", target: first, coords: { clientX: 1300, clientY: 40 } }
    ])
    await gone("Pinned until closed")
    await userEvent.click(sticky)
    await shown("Pinned until closed")
    const second = page.getByText("Pinned until closed")
    const wrapper = second.closest("[data-position]")
    await fireEvent.wheel(second, { deltaX: 0, deltaY: 40 })
    await fireEvent.wheel(second, { deltaX: 30, deltaY: 0 })
    await waitFor(() => expect(wrapper?.getAttribute("style")).toContain("translate3d(-30px"))
    await waitFor(() => expect(wrapper?.getAttribute("style")).toContain("translate3d(0px"))
    await fireEvent.wheel(second, { deltaX: 100, deltaY: 0 })
    await fireEvent.wheel(second, { deltaX: 100, deltaY: 0 })
    await gone("Pinned until closed")
  }
}

const wrapper = (text: string) => page.getByText(text).closest("[data-position]")

const styleOf = (text: string) => wrapper(text)?.getAttribute("style") ?? ""

export const Stacked: StoryObj = {
  render: demoApp(StackedDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Add to stack" })).toBeVisible()
    await expect(page.queryByRole("alert")).toBeNull()
  }
}

export const Stacking: StoryObj = {
  render: demoApp(StackedDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const add = await canvas.findByRole("button", { name: "Add to stack" })
    await userEvent.click(add)
    await userEvent.click(add)
    await userEvent.click(add)
    await shown("Stacked notification number 3")
    await waitFor(() => expect(styleOf("Stacked notification number 1")).toContain("scale(0.94)"))
    await userEvent.hover(page.getByText("Stacked notification number 3"))
    await waitFor(() => expect(styleOf("Stacked notification number 1")).toMatch(/translateY\(-\d+px\)/))
    await userEvent.unhover(page.getByText("Stacked notification number 3"))
    await waitFor(() => expect(styleOf("Stacked notification number 1")).toContain("scale(0.94)"))
    await fireEvent.pointerDown(page.getByText("Stacked notification number 3"), { pointerType: "touch" })
    await waitFor(() => expect(styleOf("Stacked notification number 1")).toMatch(/translateY\(-\d+px\)/))
    await fireEvent.pointerDown(page.getByText("Stacked notification number 2"), { pointerType: "touch" })
    await expect(styleOf("Stacked notification number 1")).toMatch(/translateY\(-\d+px\)/)
    await fireEvent.pointerDown(document.body, { pointerType: "touch" })
    await waitFor(() => expect(styleOf("Stacked notification number 1")).toContain("scale(0.94)"))
    const top = page.getByText("Stacked notification number 3")
    await fireEvent.pointerDown(top, { button: 0, clientX: 100, pointerId: 1 })
    await fireEvent.pointerMove(top, { clientX: 140, pointerId: 1 })
    await waitFor(() => expect(styleOf("Stacked notification number 3")).toContain("translate3d(40px"))
    await fireEvent.pointerMove(page.getByText("Stacked notification number 3"), { clientX: 150, pointerId: 1 })
    await fireEvent.pointerUp(page.getByText("Stacked notification number 3"), { clientX: 150, pointerId: 1 })
    await gone("Stacked notification number 3")
    await userEvent.click(page.getAllByRole("button", { name: "Close notification" })[0] ?? add)
    await gone("Stacked notification number 2")
    await userEvent.click(canvas.getByRole("button", { name: "Show custom" }))
    await shown("Rendered by renderNotification")
    await userEvent.click(page.getByRole("button", { name: "Dismiss" }))
    await gone("Rendered by renderNotification")
    await userEvent.click(canvas.getByRole("button", { name: "Show custom" }))
    await shown("Rendered by renderNotification")
    await userEvent.unhover(page.getByText("Rendered by renderNotification"))
    await userEvent.hover(add)
    await gone("Rendered by renderNotification")
  }
}

const box = (text: string) => page.getByText(text).getBoundingClientRect()

export const Positions: StoryObj = {
  render: demoApp(PositionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "top-left" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "bottom-right" })).toBeVisible()
  }
}

export const Placing: StoryObj = {
  render: demoApp(PositionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "top-left" }))
    await userEvent.click(canvas.getByRole("button", { name: "bottom-right" }))
    await userEvent.click(canvas.getByRole("button", { name: "top-center" }))
    await shown("Notification at top-left")
    await shown("Notification at bottom-right")
    await shown("Notification at top-center")
    await waitFor(() =>
      expect(box("Notification at top-left").top).toBeLessThan(box("Notification at bottom-right").top)
    )
    await waitFor(() =>
      expect(box("Notification at top-left").left).toBeLessThan(box("Notification at top-center").left)
    )
    await waitFor(() =>
      expect(box("Notification at top-center").left).toBeLessThan(box("Notification at bottom-right").left)
    )
    await gone("Notification at top-left")
  }
}
