import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as TimeoutDemo from "./demos/timeout.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Buttons/CopyButton" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const pause = async (ms: number) => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(ms), { timeout: ms + 1000 })
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Copy url" })
    await expect(css(button).backgroundColor).toBe("rgb(34, 139, 230)")
  }
}

export const Copying: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Copy url" }))
    const copied = await canvas.findByRole("button", { name: "Copied url" })
    await expect(css(copied).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(await navigator.clipboard.readText()).toBe("https://mantine.dev")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Copy url" })).toBeVisible(), { timeout: 2000 })
  }
}

export const Timeout: StoryObj = {
  render: demoApp(TimeoutDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Copy" })).toBeVisible()
  }
}

export const WaitingLonger: StoryObj = {
  render: demoApp(TimeoutDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Copy" }))
    await expect(await canvas.findByRole("button", { name: "Copied" })).toBeVisible()
    await pause(1300)
    await expect(canvas.getByRole("button", { name: "Copied" })).toBeVisible()
    await waitFor(() => expect(canvas.getByRole("button", { name: "Copy" })).toBeVisible(), { timeout: 2000 })
  }
}
