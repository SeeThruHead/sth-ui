import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as ColorDemo from "./demos/color.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as IconsOnlyDemo from "./demos/icons-only.ts"
import * as LabelsDemo from "./demos/labels.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as ReadOnlyDemo from "./demos/read-only.ts"
import * as TransitionsDemo from "./demos/transitions.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/SegmentedControl" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const indicatorOf = (group: HTMLElement) => present(group.firstElementChild)

const over = async (group: HTMLElement, segment: HTMLElement) => {
  await waitFor(() =>
    expect(Math.round(box(indicatorOf(group)).left)).toBe(Math.round(box(segment.parentElement).left))
  )
  await expect(Math.round(box(indicatorOf(group)).width)).toBe(Math.round(box(segment.parentElement).width))
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByRole("radiogroup", { name: "Framework" })
    const react = within(group).getByRole("radio", { name: "React" })
    await expect(react).toBeChecked()
    await expect(within(group).getAllByRole("radio")).toHaveLength(4)
    await expect(css(group).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(css(indicatorOf(group)).backgroundColor).toBe("rgb(255, 255, 255)")
    await over(group, react)
    await expect(css(react).color).toBe("rgb(0, 0, 0)")
    await expect(css(within(group).getByRole("radio", { name: "Vue" })).color).toBe("rgb(73, 80, 87)")
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Framework" })
    const vue = within(group).getByRole("radio", { name: "Vue" })
    await userEvent.click(vue)
    await waitFor(() => expect(vue).toBeChecked())
    await over(group, vue)
    await userEvent.keyboard("{ArrowRight}")
    const svelte = within(group).getByRole("radio", { name: "Svelte" })
    await waitFor(() => expect(svelte).toBeChecked())
    await expect(svelte).toHaveFocus()
    await over(group, svelte)
  }
}

export const Color: StoryObj = {
  render: demoApp(ColorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Framework" })
    await expect(css(indicatorOf(group)).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(within(group).getByRole("radio", { name: "React" })).color).toBe("rgb(255, 255, 255)")
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const control = await canvas.findByRole("radiogroup", { name: "Disabled control" })
    await expect(within(control).getByRole("radio", { name: "Code" })).toHaveAttribute("aria-disabled", "true")
    const option = canvas.getByRole("radiogroup", { name: "Disabled option" })
    await expect(within(option).getByRole("radio", { name: "Preview" })).toHaveAttribute("aria-disabled", "true")
    await expect(css(within(option).getByRole("radio", { name: "Preview" })).color).toBe("rgb(173, 181, 189)")
    await expect(within(option).getByRole("radio", { name: "Code" })).not.toHaveAttribute("aria-disabled")
    await expect(within(option).getByRole("radio", { name: "Code" })).toBeChecked()
  }
}

export const ChoosingAroundDisabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const option = await canvas.findByRole("radiogroup", { name: "Disabled option" })
    await userEvent.click(within(option).getByRole("radio", { name: "Export" }))
    await waitFor(() => expect(within(option).getByRole("radio", { name: "Export" })).toBeChecked())
    const control = canvas.getByRole("radiogroup", { name: "Disabled control" })
    await userEvent.click(within(control).getByRole("radio", { name: "Code" }))
    await expect(within(control).getByRole("radio", { name: "Code" })).not.toBeChecked()
  }
}

export const Labels: StoryObj = {
  render: demoApp(LabelsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "View" })
    const code = within(group).getByRole("radio", { name: "Code" })
    await expect(box(code.querySelector("svg")).width).toBe(16)
  }
}

export const ChoosingLabels: StoryObj = {
  render: demoApp(LabelsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "View" })
    await userEvent.click(within(group).getByRole("radio", { name: "Export" }))
    await waitFor(() => expect(within(group).getByRole("radio", { name: "Export" })).toBeChecked())
  }
}

export const AutoContrast: StoryObj = {
  render: demoApp(AutoContrastDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("radiogroup", { name: "Lime" })
    await expect(css(indicatorOf(plain)).backgroundColor).toBe("rgb(169, 227, 75)")
    const contrast = canvas.getByRole("radiogroup", { name: "Lime with contrast" })
    await expect(css(within(contrast).getByRole("radio", { name: "React" })).color).toBe("oklch(0 0 0)")
  }
}

