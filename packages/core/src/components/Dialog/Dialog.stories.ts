import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Dialog" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const paperOf = (text: HTMLElement) => present(text.parentElement)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Toggle dialog" })).toBeVisible()
    await expect(screen.queryByText("Subscribe to email newsletter")).toBeNull()
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const toggle = await within(canvasElement).findByRole("button", { name: "Toggle dialog" })
    await userEvent.click(toggle)
    const title = await screen.findByText("Subscribe to email newsletter")
    const paper = paperOf(title)
    await waitFor(() => expect(css(paper.parentElement).opacity).toBe("1"))
    await expect(box(paper).width).toBe(400)
    await expect(box(paper).left).toBe(20)
    await expect(Math.round(document.documentElement.clientHeight - box(paper).bottom)).toBe(20)
    await expect(css(paper).paddingTop).toBe("16px")
    await expect(css(paper).borderTopWidth).toBe("1px")
    await expect(css(paper).boxShadow).not.toBe("none")
    const close = within(paper).getByRole("button", { name: "Close" })
    await expect(Math.round(box(paper).right - box(close).right)).toBe(9)
    await expect(Math.round(box(close).top - box(paper).top)).toBe(9)
    await userEvent.type(within(paper).getByRole("textbox", { name: "Email" }), "me@example.com")
    await userEvent.click(close)
    await waitFor(() => expect(screen.queryByText("Subscribe to email newsletter")).toBeNull())
    await userEvent.click(toggle)
    await userEvent.click(await screen.findByRole("button", { name: "Subscribe" }))
    await waitFor(() => expect(screen.queryByText("Subscribe to email newsletter")).toBeNull())
    await userEvent.click(toggle)
    await expect(await screen.findByRole("textbox", { name: "Email" })).toHaveValue("")
    await userEvent.click(toggle)
    await waitFor(() => expect(screen.queryByText("Subscribe to email newsletter")).toBeNull())
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const saved = await within(canvasElement).findByText("Your changes were saved")
    const paper = paperOf(saved)
    await expect(paper).toHaveAttribute("aria-label", "Saved")
    await expect(box(paper).width).toBe(260)
    await expect(css(paper).borderTopWidth).toBe("0px")
    await expect(css(paper).borderTopLeftRadius).toBe("16px")
    await expect(box(paper).top).toBe(20)
    await expect(css(present(paper.parentElement).parentElement).zIndex).toBe("30")
    await expect(within(paper).queryByRole("button")).toBeNull()
    const kept = await screen.findByText("Kept in the page while closed")
    await expect(kept).not.toBeVisible()
    await expect(box(paperOf(kept)).width).toBe(0)
  }
}
