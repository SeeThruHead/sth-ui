import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as LabelDemo from "./demos/label.ts"
import * as RootColorDemo from "./demos/root-color.ts"
import * as SectionEventsDemo from "./demos/section-events.ts"
import * as SectionGapDemo from "./demos/section-gap.ts"
import * as SizeDemo from "./demos/size.ts"
import * as StartAngleDemo from "./demos/start-angle.ts"
import * as TransitionsDemo from "./demos/transitions.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Feedback/RingProgress" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const rings = async (canvasElement: HTMLElement) => {
  await waitFor(() => expect(canvasElement.querySelector("svg")).not.toBeNull())

  return [...canvasElement.querySelectorAll("svg")].map((svg) => [...svg.querySelectorAll("circle")])
}

const attribute = (element: Element | undefined, name: string) => present(element).getAttribute(name)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [circles = []] = await rings(canvasElement)
    const [root, cyan, grape, orange] = circles
    await expect(circles).toHaveLength(4)
    await expect(attribute(root, "stroke-dasharray")).toBe("79.1681348704628, 184.72564803107986")
    await expect(attribute(root, "transform")).toBe("scale(1, -1) translate(0, -120)")
    await expect(attribute(cyan, "stroke-dasharray")).toBe("105.55751316061705, 158.3362697409256")
    await expect(attribute(cyan, "stroke-dashoffset")).toBe("263.89378290154264")
    await expect(attribute(grape, "stroke-dashoffset")).toBe("118.75220230569417")
    await expect(attribute(orange, "stroke-dashoffset")).toBe("158.33626974092556")
    await expect(attribute(cyan, "r")).toBe("42")
    await expect(attribute(cyan, "stroke-width")).toBe("12")
    await expect(css(root).stroke).toBe("rgb(233, 236, 239)")
    await expect(css(cyan).stroke).toBe("rgb(21, 170, 191)")
    await expect(css(grape).stroke).toBe("rgb(190, 75, 219)")
    await expect(css(orange).stroke).toBe("rgb(253, 126, 20)")
    const svg = present(canvasElement.querySelector("svg"))
    await expect(box(svg).width).toBe(120)
    await expect(css(svg).transform).toBe("matrix(0, -1, 1, 0, 0, 0)")
    const label = within(canvasElement).getByText("Application data usage")
    await expect(box(label.parentElement).width).toBe(72)
  }
}

export const Size: StoryObj = {
  render: demo(SizeDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [plain = [], big = [], clamped = []] = await rings(canvasElement)
    await expect(attribute(plain[1], "stroke-linecap")).toBe("butt")
    await expect(attribute(big[1], "stroke-linecap")).toBe("round")
    await expect(attribute(big[2], "stroke-linecap")).toBe("round")
    await expect(attribute(big[3], "stroke-linecap")).toBe("butt")
    await expect(attribute(big[1], "stroke-width")).toBe("20")
    await expect(attribute(clamped[1], "stroke-width")).toBe("15")
    await expect(clamped).toHaveLength(2)
    await expect(box(present(canvasElement.querySelectorAll("svg")[1])).width).toBe(180)
  }
}

export const SectionGap: StoryObj = {
  render: demo(SectionGapDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [none = [], five = []] = await rings(canvasElement)
    await expect(attribute(none[1], "stroke-dasharray")).toBe("105.55751316061705, 158.3362697409256")
    const [gapped] = (attribute(five[1], "stroke-dasharray") ?? "").split(", ")
    await expect(Number(gapped)).toBeCloseTo(((40 - 500 / 360) / 100) * 263.89378290154264, 6)
  }
}

export const StartAngle: StoryObj = {
  render: demo(StartAngleDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await rings(canvasElement)
    const transforms = [...canvasElement.querySelectorAll("svg")].map((svg) => css(svg).transform)
    await expect(transforms[0]).toBe("matrix(1, 0, 0, 1, 0, 0)")
    await expect(transforms[2]).toBe("matrix(-1, 0, 0, -1, 0, 0)")
  }
}

export const RootColor: StoryObj = {
  render: demo(RootColorDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [circles = []] = await rings(canvasElement)
    await expect(css(circles[0]).stroke).toBe("rgb(250, 82, 82)")
    await expect(css(circles[1]).stroke).toBe("rgb(250, 176, 5)")
  }
}

export const Label: StoryObj = {
  render: demo(LabelDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("40%")).toBeVisible()
    await expect(within(canvasElement).getByRole("button", { name: "Done" })).toBeVisible()
  }
}

export const SectionEvents: StoryObj = {
  render: demoApp(SectionEventsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [circles = []] = await rings(canvasElement)
    await expect(within(canvasElement).getByText("Hovered section: none")).toBeVisible()
    await userEvent.hover(present(circles[1]))
    await waitFor(() => expect(within(canvasElement).getByText("Hovered section: 0")).toBeVisible())
    await userEvent.click(present(circles[1]))
    await waitFor(() => expect(within(canvasElement).getByText("Clicked section: 0")).toBeVisible())
    await userEvent.unhover(present(circles[1]))
    await waitFor(() => expect(within(canvasElement).getByText("Hovered section: none")).toBeVisible())
  }
}

export const Transitions: StoryObj = {
  render: demoApp(TransitionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [circles = []] = await rings(canvasElement)
    await expect(css(circles[1]).transitionDuration).toBe("0.25s")
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Set next value" }))
    await waitFor(() => expect(within(canvasElement).getByText("72%")).toBeVisible())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [circles = []] = await rings(canvasElement)
    await expect(css(circles[0]).stroke).toBe("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Application data usage")).toBeVisible()
  }
}
