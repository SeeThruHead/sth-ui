import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useCollapse" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Expand" })).toBeVisible()
    await expect(
      present(canvasElement.querySelector<HTMLElement>("[data-collapse]")).getBoundingClientRect().height
    ).toBe(0)
  }
}

export const Expanding: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Expand" }))
    const region = present(canvasElement.querySelector<HTMLElement>("[data-collapse]"))
    await waitFor(() => expect(region.getBoundingClientRect().height).toBeGreaterThan(10), { timeout: 2000 })
  }
}
