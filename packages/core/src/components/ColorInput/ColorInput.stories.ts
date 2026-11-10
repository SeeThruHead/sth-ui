import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ChangeEndDemo from "./demos/change-end.ts"
import * as CloseOnSwatchDemo from "./demos/close-on-swatch.ts"
import * as DisallowInputDemo from "./demos/disallow-input.ts"
import * as EyeDropperDemo from "./demos/eye-dropper.ts"
import * as FixOnBlurDemo from "./demos/fix-on-blur.ts"
import * as FormatsDemo from "./demos/formats.ts"
import * as FullWidthDemo from "./demos/full-width.ts"
import * as SectionsDemo from "./demos/sections.ts"
import * as StatesDemo from "./demos/states.ts"
import * as SwatchesOnlyDemo from "./demos/swatches-only.ts"
import * as SwatchesDemo from "./demos/swatches.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as WithoutPickerDemo from "./demos/without-picker.ts"

const meta: Meta = { title: "Inputs/ColorInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const dropdown = () => document.querySelector("[data-color-input-dropdown]")

const page = within(document.body)

const previewOf = (input: HTMLElement) => present(input.parentElement?.querySelector("[data-color-preview]"))

const eyeDropperOf = (input: HTMLElement) =>
  input.parentElement?.querySelector("button[aria-label='Pick a colour from the screen']") ?? null

const stubEyeDropper = (color: string) => () => {
  Object.defineProperty(window, "EyeDropper", {
    configurable: true,
    writable: true,
    value: class {
      open = () => Promise.resolve({ sRGBHex: color })
    }
  })

  return () => {
    Reflect.deleteProperty(window, "EyeDropper")
  }
}

export const Usage: StoryObj = {
  beforeEach: stubEyeDropper("#fa5252"),
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Input label" })
    await expect(input).toHaveAttribute("placeholder", "Input placeholder")
    await expect(input).toHaveAttribute("autocomplete", "off")
    await expect(input).toHaveAttribute("spellcheck", "false")
    await expect(canvas.getByText("Input description")).toBeVisible()
    await expect(box(input).height).toBe(36)
    const preview = previewOf(input)
    await expect(box(preview).width).toBe(18)
    await expect(css(preview.children[2]).backgroundColor).toBe("rgb(255, 255, 255)")
    const eyeDropper = present(eyeDropperOf(input))
    await expect(box(eyeDropper).width).toBe(26)
    await expect(box(present(eyeDropper.querySelector("svg"))).width).toBe(16)
    await expect(dropdown()).toBeNull()
  }
}

export const Opening: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Input label" })
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(dropdown()).not.toBeNull())
    const opened = present(dropdown())
    await waitFor(() => expect(Math.round(box(opened).top)).toBe(Math.round(box(input).bottom + 5)))
    await expect(Math.round(box(opened).left)).toBe(Math.round(box(input).left))
    await expect(css(opened).paddingTop).toBe("8px")
    await expect(Math.round(box(opened).width)).toBe(218)
    const saturation = present(page.getAllByRole("slider")[0])
    await expect(saturation).toHaveAttribute("tabindex", "-1")
    await user.type(input, "#fa5252")
    await waitFor(() => expect(input).toHaveValue("#fa5252"))
    await waitFor(() => expect(css(previewOf(input).children[2]).backgroundColor).toBe("rgb(250, 82, 82)"))
    await waitFor(() => expect(saturation).toHaveAttribute("aria-valuetext", "rgba(250, 82, 82, 1)"))
    await user.pointer({
      keys: "[MouseLeft][/MouseLeft]",
      target: saturation,
      coords: { clientX: box(saturation).right - 1, clientY: box(saturation).top + 1 }
    })
    await waitFor(() => expect(input).not.toHaveValue("#fa5252"))
    await expect(input).toHaveFocus()
    await expect(dropdown()).not.toBeNull()
    await user.tab()
    await waitFor(() => expect(dropdown()).toBeNull())
  }
}

export const FixingOnBlur: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Input label" })
    const user = userEvent.setup()
    await user.type(input, "#228be6")
    await user.type(input, "{Backspace}")
    await expect(input).toHaveValue("#228be")
    await user.tab()
    await waitFor(() => expect(input).toHaveValue("#228be6"))
  }
}

