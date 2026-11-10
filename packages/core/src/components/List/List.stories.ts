import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as IconDemo from "./demos/icon.ts"
import * as NestedDemo from "./demos/nested.ts"
import * as NumberingDemo from "./demos/numbering.ts"
import * as OrderedDemo from "./demos/ordered.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Typography/List" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const list = await within(canvasElement).findByRole("list")
    await expect(list.tagName).toBe("UL")
    await expect(within(list).getAllByRole("listitem")).toHaveLength(5)
    await expect(css(list).listStyleType).toBe("disc")
    await expect(css(list).paddingLeft).toBe("20px")
    await expect(css(list).fontSize).toBe("16px")
    await expect(css(list).marginTop).toBe("0px")
  }
}

export const Ordered: StoryObj = {
  render: demo(OrderedDemo.view),
  play: async ({ canvasElement }) => {
    const list = await within(canvasElement).findByRole("list")
    await expect(list.tagName).toBe("OL")
    await expect(css(list).listStyleType).toBe("decimal")
    await expect(css(list).paddingLeft).toBe("36px")
    await expect(css(list).fontSize).toBe("18px")
    await expect(list).toHaveAttribute("data-with-padding")
  }
}

export const WithIcons: StoryObj = {
  render: demo(IconDemo.view),
  play: async ({ canvasElement }) => {
    const items = await within(canvasElement).findAllByRole("listitem")
    await expect(items[0]).toHaveAttribute("data-with-icon")
    await expect(items[0]).toHaveAttribute("data-centered")
    await expect(css(items[0]).listStyleType).toBe("none")
    await expect(css(items[1]).marginTop).toBe("10px")
    await expect(css(items[0]).marginTop).toBe("0px")
    await expect(css(items[0]?.firstElementChild).flexDirection).toBe("row")
    await expect(css(items[0]?.firstElementChild?.firstElementChild).marginRight).toBe("12px")
    await expect(items[4]?.querySelector("svg")).not.toBeNull()
  }
}

export const Nested: StoryObj = {
  render: demo(NestedDemo.view),
  play: async ({ canvasElement }) => {
    const [outer, inner, innermost] = await within(canvasElement).findAllByRole("list")
    await expect(css(outer).listStyleType).toBe("disc")
    await expect(css(inner).paddingLeft).toBe("36px")
    await expect(within(present(innermost)).getByText("Even more nested")).toBeVisible()
  }
}

export const Numbering: StoryObj = {
  render: demo(NumberingDemo.view),
  play: async ({ canvasElement }) => {
    const [start, reversed, values] = await within(canvasElement).findAllByRole("list")
    await expect(start).toHaveAttribute("start", "5")
    await expect(reversed).toHaveAttribute("reversed")
    await expect(within(present(values)).getAllByRole("listitem")[1]).toHaveAttribute("value", "5")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
