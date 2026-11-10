import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "Inputs/Fieldset" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const fieldset = await within(canvasElement).findByRole("group", { name: "Personal information" })
    await expect(fieldset.tagName).toBe("FIELDSET")
    await expect(fieldset).toHaveAttribute("data-variant", "default")
    await expect(css(fieldset).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(css(fieldset).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(fieldset).paddingTop).toBe("10px")
    await expect(css(fieldset).paddingLeft).toBe("20px")
    await expect(css(fieldset).borderTopLeftRadius).toBe("8px")
    await expect(css(fieldset.querySelector("legend")).fontSize).toBe("14px")
    await expect(within(fieldset).getByRole("textbox", { name: "Email" })).toBeEnabled()
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByTestId("filled")
    await expect(css(filled).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(filled).borderTopLeftRadius).toBe("8px")
    const unstyled = canvas.getByTestId("unstyled")
    await expect(css(unstyled).borderTopWidth).toBe("0px")
    await expect(css(unstyled).paddingTop).toBe("0px")
    await expect(css(unstyled.querySelector("legend")).marginBottom).toBe("12px")
  }
}

export const Disabled: StoryObj = {
  render: demo(DisabledDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const fieldset = await canvas.findByRole("group", { name: "Personal information" })
    await expect(fieldset).toBeDisabled()
    await expect(fieldset).toHaveAttribute("name", "personal")
    await expect(canvas.getByRole("textbox", { name: "Your name" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Submit" })).toBeDisabled()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    const filled = await within(canvasElement).findByTestId("filled")
    await expect(css(filled).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(filled).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const WithoutLegend: StoryObj = {
  render: demo((h, ui) =>
    ui.Fieldset(h, {
      attributes: { root: { "aria-label": "Address" } },
      children: [ui.Text(h, { children: ["No legend"] })]
    })
  ),
  play: async ({ canvasElement }) => {
    const fieldset = await within(canvasElement).findByRole("group", { name: "Address" })
    await expect(fieldset.querySelector("legend")).toBeNull()
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("group", { name: "Personal information" })).toBeVisible()
  }
}
