import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo, demoApp } from "../../stories/harness.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Extensions/NavigationProgress" }

export default meta

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const bar = () => present(document.querySelector<HTMLElement>("[role=progressbar]")?.parentElement)

const progressText = (canvasElement: HTMLElement, value: number) =>
  waitFor(() => expect(within(canvasElement).getByText(`Progress: ${value}%`)).toBeVisible())

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("button", { name: "Start" })
    const root = bar()
    await expect(css(root).position).toBe("fixed")
    await expect(css(root).top).toBe("0px")
    await expect(css(root).zIndex).toBe("9999")
    await expect(css(root).height).toBe("3px")
    await expect(css(root).opacity).toBe("0")
    await expect(root).not.toHaveAttribute("data-mounted")
    await expect(css(root).borderTopLeftRadius).toBe("0px")
  }
}

export const Running: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Start" }))
    await progressText(canvasElement, 10)
    await waitFor(() => expect(bar()).toHaveAttribute("data-mounted"))
    await waitFor(() => expect(css(bar()).opacity).toBe("1"))
    await expect(css(bar().firstElementChild, "::before").boxShadow).toContain("rgb(34, 139, 230)")
    await progressText(canvasElement, 20)
    await user.click(canvas.getByRole("button", { name: "Stop" }))
    await user.click(canvas.getByRole("button", { name: "Set 50%" }))
    await progressText(canvasElement, 50)
    await user.click(canvas.getByRole("button", { name: "Increment" }))
    await progressText(canvasElement, 51)
    await user.click(canvas.getByRole("button", { name: "Decrement" }))
    await progressText(canvasElement, 50)
    await user.click(canvas.getByRole("button", { name: "Complete" }))
    await progressText(canvasElement, 100)
    await waitFor(() => expect(bar()).not.toHaveAttribute("data-mounted"))
    await progressText(canvasElement, 0)
    await user.click(canvas.getByRole("button", { name: "Set 50%" }))
    await user.click(canvas.getByRole("button", { name: "Reset" }))
    await progressText(canvasElement, 0)
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const progress = await within(canvasElement).findByRole("progressbar")
    const root = present(progress.parentElement)
    await expect(root).toHaveAttribute("data-mounted")
    await expect(css(root).height).toBe("6px")
    await expect(css(root).zIndex).toBe("5")
    await expect(css(progress).backgroundColor).toBe("rgb(190, 75, 219)")
    await expect(progress).toHaveAttribute("aria-valuenow", "60")
  }
}
