import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as BoundariesDemo from "./demos/boundaries.ts"
import * as IconsDemo from "./demos/icons.ts"
import * as LinksDemo from "./demos/links.ts"
import * as ResponsiveDemo from "./demos/responsive.ts"
import * as SiblingsDemo from "./demos/siblings.ts"
import * as SizeDemo from "./demos/size.ts"
import * as StartValueDemo from "./demos/start-value.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as WithContentDemo from "./demos/with-content.ts"
import * as WithPagesDemo from "./demos/with-pages.ts"

const meta: Meta = { title: "Navigation/Pagination" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const controlsOf = (root: Element | null | undefined) =>
  [...present(root).querySelectorAll<HTMLElement>("button, a")].map((control) => control.textContent || "·")

const pages = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll<HTMLElement>("[data-with-padding]")].map((control) => control.textContent)

const roots = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("div:has(> div > [data-with-padding], > div > [aria-label])")
]

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = await canvas.findByRole("button", { name: "1" })
    await expect(current).toHaveAttribute("aria-current", "page")
    await expect(current).toHaveAttribute("data-active")
    await expect(pages(canvasElement)).toEqual(["1", "2", "3", "4", "5", "10"])
    await expect(box(current).width).toBe(32)
    await expect(box(current).height).toBe(32)
    await expect(css(current).fontSize).toBe("16px")
    await expect(css(current).paddingTop).toBe("8px")
    await expect(css(current).borderTopLeftRadius).toBe("8px")
    await expect(css(current).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(current).color).toBe("rgb(255, 255, 255)")
    const second = canvas.getByRole("button", { name: "2" })
    await expect(css(second).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(second).borderTopColor).toBe("rgb(206, 212, 218)")
    await expect(Math.round(box(second).left - box(current).right)).toBe(8)
    const previous = canvas.getByRole("button", { name: "Previous page" })
    await expect(previous).toBeDisabled()
    await expect(css(previous).opacity).toBe("0.4")
    await expect(css(previous).paddingTop).toBe("0px")
    await expect(box(previous.querySelector("svg")).width).toBeCloseTo(32 / 1.8, 1)
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeEnabled()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "5" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "5" })).toHaveAttribute("aria-current", "page"))
    await expect(pages(canvasElement)).toEqual(["1", "4", "5", "6", "10"])
    await expect(canvas.getAllByText("", { selector: "[data-with-padding] ~ div svg" }).length).toBeGreaterThan(0)
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "6" })).toHaveAttribute("aria-current", "page"))
    await userEvent.click(canvas.getByRole("button", { name: "10" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled())
    await expect(pages(canvasElement)).toEqual(["1", "6", "7", "8", "9", "10"])
    await userEvent.click(canvas.getByRole("button", { name: "Previous page" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "9" })).toHaveAttribute("aria-current", "page"))
  }
}

export const WithContent: StoryObj = {
  render: demoApp(WithContentDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("id: 0, name: Ada 1")).toBeVisible()
    await expect(canvas.getByText("id: 4, name: Alan 1")).toBeVisible()
  }
}

export const Paging: StoryObj = {
  render: demoApp(WithContentDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "3" }))
    await waitFor(() => expect(canvas.getByText("id: 10, name: Ada 2")).toBeVisible())
    await expect(canvas.queryByText("id: 0, name: Ada 1")).toBeNull()
  }
}

export const Siblings: StoryObj = {
  render: demoApp(SiblingsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(roots(canvasElement)).toHaveLength(3))
    const [one, two, three] = roots(canvasElement)
    await expect(controlsOf(one)).toEqual(["·", "1", "9", "10", "11", "20", "·"])
    await expect(controlsOf(two)).toEqual(["·", "1", "8", "9", "10", "11", "12", "20", "·"])
    await expect(controlsOf(three)).toEqual(["·", "1", "7", "8", "9", "10", "11", "12", "13", "20", "·"])
  }
}

export const Boundaries: StoryObj = {
  render: demoApp(BoundariesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(roots(canvasElement)).toHaveLength(3))
    const [, two, three] = roots(canvasElement)
    await expect(controlsOf(two)).toEqual(["·", "1", "2", "9", "10", "11", "19", "20", "·"])
    await expect(controlsOf(three)).toEqual(["·", "1", "2", "3", "9", "10", "11", "18", "19", "20", "·"])
  }
}

