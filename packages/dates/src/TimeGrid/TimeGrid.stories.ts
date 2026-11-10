import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configureApp, demoApp } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/TimeGrid" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Slot at 10:00" })).toHaveAttribute("data-active")
    await expect(canvas.getByRole("button", { name: "Slot at 12:00" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "5:00:00 p.m." })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "8:00:30 p.m." })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "6:30:00 p.m." })).not.toBeDisabled()
    await expect(canvas.getByRole("button", { name: "09:00" })).toHaveAttribute("data-active")
    await expect(canvas.getByRole("button", { name: "09:00" })).toBeDisabled()
    await expect(getComputedStyle(canvas.getByRole("button", { name: "6:30:00 p.m." })).borderTopLeftRadius).toBe(
      "32px"
    )
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Slot at 13:00" }))
    await expect(await canvas.findByText("Slot: 13:00")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Slot at 13:00" }))
    await expect(await canvas.findByText("Slot: none")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "6:30:00 p.m." }))
    await expect(await canvas.findByText("Evening: 18:30:00")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "6:30:00 p.m." }))
    await expect(canvas.getByText("Evening: 18:30:00")).toBeVisible()
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Slot at 10:00" })).toBeVisible()
  }
}
