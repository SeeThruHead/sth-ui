import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/number-input/configurator.ts"
import * as AllowDecimalDemo from "./demos/number-input/allow-decimal.ts"
import * as AllowNegativeDemo from "./demos/number-input/allow-negative.ts"
import * as ExtrasDemo from "./demos/number-input/extras.ts"
import * as DecimalScaleDemo from "./demos/number-input/decimal-scale.ts"
import * as DecimalSeparatorDemo from "./demos/number-input/decimal-separator.ts"
import * as DisabledDemo from "./demos/number-input/disabled.ts"
import * as ErrorDemo from "./demos/number-input/error.ts"
import * as FixedDemo from "./demos/number-input/fixed-decimal-scale.ts"
import * as MinMaxDemo from "./demos/number-input/min-max.ts"
import * as OptionsDemo from "./demos/number-input/options.ts"
import * as PrefixSuffixDemo from "./demos/number-input/prefix-suffix.ts"
import * as RightSectionDemo from "./demos/number-input/right-section.ts"
import * as StrictDemo from "./demos/number-input/strict-clamp.ts"
import * as SuccessDemo from "./demos/number-input/success.ts"
import * as ThousandsDemo from "./demos/number-input/thousands-separator.ts"
import * as UsageDemo from "./demos/number-input/usage.ts"

const meta: Meta = { title: "Inputs/NumberInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const controlsOf = (input: HTMLElement) => [
  ...present(input.parentElement).querySelectorAll<HTMLButtonElement>("button[data-direction]")
]

const up = (input: HTMLElement) => present(controlsOf(input)[0])

const rendered = async () => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(50))
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Input label" })
    await expect(input).toHaveAttribute("inputmode", "decimal")
    await expect(input).toHaveAccessibleDescription("Input description")
    await expect(controlsOf(input)).toHaveLength(2)
    await expect(box(up(input).parentElement).width).toBe(24)
    await expect(box(up(input)).height).toBe(17)
    await expect(box(up(input).querySelector("svg")).width).toBe(14)
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Input label" })
    await userEvent.type(input, "12.")
    await expect(input).toHaveValue("12.")
    await userEvent.type(input, "5")
    await waitFor(() => expect(input).toHaveValue("12.5"))
    await rendered()
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(input).toHaveValue("13.5"))
    await userEvent.click(up(input))
    await waitFor(() => expect(input).toHaveValue("14.5"))
    await userEvent.click(present(controlsOf(input)[1]))
    await waitFor(() => expect(input).toHaveValue("13.5"))
    await userEvent.click(present(controlsOf(input)[1]))
    await waitFor(() => expect(input).toHaveValue("12.5"))
    input.focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveValue("11.5"))
    await userEvent.keyboard("{ArrowLeft}")
    await expect(input).toHaveValue("11.5")
  }
}

export const MinMax: StoryObj = {
  render: demoApp(MinMaxDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Enter value between 10 and 20" })
    await userEvent.type(input, "25")
    await expect(input).toHaveValue("25")
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue("20"))
    await expect(up(input)).toBeDisabled()
    await userEvent.clear(input)
    await waitFor(() => expect(input).toHaveValue(""))
    await userEvent.type(input, "5")
    await waitFor(() => expect(input).toHaveValue("5"))
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue("10"))
    await expect(present(controlsOf(input)[1])).toBeDisabled()
  }
}

export const StrictClamp: StoryObj = {
  render: demoApp(StrictDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Strict clamping between 0 and 100" })
    await userEvent.type(input, "150")
    await waitFor(() => expect(input).toHaveValue("100"))
  }
}

export const PrefixSuffix: StoryObj = {
  render: demoApp(PrefixSuffixDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "With prefix" })).toHaveValue("$100")
    await expect(canvas.getByRole("textbox", { name: "With suffix" })).toHaveValue("100%")
  }
}

export const TypingWithAffixes: StoryObj = {
  render: demoApp(PrefixSuffixDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const prefixed = await canvas.findByRole("textbox", { name: "With prefix" })
    await userEvent.type(prefixed, "5")
    await waitFor(() => expect(prefixed).toHaveValue("$1005"))
    const suffixed = canvas.getByRole("textbox", { name: "With suffix" })
    await userEvent.clear(suffixed)
    await userEvent.type(suffixed, "42")
    await waitFor(() => expect(suffixed).toHaveValue("42%"))
  }
}

export const AllowNegative: StoryObj = {
  render: demoApp(AllowNegativeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Negative number are not allowed" })
    await userEvent.type(input, "-5")
    await waitFor(() => expect(input).toHaveValue("5"))
  }
}

export const AllowDecimal: StoryObj = {
  render: demoApp(AllowDecimalDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Decimals are not allowed" })
    await userEvent.type(input, "1.5")
    await waitFor(() => expect(input).toHaveValue("15"))
    await userEvent.type(input, "{Backspace}")
    await waitFor(() => expect(input).toHaveValue("1"))
  }
}

export const DecimalScale: StoryObj = {
  render: demoApp(DecimalScaleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", {
      name: "You can enter only 2 digits after decimal point"
    })
    await userEvent.type(input, "1.234")
    await waitFor(() => expect(input).toHaveValue("1.23"))
  }
}

export const FixedDecimalScale: StoryObj = {
  render: demoApp(FixedDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", {
      name: "Always show 2 digits after decimal point"
    })
    await expect(input).toHaveValue("2.20")
  }
}

export const DecimalSeparator: StoryObj = {
  render: demoApp(DecimalSeparatorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Custom decimal separator" })
    await expect(input).toHaveValue("20,573")
    await userEvent.clear(input)
    await userEvent.type(input, "3,5")
    await waitFor(() => expect(input).toHaveValue("3,5"))
  }
}