export const Responsive: StoryObj = {
  render: demoApp(ResponsiveDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const labels = await canvas.findAllByText("Page 1 of 20")
    await expect(labels).toHaveLength(2)
    await expect(css(labels[0]).display).toBe("none")
    await expect(css(labels[1]).display).toBe("flex")
    const ones = canvas.getAllByRole("button", { name: "1", hidden: true })
    await expect(css(ones[0]?.parentElement).display).toBe("flex")
    await expect(css(ones[1]?.parentElement).display).toBe("none")
    await expect(present(labels[0]?.closest("[data-layout]"))).toHaveAttribute("data-layout", "responsive")
  }
}

export const WithPages: StoryObj = {
  render: demoApp(WithPagesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Showing 1 – 10 of 145")).toBeVisible()
    await expect(canvas.queryByRole("button", { name: "1" })).toBeNull()
    await expect(canvas.getAllByRole("button")).toHaveLength(2)
  }
}

export const Stepping: StoryObj = {
  render: demoApp(WithPagesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Next page" }))
    await waitFor(() => expect(canvas.getByText("Showing 11 – 20 of 145")).toBeVisible())
  }
}

export const Links: StoryObj = {
  render: demoApp(LinksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("link", { name: "2" })).toHaveAttribute("href", "#page-2")
    await expect(canvas.getByRole("link", { name: "Last page" })).toHaveAttribute("href", "#page-10")
    const first = canvas.getByRole("link", { name: "First page" })
    await expect(first).toHaveAttribute("aria-disabled", "true")
    await expect(first).toHaveAttribute("href", "#page-1")
    await expect(canvas.getByRole("link", { name: "1" })).toHaveAttribute("aria-current", "page")
  }
}

export const Following: StoryObj = {
  render: demoApp(LinksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const last = await canvas.findByRole("link", { name: "Last page" })
    last.addEventListener("click", (event) => event.preventDefault(), { capture: true })
    await userEvent.click(last)
    await waitFor(() => expect(canvas.getByRole("link", { name: "10" })).toHaveAttribute("aria-current", "page"))
  }
}

export const Icons: StoryObj = {
  render: demoApp(IconsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const next = await canvas.findByRole("button", { name: "Next page" })
    await expect(box(next.querySelector("svg")).width).toBe(18)
    await expect(canvas.getAllByRole("button")).toHaveLength(10)
    await expect(box(canvasElement.querySelector("div:not([data-with-padding]) > svg")).width).toBe(18)
  }
}

export const Size: StoryObj = {
  render: demoApp(SizeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [small, inputSmall] = await canvas.findAllByRole("button", { name: "1" })
    await expect(box(small).height).toBe(26)
    await expect(css(small).fontSize).toBe("14px")
    await expect(box(inputSmall).height).toBe(36)
    await expect(box(canvas.getAllByPlaceholderText("sm input")[1]).height).toBe(36)
  }
}

export const StartValue: StoryObj = {
  render: demoApp(StartValueDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "5" })).toHaveAttribute("aria-current", "page")
    await expect(pages(canvasElement)).toEqual(["5", "6", "7", "8", "9", "15"])
    await expect(canvas.queryByRole("button", { name: "1" })).toBeNull()
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled()
  }
}

export const AutoContrast: StoryObj = {
  render: demoApp(AutoContrastDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [off, on] = await within(canvasElement).findAllByRole("button", { name: "1" })
    await expect(css(off).backgroundColor).toBe("rgb(169, 227, 75)")
    await expect(css(off).color).toBe("rgb(255, 255, 255)")
    await expect(css(on).color).toBe("oklch(0 0 0)")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [locked] = await canvas.findAllByRole("button", { name: "3" })
    await expect(locked).toBeDisabled()
    await expect(css(locked).cursor).toBe("not-allowed")
    await expect(canvas.queryByRole("button", { name: "Page 1 of 1" })).toBeNull()
    const first = canvas.getByRole("button", { name: "First page" })
    await expect(first).toBeDisabled()
    await expect(canvas.queryAllByRole("button", { name: "Previous page" })).toHaveLength(2)
    await expect(css(canvas.getAllByRole("button", { name: "1" })[1]).borderTopLeftRadius).toBe("32px")
    await expect(present(first.closest("[data-layout]"))).toHaveAttribute("data-layout", "default")
    await userEvent.click(canvas.getByRole("button", { name: "Last page" }))
    await waitFor(() => expect(canvas.getAllByRole("button", { name: "3" })[1]).toHaveAttribute("aria-current", "page"))
    await expect(css(canvas.getAllByRole("button", { name: "3" })[1]).backgroundColor).toBe("rgb(190, 75, 219)")
    await expect(canvas.getAllByRole("button", { name: "Last page" })[0]).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Go to page 2" })).toHaveTextContent("#2")
    await expect(canvas.getAllByRole("button")).toHaveLength(16)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const second = await within(canvasElement).findByRole("button", { name: "2" })
    await expect(css(second).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(second).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
