import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AllowNextStepsDemo from "./demos/allow-next-steps.ts"
import * as AllowStepSelectDemo from "./demos/allow-step-select.ts"
import * as ColorSizeDemo from "./demos/color-size.ts"
import * as IconPositionDemo from "./demos/icon-position.ts"
import * as IconsOnlyDemo from "./demos/icons-only.ts"
import * as IconsDemo from "./demos/icons.ts"
import * as LabelPositionDemo from "./demos/label-position.ts"
import * as LoadingDemo from "./demos/loading.ts"
import * as OrientationDemo from "./demos/orientation.ts"
import * as StatesDemo from "./demos/states.ts"
import * as StepColorDemo from "./demos/step-color.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalRightDemo from "./demos/vertical-right.ts"

const meta: Meta = { title: "Navigation/Stepper" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const iconOf = (step: HTMLElement) => present(step.querySelector("span > span"))

const stepsOf = (canvasElement: HTMLElement) =>
  Array.from(canvasElement.querySelectorAll<HTMLElement>("button[data-icon-position]"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: /First step/ })
    const second = canvas.getByRole("button", { name: /Second step/ })
    const third = canvas.getByRole("button", { name: /Final step/ })
    await expect(first).toHaveAttribute("data-completed")
    await expect(second).toHaveAttribute("data-progress")
    await expect(third).not.toHaveAttribute("data-progress")
    await expect(first.querySelector("svg")).not.toBeNull()
    await expect(iconOf(second)).toHaveTextContent("2")
    await expect(box(iconOf(second)).width).toBe(42)
    await expect(css(iconOf(second)).borderTopLeftRadius).toBe("1000px")
    await expect(css(iconOf(second)).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(css(iconOf(first)).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(iconOf(third)).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(canvas.getByText("Step 2 content: Verify email")).toBeVisible()
    const separators = canvasElement.querySelectorAll("div[data-orientation=horizontal]:empty")
    await expect(separators).toHaveLength(2)
    await expect(separators[0]).toHaveAttribute("data-active")
    await expect(css(separators[0]).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(box(separators[0]).height).toBe(2)
    await expect(css(canvas.getByText("Create an account")).color).toBe("rgb(134, 142, 150)")
    await expect(first).toHaveAttribute("tabindex", "0")
    await expect(css(first).cursor).toBe("pointer")
  }
}

export const Navigating: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Next step" }))
    await user.click(canvas.getByRole("button", { name: "Next step" }))
    await waitFor(() => expect(canvas.getByText("Completed, click back button to get to previous step")).toBeVisible())
    await expect(canvas.getByRole("button", { name: /Final step/ })).toHaveAttribute("data-completed")
    await user.click(canvas.getByRole("button", { name: /First step/ }))
    await waitFor(() => expect(canvas.getByText("Step 1 content: Create an account")).toBeVisible())
    await user.click(canvas.getByRole("button", { name: /Final step/ }))
    await waitFor(() => expect(canvas.getByText("Step 3 content: Get full access")).toBeVisible())
  }
}

export const AllowStepSelect: StoryObj = {
  render: demoApp(AllowStepSelectDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const third = await canvas.findByRole("button", { name: /Final step/ })
    await expect(third).toHaveAttribute("tabindex", "-1")
    await user.click(third)
    await expect(canvas.getByText("Step 1 content: Create an account")).toBeVisible()
    await user.click(canvas.getByRole("button", { name: "Next step" }))
    await user.click(canvas.getByRole("button", { name: "Next step" }))
    await user.click(canvas.getByRole("button", { name: /First step/ }))
    await waitFor(() => expect(canvas.getByText("Step 1 content: Create an account")).toBeVisible())
    await user.click(canvas.getByRole("button", { name: /Final step/ }))
    await waitFor(() => expect(canvas.getByText("Step 3 content: Get full access")).toBeVisible())
  }
}

export const AllowNextSteps: StoryObj = {
  render: demoApp(AllowNextStepsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const second = await canvas.findByRole("button", { name: /Second step/ })
    await expect(second).toHaveAttribute("tabindex", "-1")
    await expect(second).not.toHaveAttribute("data-allow-click")
    await user.click(second)
    await expect(canvas.getByText("Step 1 content: Create an account")).toBeVisible()
    await user.click(canvas.getByRole("button", { name: "Next step" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: /First step/ })).toHaveAttribute("tabindex", "0"))
  }
}

export const ColorSize: StoryObj = {
  render: demoApp(ColorSizeDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: /Step 1/ })
    await expect(box(iconOf(first)).width).toBe(36)
    await expect(css(iconOf(first)).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(css(iconOf(first)).borderTopLeftRadius).toBe("8px")
    await expect(css(present(first.querySelector("span:last-child > span"))).fontSize).toBe("14px")
    await expect(first).toHaveAttribute("tabindex", "-1")
  }
}

export const Icons: StoryObj = {
  render: demoApp(IconsDemo),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stepsOf(canvasElement)).toHaveLength(3))
    const steps = stepsOf(canvasElement)
    await expect(steps[0]?.querySelector("svg path[d^='M4 4.586']")).toBeNull()
    await expect(steps[0]?.querySelector("svg")).not.toBeNull()
    await expect(steps[1]?.querySelector("svg")).not.toBeNull()
  }
}

