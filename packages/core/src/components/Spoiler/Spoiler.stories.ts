import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as StatesDemo from "./demos/states.ts"
import * as TransitionsDemo from "./demos/transitions.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "DataDisplay/Spoiler" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const regions = (canvasElement: HTMLElement) => within(canvasElement).findAllByRole("region")

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const control = await within(canvasElement).findByRole("button", { name: "Show more" })
    const [region] = await regions(canvasElement)
    await expect(control).toHaveAttribute("aria-expanded", "false")
    await expect(control).toHaveAttribute("aria-controls", present(region).id)
    await expect(box(region).height).toBe(120)
    await expect(css(present(region).parentElement).marginBottom).toBe("24px")
    await expect(box(control).top).toBe(box(region).bottom)
    await expect(box(control).height).toBe(24)
  }
}

export const Expanding: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Show more" }))
    const hide = await canvas.findByRole("button", { name: "Hide" })
    await expect(hide).toHaveAttribute("aria-expanded", "true")
    const [region] = await regions(canvasElement)
    await waitFor(() => expect(box(region).height).toBe(box(present(region).firstElementChild).height))
    await expect(box(region).height).toBeGreaterThan(120)
    await userEvent.click(hide)
    await waitFor(() => expect(box(region).height).toBe(120))
  }
}

export const Transitions: StoryObj = {
  render: demoApp(TransitionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [region] = await regions(canvasElement)
    await expect(css(region).transitionDuration).toBe("0s")
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Show more" }))
    await waitFor(() => expect(box(region).height).toBeGreaterThan(120))
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [once, open, short] = await regions(canvasElement)
    await waitFor(() => expect(box(open).height).toBeGreaterThan(60))
    await expect(await canvas.findByRole("button", { name: "Hide the story" })).toHaveAttribute("aria-expanded", "true")
    await expect(box(short).height).toBeLessThan(100)
    await expect(present(short).parentElement).not.toHaveAttribute("data-has-spoiler")
    await expect(css(present(short).parentElement).marginBottom).toBe("0px")
    await expect(box(once).height).toBe(60)
    await userEvent.click(canvas.getByRole("button", { name: "Read the whole story" }))
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Read the whole story" })).toBeNull())
    await waitFor(() => expect(box(once).height).toBeGreaterThan(60))
  }
}