export const Formats: StoryObj = {
  render: demoApp(FormatsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "HEX" })).toBeVisible()
    await expect(canvas.getByRole("textbox", { name: "RGBA" })).toHaveAttribute("placeholder", "rgba(197, 216, 153, 1)")
    await expect(canvas.getAllByRole("textbox")).toHaveLength(3)
  }
}

export const PickingAlpha: StoryObj = {
  render: demoApp(FormatsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "RGBA" })
    const user = userEvent.setup()
    await user.type(input, "#c5d899")
    await waitFor(() => expect(page.getAllByRole("slider")).toHaveLength(3))
    const alpha = page.getAllByRole("slider")[2]
    await user.pointer({
      keys: "[MouseLeft][/MouseLeft]",
      target: present(alpha),
      coords: { clientX: box(alpha).left + box(alpha).width / 2, clientY: box(alpha).top + 4 }
    })
    await waitFor(() => expect(input).toHaveValue("rgba(197, 216, 153, 0.5)"))
    await user.tab()
    await waitFor(() => expect(input).toHaveValue("rgba(197, 216, 153, 0.5)"))
  }
}

export const FixOnBlur: StoryObj = {
  render: demoApp(FixOnBlurDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Value is not fixed on blur" })).toHaveAttribute(
      "placeholder",
      "May contain invalid value"
    )
  }
}

export const KeepingInvalidValue: StoryObj = {
  render: demoApp(FixOnBlurDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Value is not fixed on blur" })
    const user = userEvent.setup()
    await user.type(input, "not a colour")
    await user.tab()
    await expect(input).toHaveValue("not a colour")
  }
}

export const ChangeEnd: StoryObj = {
  render: demoApp(ChangeEndDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("#FFFFFF", { selector: "b" })).toBeVisible()
    await expect(canvas.getByRole("textbox", { name: "Pick color" })).toHaveValue("#FFFFFF")
  }
}

export const EndingChange: StoryObj = {
  render: demoApp(ChangeEndDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Pick color" })
    const user = userEvent.setup()
    await user.clear(input)
    await user.type(input, "#00f")
    await waitFor(() => expect(canvas.getByText("#0000ff", { selector: "b" })).toBeVisible())
  }
}

export const DisallowInput: StoryObj = {
  render: demoApp(DisallowInputDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your favorite color" })
    await expect(input).toHaveAttribute("readonly")
    await expect(css(input).cursor).toBe("pointer")
  }
}

export const OpeningWithoutTyping: StoryObj = {
  render: demoApp(DisallowInputDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your favorite color" })
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(dropdown()).not.toBeNull())
    await user.keyboard("abc")
    await expect(input).toHaveValue("")
  }
}

export const Swatches: StoryObj = {
  render: demoApp(SwatchesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Your favorite color" })).toHaveAttribute(
      "placeholder",
      "Pick color"
    )
  }
}

