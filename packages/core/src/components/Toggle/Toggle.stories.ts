import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as AutoWidthDemo from "./demos/auto-width.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "Buttons/Toggle" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const bold = await within(canvasElement).findByRole("button", { name: "Bold", pressed: false })
    await expect(bold).toHaveAttribute("type", "button")
    await expect(box(bold).width).toBe(30)
    await expect(css(bold).paddingLeft).toBe("6px")
    await expect(css(bold).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(bold).borderTopColor).toBe("rgb(206, 212, 218)")
    await expect(css(bold).color).toBe("rgb(73, 80, 87)")
    await expect(css(bold).borderTopLeftRadius).toBe("8px")
    await expect(box(bold.querySelector("svg")).width).toBe(16)
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Italic" }))
    const italic = await canvas.findByRole("button", { name: "Italic", pressed: true })
    await expect(italic).toHaveAttribute("data-active")
    await expect(css(italic).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(italic).color).toBe("rgb(255, 255, 255)")
    await expect(css(italic).borderTopColor).toBe("rgba(0, 0, 0, 0)")
    await user.click(italic)
    await waitFor(() => expect(canvas.getByRole("button", { name: "Italic", pressed: false })).toBeVisible())
    await user.keyboard("{Enter}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Italic", pressed: true })).toBeVisible())
    await expect(canvas.getByRole("button", { name: "Bold", pressed: false })).toBeVisible()
  }
}

export const AutoContrast: StoryObj = {
  render: demo(AutoContrastDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const without = await canvas.findByRole("button", { name: "Without autoContrast" })
    await expect(css(without).backgroundColor).toBe("rgb(169, 227, 75)")
    await expect(css(without).color).toBe("rgb(255, 255, 255)")
    await expect(["rgb(0, 0, 0)", "oklch(0 0 0)"]).toContain(
      css(canvas.getByRole("button", { name: "With autoContrast" })).color
    )
  }
}

export const AutoWidth: StoryObj = {
  render: demo(AutoWidthDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const save = await canvas.findByRole("button", { name: "Save" })
    await expect(save).toHaveAttribute("data-auto-width")
    await expect(css(save).paddingLeft).toBe("7.5px")
    await expect(box(save).width).toBeGreaterThan(30)
    await expect(css(save).fontSize).toBe("12px")
    const disabled = canvas.getByRole("button", { name: "Disabled" })
    await expect(disabled).toBeDisabled()
    await expect(disabled).toHaveAttribute("aria-disabled", "true")
    await expect(disabled).toHaveAttribute("tabindex", "-1")
    await expect(css(disabled).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(disabled).cursor).toBe("not-allowed")
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bg = async (name: string) => css(await canvas.findByRole("button", { name })).backgroundColor
    await expect(await bg("light")).toBe("rgb(208, 235, 255)")
    await expect(await bg("outline")).toBe("rgba(0, 0, 0, 0)")
    await expect(css(canvas.getByRole("button", { name: "outline" })).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(await bg("default")).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByRole("button", { name: "white" })).color).toBe("rgb(34, 139, 230)")
    await expect(box(canvas.getByRole("button", { name: "Size xs" })).width).toBe(22)
    await expect(box(canvas.getByRole("button", { name: "Size xl" })).width).toBe(42)
    await expect(css(canvas.getByRole("button", { name: "Size xl" })).borderTopLeftRadius).toBe("32px")
    await expect(box(canvas.getByRole("button", { name: "Grape" })).width).toBe(48)
    await expect(await bg("Grape")).toBe("rgb(190, 75, 219)")
    const both = canvas.getByRole("button", { name: "Active and disabled" })
    await expect(css(both).backgroundColor).toBe("rgb(206, 212, 218)")
    await expect(css(both).color).toBe("rgb(134, 142, 150)")
    await expect(box(both).width).toBe(40)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const bold = await within(canvasElement).findByRole("button", { name: "Bold" })
    await expect(css(bold).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(bold).borderTopColor).toBe("rgb(66, 66, 66)")
    await expect(css(bold).color).toBe("rgb(184, 184, 184)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
