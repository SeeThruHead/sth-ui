import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo } from "../../stories/harness.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Affix" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const button = await screen.findByRole("button", { name: "Scroll to top" })
    await expect(canvasElement.contains(button)).toBe(false)
    await expect(present(button.closest("[data-portal]"))).toBeInTheDocument()
    const affix = present(button.parentElement)
    await expect(css(affix).position).toBe("fixed")
    await expect(css(affix).zIndex).toBe("200")
    await expect(box(affix).left).toBe(20)
    await expect(Math.round(document.documentElement.clientHeight - box(affix).bottom)).toBe(20)
    await expect(within(canvasElement).getByText("Affix is located at the bottom of the screen")).toBeVisible()
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const corner = present((await screen.findByText("Corner")).closest("[data-portal]")?.firstElementChild)
    await expect(Math.round(document.documentElement.clientWidth - box(corner).right)).toBe(0)
    await expect(Math.round(document.documentElement.clientHeight - box(corner).bottom)).toBe(0)
    const inPlace = await within(canvasElement).findByText("In place")
    const fixed = present(inPlace.closest("div")?.parentElement)
    await expect(inPlace.closest("[data-portal]")).toBeNull()
    await expect(css(fixed).zIndex).toBe("50")
    await expect(box(fixed).top).toBe(16)
    await expect(Math.round(document.documentElement.clientWidth - box(fixed).right)).toBe(32)
  }
}
