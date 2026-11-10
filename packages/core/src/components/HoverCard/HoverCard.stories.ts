import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as DelayDemo from "./demos/delay.ts"
import * as RoleDemo from "./demos/role.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/HoverCard" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const pause = async (ms: number) => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(ms), { timeout: ms + 1000 })
}

const card = (text: string) => screen.queryByText(text)

const usageText =
  "Hover card is revealed when user hovers over target element, it will be hidden once mouse is not over both target and dropdown elements"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByRole("button", { name: "Hover to reveal the card" })
    await expect(target).toHaveAttribute("aria-haspopup", "dialog")
    await expect(target).toHaveAttribute("aria-expanded", "false")
    await expect(card(usageText)).toBeNull()
  }
}

export const Hovering: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByRole("button", { name: "Hover to reveal the card" })
    await userEvent.hover(target)
    const dropdown = present((await screen.findByText(usageText)).closest<HTMLElement>("[role='dialog']"))
    await expect(target).toHaveAttribute("aria-expanded", "true")
    await expect(target).toHaveAttribute("aria-controls", dropdown.id)
    await expect(box(dropdown).width).toBe(280)
    await expect(css(dropdown).boxShadow).not.toBe("none")
    await expect(css(dropdown).paddingLeft).toBe("16px")
    await waitFor(() => expect(Math.round(box(dropdown).top - box(target).bottom)).toBe(8))
    await userEvent.unhover(target)
    await userEvent.hover(dropdown)
    await pause(300)
    await expect(card(usageText)).not.toBeNull()
    await userEvent.unhover(dropdown)
    await waitFor(() => expect(card(usageText)).toBeNull())
    await expect(target).toHaveAttribute("aria-expanded", "false")
  }
}

export const Focusing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByRole("button", { name: "Hover to reveal the card" })
    await userEvent.tab()
    await expect(target).toHaveFocus()
    await waitFor(() => expect(card(usageText)).not.toBeNull())
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(card(usageText)).toBeNull())
    await expect(target).toHaveFocus()
  }
}

export const Delay: StoryObj = {
  render: demoApp(DelayDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "1000ms open delay" })).toBeVisible()
    await expect(within(canvasElement).getByRole("button", { name: "1000ms close delay" })).toBeVisible()
  }
}

export const Delays: StoryObj = {
  render: demoApp(DelayDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const opening = await canvas.findByRole("button", { name: "1000ms open delay" })
    await userEvent.hover(opening)
    await pause(500)
    await expect(card("Opened with 1000ms delay")).toBeNull()
    await waitFor(() => expect(card("Opened with 1000ms delay")).not.toBeNull(), { timeout: 2000 })
    await userEvent.unhover(opening)
    const closing = canvas.getByRole("button", { name: "1000ms close delay" })
    await userEvent.hover(closing)
    await waitFor(() => expect(card("Will close with 1000ms delay")).not.toBeNull())
    await userEvent.unhover(closing)
    await pause(500)
    await expect(card("Will close with 1000ms delay")).not.toBeNull()
    await waitFor(() => expect(card("Will close with 1000ms delay")).toBeNull(), { timeout: 2000 })
  }
}

export const Role: StoryObj = {
  render: demoApp(RoleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByText("Hydration")
    await expect(target).toHaveAttribute("aria-haspopup", "tooltip")
    await expect(target).toHaveAttribute("tabindex", "0")
  }
}

export const ShowingTooltip: StoryObj = {
  render: demoApp(RoleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.hover(await within(canvasElement).findByText("Hydration"))
    const tooltip = await screen.findByRole("tooltip")
    await expect(tooltip).toHaveTextContent("Attaching React event handlers")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const withArrow = await canvas.findByRole("button", { name: "With arrow" })
    const open = present(
      (await canvas.findByText("Starts open, with an arrow")).closest<HTMLElement>("[role='dialog']")
    )
    await expect(canvasElement.contains(open)).toBe(true)
    await expect(css(open).borderTopLeftRadius).toBe("8px")
    await waitFor(() => expect(open).toHaveAttribute("data-placement"))
    await expect(open).toHaveAttribute("data-position")
    const gap =
      open.getAttribute("data-placement") === "top"
        ? box(withArrow).top - box(open).bottom
        : box(open).top - box(withArrow).bottom
    await expect(Math.round(gap)).toBe(12)
    await expect(open.lastElementChild).toHaveAttribute("aria-hidden", "true")
    const plain = canvas.getByRole("button", { name: "No roles" })
    await expect(plain).not.toHaveAttribute("aria-haspopup")
    await userEvent.hover(plain)
    const shown = present((await screen.findByText("No ARIA roles")).parentElement)
    await expect(shown).not.toHaveAttribute("role")
    await waitFor(() => expect(canvas.getByText("Opened 1 times, closed 0 times")).toBeVisible())
    await userEvent.unhover(plain)
    await waitFor(() => expect(canvas.getByText("Opened 1 times, closed 1 times")).toBeVisible())
    await userEvent.hover(canvas.getByRole("button", { name: "Disabled" }))
    await pause(300)
    await expect(card("Never shown")).toBeNull()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const open = present(
      (await within(canvasElement).findByText("Starts open, with an arrow")).closest<HTMLElement>("[role='dialog']")
    )
    await expect(css(open).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}
