import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo, demoApp } from "../../stories/harness.ts"
import * as DurationDemo from "./demos/duration.ts"
import * as PrefixDemo from "./demos/prefix.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "DataDisplay/RollingNumber" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const columns = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("[data-direction]")]

const shownDigits = (root: HTMLElement) =>
  [...root.querySelectorAll(":scope > span:not([data-empty])")]
    .slice(1)
    .map((slot) =>
      slot.querySelector("[data-direction]") === null
        ? slot.textContent
        : String(
            -Number.parseFloat(css(slot.querySelector("[data-direction]")).top) / Number.parseFloat(css(slot).fontSize)
          )
    )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const root = await within(canvasElement).findByRole("img", { name: "1234" })
    await expect(css(root).fontSize).toBe("36px")
    await expect(css(root).fontVariantNumeric).toBe("tabular-nums")
    await expect(present(root.firstElementChild).textContent).toBe("1234")
    await expect(columns(root)).toHaveLength(4)
    await expect(shownDigits(root)).toEqual(["1", "2", "3", "4"])
    await expect(css(columns(root)[0]).animationDuration).toBe("0.6s")
  }
}

export const Counting: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Increment" }))
    const root = await canvas.findByRole("img", { name: "1235" })
    await expect(columns(root)[3]).toHaveAttribute("data-direction", "up")
    await expect(columns(root)[3]?.getAttribute("style")).toContain("translateY(1em)")
    await userEvent.click(canvas.getByRole("button", { name: "Decrement" }))
    await waitFor(() => expect(canvas.getByRole("img", { name: "1234" })).toBeInTheDocument())
    await expect(columns(canvas.getByRole("img", { name: "1234" }))[3]).toHaveAttribute("data-direction", "down")
    await userEvent.click(canvas.getByRole("button", { name: "Random" }))
    await waitFor(() => expect(canvas.getByRole("img", { name: "8406" })).toBeInTheDocument())
    await userEvent.click(canvas.getByRole("button", { name: "Random" }))
    const shrunk = await canvas.findByRole("img", { name: "51" })
    await expect(shrunk.querySelectorAll(":scope > [data-empty]")).toHaveLength(2)
  }
}

export const Prefix: StoryObj = {
  render: demoApp(PrefixDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("img", { name: "$ 99.99 USD" })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "+10.50" }))
    await waitFor(() => expect(canvas.getByRole("img", { name: "$ 110.49 USD" })).toBeInTheDocument())
    await userEvent.click(canvas.getByRole("button", { name: "-10.50" }))
    await waitFor(() => expect(canvas.getByRole("img", { name: "$ 99.99 USD" })).toBeInTheDocument())
    await userEvent.click(canvas.getByRole("button", { name: "Random" }))
    await waitFor(() => expect(canvas.getByRole("img", { name: "$ 4,321.50 USD" })).toBeInTheDocument())
  }
}

export const Duration: StoryObj = {
  render: demoApp(DurationDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const roots = await within(canvasElement).findAllByRole("img", { name: "500" })
    await expect(roots.map((root) => css(columns(root)[0]).animationDuration)).toEqual(["0.2s", "0.6s", "1.2s"])
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Random" }))
    await waitFor(() => expect(within(canvasElement).getAllByRole("img", { name: "827" })).toHaveLength(3))
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const negative = await canvas.findByRole("img", { name: "-42" })
    await expect(negative.querySelector("[data-empty]")).toBeNull()
    const grouped = canvas.getByRole("status", { name: "1 250 000" })
    await expect(css(grouped).fontVariantNumeric).toBe("normal")
    await expect(canvas.getByRole("img", { name: "1,5" })).toBeInTheDocument()
    await expect(canvas.getAllByRole("img", { name: "0" })).toHaveLength(2)
    const wrapped = canvas.getByRole("img", { name: "0.12" })
    await expect(columns(wrapped)[0]).toHaveAttribute("data-direction", "down")
    const rolledOver = canvas.getByRole("img", { name: "10" })
    await expect(columns(rolledOver)[1]).toHaveAttribute("data-direction", "down")
    await expect(columns(canvas.getByRole("img", { name: "15" }))[1]).toHaveAttribute("data-direction", "down")
    const lostSign = canvas.getByRole("img", { name: "7" })
    await expect([...lostSign.querySelectorAll(":scope > [data-empty]")].map((slot) => slot.textContent)).toEqual([
      "-",
      ".",
      "012345678901"
    ])
  }
}
