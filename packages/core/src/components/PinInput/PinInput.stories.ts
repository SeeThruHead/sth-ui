import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as RegexpDemo from "./demos/regexp.ts"
import * as StatesDemo from "./demos/states.ts"
import * as SuccessDemo from "./demos/success.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/PinInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const boxesOf = (group: HTMLElement) => [...group.querySelectorAll<HTMLInputElement>("input:not([type='hidden'])")]

const at = (group: HTMLElement, index: number) => present(boxesOf(group)[index])

const valueOf = (group: HTMLElement) =>
  boxesOf(group)
    .map((input) => input.value)
    .join("")

const rendered = async () => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(50))
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Security code" })
    await expect(boxesOf(group)).toHaveLength(4)
    await expect(at(group, 0)).toHaveAccessibleName("Security code")
    await expect(at(group, 0)).toHaveAttribute("placeholder", "○")
    await expect(at(group, 0)).toHaveAttribute("autocomplete", "one-time-code")
    await expect(box(at(group, 0)).width).toBe(36)
    await expect(box(at(group, 0)).height).toBe(36)
    await expect(css(at(group, 0)).textAlign).toBe("center")
    await expect(Math.round(box(at(group, 1)).left - box(at(group, 0)).right)).toBe(12)
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Security code" })
    await userEvent.click(at(group, 0))
    await userEvent.keyboard("a")
    await waitFor(() => expect(at(group, 1)).toHaveFocus())
    await userEvent.keyboard("7")
    await waitFor(() => expect(at(group, 2)).toHaveFocus())
    await userEvent.keyboard("!")
    await expect(at(group, 2)).toHaveValue("")
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(at(group, 1)).toHaveFocus())
    await expect(valueOf(group)).toBe("a")
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(at(group, 0)).toHaveFocus())
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(at(group, 1)).toHaveFocus())
    await userEvent.keyboard("{Enter}")
    await expect(at(group, 1)).toHaveFocus()
  }
}

export const Pasting: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Security code" })
    await userEvent.click(at(group, 0))
    await userEvent.paste("12ab")
    await waitFor(() => expect(valueOf(group)).toBe("12ab"))
    await waitFor(() => expect(at(group, 3)).toHaveFocus())
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(valueOf(group)).toBe("12a"))
    await expect(at(group, 3)).toHaveFocus()
  }
}

export const Regexp: StoryObj = {
  render: demoApp(RegexpDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Code of 0 to 3" })
    await userEvent.click(at(group, 0))
    await userEvent.keyboard("5")
    await expect(at(group, 0)).toHaveValue("")
    await userEvent.keyboard("3")
    await waitFor(() => expect(at(group, 0)).toHaveValue("3"))
    await waitFor(() => expect(at(group, 1)).toHaveFocus())
  }
}

export const Success: StoryObj = {
  render: demoApp(SuccessDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "PinInput" })
    await expect(valueOf(group)).toBe("1234")
    await expect(css(at(group, 0)).borderTopColor).toBe("rgb(9, 146, 104)")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const masked = await canvas.findByRole("group", { name: "Masked" })
    await expect(at(masked, 0)).toHaveAttribute("type", "password")
    await expect(at(masked, 0)).toHaveAttribute("inputmode", "numeric")
    const wrong = canvas.getByRole("group", { name: "Wrong" })
    await expect(css(at(wrong, 0)).borderTopColor).toBe("rgb(250, 82, 82)")
    const locked = canvas.getByRole("group", { name: "Disabled" })
    await expect(at(locked, 0)).toBeDisabled()
    const long = canvas.getByRole("group", { name: "Six digits" })
    await expect(boxesOf(long)).toHaveLength(6)
    await expect(box(at(long, 0)).width).toBe(50)
    await expect(at(long, 0)).toHaveAttribute("autocomplete", "off")
    await expect(Math.round(box(at(long, 1)).left - box(at(long, 0)).right)).toBe(10)
  }
}

export const Completing: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const long = await canvas.findByRole("group", { name: "Six digits" })
    await userEvent.click(at(long, 0))
    await userEvent.paste("123456")
    await waitFor(() => expect(present(canvasElement.querySelector("input[name='otp']"))).toHaveValue("123456"))
    await waitFor(() => expect(at(long, 5)).toHaveFocus())
    const masked = canvas.getByRole("group", { name: "Masked" })
    await userEvent.click(at(masked, 2))
    await userEvent.keyboard("x")
    await expect(at(masked, 2)).toHaveValue("")
    await userEvent.keyboard("9")
    await waitFor(() => expect(at(masked, 2)).toHaveValue("9"))
    await userEvent.click(at(canvas.getByRole("group", { name: "Wrong" }), 0))
    await userEvent.keyboard("{ArrowLeft}")
    await rendered()
    await userEvent.click(at(canvas.getByRole("group", { name: "Wrong" }), 3))
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(valueOf(canvas.getByRole("group", { name: "Wrong" }))).toBe("987"))
    const wrong = canvas.getByRole("group", { name: "Wrong" })
    await userEvent.click(at(wrong, 3))
    await userEvent.keyboard("5")
    await waitFor(() => expect(valueOf(wrong)).toBe("9875"))
    await expect(at(wrong, 3)).toHaveFocus()
    await rendered()
    await userEvent.type(at(wrong, 0), "{Delete}", { initialSelectionStart: 0, initialSelectionEnd: 0 })
    await waitFor(() => expect(valueOf(wrong)).toBe("875"))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Security code" })
    await expect(css(at(group, 0)).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
