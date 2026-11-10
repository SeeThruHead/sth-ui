import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"

import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"

import { present } from "../../stories/dom.ts"

import * as UsageDemo from "./demos/usage.ts"
import * as OffsetAutoAndContentDemo from "./demos/offset-auto-and-content.ts"
import * as GrowAndColumnsDemo from "./demos/grow-and-columns.ts"
import * as ContainerQueriesDemo from "./demos/container-queries.ts"
import * as ResponsiveDemo from "./demos/responsive.ts"
const meta: Meta = { title: "Layout/Grid", globals: { viewport: { value: "wide", isRotated: false } } }

export default meta

const width = (element: HTMLElement | null | undefined) => element?.getBoundingClientRect().width ?? 0

const left = (element: HTMLElement | null | undefined) => element?.getBoundingClientRect().left ?? 0

const colOf = async (canvasElement: HTMLElement, label: string) =>
  (await within(canvasElement).findByText(label)).parentElement

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const first = await colOf(canvasElement, "1")
    await expect(first).toHaveAttribute("data-with-col-vars")
    await expect(canvasElement.querySelector("[data-with-gap]")).not.toBeNull()
    await expect(width(first)).toBeCloseTo((900 - 2 * 16) / 3, 0)
    await expect(left(await colOf(canvasElement, "2")) - left(first)).toBeCloseTo((900 - 32) / 3 + 16, 0)
  }
}

export const OffsetAutoAndContent: StoryObj = {
  render: demo(OffsetAutoAndContentDemo.view),
  play: async ({ canvasElement }) => {
    const offset = await colOf(canvasElement, "Offset 3, span 3")
    await expect(left(offset) - left(offset?.parentElement)).toBeCloseTo(225, 0)
    await expect(width(offset)).toBeCloseTo(225, 0)
    const content = await colOf(canvasElement, "Content")
    const auto = await colOf(canvasElement, "Auto fills the rest")
    const two = await colOf(canvasElement, "Span 2")
    await expect(width(content) + width(auto) + width(two) + 20).toBeCloseTo(900, 0)
    await expect(width(content)).toBeLessThan(120)
  }
}

export const GrowAndColumns: StoryObj = {
  render: demo(GrowAndColumnsDemo.view),
  play: async ({ canvasElement }) => {
    await expect(width(await colOf(canvasElement, "Grown"))).toBeCloseTo(900, 0)
    await expect(width(await colOf(canvasElement, "Span 6 of 24"))).toBeCloseTo(225, 0)
    await expect(width(await colOf(canvasElement, "Full width by default"))).toBeCloseTo(900, 0)
    const centred = await colOf(canvasElement, "Centred")
    const inner = centred?.parentElement
    await expect(getComputedStyle(present(inner)).justifyContent).toBe("center")
    await expect(getComputedStyle(present(inner?.parentElement)).overflow).toBe("hidden")
  }
}

const responsive = demo(ResponsiveDemo.view)

export const ResponsiveOnPhone: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    const first = await colOf(canvasElement, "First")
    const second = await colOf(canvasElement, "Second")
    await expect(width(first)).toBeCloseTo(width(first?.parentElement), 0)
    await expect((second?.getBoundingClientRect().top ?? 0) < (first?.getBoundingClientRect().top ?? 0)).toBe(true)
    await expect(getComputedStyle(present(first?.parentElement)).rowGap).toBe("5px")
  }
}

export const ResponsiveOnDesktop: StoryObj = {
  render: responsive,
  play: async ({ canvasElement }) => {
    const first = await colOf(canvasElement, "First")
    const second = await colOf(canvasElement, "Second")
    await expect(left(first) < left(second)).toBe(true)
    await expect(getComputedStyle(present(first?.parentElement)).columnGap).toBe("32px")
    await expect(getComputedStyle(present(second)).alignSelf).toBe("center")
  }
}

export const ContainerQueries: StoryObj = {
  render: demo(ContainerQueriesDemo.view),
  play: async ({ canvasElement }) => {
    const half = await colOf(canvasElement, "Half from xs")
    await expect(width(half)).toBeCloseTo((700 - 16) / 2, 0)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("1")).toBeVisible()
  }
}
