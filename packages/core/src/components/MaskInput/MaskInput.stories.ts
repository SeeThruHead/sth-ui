import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as CustomTokensDemo from "./demos/custom-tokens.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as DynamicDemo from "./demos/dynamic.ts"
import * as ErrorDemo from "./demos/error.ts"
import * as RegexDemo from "./demos/regex.ts"
import * as ResetDemo from "./demos/reset.ts"
import * as SuccessDemo from "./demos/success.ts"
import * as SyntaxDemo from "./demos/syntax.ts"
import * as TransformDemo from "./demos/transform.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/MaskInput" }

export default meta

const field = (canvasElement: HTMLElement, name: string) =>
  within(canvasElement).findByRole<HTMLInputElement>("textbox", { name })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Phone number")
    await expect(input).toHaveValue("")
    await expect(input).toHaveAttribute("placeholder", "(___) ___-____")
    await expect(within(canvasElement).getByText("Incomplete")).toBeVisible()
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await field(canvasElement, "Phone number")
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(input).toHaveValue("(___) ___-____"))
    await user.keyboard("12a3")
    await expect(input).toHaveValue("(123) ___-____")
    await expect(input.selectionStart).toBe(6)
    await user.keyboard("4567890")
    await expect(input).toHaveValue("(123) 456-7890")
    await waitFor(() => expect(canvas.getByText("Raw value: 1234567890")).toBeVisible())
    await expect(canvas.getByText("Complete")).toBeVisible()
  }
}

export const Editing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Phone number")
    const user = userEvent.setup()
    await user.click(input)
    await user.keyboard("1234567890")
    input.setSelectionRange(10, 10)
    await user.keyboard("{Backspace}")
    await expect(input).toHaveValue("(123) 457-890_")
    await expect(input.selectionStart).toBe(8)
    await user.keyboard("{Control>}z{/Control}")
    await expect(input).toHaveValue("(123) 456-7890")
    await user.keyboard("{Control>}y{/Control}")
    await expect(input).toHaveValue("(123) 457-890_")
    input.setSelectionRange(4, 4)
    await user.keyboard("{ArrowRight}")
    await expect(input.selectionStart).toBe(6)
    await user.keyboard("{ArrowLeft}")
    await expect(input.selectionStart).toBe(4)
    await user.keyboard("{Delete}")
    await expect(input).toHaveValue("(123) 578-90__")
  }
}

export const Pasting: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Phone number")
    const user = userEvent.setup()
    await user.click(input)
    await user.keyboard("12")
    await user.paste("3-4 5")
    await expect(input).toHaveValue("(123) 45_-____")
    await expect(input.selectionStart).toBe(8)
  }
}

export const PastingUnfocused: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Phone number")
    const data = new DataTransfer()
    data.setData("text", "123")
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }))
    await expect(input).toHaveValue("(123) ")
    await expect(input).not.toHaveFocus()
    input.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true }))
    await expect(input).toHaveValue("(123) ")
  }
}

export const Blurring: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await field(canvasElement, "Phone number")
    const user = userEvent.setup()
    await user.click(input)
    await user.tab()
    await expect(input).toHaveValue("")
    await user.click(input)
    await user.keyboard("12")
    await user.tab()
    await expect(input).toHaveValue("(12")
    await waitFor(() => expect(canvas.getByText("Raw value: 12")).toBeVisible())
    await user.click(input)
    await expect(input).toHaveValue("(12_) ___-____")
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Phone number")
    const user = userEvent.setup()
    await user.click(input)
    await user.keyboard("12")
    await user.pointer({ keys: "[MouseLeft]", target: input, offset: 12 })
    await waitFor(() => expect(input.selectionStart).toBe(3))
    await user.pointer({ keys: "[MouseLeft]", target: input, offset: 0 })
    await waitFor(() => expect(input.selectionStart).toBe(3))
  }
}

export const Dynamic: StoryObj = {
  render: demoApp(DynamicDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Credit card")).toHaveAttribute("placeholder", "____ ____ ____ ____")
  }
}

export const TypingAmex: StoryObj = {
  render: demoApp(DynamicDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Credit card")
    const user = userEvent.setup()
    await user.click(input)
    await user.keyboard("378282246310005")
    await expect(input).toHaveValue("3782 822463 10005")
    await user.clear(input)
    await user.keyboard("4111111111111111")
    await expect(input).toHaveValue("4111 1111 1111 1111")
  }
}

export const CustomTokens: StoryObj = {
  render: demoApp(CustomTokensDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Hex color")).toHaveValue("")
  }
}

export const TypingHex: StoryObj = {
  render: demoApp(CustomTokensDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Hex color")
    await userEvent.setup().type(input, "ff00gaa")
    await expect(input).toHaveValue("#ff00aa")
  }
}

export const Regex: StoryObj = {
  render: demoApp(RegexDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Time (HH:MM)")
    await expect(input).toHaveAttribute("placeholder", "__:__")
  }
}

export const TypingTime: StoryObj = {
  render: demoApp(RegexDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Time (HH:MM)")
    await userEvent.setup().type(input, "3239")
    await expect(input).toHaveValue("23:__")
  }
}

export const Transform: StoryObj = {
  render: demoApp(TransformDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Promo code")).toHaveValue("")
    await expect(within(canvasElement).getByText(/auto-uppercased/)).toBeVisible()
  }
}

export const TypingLowercase: StoryObj = {
  render: demoApp(TransformDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Promo code")
    const user = userEvent.setup()
    await user.click(input)
    await expect(input).toHaveValue("XXX-0000")
    await user.keyboard("ab")
    await expect(input).toHaveValue("ABX-0000")
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Phone number")).toBeDisabled()
  }
}

export const Error: StoryObj = {
  render: demoApp(ErrorDemo),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Phone number")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(within(canvasElement).getByText("Invalid phone number")).toBeVisible()
  }
}

export const Success: StoryObj = {
  render: demoApp(SuccessDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Phone number")).toBeVisible()
    await expect(within(canvasElement).getByText("Looks good!")).toBeVisible()
  }
}

export const Reset: StoryObj = {
  render: demoApp(ResetDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Phone number")).toHaveValue("(555) 123-4567")
  }
}

export const Resetting: StoryObj = {
  render: demoApp(ResetDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await field(canvasElement, "Phone number")
    await userEvent.setup().click(canvas.getByRole("button", { name: "Reset" }))
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Phone number" })).toHaveValue("(555) 123-4567"))
  }
}

export const Syntax: StoryObj = {
  render: demoApp(SyntaxDemo),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement, "Always shows the mask")).toHaveValue("mm/dd/yyyy")
    await expect(within(canvasElement).getByText("Not complete yet")).toBeVisible()
  }
}

export const OptionalAndEscaped: StoryObj = {
  render: demoApp(SyntaxDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const extension = await field(canvasElement, "Phone with optional extension")
    await user.type(extension, "1234567890")
    await waitFor(() => expect(canvas.getByText("Completed: (123) 456-7890 x____")).toBeVisible())
    const escaped = canvas.getByRole("textbox", { name: "Escaped token" })
    await user.type(escaped, "12")
    await expect(escaped).toHaveValue("A12_")
    await user.tab()
    await expect(escaped).toHaveValue("")
    const always = canvas.getByRole("textbox", { name: "Always shows the mask" })
    await user.type(always, "1225")
    await user.tab()
    await expect(always).toHaveValue("12/25/yyyy")
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
