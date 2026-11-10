import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"

import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"

import * as UsageDemo from "./demos/usage.ts"
import * as ContainerQueriesDemo from "./demos/container-queries.ts"
import * as MinColumnWidthDemo from "./demos/min-column-width.ts"
import * as ResponsiveDemo from "./demos/responsive.ts"
const meta: Meta = { title: "Layout/SimpleGrid" }

export default meta

const columnsOf = (cell: HTMLElement): number =>
  getComputedStyle(present(cell.parentElement)).gridTemplateColumns.split(" ").length

const responsive = demo(ResponsiveDemo.view)

export const Usage: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByText("1")
    await expect(columnsOf(first)).toBe(3)
    await expect(getComputedStyle(present(first.parentElement)).columnGap).toBe("20px")
    await expect(getComputedStyle(present(first.parentElement)).rowGap).toBe("10px")
  }
}

export const ResponsiveOnPhone: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByText("Cell 1")
    await expect(columnsOf(first)).toBe(1)
    await expect(getComputedStyle(present(first.parentElement)).columnGap).toBe("10px")
  }
}

export const ResponsiveOnDesktop: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByText("Cell 1")
    await expect(columnsOf(first)).toBe(5)
    await expect(getComputedStyle(present(first.parentElement)).columnGap).toBe("32px")
  }
}

export const ContainerQueries: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: demo(ContainerQueriesDemo.view),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByText("Cell 1")
    await expect(window.innerWidth).toBeGreaterThan(1200)
    await expect(columnsOf(first)).toBe(2)
    await expect(getComputedStyle(present(first.parentElement?.parentElement)).containerType).toBe("inline-size")
  }
}

export const MinColumnWidth: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: demo(MinColumnWidthDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [fill, fit] = await canvas.findAllByText("Cell 1")
    await expect(columnsOf(present(fill))).toBe(3)
    await expect(fit?.getBoundingClientRect().width).toBeGreaterThan(300)
    await expect(fit?.getBoundingClientRect().height).toBe(60)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("5")).toBeVisible()
  }
}
