import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/HueSlider" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Hue" })
    await expect(slider).toHaveAttribute("aria-valuenow", "250")
    await expect(slider).toHaveAttribute("aria-valuemax", "360")
    await expect(slider).toHaveAttribute("data-hue")
    await expect(css(slider.children[0]).backgroundImage).toContain("rgb(255, 0, 0)")
    await expect(css(present(slider.lastElementChild)).backgroundColor).toBe("rgb(42, 0, 255)")
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slider = await canvas.findByRole("slider", { name: "Hue" })
    const user = userEvent.setup()
    await user.pointer([
      {
        keys: "[MouseLeft>]",
        target: slider,
        coords: { clientX: box(slider).left + box(slider).width / 3, clientY: box(slider).top + 5 }
      },
      { keys: "[/MouseLeft]", target: slider }
    ])
    await waitFor(() => expect(canvas.getByText("Hue value: 120")).toBeVisible())
    await expect(css(present(slider.lastElementChild)).backgroundColor).toBe("rgb(0, 255, 0)")
    slider.focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "138"))
  }
}
