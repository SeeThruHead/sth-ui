import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo } from "../../stories/harness.ts"
import * as LabelsDemo from "./demos/labels.ts"
import * as OrientationDemo from "./demos/orientation.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "Miscellaneous/Divider" }

export default meta

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const divider = await within(canvasElement).findByRole("separator")
    await expect(divider).toHaveAttribute("aria-orientation", "horizontal")
    await expect(css(divider).borderTopWidth).toBe("1px")
    await expect(css(divider).borderTopStyle).toBe("solid")
    await expect(css(divider).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(css(divider).marginTop).toBe("16px")
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    const dividers = await within(canvasElement).findAllByRole("separator")
    await expect(dividers.map((divider) => css(divider).borderTopStyle)).toEqual(["solid", "dashed", "dotted"])
  }
}

export const Labels: StoryObj = {
  render: demo(LabelsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = present((await canvas.findByText("Label on the left")).closest("[role=separator]"))
    await expect(left).toHaveAttribute("data-with-label")
    await expect(css(left).borderTopWidth).toBe("0px")
    const label = canvas.getByText("Label on the left")
    await expect(css(label, "::before").display).toBe("none")
    await expect(css(label, "::after").borderTopWidth).toBe("1px")
    await expect(css(label).fontSize).toBe("12px")
    await expect(css(label).color).toBe("rgb(134, 142, 150)")
    await expect(css(canvas.getByText("Label on the right"), "::after").display).toBe("none")
    const center = canvas.getByText("Label in the center")
    await expect(css(center, "::before").display).toBe("block")
    await expect(center).toHaveAttribute("data-position", "center")
    await expect(css(canvas.getByText("Search results").parentElement?.parentElement, "::before").borderTopStyle).toBe(
      "dashed"
    )
    await expect(canvas.getByRole("link", { name: "Link label" })).toHaveAttribute("href", "https://mantine.dev")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const widths = await Promise.all(
      ["xs", "sm", "md", "lg", "xl", "10"].map(async (size) => css(await canvas.findByTestId(size)).borderTopWidth)
    )
    await expect(widths).toEqual(["1px", "2px", "3px", "4px", "5px", "10px"])
  }
}

export const Orientation: StoryObj = {
  render: demo(OrientationDemo.view),
  play: async ({ canvasElement }) => {
    const dividers = await within(canvasElement).findAllByRole("separator")
    await expect(dividers[0]).toHaveAttribute("aria-orientation", "vertical")
    await expect(css(dividers[0]).borderLeftWidth).toBe("1px")
    await expect(css(dividers[0]).alignSelf).toBe("stretch")
    await expect(present(dividers[0]).getBoundingClientRect().height).toBeGreaterThan(10)
    await expect(css(dividers[4]).borderLeftWidth).toBe("5px")
    await expect(css(dividers[5]).borderLeftWidth).toBe("8px")
    await expect(css(dividers[5]).borderLeftColor).toBe("rgb(190, 75, 219)")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const divider = await within(canvasElement).findByRole("separator")
    await expect(css(divider).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}
