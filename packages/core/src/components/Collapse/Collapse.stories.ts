import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as HorizontalDemo from "./demos/horizontal.ts"
import * as NestedDemo from "./demos/nested.ts"
import * as StatesDemo from "./demos/states.ts"
import * as TransitionDemo from "./demos/transition.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Miscellaneous/Collapse" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const collapseOf = (text: string | RegExp, canvasElement: HTMLElement) =>
  present(within(canvasElement).getByText(text).closest<HTMLElement>("[aria-hidden]"))

const pause = async (ms: number) => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(ms), { timeout: ms + 1000 })
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Toggle content" })).toBeVisible()
    const collapse = collapseOf(/Bulbapedia/, canvasElement)
    await expect(collapse).toHaveAttribute("aria-hidden", "true")
    await expect(box(collapse).height).toBe(0)
    await expect(within(canvasElement).getByText(/Bulbapedia/)).not.toBeVisible()
  }
}

export const Expanding: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle content" })
    const collapse = collapseOf(/Bulbapedia/, canvasElement)
    await expect(collapse).toHaveAttribute("inert")
    await expect(css(collapse).opacity).toBe("0")
    await expect(css(collapse).transitionDuration).toBe("0.2s, 0.2s, 0s")
    await expect(css(collapse).transitionTimingFunction).toBe("ease")
    await userEvent.click(button)
    await pause(60)
    const midway = box(collapse).height
    await expect(midway).toBeGreaterThan(0)
    await waitFor(() => expect(box(collapse).height).toBe(box(collapse.firstElementChild).height))
    await expect(midway).toBeLessThan(box(collapse).height)
    await expect(collapse).toHaveAttribute("aria-hidden", "false")
    await expect(collapse).not.toHaveAttribute("inert")
    await expect(collapse).toHaveAttribute("data-expanded")
    await waitFor(() => expect(css(collapse).opacity).toBe("1"))
    await expect(within(canvasElement).getByText(/Bulbapedia/)).toBeVisible()
    await userEvent.click(button)
    await waitFor(() => expect(box(collapse).height).toBe(0))
    await waitFor(() => expect(within(canvasElement).getByText(/Bulbapedia/)).not.toBeVisible())
  }
}

export const Horizontal: StoryObj = {
  render: demoApp(HorizontalDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Expand" })).toBeVisible()
    await expect(box(collapseOf(/Lorem ipsum/, canvasElement)).width).toBe(0)
  }
}

export const ExpandingSideways: StoryObj = {
  render: demoApp(HorizontalDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Expand" }))
    const collapse = collapseOf(/Lorem ipsum/, canvasElement)
    await waitFor(() => expect(box(collapse).width).toBe(200))
    await expect(within(canvasElement).getByRole("button", { name: "Collapse" })).toBeVisible()
    await expect(css(within(canvasElement).getByText(/Lorem ipsum/)).borderTopLeftRadius).toBe("8px")
    await expect(css(within(canvasElement).getByText(/Lorem ipsum/)).backgroundColor).toBe("rgb(208, 235, 255)")
  }
}

export const Transition: StoryObj = {
  render: demoApp(TransitionDemo),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Toggle with linear transition" })
    ).toBeVisible()
    const collapse = collapseOf(/Bulbapedia/, canvasElement)
    await expect(css(collapse).transitionDuration).toBe("1s, 1s, 0s")
    await expect(css(collapse).transitionTimingFunction).toBe("linear")
  }
}

export const Nested: StoryObj = {
  render: demoApp(NestedDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Root collapse" })).toBeVisible()
    await expect(canvas.queryByRole("button", { name: "Inner collapse" })).toBeNull()
  }
}

export const OpeningNested: StoryObj = {
  render: demoApp(NestedDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Root collapse" }))
    await userEvent.click(await canvas.findByRole("button", { name: "Inner collapse" }))
    await waitFor(() => expect(canvas.getByText("This collapse is inside another collapse")).toBeVisible())
    const inner = collapseOf("This collapse is inside another collapse", canvasElement)
    await waitFor(() => expect(box(inner).height).toBe(box(inner.firstElementChild).height))
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Without fade" })).toBeVisible()
    await expect(css(collapseOf("Height only, no fade.", canvasElement)).opacity).toBe("1")
    await expect(canvas.queryByText("Only in the page while expanded.")).toBeNull()
  }
}

export const Events: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Without fade" }))
    await waitFor(() => expect(canvas.getByText("Events: started, ended")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Unmounted when closed" }))
    await waitFor(() => expect(canvas.getByText("Only in the page while expanded.")).toBeVisible())
    await waitFor(() => expect(canvas.getByText("Events: started, ended, unmounted ended")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Unmounted when closed" }))
    await waitFor(() => expect(canvas.queryByText("Only in the page while expanded.")).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Instant" }))
    const instant = collapseOf("Shown without a transition.", canvasElement)
    await waitFor(() => expect(box(instant).height).toBeGreaterThan(0))
    await expect(css(instant).transitionDuration).toBe("0s")
    await pause(100)
    await expect(canvas.getByText("Events: started, ended, unmounted ended")).toBeVisible()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(HorizontalDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Expand" }))
    await waitFor(() => expect(within(canvasElement).getByText(/Lorem ipsum/)).toBeVisible())
  }
}
