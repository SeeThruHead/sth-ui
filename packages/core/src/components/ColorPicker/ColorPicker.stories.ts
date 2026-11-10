import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as FormatsDemo from "./demos/formats.ts"
import * as FullWidthDemo from "./demos/full-width.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as SwatchesOnlyDemo from "./demos/swatches-only.ts"
import * as SwatchesPerRowDemo from "./demos/swatches-per-row.ts"
import * as StatesDemo from "./demos/states.ts"
import * as SwatchesDemo from "./demos/swatches.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/ColorPicker" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const along = (slider: HTMLElement, fraction: number) => ({
  clientX: box(slider).left + box(slider).width * fraction,
  clientY: box(slider).top + box(slider).height / 2
})

const wrapperOf = (element: Element) => present(element.closest("[data-saturation]")?.parentElement)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saturation = await canvas.findByRole("slider", { name: "Saturation" })
    const hue = canvas.getByRole("slider", { name: "Hue" })
    const alpha = canvas.getByRole("slider", { name: "Alpha" })
    await expect(canvas.getByText("rgba(47, 119, 150, 0.7)")).toBeVisible()
    await expect(saturation).toHaveAttribute("aria-valuetext", "rgba(47, 119, 150, 0.7)")
    await expect(saturation).toHaveAttribute("tabindex", "0")
    await expect(Number(hue.getAttribute("aria-valuenow"))).toBeCloseTo(198.058, 2)
    await expect(alpha).toHaveAttribute("aria-valuenow", "0.7")
    await expect(box(wrapperOf(saturation)).width).toBe(240)
    await expect(box(saturation).height).toBe(120)
    await expect(css(saturation.children[0]).backgroundColor).toBe("rgb(0, 178, 255)")
    const thumb = present(saturation.lastElementChild)
    await expect(css(thumb).backgroundColor).toBe("rgba(47, 119, 150, 0.7)")
    await expect(Math.round(box(thumb).left + 8 - box(saturation).left)).toBe(
      Math.round(box(saturation).width * 0.68667)
    )
    await expect(Math.round(box(thumb).top + 8 - box(saturation).top)).toBe(Math.round(120 * (1 - 0.58824)))
    const preview = present(canvasElement.querySelector("[data-preview]"))
    await expect(box(preview).width).toBe(42)
    await expect(box(preview).left).toBeGreaterThan(box(alpha).right)
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saturation = await canvas.findByRole("slider", { name: "Saturation" })
    const user = userEvent.setup()
    const at = (x: number, y: number) => ({
      clientX: box(saturation).left + box(saturation).width * x,
      clientY: box(saturation).top + box(saturation).height * y
    })
    await user.pointer({ keys: "[MouseLeft>]", target: saturation, coords: at(1, 0) })
    await user.pointer([
      { target: saturation, coords: at(2, -1) },
      { keys: "[/MouseLeft]", target: saturation, coords: at(2, -1) }
    ])
    await waitFor(() => expect(canvas.getByText("rgba(0, 178, 255, 0.7)")).toBeVisible())
    await user.pointer({ keys: "[MouseLeft][/MouseLeft]", target: saturation, coords: at(0, 1) })
    await waitFor(() => expect(canvas.getByText("rgba(0, 0, 0, 0.7)")).toBeVisible())
    await user.keyboard("{ArrowUp}{ArrowRight}")
    await waitFor(() => expect(canvas.getByText("rgba(12, 13, 13, 0.7)")).toBeVisible())
    const hue = canvas.getByRole("slider", { name: "Hue" })
    hue.focus()
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(hue).toHaveAttribute("aria-valuenow", "180"))
    await expect(canvas.getByText("rgba(12, 13, 13, 0.7)")).toBeVisible()
    const alpha = canvas.getByRole("slider", { name: "Alpha" })
    alpha.focus()
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(canvas.getByText("rgba(12, 13, 13, 0.65)")).toBeVisible())
    await user.pointer({ keys: "[MouseLeft>]", target: alpha, coords: along(alpha, 0.5) })
    await user.pointer([
      { target: alpha, coords: along(alpha, 0.2) },
      { keys: "[/MouseLeft]", target: alpha, coords: along(alpha, 0.2) }
    ])
    await waitFor(() => expect(canvas.getByText("rgba(12, 13, 13, 0.2)")).toBeVisible())
    await user.pointer({ keys: "[MouseLeft>]", target: hue, coords: along(hue, 0.5) })
    await user.pointer([
      { target: hue, coords: along(hue, 0) },
      { keys: "[/MouseLeft]", target: hue, coords: along(hue, 0) }
    ])
    await waitFor(() => expect(hue).toHaveAttribute("aria-valuenow", "0"))
  }
}

export const Formats: StoryObj = {
  render: demoApp(FormatsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("#C5D899")).toBeVisible()
    await expect(canvas.queryByRole("slider", { name: "Alpha" })).toBeNull()
    await expect(canvasElement.querySelector("[data-preview]")).toBeNull()
    await expect(present(canvasElement.querySelector("input[type=hidden]"))).toHaveAttribute("name", "color")
    await expect(canvas.getByRole("radio", { name: "HEX" })).toBeChecked()
  }
}