export const IconsOnly: StoryObj = {
  render: demoApp(IconsOnlyDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Create an account" })).toHaveAttribute("data-completed")
    await expect(canvas.getByRole("button", { name: "Verify email" })).toHaveAttribute("data-progress")
    await expect(canvas.getByRole("button", { name: "Get full access" }).querySelector("[data-orientation]")).toBeNull()
  }
}

export const Orientation: StoryObj = {
  render: demoApp(OrientationDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: /Step 1/ })
    const second = canvas.getByRole("button", { name: /Step 2/ })
    const third = canvas.getByRole("button", { name: /Step 3/ })
    await expect(box(second).top).toBeGreaterThan(box(first).bottom - 1)
    await expect(Math.round(box(first).left)).toBe(Math.round(box(second).left))
    const lines = canvasElement.querySelectorAll("[data-active], span[class] + span:empty")
    await expect(lines.length).toBeGreaterThan(0)
    const lastLine = present(third.querySelector("span > span:nth-child(2)"))
    await expect(css(lastLine).display).toBe("none")
    const firstLine = present(first.querySelector("span > span:nth-child(2)"))
    await expect(css(firstLine).borderInlineStartColor).toBe("rgb(34, 139, 230)")
    await expect(box(first).height).toBeGreaterThanOrEqual(42 + 32)
    await expect(canvasElement.querySelector("[data-wrap]")).toBeNull()
  }
}

export const LabelPosition: StoryObj = {
  render: demoApp(LabelPositionDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: /Account/ })
    await expect(first).toHaveAttribute("data-label-position", "bottom")
    await expect(css(first).flexDirection).toBe("column")
    const label = canvas.getByText("Account")
    await expect(box(label).top).toBeGreaterThan(box(iconOf(first)).bottom)
    const separator = present(first.nextElementSibling)
    await expect(css(separator).marginTop).toBe("20px")
  }
}

export const IconPosition: StoryObj = {
  render: demoApp(IconPositionDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: /Step 1/ })
    await expect(css(first).flexDirection).toBe("row-reverse")
    await expect(box(iconOf(first)).left).toBeGreaterThan(box(canvas.getByText("Step 1")).right)
    await expect(css(present(canvas.getByText("Step 1").parentElement)).textAlign).toBe("end")
  }
}

export const Loading: StoryObj = {
  render: demoApp(LoadingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const second = await canvas.findByRole("button", { name: /Step 2/ })
    await expect(iconOf(second)).not.toHaveTextContent("2")
    await expect(box(present(iconOf(second).querySelector("span > *"))).width).toBe(21)
  }
}

export const StepColor: StoryObj = {
  render: demoApp(StepColorDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const second = await canvas.findByRole("button", { name: /Step 2/ })
    await expect(css(iconOf(second)).backgroundColor).toBe("rgb(250, 82, 82)")
    await expect(second.querySelector("svg path[d^='M4 4.586']")).toBeNull()
    await expect(css(iconOf(canvas.getByRole("button", { name: /Step 1/ }))).backgroundColor).toBe("rgb(34, 139, 230)")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: /Kept/ })
    const second = canvas.getByRole("button", { name: /Step 2/ })
    await expect(iconOf(second)).toHaveTextContent("…")
    await expect(box(iconOf(second)).width).toBe(30)
    await expect(css(iconOf(first)).color).toBe("rgb(0, 0, 0)")
    await expect(first.querySelector("svg path[d^='M4 4.586']")).toBeNull()
    await expect(css(iconOf(first)).backgroundColor).toBe("rgb(250, 176, 5)")
    await expect(canvas.getByRole("button", { name: /Plain/ }).firstElementChild).toHaveTextContent("Plain")
    await expect(canvas.getByText("First content")).not.toBeVisible()
    await expect(canvas.getByText("Second content")).toBeVisible()
    await expect(css(present(canvas.getByText("Second content"))).paddingTop).toBe("32px")
    await expect(canvas.getByText("Completed, click back button to get to previous step")).not.toBeVisible()
    await expect(canvasElement.querySelector("[data-wrap]")).toBeNull()
  }
}

export const KeptContent: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Back" }))
    await waitFor(() => expect(canvas.getByText("First content")).toBeVisible())
    await expect(iconOf(canvas.getByRole("button", { name: /Kept/ })).textContent).toBe("")
    await expect(iconOf(canvas.getByRole("button", { name: /Step 2/ }))).toHaveTextContent("#2")
  }
}

export const VerticalRight: StoryObj = {
  render: demoApp(VerticalRightDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const third = await canvas.findByRole("button", { name: /Step 3/ })
    await expect(box(iconOf(third)).width).toBe(32)
    await expect(css(present(third.parentElement)).alignItems).toBe("flex-end")
    await expect(third).toHaveAttribute("data-completed")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const third = await within(canvasElement).findByRole("button", { name: /Final step/ })
    await expect(css(iconOf(third)).backgroundColor).toBe("rgb(59, 59, 59)")
    await expect(css(iconOf(third)).color).toBe("rgb(184, 184, 184)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: /First step/ })).toBeVisible()
  }
}
