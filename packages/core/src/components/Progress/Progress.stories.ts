import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as CompoundDemo from "./demos/compound.ts"
import * as SegmentsDemo from "./demos/segments.ts"
import * as StatesDemo from "./demos/states.ts"
import * as TransitionDemo from "./demos/transition.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalDemo from "./demos/vertical.ts"

const meta: Meta = { title: "Feedback/Progress" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole("progressbar", { name: "Upload" })
    const root = present(bar.parentElement)
    await expect(bar).toHaveAttribute("aria-valuenow", "50")
    await expect(bar).toHaveAttribute("aria-valuetext", "50%")
    await expect(box(root).height).toBe(8)
    await expect(css(root).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(root).borderTopLeftRadius).toBe("8px")
    await expect(box(bar).width).toBe(box(root).width / 2)
    await expect(css(bar).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(bar).borderTopLeftRadius).toBe("8px")
    await expect(css(bar).borderTopRightRadius).toBe("0px")
  }
}

export const Compound: StoryObj = {
  render: demo(CompoundDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const bars = await within(canvasElement).findAllByRole("progressbar")
    await expect(bars).toHaveLength(3)
    await expect(box(bars[0]).height).toBe(16)
    await expect(css(bars[1]).backgroundColor).toBe("rgb(230, 73, 128)")
    await expect(css(bars[0]).borderTopRightRadius).toBe("0px")
    await expect(css(bars[2]).borderTopRightRadius).toBe("8px")
    await expect(css(bars[2]).borderTopLeftRadius).toBe("0px")
    const label = within(canvasElement).getByText("Photos")
    await expect(css(label).color).toBe("rgb(255, 255, 255)")
    await expect(css(label).fontSize).toBe("10.4px")
    await expect(css(label).fontWeight).toBe("700")
  }
}

export const Vertical: StoryObj = {
  render: demo(VerticalDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const bars = await within(canvasElement).findAllByRole("progressbar")
    const [eighty, sixty, documents] = bars
    await expect(box(eighty).height).toBe(160)
    await expect(box(present(eighty).parentElement).width).toBe(8)
    await expect(css(eighty).borderBottomLeftRadius).toBe("8px")
    await expect(sixty).toHaveAttribute("data-animated")
    await expect(css(sixty).animationName).not.toBe("none")
    await expect(css(sixty).backgroundImage).toContain("135deg")
    await expect(box(documents).bottom).toBeGreaterThan(box(bars[3]).bottom)
    await expect(css(bars[4]).borderTopLeftRadius).toBe("8px")
    await expect(css(within(canvasElement).getByText("Apps")).writingMode).toBe("vertical-rl")
    await expect(css(within(canvasElement).getByText("Apps")).color).not.toBe("rgb(255, 255, 255)")
  }
}

export const Transition: StoryObj = {
  render: demoApp(TransitionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole("progressbar")
    await expect(css(bar).transitionDuration).toBe("0.2s")
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Set next value" }))
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "82"))
  }
}

export const Segments: StoryObj = {
  render: demoApp(SegmentsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bars = await canvas.findAllByRole("progressbar")
    await expect(bars.map((bar) => bar.getAttribute("aria-valuenow"))).toEqual(["0", "0", "0", "0"])
    await userEvent.type(canvas.getByLabelText("Enter password"), "abc")
    await waitFor(() => expect(bars.map((bar) => bar.getAttribute("aria-valuenow"))).toEqual(["100", "0", "0", "0"]))
    await expect(css(bars[0]).backgroundColor).toBe("rgb(250, 82, 82)")
    await userEvent.type(canvas.getByLabelText("Enter password"), "Def12!")
    await waitFor(() =>
      expect(bars.map((bar) => bar.getAttribute("aria-valuenow"))).toEqual(["100", "100", "100", "100"])
    )
    await expect(css(bars[3]).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(bars[0]?.parentElement?.getBoundingClientRect().height).toBe(3)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole("progressbar", { name: "Upload" })
    await expect(css(bar.parentElement).backgroundColor).toBe("rgb(66, 66, 66)")
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector("[data-striped]")).not.toBeNull())
    const bar = present(canvasElement.querySelector("[data-striped]"))
    await expect(bar).not.toHaveAttribute("role")
    await expect(css(bar).backgroundImage).toContain("45deg")
    await expect(box(bar).height).toBe(20)
    await expect(box(bar).width).toBe(210)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
