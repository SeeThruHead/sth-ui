import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as RadiusShadowBorderDemo from "./demos/radius-shadow-border.ts"

const meta: Meta = { title: "Miscellaneous/Paper" }

export default meta

const style = (element: HTMLElement) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const paper = (await within(canvasElement).findByText("Paper is the most basic ui component")).parentElement
    await expect(paper).not.toBeNull()
    await expect(style(present(paper)).boxShadow).toContain("rgba(0, 0, 0, 0.05)")
    await expect(style(present(paper)).borderTopLeftRadius).toBe("8px")
    await expect(style(present(paper)).backgroundColor).toBe("rgb(255, 255, 255)")
  }
}

export const RadiusShadowBorder: StoryObj = {
  render: demo(RadiusShadowBorderDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const border = await canvas.findByText("With border")
    await expect(border).toHaveAttribute("data-with-border")
    await expect(style(border).borderTopStyle).toBe("solid")
    await expect(style(border).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(style(canvas.getByText("Radius xl, shadow md")).borderTopLeftRadius).toBe("32px")
    const square = canvas.getByText("Square, custom shadow")
    await expect(style(square).borderTopLeftRadius).toBe("0px")
    await expect(style(square).boxShadow).toBe("rgb(255, 0, 0) 0px 0px 0px 3px")
    await expect(canvas.getByText("A section").tagName).toBe("SECTION")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Paper is the most basic ui component")).toBeVisible()
  }
}