export const ThousandsSeparator: StoryObj = {
  render: demoApp(ThousandsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const comma = await canvas.findByRole("textbox", { name: "Thousands are separated with a comma" })
    await expect(comma).toHaveValue("1,000,000")
    await expect(canvas.getByRole("textbox", { name: "Thousands are separated with a space" })).toHaveValue("1 000 000")
    await userEvent.type(comma, "0")
    await waitFor(() => expect(comma).toHaveValue("10,000,000"))
  }
}

export const RightSection: StoryObj = {
  render: demoApp(RightSectionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const hidden = await canvas.findByRole("textbox", { name: "Hide controls" })
    await expect(controlsOf(hidden)).toHaveLength(0)
    const custom = canvas.getByRole("textbox", { name: "Custom right section" })
    await expect(controlsOf(custom)).toHaveLength(0)
    await expect(present(custom.parentElement).querySelector("svg")).not.toBeNull()
    await userEvent.type(hidden, "7")
    await waitFor(() => expect(hidden).toHaveValue("7"))
    await userEvent.type(custom, "8")
    await waitFor(() => expect(custom).toHaveValue("8"))
  }
}

export const Error: StoryObj = {
  render: demoApp(ErrorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("textbox", { name: "Boolean error" })
    await expect(plain).toHaveAttribute("aria-invalid", "true")
    await expect(css(up(plain)).color).toBe("rgb(250, 82, 82)")
    await expect(canvas.getByRole("textbox", { name: "With error message" })).toHaveAccessibleDescription(
      "Invalid name"
    )
    await userEvent.click(up(plain))
    await userEvent.click(up(canvas.getByRole("textbox", { name: "With error message" })))
    await waitFor(() => expect(plain).toHaveValue("1"))
  }
}

export const Success: StoryObj = {
  render: demoApp(SuccessDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Number input" })
    await expect(input).toHaveAccessibleDescription("Looks good!")
    await userEvent.type(input, "3")
    await waitFor(() => expect(input).toHaveValue("3"))
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Disabled" })
    await expect(input).toBeDisabled()
    await expect(up(input)).toBeDisabled()
    await expect(css(up(input)).opacity).toBe("0.6")
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const big = await canvas.findByRole("textbox", { name: "Big" })
    await expect(big).toHaveValue("€ 1,234.5")
    await expect(box(up(big).parentElement).width).toBe(31)
    await userEvent.click(up(big))
    await waitFor(() => expect(big).toHaveValue("€ 1,235"))
    const free = canvas.getByRole("textbox", { name: "Free" })
    await userEvent.click(up(free))
    await waitFor(() => expect(free).toHaveValue("6"))
    await userEvent.type(free, "0.")
    await userEvent.tab()
    await expect(free).toHaveValue("60.")
    await userEvent.clear(big)
    await userEvent.type(big, "7.")
    await userEvent.tab()
    await waitFor(() => expect(big).toHaveValue("€ 7"))
    await userEvent.clear(big)
    await userEvent.type(big, "-")
    await userEvent.tab()
    await waitFor(() => expect(big).toHaveValue("-€ "))
  }
}

export const Extras: StoryObj = {
  render: demoApp(ExtrasDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Lakh grouping" })).toHaveValue("12,34,567")
    await expect(canvas.getByRole("textbox", { name: "Wan grouping" })).toHaveValue("123,4567")
  }
}

export const UsingExtras: StoryObj = {
  render: demoApp(ExtrasDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const zeros = await canvas.findByRole("textbox", { name: "Leading zeros kept" })
    await user.type(zeros, "007")
    await waitFor(() => expect(zeros).toHaveValue("007"))
    await user.tab()
    await expect(zeros).toHaveValue("007")
    const trimmed = canvas.getByRole("textbox", { name: "No leading zeros" })
    await user.type(trimmed, "007")
    await waitFor(() => expect(trimmed).toHaveValue("7"))
    const allowed = canvas.getByRole<HTMLInputElement>("textbox", { name: "Up to 100" })
    allowed.focus()
    await waitFor(() => expect(allowed).toHaveFocus())
    await user.keyboard("5")
    await waitFor(() => expect(allowed).toHaveValue("5"))
    await user.keyboard("{End}0")
    await waitFor(() => expect(allowed).toHaveValue("50"))
    await expect(allowed).toHaveFocus()
    await user.keyboard("0")
    await expect(allowed).toHaveValue("50")
    await user.tab()
    await user.click(allowed)
    await waitFor(() => expect([allowed.selectionStart, allowed.selectionEnd]).toEqual([0, 2]))
    const hold = canvas.getByRole<HTMLInputElement>("textbox", { name: "Hold to step" })
    const increase = present(
      hold.closest("[data-variant]")?.parentElement?.querySelector<HTMLElement>("[data-direction=up]")
    )
    await user.pointer({ keys: "[MouseLeft>]", target: increase })
    await waitFor(() => expect(Number(hold.value)).toBeGreaterThan(3))
    await user.pointer({ keys: "[/MouseLeft]", target: increase })
    const held = Number(hold.value)
    await expect(
      waitFor(() => expect(Number(hold.value)).toBeGreaterThan(held + 1), { timeout: 200 })
    ).rejects.toThrow()
    const custom = canvas.getByRole("textbox", { name: "Custom controls" })
    await user.click(canvas.getByRole("button", { name: "Increment" }))
    await waitFor(() => expect(custom).toHaveValue("6"))
    await user.click(canvas.getByRole("button", { name: "Decrement" }))
    await waitFor(() => expect(custom).toHaveValue("5"))
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
