import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configureApp, demoApp } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/TimeInput" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByLabelText("Input label")
    await expect(plain).toHaveAttribute("type", "time")
    await expect(plain).toHaveAttribute("step", "60")
    await expect(canvas.getByLabelText("With seconds")).toHaveAttribute("step", "1")
    await expect(canvas.getByLabelText("With seconds")).toHaveValue("12:30:15")
    await expect(canvas.getByLabelText("Read only")).toHaveValue("08:15")
    await expect(getComputedStyle(plain).paddingTop).toBe("0px")
  }
}

export const Limits: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const limited = await canvas.findByLabelText("Between 09:00 and 17:00")
    await fireEvent.input(limited, { target: { value: "18:30" } })
    await expect(await canvas.findByText(/· 18:30$/)).toBeVisible()
    await userEvent.click(limited)
    await userEvent.click(canvas.getByLabelText("Input label"))
    await waitFor(() => expect(limited).toHaveValue("17:00"))
    await fireEvent.input(limited, { target: { value: "07:00" } })
    await expect(await canvas.findByText(/· 07:00$/)).toBeVisible()
    await fireEvent.blur(limited)
    await waitFor(() => expect(limited).toHaveValue("09:00"))
    await fireEvent.input(limited, { target: { value: "12:00" } })
    await fireEvent.blur(limited)
    await expect(await canvas.findByText(/· 12:00$/)).toBeVisible()
    await fireEvent.input(canvas.getByLabelText("Input label"), { target: { value: "06:45" } })
    await expect(await canvas.findByText(/^06:45 ·/)).toBeVisible()
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