export const ChangingFormat: StoryObj = {
  render: demoApp(FormatsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByText("RGBA"))
    await waitFor(() => expect(canvas.getByText("rgba(197, 216, 153, 1)")).toBeVisible())
    await expect(canvas.getByRole("slider", { name: "Alpha" })).toBeVisible()
    await expect(present(canvasElement.querySelector("input[type=hidden]"))).toHaveValue("rgba(197, 216, 153, 1)")
    await user.click(canvas.getByText("HSLA"))
    await waitFor(() => expect(canvas.getByText("hsla(78, 45%, 72%, 1)")).toBeVisible())
    await user.click(canvas.getByText("HEXA"))
    await waitFor(() => expect(canvas.getByText("#c5d899ff")).toBeVisible())
    await user.click(canvas.getByText("RGB"))
    await waitFor(() => expect(canvas.getByText("rgb(197, 216, 153)")).toBeVisible())
    await expect(canvas.queryByRole("slider", { name: "Alpha" })).toBeNull()
  }
}

export const Swatches: StoryObj = {
  render: demoApp(SwatchesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const red = await canvas.findByRole("button", { name: "#fa5252" })
    const swatches = canvas.getAllByRole("button")
    await expect(swatches).toHaveLength(14)
    await expect(red).toHaveAttribute("data-swatch")
    await expect(red).toHaveAttribute("tabindex", "0")
    await expect(Math.round(box(red).width)).toBe(Math.round(box(red).height))
    await expect(Math.round(box(swatches[7]).top)).toBeGreaterThan(Math.round(box(swatches[6]).top))
    await expect(Math.round(box(swatches[6]).right - box(swatches[0]).left)).toBe(238)
    await expect(red.querySelector("svg")).toBeNull()
  }
}

export const PickingSwatch: StoryObj = {
  render: demoApp(SwatchesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "#fab005" }))
    await waitFor(() => expect(canvas.getByText("#fab005")).toBeVisible())
    const yellow = canvas.getByRole("button", { name: "#fab005" })
    await expect(css(yellow.querySelector("svg")).color).toBe("rgb(0, 0, 0)")
    await expect(canvas.getByRole("slider", { name: "Saturation" })).toHaveAttribute(
      "aria-valuetext",
      "rgba(250, 176, 5, 1)"
    )
    await user.click(canvas.getByRole("button", { name: "#2e2e2e" }))
    await waitFor(() =>
      expect(css(canvas.getByRole("button", { name: "#2e2e2e" }).querySelector("svg")).color).toBe("rgb(255, 255, 255)")
    )
  }
}

export const SwatchesPerRow: StoryObj = {
  render: demoApp(SwatchesPerRowDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("radio", { name: "7" })).toBeChecked()
    const swatches = canvas.getAllByRole("button")
    await expect(Math.round(box(swatches[6]).top)).toBe(Math.round(box(swatches[0]).top))
    await expect(Math.round(box(swatches[7]).top)).toBeGreaterThan(Math.round(box(swatches[6]).top))
  }
}

export const ChangingSwatchesPerRow: StoryObj = {
  render: demoApp(SwatchesPerRowDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByText("10"))
    const swatches = canvas.getAllByRole("button")
    await waitFor(() => expect(Math.round(box(swatches[10]).top)).toBeGreaterThan(Math.round(box(swatches[9]).top)))
    await expect(Math.round(box(swatches[9]).top)).toBe(Math.round(box(swatches[0]).top))
  }
}

export const SwatchesOnly: StoryObj = {
  render: demoApp(SwatchesOnlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("#fff")).toBeVisible()
    await expect(canvas.queryByRole("slider")).toBeNull()
    const swatches = canvas.getAllByRole("button")
    await expect(swatches).toHaveLength(21)
    const wrapper = present(swatches[0]?.parentElement?.parentElement)
    await expect(wrapper).toHaveAttribute("data-full-width")
    await expect(Math.round(box(wrapper).width)).toBe(400)
  }
}

export const Sizes: StoryObj = {
  render: demoApp(SizesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saturation = await canvas.findByRole("slider", { name: "Saturation" })
    await expect(box(wrapperOf(saturation)).width).toBe(200)
    await expect(box(saturation).height).toBe(110)
    await expect(box(present(canvasElement.querySelector("[data-preview]"))).width).toBe(34)
  }
}

export const ChangingSize: StoryObj = {
  render: demoApp(SizesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByText("xl"))
    const saturation = canvas.getByRole("slider", { name: "Saturation" })
    await waitFor(() => expect(box(wrapperOf(saturation)).width).toBe(320))
    await expect(box(saturation).height).toBe(160)
    await expect(box(present(saturation.lastElementChild)).width).toBe(22)
    await user.click(canvas.getByText("xs"))
    await waitFor(() => expect(box(wrapperOf(saturation)).width).toBe(180))
  }
}

export const FullWidth: StoryObj = {
  render: demoApp(FullWidthDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saturation = await canvas.findByRole("slider", { name: "Saturation" })
    await expect(box(saturation).height).toBe(140)
    await expect(box(wrapperOf(saturation)).width).toBeGreaterThan(400)
    await expect(box(present(canvasElement.querySelector("[data-preview]"))).width).toBe(50)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(SwatchesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saturation = await canvas.findByRole("slider", { name: "Saturation" })
    await expect(css(present(saturation.lastElementChild)).borderTopColor).toBe("rgb(255, 255, 255)")
    await expect(canvas.getAllByRole("button")).toHaveLength(14)
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sliders = await canvas.findAllByRole("slider")
    await expect(sliders).toHaveLength(2)
    await expect(sliders[0]).not.toHaveAttribute("aria-label")
    await expect(sliders[0]).toHaveAttribute("tabindex", "-1")
    await expect(sliders[1]).toHaveAttribute("tabindex", "-1")
    await expect(canvas.getByRole("button", { name: "#fa5252" })).toHaveAttribute("tabindex", "-1")
    await expect(canvas.getByText("#3297c2")).toBeVisible()
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("slider", { name: "Saturation" })).toBeVisible()
  }
}
