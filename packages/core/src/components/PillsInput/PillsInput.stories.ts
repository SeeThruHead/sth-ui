import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/PillsInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const keys = (canvasElement: HTMLElement) => present(canvasElement.querySelector("[data-keys]")).textContent

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const field = await within(canvasElement).findByRole("textbox", { name: "PillsInput" })
    await expect(field).toHaveAttribute("placeholder", "Enter tags")
    await expect(within(canvasElement).getByText("Svelte")).toBeVisible()
    const shell = present(field.closest("[data-variant]"))
    await expect(shell.tagName).toBe("DIV")
    await expect(box(shell).height).toBeGreaterThanOrEqual(36)
    await expect(box(field).top).toBeGreaterThan(box(shell).top)
    await expect(Math.round(box(field).height)).toBe(22)
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const field = await within(canvasElement).findByRole("textbox", { name: "PillsInput" })
    const shell = present(field.closest("[data-variant]"))
    await userEvent.click(within(canvasElement).getByText("React"))
    await waitFor(() => expect(field).toHaveFocus())
    await waitFor(() => expect(css(shell).borderTopColor).toBe("rgb(34, 139, 230)"))
    await userEvent.keyboard("Angular")
    await waitFor(() => expect(field).toHaveValue("Angular"))
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByRole("textbox", { name: "Filled" })
    await expect(filled).toHaveAccessibleDescription("Pick at least three Pills use the contrast variant here")
    await expect(filled).toHaveAttribute("aria-invalid", "true")
    await expect(css(filled).cursor).toBe("pointer")
    await expect(css(present(canvas.getAllByText("React")[0]?.parentElement)).backgroundColor).toBe(
      "rgb(255, 255, 255)"
    )
    const hidden = canvas.getByRole("textbox", { name: "Hidden field" })
    await expect(box(hidden).width).toBe(1)
    await expect(hidden).toHaveAttribute("data-type", "hidden")
    const locked = canvas.getByRole("textbox", { name: "Disabled" })
    await expect(locked).toBeDisabled()
    await expect(css(locked).cursor).toBe("not-allowed")
    await expect(canvas.getByText("No field")).toBeVisible()
  }
}

export const FieldEvents: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByRole("textbox", { name: "Filled" })
    await userEvent.click(filled)
    await userEvent.keyboard("{Enter}a")
    await userEvent.tab()
    await waitFor(() => expect(keys(canvasElement)).toBe("focus,Enter,blur"))
    const auto = canvas.getByRole("textbox", { name: "Auto field" })
    await expect(box(auto).width).toBe(1)
    await userEvent.click(present(auto.parentElement))
    await waitFor(() => expect(auto).toHaveFocus())
    await waitFor(() => expect(box(auto).width).toBeGreaterThan(90))
    const locked = canvas.getByRole("textbox", { name: "Disabled" })
    await userEvent.click(present(locked.parentElement))
    await expect(locked).not.toHaveFocus()
    await userEvent.click(canvas.getByText("No field"))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const field = await within(canvasElement).findByRole("textbox", { name: "PillsInput" })
    await expect(css(field.closest("[data-variant]")).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
