import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as DepthOffsetDemo from "./demos/depth-offset.ts"
import * as PlainDemo from "./demos/plain.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Navigation/TableOfContents" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const articleOf = (canvasElement: HTMLElement) => present(canvasElement.querySelector<HTMLElement>("[id$=-article]"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "Getting started" })
    await expect(canvas.getAllByRole("button")).toHaveLength(7)
    await waitFor(() => expect(first).toHaveAttribute("data-active"))
    await expect(css(first).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(first).color).toBe("rgb(255, 255, 255)")
    await expect(css(first).borderTopLeftRadius).toBe("8px")
    await expect(css(first).paddingLeft).toBe("12.8px")
    await expect(css(canvas.getByRole("button", { name: "With a package manager" })).paddingLeft).toBe("25.6px")
    await expect(css(canvas.getByRole("button", { name: "Installation" })).backgroundColor).toBe("rgba(0, 0, 0, 0)")
  }
}

export const Spying: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const usage = await canvas.findByRole("button", { name: "Usage" })
    const article = articleOf(canvasElement)
    const heading = present(within(article).getByRole("heading", { name: "Usage" }))
    article.scrollTo({ top: heading.offsetTop - article.offsetTop })
    await waitFor(() => expect(usage).toHaveAttribute("data-active"))
    await userEvent.setup().click(canvas.getByRole("button", { name: "Buttons" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Buttons" })).toHaveAttribute("data-active"))
    await expect(usage).not.toHaveAttribute("data-active")
  }
}

export const AutoContrast: StoryObj = {
  render: demoApp(AutoContrastDemo),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByRole("button", { name: "Getting started" })
    await waitFor(() => expect(first).toHaveAttribute("data-active"))
    await expect(css(first).backgroundColor).toBe("rgb(255, 212, 59)")
    await expect(["rgb(0, 0, 0)", "oklch(0 0 0)"]).toContain(css(first).color)
    await expect(css(first).fontSize).toBe("14px")
  }
}

export const DepthOffset: StoryObj = {
  render: demoApp(DepthOffsetDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByRole("button", { name: "Getting started" })).paddingLeft).toBe("40px")
    await expect(css(canvas.getByRole("button", { name: "From a script tag" })).paddingLeft).toBe("120px")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("link", { name: "→ Getting started" })
    await expect(first).toHaveAttribute("href", "#top")
    await expect(first).toHaveAttribute("data-variant", "light")
    await expect(css(first).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(first).fontSize).toBe("13px")
    await expect(css(canvas.getByRole("link", { name: "Installation" })).paddingLeft).toBe("19.5px")
  }
}

export const Reinitializing: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("link", { name: "Installation" })
    await expect(canvas.queryByRole("link", { name: "Added later" })).toBeNull()
    await userEvent.setup().click(canvas.getByRole("button", { name: "Add a section" }))
    await waitFor(() => expect(canvas.getByRole("link", { name: "Added later" })).toBeVisible())
  }
}

export const Plain: StoryObj = {
  render: demoApp(PlainDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "Getting started" })
    await expect(first).toHaveAttribute("data-variant", "none")
    await expect(css(first).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(canvas.getAllByRole("button").length).toBeGreaterThanOrEqual(7)
  }
}

export const ScrollingToHeading: StoryObj = {
  render: demoApp(PlainDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const buttons = await canvas.findByRole("button", { name: "Buttons" })
    const article = articleOf(canvasElement)
    await userEvent.setup().click(buttons)
    await waitFor(() => expect(article.scrollTop).toBeGreaterThan(0))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByRole("button", { name: "Getting started" })
    await waitFor(() => expect(first).toHaveAttribute("data-active"))
    await expect(css(first).backgroundColor).toBe("rgb(25, 113, 194)")
    await expect(css(within(canvasElement).getByRole("button", { name: "Installation" })).color).toBe(
      "rgb(201, 201, 201)"
    )
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
