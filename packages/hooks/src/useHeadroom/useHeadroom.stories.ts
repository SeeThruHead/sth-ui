import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useHeadroom" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Header pinned, scrolling unknown")).toBeVisible()
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Header pinned/)
    window.scrollTo({ top: 400 })
    await expect(await canvas.findByText("Header hidden, scrolling down")).toBeInTheDocument()
    window.scrollTo({ top: 300 })
    await expect(await canvas.findByText(/scrolling up/)).toBeInTheDocument()
    window.dispatchEvent(new Event("resize"))
    window.scrollTo({ top: 500 })
    await expect(await canvas.findByText(/scrolling up/)).toBeInTheDocument()
    await waitFor(
      async () => {
        window.scrollTo({ top: window.scrollY + 10 })

        return expect(await canvas.findByText(/scrolling down/)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
    window.scrollTo({ top: 0 })
    await expect(await canvas.findByText(/Header pinned/)).toBeInTheDocument()
  }
}
