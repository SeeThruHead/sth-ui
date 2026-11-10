import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useDocumentVisibility" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(`Tab is ${document.visibilityState}, changed 0 times`)).toBeVisible()
    document.dispatchEvent(new Event("visibilitychange"))
    await expect(await canvas.findByText(`Tab is ${document.visibilityState}, changed 1 times`)).toBeVisible()
  }
}
