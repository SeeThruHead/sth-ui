import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demo, story } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as SizesDemo from "./demos/sizes.ts"

const meta: Meta = { title: "Buttons/CloseButton" }

export default meta

const css = (element: Element) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const close = await within(canvasElement).findByRole("button", { name: "Close" })
    await expect(close.getBoundingClientRect().width).toBe(28)
    await expect(css(close).color).toBe("rgb(73, 80, 87)")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const close = await canvas.findByRole("button", { name: "Close modal" })
    await expect(close.getBoundingClientRect().width).toBe(28)
    await expect(css(close).color).toBe("rgb(73, 80, 87)")
    await expect(canvas.getByRole("button", { name: "Close xs" }).getBoundingClientRect().width).toBe(18)
    await expect(canvas.getByRole("button", { name: "Close xl" }).getBoundingClientRect().width).toBe(44)
    const custom = canvas.getByRole("button", { name: "Close custom" })
    await expect(custom.getBoundingClientRect().width).toBe(40)
    await expect(custom.querySelector("svg")?.getBoundingClientRect().width).toBe(14)
    await expect(css(custom).borderTopLeftRadius).toBe("32px")
  }
}

export const Disabled: StoryObj = {
  render: story(({ h, ui, log }) =>
    ui.CloseButton(h, { disabled: true, onClick: log("closed"), label: "Close disabled" })
  ),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Close disabled" })
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute("data-disabled")
    await expect(css(button).opacity).toBe("0.6")
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, log }) =>
    ui.CloseButton(h, {
      onClick: log("closed"),
      label: "Close with text",
      icon: h.span([h.AriaHidden(true)], ["✕"]),
      children: [" text"]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Close with text" })
    await expect(button).toHaveTextContent("✕ text")
    await userEvent.hover(button)
    await userEvent.click(button)
    await waitFor(() => expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("closed"))
  }
}
