import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useDocumentTitle" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Document title" })).toHaveValue("Inbox (3 unread)")
  }
}

export const Setting: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const before = document.title
    const input = await canvas.findByRole("textbox", { name: "Document title" })
    await userEvent.clear(input)
    await userEvent.type(input, "   ")
    await userEvent.click(canvas.getByRole("button", { name: "Set title" }))
    await expect(document.title).toBe(before)
    await userEvent.type(input, "Drafts ")
    await userEvent.click(canvas.getByRole("button", { name: "Set title" }))
    await waitFor(() => expect(document.title).toBe("Drafts"))
  }
}
