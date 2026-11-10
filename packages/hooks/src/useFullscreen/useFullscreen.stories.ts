import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useFullscreen" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Enter fullscreen" })).toBeVisible()
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Enter fullscreen" }))
    await expect(await canvas.findByText(/Permissions check failed/)).toBeVisible()
    const target = present(canvasElement.querySelector("#fullscreen-target"))
    const entered = spyOn(Element.prototype, "requestFullscreen").mockResolvedValue(undefined)
    await userEvent.click(canvas.getByRole("button", { name: "Enter fullscreen" }))
    await waitFor(() => expect(entered).toHaveBeenCalledOnce())
    const current = spyOn(Document.prototype, "fullscreenElement", "get").mockReturnValue(target)
    document.dispatchEvent(new Event("fullscreenchange"))
    await expect(await canvas.findByRole("button", { name: "Exit fullscreen" })).toBeVisible()
    const exited = spyOn(Document.prototype, "exitFullscreen").mockResolvedValue(undefined)
    await userEvent.click(canvas.getByRole("button", { name: "Exit fullscreen" }))
    await waitFor(() => expect(exited).toHaveBeenCalledOnce())
    current.mockRestore()
    document.dispatchEvent(new Event("fullscreenchange"))
    await expect(await canvas.findByRole("button", { name: "Enter fullscreen" })).toBeVisible()
    await expect(canvas.queryByText(/Permissions check failed/)).toBeNull()
    entered.mockRestore()
    exited.mockRestore()
  }
}