export const ChoosingContrast: StoryObj = {
  render: demoApp(AutoContrastDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("radiogroup", { name: "Lime" })
    await userEvent.click(within(plain).getByRole("radio", { name: "Vue" }))
    const contrast = canvas.getByRole("radiogroup", { name: "Lime with contrast" })
    await userEvent.click(within(contrast).getByRole("radio", { name: "Vue" }))
    await waitFor(() => expect(within(contrast).getByRole("radio", { name: "Vue" })).toBeChecked())
  }
}

export const Transitions: StoryObj = {
  render: demoApp(TransitionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slow = await canvas.findByRole("radiogroup", { name: "500ms linear transition" })
    await expect(css(indicatorOf(slow)).transitionDuration).toBe("0.5s")
    await expect(css(indicatorOf(canvas.getByRole("radiogroup", { name: "No transitions" }))).transitionDuration).toBe(
      "0s"
    )
  }
}

export const Sliding: StoryObj = {
  render: demoApp(TransitionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slow = await canvas.findByRole("radiogroup", { name: "500ms linear transition" })
    const svelte = within(slow).getByRole("radio", { name: "Svelte" })
    const start = box(indicatorOf(slow)).left
    await userEvent.click(svelte)
    await waitFor(() => expect(box(indicatorOf(slow)).left).toBeGreaterThan(start + 5))
    await expect(box(indicatorOf(slow)).left).toBeLessThan(box(svelte.parentElement).left)
    await over(slow, svelte)
    const instant = canvas.getByRole("radiogroup", { name: "No transitions" })
    await userEvent.click(within(instant).getByRole("radio", { name: "Vue" }))
    await waitFor(() => expect(within(instant).getByRole("radio", { name: "Vue" })).toBeChecked())
  }
}

export const ReadOnly: StoryObj = {
  render: demoApp(ReadOnlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Framework" })
    await expect(group).toHaveAttribute("aria-readonly", "true")
    await userEvent.click(within(group).getByRole("radio", { name: "React" }))
    await expect(within(group).getByRole("radio", { name: "Vue" })).toBeChecked()
    await expect(within(group).getByRole("radio", { name: "Vue" }).closest("[data-read-only]")).not.toBeNull()
  }
}

export const IconsOnly: StoryObj = {
  render: demoApp(IconsOnlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "View" })
    const code = within(group).getByRole("radio", { name: "Code" })
    await expect(box(code.querySelector("svg")).width).toBe(20)
    await userEvent.click(code)
    await waitFor(() => expect(code).toBeChecked())
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const vertical = await canvas.findByRole("radiogroup", { name: "Vertical" })
    await expect(vertical.closest("[data-with-items-borders]")).toBeNull()
    await expect(vertical).toHaveAttribute("aria-orientation", "vertical")
    const angular = within(vertical).getByRole("radio", { name: "Angular" })
    await expect(box(angular).top).toBeGreaterThan(
      box(within(vertical).getByRole("radio", { name: "React" })).bottom - 1
    )
    await expect(css(vertical).borderTopLeftRadius).toBe("32px")
    await expect(present(canvasElement.querySelector("input[name='vertical']"))).toHaveValue("React")
    await userEvent.click(angular)
    await waitFor(() => expect(angular).toBeChecked())
    const [, full] = canvas.getAllByRole("radiogroup")
    await expect(css(within(present(full)).getByRole("radio", { name: "React" })).color).toBe("oklch(1 0 0)")
    await userEvent.click(within(present(full)).getByRole("radio", { name: "Vue" }))
    await waitFor(() => expect(within(present(full)).getByRole("radio", { name: "Vue" })).toBeChecked())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Framework" })
    await expect(css(group).backgroundColor).toBe("rgb(31, 31, 31)")
    await expect(css(indicatorOf(group)).backgroundColor).toBe("rgb(59, 59, 59)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("radiogroup", { name: "Framework" })).toBeVisible()
  }
}
