import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ComponentDemo from "./demos/component.ts"
import * as ShadowDemo from "./demos/shadow.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "DataDisplay/ColorSwatch" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const layers = (swatch: HTMLElement) => [...swatch.children]

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const teal = await canvas.findByRole("img", { name: "Teal" })
    await expect(box(teal).width).toBe(28)
    await expect(box(teal).height).toBe(28)
    await expect(css(teal).borderTopLeftRadius).toBe("1000px")
    const [alpha, shadow, color, children] = layers(teal)
    await expect(css(alpha).backgroundImage).toContain("linear-gradient")
    await expect(css(alpha).backgroundSize).toBe("8px 8px, 8px 8px, 8px 8px, 8px 8px")
    await expect(css(shadow).boxShadow).toContain("inset")
    await expect(css(color).backgroundColor).toBe("rgb(0, 151, 144)")
    await expect(css(children).zIndex).toBe("2")
    await expect(css(layers(canvas.getByRole("img", { name: "Translucent pink" }))[2]).backgroundColor).toBe(
      "rgba(234, 22, 174, 0.5)"
    )
    await expect(css(layers(canvas.getByRole("img", { name: "Orange" }))[2]).backgroundColor).toBe("rgb(255, 146, 43)")
  }
}

export const Shadow: StoryObj = {
  render: demo(ShadowDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(layers(await canvas.findByRole("img", { name: "With shadow" }))).toHaveLength(4)
    await expect(layers(canvas.getByRole("img", { name: "Without shadow" }))).toHaveLength(3)
  }
}

export const Component: StoryObj = {
  render: demoApp(ComponentDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const swatch = await within(canvasElement).findByRole("button", { name: "Grape, chosen" })
    await expect(swatch).toHaveAttribute("type", "button")
    await expect(css(swatch).cursor).toBe("pointer")
    await expect(css(swatch).color).toBe("rgb(255, 255, 255)")
    await expect(swatch.querySelector("svg")).not.toBeNull()
  }
}

export const Toggling: StoryObj = {
  render: demoApp(ComponentDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Grape, chosen" }))
    const plain = await canvas.findByRole("button", { name: "Grape" })
    await expect(plain.querySelector("svg")).toBeNull()
    await userEvent.click(plain)
    await waitFor(() => expect(canvas.getByRole("button", { name: "Grape, chosen" })).toBeVisible())
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const square = await canvas.findByRole("img", { name: "Blue square" })
    await expect(box(square).width).toBe(40)
    await expect(css(square).borderTopLeftRadius).toBe("4px")
    await expect(css(layers(square)[2]).backgroundColor).toBe("rgb(34, 139, 230)")
    const small = canvas.getByRole("img", { name: "Small red" })
    await expect(small.tagName).toBe("SPAN")
    await expect(box(small).width).toBe(20)
    const plain = present(small.nextElementSibling)
    await expect(plain).not.toHaveAttribute("role")
    await expect(plain).not.toHaveAttribute("aria-label")
    await expect(box(plain).width).toBe(28)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(ShadowDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const swatch = await within(canvasElement).findByRole("img", { name: "With shadow" })
    await expect(css(layers(swatch)[0]).backgroundImage).toContain("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
