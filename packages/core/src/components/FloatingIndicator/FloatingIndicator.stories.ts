import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo, demoApp } from "../../stories/harness.ts"
import * as DirectionDemo from "./demos/direction.ts"
import * as SegmentedDemo from "./demos/segmented.ts"
import * as StatesDemo from "./demos/states.ts"

const meta: Meta = { title: "Overlays/FloatingIndicator" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const indicatorIn = (canvasElement: HTMLElement) => present(canvasElement.querySelector("[aria-hidden='true']:empty"))

const covers = (indicator: Element, target: Element) => {
  const a = box(indicator)
  const b = box(target)

  return (
    [a.left, a.top, a.width, a.height].map(Math.round).join() ===
    [b.left, b.top, b.width, b.height].map(Math.round).join()
  )
}

export const Segmented: StoryObj = {
  render: demoApp(SegmentedDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const react = await within(canvasElement).findByRole("button", { name: "React" })
    const indicator = indicatorIn(canvasElement)
    await waitFor(() => expect(covers(indicator, react)).toBe(true))
    await expect(css(indicator).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(indicator).transitionDuration).toBe("0.15s")
    await expect(css(react).color).toBe("rgb(255, 255, 255)")
  }
}

export const Choosing: StoryObj = {
  render: demoApp(SegmentedDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const angular = await canvas.findByRole("button", { name: "Angular" })
    await userEvent.click(angular)
    await waitFor(() => expect(covers(indicatorIn(canvasElement), angular)).toBe(true))
    await expect(angular).toHaveAttribute("data-active")
    await expect(canvas.getByRole("button", { name: "React" })).not.toHaveAttribute("data-active")
  }
}

export const Direction: StoryObj = {
  render: demoApp(DirectionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const center = await canvas.findByRole("button", { name: "center" })
    await waitFor(() => expect(covers(indicatorIn(canvasElement), center)).toBe(true))
    await expect(box(center).width).toBe(50)
    await expect(css(indicatorIn(canvasElement)).borderTopWidth).toBe("1px")
  }
}

export const ChoosingDirection: StoryObj = {
  render: demoApp(DirectionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const downRight = await canvas.findByRole("button", { name: "down-right" })
    await userEvent.click(downRight)
    await waitFor(() => expect(covers(indicatorIn(canvasElement), downRight)).toBe(true))
    await expect(indicatorIn(canvasElement)).toHaveAttribute("data-initialized")
    await userEvent.click(canvas.getByRole("button", { name: "up-left" }))
    await waitFor(() =>
      expect(covers(indicatorIn(canvasElement), canvas.getByRole("button", { name: "up-left" }))).toBe(true)
    )
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector("[data-hidden]")).not.toBeNull())
    const indicator = present(canvasElement.querySelector("[data-hidden]"))
    await expect(css(indicator).display).toBe("none")
    await expect(css(indicator).transitionDuration).toBe("0.4s")
  }
}
