import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ChangeEndDemo from "./demos/change-end.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as FormatLabelDemo from "./demos/format-label.ts"
import * as MarksDemo from "./demos/marks.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/AngleSlider" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const rootOf = (slider: HTMLElement) => present(slider.closest("[data-angle-slider]"))

const around = (slider: HTMLElement, degrees: number) => {
  const root = box(rootOf(slider))
  const radians = (degrees * Math.PI) / 180
  const radius = root.width / 3

  return {
    clientX: root.left + root.width / 2 + Math.sin(radians) * radius,
    clientY: root.top + root.height / 2 - Math.cos(radians) * radius
  }
}

const drag = async (slider: HTMLElement, from: number, to: number) => {
  const user = userEvent.setup()
  const target = rootOf(slider)
  await user.pointer({ keys: "[MouseLeft>]", target, coords: around(slider, from) })
  await user.pointer({ target, coords: around(slider, to) })
  await user.pointer({ keys: "[/MouseLeft]", target, coords: around(slider, to) })
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    const root = rootOf(slider)
    await expect(slider).toHaveAttribute("aria-valuenow", "0")
    await expect(slider).toHaveAttribute("aria-valuemax", "360")
    await expect(slider).toHaveAttribute("tabindex", "0")
    await expect(box(root).width).toBe(60)
    await expect(css(root).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(css(root).borderTopLeftRadius).toBe("100%")
    await expect(root).toHaveTextContent("0")
    await expect(css(slider, "::before").height).toBe("12px")
    await expect(css(slider, "::before").backgroundColor).toBe("rgb(73, 80, 87)")
    await expect(present(root.querySelector("input[type=hidden]"))).toHaveValue("0")
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    await drag(slider, 90, 180)
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "180"))
    await expect(css(slider).transform).toBe("matrix(-1, 0, 0, -1, 0, 0)")
    await expect(rootOf(slider)).toHaveTextContent("180")
  }
}

export const FormatLabel: StoryObj = {
  render: demoApp(FormatLabelDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    await expect(rootOf(slider)).toHaveTextContent("0°")
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(FormatLabelDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    const user = userEvent.setup()
    await user.tab()
    await expect(slider).toHaveFocus()
    await expect(css(rootOf(slider)).outlineStyle).toBe("solid")
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(rootOf(slider)).toHaveTextContent("1°"))
    await user.keyboard("{End}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "359"))
    await user.keyboard("{ArrowUp}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "0"))
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "359"))
    await user.keyboard("{Home}")
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "0"))
  }
}

export const Marks: StoryObj = {
  render: demoApp(MarksDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const labelled = await canvas.findByRole("slider", { name: "Labelled angle slider" })
    const marks = rootOf(labelled).querySelectorAll("[data-label]")
    await expect(marks).toHaveLength(8)
    await expect(css(marks[2], "::after").content).toBe('"90°"')
    await expect(css(marks[2]).transform).toBe("matrix(0, 1, -1, 0, 0, 0)")
    await expect(box(rootOf(labelled)).width).toBe(100)
    const restricted = canvas.getByRole("slider", { name: "Angle slider" })
    await expect(rootOf(restricted).querySelectorAll("[data-label]")).toHaveLength(0)
  }
}

export const SnappingToMarks: StoryObj = {
  render: demoApp(MarksDemo),
  play: async ({ canvasElement }) => {
    const restricted = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    await drag(restricted, 30, 100)
    await waitFor(() => expect(restricted).toHaveAttribute("aria-valuenow", "90"))
    restricted.focus()
    await userEvent.setup().keyboard("{ArrowRight}")
    await waitFor(() => expect(restricted).toHaveAttribute("aria-valuenow", "135"))
  }
}

export const ChangeEnd: StoryObj = {
  render: demoApp(ChangeEndDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Current value: 0")).toBeVisible()
    await expect(canvas.getByText("End value: 0")).toBeVisible()
  }
}

export const EndingChange: StoryObj = {
  render: demoApp(ChangeEndDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slider = await canvas.findByRole("slider")
    const user = userEvent.setup()
    const target = rootOf(slider)
    await user.pointer({ keys: "[MouseLeft>]", target, coords: around(slider, 90) })
    await user.pointer({ target, coords: around(slider, 270) })
    await waitFor(() => expect(canvas.getByText("Current value: 270")).toBeVisible())
    await expect(canvas.getByText("End value: 0")).toBeVisible()
    await user.pointer({ keys: "[/MouseLeft]", target, coords: around(slider, 270) })
    await waitFor(() => expect(canvas.getByText("End value: 270")).toBeVisible())
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    await expect(slider).toHaveAttribute("aria-disabled", "true")
    await expect(slider).toHaveAttribute("tabindex", "-1")
    await expect(rootOf(slider)).toHaveAttribute("data-disabled")
    await expect(present(rootOf(slider).querySelector("input[type=hidden]"))).toHaveAttribute("name", "angle")
  }
}

export const IgnoringWhileDisabled: StoryObj = {
  render: demoApp(DisabledDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    await drag(slider, 90, 180)
    await expect(slider).toHaveAttribute("aria-valuenow", "0")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Big angle slider" })
    const root = rootOf(slider)
    await expect(box(root).width).toBe(120)
    await expect(root.textContent).toBe("")
    await expect(css(slider, "::before").height).toBe("30px")
    await drag(slider, 0, 100)
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "105"))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByRole("slider", { name: "Angle slider" })
    await expect(css(rootOf(slider)).backgroundColor).toBe("rgb(59, 59, 59)")
    await expect(css(slider, "::before").backgroundColor).toBe("rgb(184, 184, 184)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("slider", { name: "Angle slider" })).toBeVisible()
  }
}
