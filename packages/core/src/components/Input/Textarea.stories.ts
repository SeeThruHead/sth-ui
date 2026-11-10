import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/textarea/configurator.ts"
import * as AutosizeDemo from "./demos/textarea/autosize.ts"
import * as BottomSectionDemo from "./demos/textarea/bottom-section.ts"
import * as DisabledDemo from "./demos/textarea/disabled.ts"
import * as ErrorDemo from "./demos/textarea/error.ts"
import * as LoadingDemo from "./demos/textarea/loading.ts"
import * as ResizeDemo from "./demos/textarea/resize.ts"
import * as SuccessDemo from "./demos/textarea/success.ts"
import * as UsageDemo from "./demos/textarea/usage.ts"

const meta: Meta = { title: "Inputs/Textarea" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const lineHeight = (element: Element) => Number.parseFloat(css(element).lineHeight)

const rowsHeight = (element: Element, rows: number) => rows * lineHeight(element) + 2 * 5.5 + 2

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const textarea = await within(canvasElement).findByRole("textbox", { name: "Input label" })
    await expect(textarea.tagName).toBe("TEXTAREA")
    await expect(textarea).toHaveAccessibleDescription("Input description")
    await expect(textarea).toHaveAttribute("placeholder", "Input placeholder")
    await expect(present(textarea.parentElement)).toHaveAttribute("data-multiline")
    await expect(css(textarea).paddingTop).toBe("5.5px")
    await expect(css(textarea).resize).toBe("none")
    await expect(box(textarea).height).toBeGreaterThan(36)
    await expect(box(textarea).width).toBe(340)
  }
}

export const Loading: StoryObj = {
  render: demo(LoadingDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const loader = await within(canvasElement).findByRole("status", { name: "Loading" })
    await expect(present(loader.parentElement)).toHaveAttribute("data-position", "right")
  }
}

export const Autosize: StoryObj = {
  render: demo(AutosizeDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const unlimited = await canvas.findByRole("textbox", { name: "Autosize with no rows limit" })
    const limited = canvas.getByRole("textbox", { name: "Autosize with 4 rows max" })
    await expect(box(unlimited).height).toBeCloseTo(rowsHeight(unlimited, 4), 0)
    await expect(box(limited).height).toBeCloseTo(rowsHeight(limited, 2), 0)
    await expect(present(unlimited.parentElement)).toHaveAttribute("data-no-overflow")
    await expect(present(limited.parentElement)).not.toHaveAttribute("data-no-overflow")
  }
}

const lines = (count: number) => Array.from({ length: count }, (_, index) => `Line ${index + 1}`).join("{Enter}")

export const Growing: StoryObj = {
  render: demo(AutosizeDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const unlimited = await canvas.findByRole("textbox", { name: "Autosize with no rows limit" })
    const limited = canvas.getByRole("textbox", { name: "Autosize with 4 rows max" })
    await userEvent.type(unlimited, lines(7))
    await waitFor(() => expect(box(unlimited).height).toBeCloseTo(rowsHeight(unlimited, 7), 0))
    await userEvent.type(limited, lines(7))
    await waitFor(() => expect(box(limited).height).toBeCloseTo(rowsHeight(limited, 4), 0))
  }
}

export const BottomSection: StoryObj = {
  render: demoApp(BottomSectionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = await canvas.findByRole("textbox", { name: "Your message" })
    const counter = canvas.getByText("0/500 characters")
    await expect(counter).toBeVisible()
    await expect(css(textarea).paddingBottom).toBe("33.5px")
    await expect(box(textarea).height).toBeCloseTo(rowsHeight(textarea, 4) + 28, 0)
    await expect(Math.round(box(textarea).bottom - box(counter.parentElement).bottom)).toBe(1)
    await expect(present(textarea.parentElement)).toHaveAttribute("data-with-bottom-section")
  }
}

export const Counting: StoryObj = {
  render: demoApp(BottomSectionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = await canvas.findByRole("textbox", { name: "Your message" })
    await userEvent.type(textarea, "Hello there")
    await expect(await canvas.findByText("11/500 characters")).toBeVisible()
    await expect(textarea).toHaveValue("Hello there")
  }
}

export const Resize: StoryObj = {
  render: demo(ResizeDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const textarea = await within(canvasElement).findByRole("textbox", { name: "Disabled" })
    await expect(css(textarea).resize).toBe("vertical")
  }
}

export const Error: StoryObj = {
  render: demo(ErrorDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("textbox", { name: "Boolean error" })
    const message = canvas.getByRole("textbox", { name: "With error message" })
    await expect(plain).toHaveAttribute("aria-invalid", "true")
    await expect(css(plain).borderTopColor).toBe("rgb(250, 82, 82)")
    await expect(message).toHaveAccessibleDescription("Invalid name")
  }
}

export const Success: StoryObj = {
  render: demo(SuccessDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const textarea = await within(canvasElement).findByRole("textbox", { name: "Textarea" })
    await expect(textarea).toHaveAccessibleDescription("Looks good!")
    await expect(css(textarea).borderTopColor).toBe("rgb(9, 146, 104)")
  }
}

export const Disabled: StoryObj = {
  render: demo(DisabledDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const textarea = await within(canvasElement).findByRole("textbox", { name: "Disabled" })
    await expect(textarea).toBeDisabled()
    await expect(css(textarea).cursor).toBe("not-allowed")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const textarea = await within(canvasElement).findByRole("textbox", { name: "Input label" })
    await expect(css(textarea).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
