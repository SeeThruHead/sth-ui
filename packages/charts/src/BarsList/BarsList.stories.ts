import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/BarsList" }

export default meta

const label = (root: HTMLElement, name: string) => present(within(root).getByText(name))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Weekly downloads")).toBeVisible()
    await expect(canvas.getByText("850,000")).toBeVisible()
    const react = label(canvasElement, "React")
    const vue = label(canvasElement, "Vue")
    await expect(react.getBoundingClientRect().height).toBe(32)
    await expect(
      Math.round((vue.getBoundingClientRect().width / present(vue.parentElement).getBoundingClientRect().width) * 100)
    ).toBe(48)
    await expect(getComputedStyle(react).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(getComputedStyle(label(canvasElement, "Solid")).paddingLeft).toBe("0px")
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const approved = (await canvas.findAllByText("Approved"))[0]
    await expect(getComputedStyle(present(approved)).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(present(approved).getBoundingClientRect().height).toBe(24)
    await expect(getComputedStyle(label(canvasElement, "Rejected")).color).toBe("rgb(20, 20, 20)")
    await expect(label(canvasElement, "Rejected").getBoundingClientRect().width).toBe(80)
    await expect(canvas.getByText("Status")).toBeVisible()
    const grape = present(canvas.getAllByText("Approved")[1])
    await expect(getComputedStyle(grape).backgroundColor).toBe("rgb(190, 75, 219)")
    await expect(getComputedStyle(grape).color).toBe("rgb(255, 236, 153)")
    await expect(grape.closest("[title]")).toHaveAttribute("title", "Approved: 64%")
    await expect(getComputedStyle(label(canvasElement, "Nothing yet")).width).toBe("0px")
  }
}
