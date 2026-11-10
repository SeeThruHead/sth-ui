import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as CollapseFromDemo from "./demos/collapse-from.ts"
import * as HoverCardDemo from "./demos/hover-card.ts"
import * as MaxRowsDemo from "./demos/max-rows.ts"
import * as MaxVisibleDemo from "./demos/max-visible.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Data display/OverflowList" }

export default meta

const resizableOf = async (canvasElement: HTMLElement) => within(canvasElement).findByTestId("resizable")

const rootOf = async (canvasElement: HTMLElement) => present((await resizableOf(canvasElement)).firstElementChild)

const shown = (root: Element) => Array.from(root.children).filter((child) => !child.hasAttribute("aria-hidden"))

const textsOf = (root: Element) => shown(root).map((child) => child.textContent)

const hiddenCount = (texts: ReadonlyArray<string | null>) =>
  texts.reduce((total, text) => total + Number(/^\+(\d+) more$/.exec(text ?? "")?.[1] ?? 0), 0)

const rowsOf = (root: Element) =>
  new Set(shown(root).map((child) => Math.round(child.getBoundingClientRect().top))).size

const settled = async (root: Element, rows = 1) => {
  await waitFor(() => expect(textsOf(root).length).toBeGreaterThan(0))
  await waitFor(() =>
    expect(textsOf(root).length - Math.sign(hiddenCount(textsOf(root))) + hiddenCount(textsOf(root))).toBe(16)
  )
  await waitFor(() => expect(rowsOf(root)).toBe(rows))
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const root = await rootOf(canvasElement)
    await settled(root)
    await expect(rowsOf(root)).toBe(1)
    await expect(textsOf(root)[0]).toBe("Apple")
    await expect(getComputedStyle(root).columnGap).toBe("4px")
    await expect(getComputedStyle(root).flexWrap).toBe("wrap")
  }
}

export const Resizing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const resizable = await resizableOf(canvasElement)
    const root = present(resizable.firstElementChild)
    await settled(root)
    resizable.style.setProperty("width", "260px")
    await waitFor(() => expect(textsOf(root).at(-1)).toMatch(/^\+\d+ more$/))
    await settled(root)
    await waitFor(() => expect(rowsOf(root)).toBe(1))
    await expect(textsOf(root).slice(0, 2)).toEqual(["Apple", "Banana"])
    resizable.style.setProperty("width", "60px")
    await waitFor(() => expect(textsOf(root)).toEqual(["+16 more"]))
    resizable.style.setProperty("max-width", "none")
    resizable.style.setProperty("width", "2000px")
    await waitFor(() => expect(textsOf(root)).toHaveLength(16))
    await expect(textsOf(root).at(-1)).toBe("Papaya")
    resizable.style.setProperty("width", "260px")
    await waitFor(() => expect(textsOf(root).at(-1)).toMatch(/^\+\d+ more$/))
  }
}

export const MaxRows: StoryObj = {
  render: demoApp(MaxRowsDemo),
  play: async ({ canvasElement }) => {
    const root = await rootOf(canvasElement)
    await settled(root, 2)
    await expect(textsOf(root).at(-1)).toMatch(/^\+\d+ more$/)
  }
}

export const MaxVisibleItems: StoryObj = {
  render: demoApp(MaxVisibleDemo),
  play: async ({ canvasElement }) => {
    const root = await rootOf(canvasElement)
    await waitFor(() => expect(textsOf(root)).toEqual(["Apple", "Banana", "Cherry", "Date", "Elderberry", "+11 more"]))
  }
}

export const CollapseFrom: StoryObj = {
  render: demoApp(CollapseFromDemo),
  play: async ({ canvasElement }) => {
    const root = await rootOf(canvasElement)
    await settled(root)
    await expect(textsOf(root).at(-1)).toBe("Papaya")
  }
}

export const CollapsingFromStart: StoryObj = {
  render: demoApp(CollapseFromDemo),
  play: async ({ canvasElement }) => {
    const resizable = await resizableOf(canvasElement)
    const root = present(resizable.firstElementChild)
    await settled(root)
    resizable.style.setProperty("width", "260px")
    await waitFor(() => expect(textsOf(root)[0]).toMatch(/^\+\d+ more$/))
    await settled(root)
    await waitFor(() => expect(rowsOf(root)).toBe(1))
    await expect(textsOf(root).at(-1)).toBe("Papaya")
    resizable.style.setProperty("width", "60px")
    await waitFor(() => expect(textsOf(root)).toEqual(["+16 more"]))
  }
}

export const WithHoverCard: StoryObj = {
  render: demoApp(HoverCardDemo),
  play: async ({ canvasElement }) => {
    const root = await rootOf(canvasElement)
    await settled(root)
    await expect(textsOf(root)[0]).toBe("Apple")
  }
}

export const HoveringOverflow: StoryObj = {
  render: demoApp(HoverCardDemo),
  play: async ({ canvasElement }) => {
    const resizable = await resizableOf(canvasElement)
    const root = present(resizable.firstElementChild)
    resizable.style.setProperty("width", "260px")
    await waitFor(() => expect(textsOf(root).at(-1)).toMatch(/^\+\d+ more$/))
    await settled(root)
    await userEvent.setup().hover(await within(resizable).findByText(/^\+\d+ more$/))
    await waitFor(() => expect(within(document.body).getByText("Papaya")).toBeVisible())
  }
}
