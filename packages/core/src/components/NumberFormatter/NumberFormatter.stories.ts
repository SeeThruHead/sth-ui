import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo } from "../../stories/harness.ts"
import * as DecimalScaleDemo from "./demos/decimal-scale.ts"
import * as PrefixSuffixDemo from "./demos/prefix-suffix.ts"
import * as ThousandsSeparatorDemo from "./demos/thousands-separator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Data display/NumberFormatter" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const value = await within(canvasElement).findByText("$ 1,000,000")
    await expect(value.tagName).toBe("SPAN")
  }
}

export const PrefixSuffix: StoryObj = {
  render: demo(PrefixSuffixDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("$ 100")).toBeVisible()
    await expect(canvas.getByText("100 RUB")).toBeVisible()
  }
}

export const ThousandsSeparator: StoryObj = {
  render: demo(ThousandsSeparatorDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("1,000,000")).toBeVisible()
    await expect(canvas.getByText("1.000.000")).toBeVisible()
    await expect(canvas.getByText("10,00,000")).toBeVisible()
    await expect(canvas.getByText("1,0000,0000")).toBeVisible()
  }
}

export const DecimalScale: StoryObj = {
  render: demo(DecimalScaleDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("1.67")).toBeVisible()
  }
}

export const WithoutValue: StoryObj = {
  render: demo((h, ui) => h.div([h.DataAttribute("testid", "holder")], [ui.NumberFormatter(h, { prefix: "$" })])),
  play: async ({ canvasElement }) => {
    const holder = await waitFor(() => present(canvasElement.querySelector("[data-testid=holder]")))
    await expect(holder.childNodes).toHaveLength(0)
  }
}
