import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DividerDemo from "./demos/divider.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalDemo from "./demos/vertical.ts"

const meta: Meta = { title: "DataDisplay/DataList" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const term = async (canvasElement: HTMLElement, text: string, index = 0) =>
  present((await within(canvasElement).findAllByText(text))[index])

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const name = await term(canvasElement, "Name")
    const value = await term(canvasElement, "John Doe")
    await expect(name.tagName).toBe("DT")
    await expect(value.tagName).toBe("DD")
    await expect(present(name.closest("dl"))).toHaveAttribute("data-orientation", "horizontal")
    await expect(css(name).color).toBe("rgb(134, 142, 150)")
    await expect(css(name).fontSize).toBe("14px")
    await expect(box(name).width).toBe(120)
    await expect(Math.round(box(value).left - box(name).right)).toBe(10)
    await expect(Math.round(box(name).top)).toBe(Math.round(box(value).top))
    const email = await term(canvasElement, "Email")
    await expect(Math.round(box(email).top - box(name).bottom)).toBe(12)
    await expect(css(present(email.parentElement)).borderTopWidth).toBe("0px")
  }
}

export const Divider: StoryObj = {
  render: demo(DividerDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const name = await term(canvasElement, "Name")
    const email = await term(canvasElement, "Email")
    await expect(present(name.closest("dl"))).toHaveAttribute("data-with-divider")
    await expect(css(present(name.parentElement)).borderTopWidth).toBe("0px")
    const row = present(email.parentElement)
    await expect(css(row).borderTopWidth).toBe("1px")
    await expect(css(row).borderTopColor).toBe("rgb(206, 212, 218)")
    await expect(css(row).paddingTop).toBe("12px")
    await expect(css(row).marginTop).toBe("12px")
  }
}

export const Vertical: StoryObj = {
  render: demo(VerticalDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const name = await term(canvasElement, "Name")
    const value = await term(canvasElement, "John Doe")
    await expect(present(name.closest("dl"))).toHaveAttribute("data-orientation", "vertical")
    await expect(Math.round(box(value).top)).toBe(Math.round(box(name).bottom))
    await expect(Math.round(box(value).left)).toBe(Math.round(box(name).left))
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const name = await term(canvasElement, "Name")
    await expect(css(name).fontSize).toBe("18px")
    await expect(box(name).width).toBe(200)
    const email = await term(canvasElement, "Email")
    await expect(Math.round(box(email).top - box(name).bottom)).toBe(32)
    const plan = await term(canvasElement, "Plan")
    await expect(css(plan).fontSize).toBe("12px")
    await expect(box(plan).width).toBe(64)
    await expect(within(canvasElement).getByText("Pro").tagName).toBe("STRONG")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(DividerDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const email = await term(canvasElement, "Email")
    await expect(css(email).color).toBe("rgb(130, 130, 130)")
    await expect(css(present(email.parentElement)).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("John Doe")).toBeVisible()
  }
}
