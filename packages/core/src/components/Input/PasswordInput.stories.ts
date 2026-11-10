import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/password-input/configurator.ts"
import * as ControlledDemo from "./demos/password-input/controlled-visibility.ts"
import * as DisabledDemo from "./demos/password-input/disabled.ts"
import * as ErrorDemo from "./demos/password-input/error.ts"
import * as FocusableDemo from "./demos/password-input/focusable.ts"
import * as IconDemo from "./demos/password-input/visibility-icon.ts"
import * as LoadingDemo from "./demos/password-input/loading.ts"
import * as SectionsDemo from "./demos/password-input/sections.ts"
import * as SuccessDemo from "./demos/password-input/success.ts"
import * as UsageDemo from "./demos/password-input/usage.ts"

const meta: Meta = { title: "Inputs/PasswordInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const toggleName = "Toggle password visibility"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText("Input label")
    await expect(input).toHaveAttribute("type", "password")
    await expect(input).toHaveAttribute("autocomplete", "off")
    await expect(input).toHaveAccessibleDescription("Input description")
    const toggle = canvas.getByRole("button", { name: toggleName })
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
    await expect(toggle).toHaveAttribute("tabindex", "-1")
    await expect(box(toggle).width).toBe(26)
    await expect(box(toggle.querySelector("svg")).width).toBe(20)
    await expect(box(input).width).toBe(340)
  }
}

export const Revealing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText("Input label")
    await userEvent.type(input, "hunter2")
    await userEvent.click(canvas.getByRole("button", { name: toggleName }))
    await waitFor(() => expect(input).toHaveAttribute("type", "text"))
    await expect(input).toHaveValue("hunter2")
    await expect(canvas.getByRole("button", { name: toggleName })).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(canvas.getByRole("button", { name: toggleName }))
    await waitFor(() => expect(input).toHaveAttribute("type", "password"))
  }
}

export const Loading: StoryObj = {
  render: demo(LoadingDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const loader = await within(canvasElement).findByRole("status", { name: "Loading" })
    await expect(present(loader.parentElement)).toHaveAttribute("data-position", "right")
  }
}

export const ControlledVisibility: StoryObj = {
  render: demoApp(ControlledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByLabelText("Password")).toHaveAttribute("type", "password")
    await expect(canvas.getByLabelText("Confirm password")).toHaveValue("secret")
  }
}

export const SharingVisibility: StoryObj = {
  render: demoApp(ControlledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first] = await canvas.findAllByRole("button", { name: toggleName })
    await userEvent.click(present(first))
    await waitFor(() => expect(canvas.getByLabelText("Password")).toHaveAttribute("type", "text"))
    await expect(canvas.getByLabelText("Confirm password")).toHaveAttribute("type", "text")
  }
}

export const VisibilityIcon: StoryObj = {
  render: demoApp(IconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = await canvas.findByRole("button", { name: toggleName })
    await expect(box(toggle.querySelector("svg")).width).toBe(20)
    await expect(box(canvas.getByLabelText("Change visibility toggle icon")).width).toBe(320)
  }
}

export const ChangingIcon: StoryObj = {
  render: demoApp(IconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = await canvas.findByRole("button", { name: toggleName })
    const hidden = present(toggle.querySelector("path")).getAttribute("d")
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute("aria-pressed", "true"))
    await expect(present(toggle.querySelector("path")).getAttribute("d")).not.toBe(hidden)
  }
}

export const Focusable: StoryObj = {
  render: demoApp(FocusableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByLabelText("Email"))
    await userEvent.tab()
    await expect(canvas.getByLabelText("Password")).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole("button", { name: toggleName })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(canvas.getByLabelText("Password")).toHaveAttribute("type", "text"))
    await userEvent.tab()
    await expect(canvas.getByLabelText("Nickname")).toHaveFocus()
  }
}

export const Sections: StoryObj = {
  render: demo(SectionsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByLabelText("With left section")
    await expect(css(left).paddingLeft).toBe("34px")
    await expect(canvas.queryByRole("button", { name: toggleName })).toBeNull()
    await expect(css(canvas.getByLabelText("With right section")).paddingRight).toBe("34px")
  }
}

export const Error: StoryObj = {
  render: demoApp(ErrorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByLabelText("Boolean error")
    await expect(plain).toHaveAttribute("aria-invalid", "true")
    await expect(css(plain).borderTopColor).toBe("rgb(250, 82, 82)")
    await expect(canvas.getByLabelText("With error message")).toHaveAccessibleDescription("Invalid name")
  }
}

export const Success: StoryObj = {
  render: demoApp(SuccessDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByLabelText("Password Input")
    await expect(input).toHaveAccessibleDescription("Looks good!")
    await expect(css(input).borderTopColor).toBe("rgb(9, 146, 104)")
  }
}

export const Disabled: StoryObj = {
  render: demo(DisabledDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByLabelText("Disabled password input")).toBeDisabled()
    await expect(canvas.queryByRole("button", { name: toggleName })).toBeNull()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByLabelText("Input label")
    await expect(css(input).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const RevealingStates: StoryObj = {
  render: demoApp(ErrorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first] = await canvas.findAllByRole("button", { name: toggleName })
    await userEvent.click(present(first))
    await waitFor(() => expect(canvas.getByLabelText("Boolean error")).toHaveAttribute("type", "text"))
  }
}

export const RevealingSuccess: StoryObj = {
  render: demoApp(SuccessDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: toggleName }))
    await waitFor(() => expect(canvas.getByLabelText("Password Input")).toHaveAttribute("type", "text"))
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
