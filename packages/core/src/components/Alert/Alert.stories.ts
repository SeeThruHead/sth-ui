import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as CloseDemo from "./demos/close.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "Feedback/Alert" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole("alert", { name: "Alert title" })
    await expect(alert).toHaveAccessibleDescription(/Lorem ipsum dolor sit/)
    await expect(css(alert).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(alert).color).toBe("rgb(24, 100, 171)")
    await expect(css(alert).padding).toBe("16px")
    await expect(css(alert).borderTopLeftRadius).toBe("8px")
    const title = within(alert).getByText("Alert title")
    const icon = present(alert.querySelector("svg")?.parentElement)
    await expect(box(icon).width).toBe(20)
    await expect(Math.round(box(icon).left - box(alert).left)).toBe(17)
    await expect(Math.round(box(title).left - box(icon).right)).toBe(16)
    await expect(css(title).fontWeight).toBe("700")
    await expect(css(title).fontSize).toBe("14px")
    const message = within(alert).getByText(/Lorem ipsum/)
    await expect(css(message).color).toBe("rgb(0, 0, 0)")
    await expect(Math.round(box(message).top - box(title).bottom)).toBe(10)
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByRole("alert", { name: "Filled variant" })
    await expect(css(filled).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(within(filled).getByText("Alert with the filled variant")).color).toBe("rgb(255, 255, 255)")
    const outline = canvas.getByRole("alert", { name: "Outline variant" })
    await expect(css(outline).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(css(outline).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    const fallback = canvas.getByRole("alert", { name: "Default variant" })
    await expect(css(fallback).borderTopColor).toBe("rgb(206, 212, 218)")
    const white = canvas.getByRole("alert", { name: "White variant" })
    await expect(css(white).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(within(white).getByText("Alert with the white variant")).color).toBe("rgb(0, 0, 0)")
    await expect(canvas.getByRole("alert", { name: "Transparent variant" })).toHaveAttribute(
      "data-variant",
      "transparent"
    )
  }
}

export const Close: StoryObj = {
  render: demoApp(CloseDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole("alert", { name: "Bummer!" })
    await expect(css(alert).backgroundColor).toBe("rgb(250, 82, 82)")
    await expect(css(alert).borderTopLeftRadius).toBe("32px")
    const dismiss = within(alert).getByRole("button", { name: "Dismiss" })
    await expect(box(dismiss).width).toBe(20)
    await expect(css(dismiss).color).toBe("rgb(255, 255, 255)")
    await expect(within(alert).getByText("Bummer!").parentElement).toHaveAttribute("data-with-close-button")
    await expect(css(within(alert).getByText("Bummer!").parentElement).paddingRight).toBe("16px")
  }
}

export const Dismissing: StoryObj = {
  render: demoApp(CloseDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Dismiss" }))
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Show the alert again" }))
    await waitFor(() => expect(canvas.getByRole("alert", { name: "Bummer!" })).toBeVisible())
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first, plain] = await canvas.findAllByRole("alert")
    const titled = present(first)
    await expect(titled).not.toHaveAttribute("aria-labelledby")
    await expect(css(titled).color).toBe("oklch(0 0 0)")
    await expect(titled.querySelector("svg")).toBeNull()
    const status = present(canvas.getByText("Only a message").closest("[role='status']"))
    await expect(status).toHaveAttribute("aria-describedby", "message-only-body")
    await expect(status).not.toHaveAttribute("aria-labelledby")
    await expect(status).toHaveAttribute("data-variant", "light")
    await expect(css(status).backgroundColor).not.toBe("rgba(0, 0, 0, 0)")
    await expect(within(present(plain)).getByRole("button")).toBeVisible()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole("alert", { name: "Alert title" })
    await expect(css(within(alert).getByText(/Lorem ipsum/)).color).toBe("rgb(255, 255, 255)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Alert title")).toBeVisible()
  }
}
