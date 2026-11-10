import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useEyeDropper" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No color picked yet")).toBeVisible()
  }
}

const dropper = (open: () => Promise<unknown>) =>
  class {
    readonly open = open
  }

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Pick a color" })
    const original: unknown = Reflect.get(window, "EyeDropper")
    Reflect.set(
      window,
      "EyeDropper",
      dropper(() => Promise.resolve({ sRGBHex: "#ff8800" }))
    )
    await userEvent.click(button)
    await expect(await canvas.findByText("Picked color: #ff8800")).toBeVisible()
    Reflect.set(
      window,
      "EyeDropper",
      dropper(() => Promise.reject(new Error("aborted")))
    )
    await userEvent.click(button)
    await expect(await canvas.findByText("Could not pick: Error: aborted")).toBeVisible()
    Reflect.set(
      window,
      "EyeDropper",
      dropper(() => Promise.resolve({ color: "red" }))
    )
    await userEvent.click(button)
    await expect(await canvas.findByText(/Could not pick: .*sRGBHex/)).toBeVisible()
    Reflect.set(window, "EyeDropper", original)
  }
}