export const PickingSwatch: StoryObj = {
  render: demoApp(SwatchesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your favorite color" })
    const user = userEvent.setup()
    await user.click(input)
    const red = await page.findByRole("button", { name: "#fa5252" })
    await expect(red).toHaveAttribute("tabindex", "-1")
    await expect(page.getAllByRole("button", { name: /^#/ })).toHaveLength(14)
    await user.click(red)
    await waitFor(() => expect(input).toHaveValue("#fa5252"))
    await expect(dropdown()).not.toBeNull()
    await expect(input).toHaveFocus()
  }
}

export const SwatchesOnly: StoryObj = {
  render: demoApp(SwatchesOnlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your favorite color" })
    await expect(eyeDropperOf(input)).toBeNull()
    await expect(input).toHaveAttribute("readonly")
  }
}

export const PickingOnlySwatches: StoryObj = {
  render: demoApp(SwatchesOnlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your favorite color" })
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(dropdown()).not.toBeNull())
    await expect(page.queryByRole("slider")).toBeNull()
    await user.click(page.getByRole("button", { name: "#40c057" }))
    await waitFor(() => expect(input).toHaveValue("#40c057"))
  }
}

export const CloseOnSwatch: StoryObj = {
  render: demoApp(CloseOnSwatchDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole("textbox", { name: "Dropdown is closed when color swatch is clicked" })
    ).toHaveAttribute("placeholder", "Click color swatch")
  }
}

export const ClosingOnSwatch: StoryObj = {
  render: demoApp(CloseOnSwatchDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Dropdown is closed when color swatch is clicked" })
    const user = userEvent.setup()
    await user.click(input)
    await user.click(await page.findByRole("button", { name: "#7950f2" }))
    await waitFor(() => expect(dropdown()).toBeNull())
    await expect(input).toHaveValue("#7950f2")
  }
}

export const WithoutPicker: StoryObj = {
  render: demoApp(WithoutPickerDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Without dropdown" })
    await expect(css(input).cursor).toBe("pointer")
  }
}

export const FocusingWithoutPicker: StoryObj = {
  render: demoApp(WithoutPickerDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Without dropdown" })
    const user = userEvent.setup()
    await user.click(input)
    await user.type(input, "#fab005")
    await expect(dropdown()).toBeNull()
    await waitFor(() => expect(css(previewOf(input).children[2]).backgroundColor).toBe("rgb(250, 176, 5)"))
  }
}

export const EyeDropper: StoryObj = {
  beforeEach: stubEyeDropper("#12b886"),
  render: demoApp(EyeDropperDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("textbox", { name: "Without eye dropper" })
    const custom = canvas.getByRole("textbox", { name: "With custom eye dropper icon" })
    await expect(eyeDropperOf(plain)).toBeNull()
    const button = present(eyeDropperOf(custom))
    await expect(box(present(button.querySelector("svg"))).width).toBe(18)
  }
}

export const PickingFromScreen: StoryObj = {
  beforeEach: stubEyeDropper("#12b886"),
  render: demoApp(EyeDropperDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "With custom eye dropper icon" })
    const user = userEvent.setup()
    await user.click(present(eyeDropperOf(input)))
    await waitFor(() => expect(input).toHaveValue("#12b886"))
  }
}

export const Sections: StoryObj = {
  render: demoApp(SectionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByRole("textbox", { name: "With custom left section" })
    const right = canvas.getByRole("textbox", { name: "With custom right section" })
    await expect(left.parentElement?.querySelector("[data-color-preview]")).toBeNull()
    await expect(eyeDropperOf(left)).toBeNull()
    await expect(eyeDropperOf(right)).toBeNull()
    await expect(right.parentElement?.querySelector("[data-color-preview]")).not.toBeNull()
  }
}

export const States: StoryObj = {
  beforeEach: stubEyeDropper("#000000"),
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Invalid name")).toBeVisible()
    await expect(canvas.getByRole("textbox", { name: "Boolean error" })).toHaveAttribute("aria-invalid", "true")
    const disabled = canvas.getByRole("textbox", { name: "Disabled" })
    await expect(disabled).toBeDisabled()
    await expect(eyeDropperOf(disabled)).toBeNull()
    await expect(eyeDropperOf(canvas.getByRole("textbox", { name: "Read only" }))).toBeNull()
    await expect(eyeDropperOf(canvas.getByRole("textbox", { name: "Boolean error" }))).not.toBeNull()
  }
}

export const FocusingReadOnly: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("textbox", { name: "Read only" }))
    await expect(dropdown()).toBeNull()
    await user.click(canvas.getByRole("textbox", { name: "Loading" }))
    await waitFor(() => expect(dropdown()).not.toBeNull())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Input label" })
    await expect(css(input).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const FullWidthDropdown: StoryObj = {
  render: demoApp(FullWidthDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Full width dropdown" })
    await userEvent.setup().click(input)
    await waitFor(() => expect(dropdown()).not.toBeNull())
    await waitFor(() => expect(Math.round(box(dropdown()).width)).toBe(Math.round(box(input).width)))
    const wrapper = present(page.getAllByRole("slider")[0]?.parentElement)
    await expect(wrapper).toHaveAttribute("data-full-width")
    await expect(Math.round(box(wrapper).width)).toBe(Math.round(box(input).width) - 18)
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
