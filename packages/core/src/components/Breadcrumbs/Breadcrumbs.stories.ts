import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo } from "../../stories/harness.ts"
import * as StatesDemo from "./demos/states.ts"
import * as TextDemo from "./demos/text.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Navigation/Breadcrumbs" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first] = await canvas.findAllByRole("link", { name: "Mantine" })
    await expect(css(first).lineHeight).toBe("16px")
    await expect(css(first).whiteSpace).toBe("nowrap")
    await expect(first).toHaveAttribute("href", "#")
    const root = present(first?.parentElement)
    await expect(css(root).display).toBe("flex")
    await expect(root.children).toHaveLength(5)
    const separator = present(root.children[1])
    await expect(separator).toHaveTextContent("/")
    await expect(css(separator).marginLeft).toBe("10px")
    await expect(css(separator).color).toBe("rgb(73, 80, 87)")
    const arrows = canvas.getAllByText("→")
    await expect(arrows).toHaveLength(2)
    await expect(css(arrows[0]).marginRight).toBe("16px")
  }
}

export const Text: StoryObj = {
  render: demo(TextDemo.view),
  play: async ({ canvasElement }) => {
    const home = await within(canvasElement).findByText("Home")
    await expect(home.tagName).toBe("DIV")
    await expect(css(home).whiteSpace).toBe("nowrap")
    await expect(css(home.nextElementSibling).marginLeft).toBe("4px")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(TextDemo.view),
  play: async ({ canvasElement }) => {
    const home = await within(canvasElement).findByText("Home")
    await expect(css(home.nextElementSibling).color).toBe("rgb(130, 130, 130)")
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const docs = await within(canvasElement).findByRole("link", { name: "Docs" })
    await expect(docs).toHaveAttribute("data-crumb", "true")
    await expect(css(docs).whiteSpace).toBe("normal")
    await expect(css(docs.nextElementSibling).display).toBe("block")
  }
}
