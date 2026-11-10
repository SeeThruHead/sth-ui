import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demo } from "./harness.ts"
import * as GalleryDemo from "./demos/gallery.ts"
import * as WeightsDemo from "./demos/weights.ts"
import * as SizesAndColorsDemo from "./demos/sizes-and-colors.ts"

const meta: Meta = { title: "Guides/Icons" }

export default meta

export const Gallery: StoryObj = {
  render: demo(GalleryDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const house = await canvas.findByRole("img", { name: "House" })
    await expect(canvas.getAllByRole("img")).toHaveLength(12)
    await expect(house.getBoundingClientRect().width).toBe(28)
    await expect(house).toHaveAttribute("data-icon", "house")
  }
}

export const Weights: StoryObj = {
  render: demo(WeightsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const duotone = await canvas.findByRole("img", { name: "duotone heart" })
    await expect(duotone.querySelectorAll("path")).toHaveLength(2)
    await expect(canvas.getByRole("img", { name: "fill heart" }).querySelectorAll("path")).toHaveLength(1)
  }
}

export const SizesAndColors: StoryObj = {
  render: demo(SizesAndColorsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findByRole("img", { name: "Small star" })).getBoundingClientRect().width).toBe(16)
    await expect(canvas.getByRole("img", { name: "Blue star" }).getBoundingClientRect().width).toBe(48)
    await expect(canvas.getByRole("img", { name: "Blue star" })).toHaveAttribute("fill", "#228be6")
    const inherited = canvas.getByRole("img", { name: "Inherits the text colour" })
    await expect(getComputedStyle(inherited).color).toBe("rgb(190, 75, 219)")
    await expect(inherited.getBoundingClientRect().width).toBe(16)
  }
}
