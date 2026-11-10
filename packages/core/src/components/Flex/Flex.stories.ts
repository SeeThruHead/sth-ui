import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"

import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as ResponsiveDemo from "./demos/responsive.ts"

const meta: Meta = { title: "Layout/Flex" }

export default meta

const parent = (element: HTMLElement) => getComputedStyle(present(element.parentElement))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByRole("button", { name: "Button 1" })
    await expect(getComputedStyle(first).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(parent(first).display).toBe("flex")
    await expect(parent(first).columnGap).toBe("16px")
    await expect(parent(first).alignItems).toBe("flex-start")
  }
}

const responsive = demo(ResponsiveDemo.view)

export const ResponsiveOnPhone: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    const one = await within(canvasElement).findByRole("button", { name: "One" })
    await expect(parent(one).flexDirection).toBe("column")
    await expect(parent(one).rowGap).toBe("4px")
    await expect(present(one.parentElement).tagName).toBe("SECTION")
  }
}

export const ResponsiveOnDesktop: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    const one = await within(canvasElement).findByRole("button", { name: "One" })
    await expect(parent(one).flexDirection).toBe("row")
    await expect(parent(one).justifyContent).toBe("center")
    await expect(parent(one).columnGap).toBe("40px")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
