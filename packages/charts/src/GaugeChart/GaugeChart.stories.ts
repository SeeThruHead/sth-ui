import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/GaugeChart" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const meter = await within(canvasElement).findByRole("meter", { name: "Gauge" })
    await expect(meter).toHaveAttribute("aria-valuenow", "72")
    await expect(meter).toHaveAttribute("aria-valuetext", "72")
    await expect(meter.getBoundingClientRect().width).toBe(200)
    await expect(within(canvasElement).getByText("72")).toBeVisible()
    const [track, filled] = Array.from(meter.querySelectorAll("path"))
    await expect(getComputedStyle(present(filled)).stroke).toBe("rgb(34, 139, 230)")
    await expect(present(track).getAttribute("stroke-linecap")).toBe("butt")
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const meters = await waitFor(() => {
      const found = canvas.getAllByRole("meter")
      return found.length === 6 ? found : Promise.reject(new Error("waiting"))
    })
    const [sectioned, targeted, half, labelled, thick, single] = meters.map(present)
    await expect(present(sectioned).querySelectorAll("path")).toHaveLength(4)
    await expect(present(present(sectioned).querySelector("line")).getAttribute("stroke-linecap")).toBe("butt")
    await expect(present(targeted).querySelectorAll("path")).toHaveLength(6)
    await expect(present(targeted).querySelector("line")).not.toBeNull()
    await expect(present(half).getBoundingClientRect().height).toBeLessThan(120)
    await expect(labelled).toHaveAccessibleName("CPU usage")
    await expect(labelled).toHaveAttribute("aria-valuetext", "100%")
    await expect(getComputedStyle(present(present(labelled).querySelectorAll("path")[1])).stroke).toBe(
      "rgb(190, 75, 219)"
    )
    await expect(present(present(thick).querySelector("path")).getAttribute("stroke-linecap")).toBe("round")
    await expect(single).toHaveAttribute("aria-labelledby", "gauge-title")
    await expect(present(single).querySelectorAll("path")).toHaveLength(3)
  }
}
