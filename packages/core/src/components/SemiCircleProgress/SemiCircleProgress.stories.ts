import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as EmptySegmentDemo from "./demos/empty-segment.ts"
import * as LabelPositionDemo from "./demos/label-position.ts"
import * as OrientationsDemo from "./demos/orientations.ts"
import * as TransitionsDemo from "./demos/transitions.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Feedback/SemiCircleProgress" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const circlesIn = (root: Element) => Array.from(root.querySelectorAll("circle"))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const label = await within(canvasElement).findByText("Label")
    const root = present(label.parentElement)
    await expect(root.getBoundingClientRect().width).toBe(200)
    const svg = present(root.querySelector("svg"))
    await expect(svg).toHaveAttribute("height", "100")
    await expect(css(svg).transform).toBe("matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)")
    const [empty, filled] = circlesIn(root)
    const circumference = Math.PI * 88
    await expect(Number(filled?.getAttribute("stroke-dasharray"))).toBeCloseTo(circumference, 3)
    await expect(Number.parseFloat(css(filled).strokeDashoffset)).toBeCloseTo(circumference * 0.4, 2)
    await expect(css(filled).stroke).toBe("rgb(34, 139, 230)")
    await expect(css(empty).stroke).toBe("rgb(233, 236, 239)")
    await expect(label).toHaveAttribute("data-position", "bottom")
    await expect(css(label).paddingLeft).toBe("24px")
  }
}

export const EmptySegment: StoryObj = {
  render: demo(EmptySegmentDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const svg = await waitFor(() => present(canvasElement.querySelector("svg")))
    await expect(css(circlesIn(svg)[0]).stroke).toBe("rgb(134, 142, 150)")
  }
}

export const LabelPosition: StoryObj = {
  render: demo(LabelPositionDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const center = await within(canvasElement).findByText("Center")
    await expect(center).toHaveAttribute("data-position", "center")
    await expect(css(center).paddingLeft).toBe("36px")
    await expect(css(center).top).toBe("50px")
  }
}

export const Orientations: StoryObj = {
  render: demo(OrientationsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const transformOf = async (id: string) => css((await canvas.findByTestId(id)).querySelector("svg")).transform
    await expect(await transformOf("up-right-to-left")).toBe("none")
    await expect(await transformOf("down-left-to-right")).toBe("matrix(-1, 0, 0, -1, 0, 0)")
    await expect(await transformOf("down-right-to-left")).toBe(
      "matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)"
    )
    const down = await canvas.findByText("down, left-to-right")
    await expect(css(down).top).toBe("0px")
    await expect(css(circlesIn(await canvas.findByTestId("up-left-to-right"))[1]).stroke).toBe("rgb(18, 184, 134)")
  }
}

export const Transitions: StoryObj = {
  render: demoApp(TransitionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("30%")).toBeVisible()
    const filled = circlesIn(canvasElement)[1]
    await expect(css(filled).transitionDuration).toContain("0.25s")
    await userEvent.setup().click(canvas.getByRole("button", { name: "Set next value" }))
    await waitFor(() => expect(canvas.getByText("67%")).toBeVisible())
    await userEvent.setup().click(canvas.getByRole("button", { name: "Set next value" }))
    await waitFor(() => expect(canvas.getByText("3%")).toBeVisible())
  }
}

export const Empty: StoryObj = {
  render: demo((h, ui) => ui.SemiCircleProgress(h, { value: 0, attributes: { root: { "data-testid": "zero" } } })),
  play: async ({ canvasElement }) => {
    const root = await within(canvasElement).findByTestId("zero")
    await expect(css(circlesIn(root)[1]).strokeOpacity).toBe("0")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const label = await within(canvasElement).findByText("Label")
    await expect(css(circlesIn(present(label.parentElement))[0]).stroke).toBe("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Label")).toBeVisible()
  }
}
