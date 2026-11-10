import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as NodesDemo from "./demos/nodes.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useClickOutside" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Click outside to close")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Open dropdown" })).toBeVisible()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByText("Click outside to close"))
    await expect(canvas.getByText("Click outside to close")).toBeVisible()
    present(canvasElement.querySelector("[data-dropdown]")).dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, composed: true })
    )
    await expect(canvas.getByText("Click outside to close")).toBeVisible()
    const removed = document.createElement("div")
    document.body.append(removed)
    removed.addEventListener("mousedown", () => removed.remove())
    removed.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    await expect(canvas.getByText("Click outside to close")).toBeVisible()
    document.documentElement.dispatchEvent(new MouseEvent("touchstart", { bubbles: true }))
    await waitFor(() => expect(canvas.getByText("Closed by touchstart")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Open dropdown" }))
    await expect(await canvas.findByText("Click outside to close")).toBeVisible()
    await userEvent.click(document.body)
    await waitFor(() => expect(canvas.getByText("Closed by mousedown")).toBeVisible())
  }
}

export const Nodes: StoryObj = {
  render: demoApp(NodesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Clicks outside both: 0")).toBeVisible()
    await expect(canvas.getByText("First")).toBeVisible()
  }
}

export const ClickingNodes: StoryObj = {
  render: demoApp(NodesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByText("First"))
    await userEvent.click(canvas.getByText("Second"))
    await expect(canvas.getByText("Clicks outside both: 0")).toBeVisible()
    await userEvent.click(canvas.getByText("Clicks outside both: 0"))
    await expect(await canvas.findByText("Clicks outside both: 1")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Stop listening" }))
    await expect(await canvas.findByRole("button", { name: "Listen again" })).toBeVisible()
    const count = () => canvas.getByText(/^Clicks outside both: \d+$/).textContent
    await waitFor(async () => {
      const before = count()
      await userEvent.click(document.body)
      await expect(count()).toBe(before)
    })
  }
}
