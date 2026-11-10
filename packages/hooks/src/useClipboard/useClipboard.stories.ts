import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useClipboard" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Copy" })).toBeVisible()
  }
}

export const Copying: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Copy" }))
    await expect(await canvas.findByRole("button", { name: "Copied" })).toBeVisible()
    await expect(await navigator.clipboard.readText()).toBe("Hello, world!")
    await expect(await canvas.findByRole("button", { name: "Copy" }, { timeout: 3000 })).toBeVisible()
    const failing = spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"))
    await userEvent.click(canvas.getByRole("button", { name: "Copy" }))
    await expect(await canvas.findByText("Could not copy: Error: denied")).toBeVisible()
    failing.mockRestore()
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }))
    await waitFor(() => expect(canvas.queryByText("Could not copy: Error: denied")).toBeNull())
  }
}
