import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/AlphaSlider" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const thumbOf = (slider: HTMLElement) => present(slider.lastElementChild)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Alpha" })
    await expect(slider).toHaveAttribute("aria-valuenow", "0.55")
    await expect(slider).toHaveAttribute("aria-valuemax", "1")
    await expect(slider).toHaveAttribute("aria-valuemin", "0")
    await expect(slider).toHaveAttribute("data-alpha")
    await expect(box(slider).height).toBe(18)
    await expect(slider.children).toHaveLength(4)
    await expect(css(slider.children[1]).backgroundImage).toBe(
      "linear-gradient(90deg, rgba(0, 0, 0, 0), rgb(28, 126, 214))"
    )
    await expect(css(slider.children[0]).backgroundImage).toContain("linear-gradient(45deg")
    const thumb = thumbOf(slider)
    await expect(box(thumb).width).toBe(16)
    await expect(Math.round(box(thumb).left + 8 - box(slider).left)).toBe(Math.round(box(slider).width * 0.55))
    await expect(css(thumb).borderTopColor).toBe("rgb(255, 255, 255)")
  }
}

export const Dragging: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slider = await canvas.findByRole("slider", { name: "Alpha" })
    const at = (fraction: number) => ({
      clientX: box(slider).left + box(slider).width * fraction,
      clientY: box(slider).top + box(slider).height / 2
    })
    const user = userEvent.setup()
    await user.pointer({ keys: "[MouseLeft>]", target: slider, coords: at(0.8) })
    await waitFor(() => expect(canvas.getByText(/scrubbing/)).toBeVisible())
    await expect(slider).toHaveAttribute("aria-valuenow", "0.8")
    await user.pointer([
      { target: slider, coords: at(0.2) },
      { keys: "[/MouseLeft]", target: slider, coords: at(0.2) }
    ])
    await waitFor(() => expect(canvas.getByText("Alpha value: 0.2, ended 0.2")).toBeVisible())
    await expect(slider).toHaveAttribute("tabindex", "-1")
    await expect(box(thumbOf(slider)).width).toBe(22)
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Alpha" })
    await userEvent.tab()
    await expect(slider).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "0.6"))
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "0.5"))
    await expect(css(thumbOf(slider)).outlineStyle).toBe("solid")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Alpha" })
    await expect(css(slider.children[0]).backgroundImage).toContain("rgb(66, 66, 66)")
  }
}
