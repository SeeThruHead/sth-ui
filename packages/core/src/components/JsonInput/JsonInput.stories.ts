import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as CustomSerializationDemo from "./demos/custom-serialization.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as LoadingDemo from "./demos/loading.ts"
import * as StatesDemo from "./demos/states.ts"
import * as SuccessDemo from "./demos/success.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/JsonInput" }

export default meta

const css = (element: Element) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Your package.json" })
    await expect(input.tagName).toBe("TEXTAREA")
    await expect(input).toHaveAttribute("data-monospace")
    await expect(input).toHaveAttribute("autocomplete", "off")
    await expect(css(input).fontFamily).toContain("monospace")
    await expect(css(input).fontSize).toBe("12px")
    await expect(input).not.toHaveAttribute("aria-invalid")
  }
}

export const Validating: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your package.json" })
    await userEvent.click(input)
    await userEvent.type(input, '{{"name":"sth-ui"')
    await userEvent.tab()
    await waitFor(() => expect(canvas.getByText("Invalid JSON")).toBeVisible())
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await userEvent.click(input)
    await waitFor(() => expect(canvas.queryByText("Invalid JSON")).toBeNull())
    await userEvent.type(input, "}")
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue('{\n  "name": "sth-ui"\n}'))
    await expect(canvas.queryByText("Invalid JSON")).toBeNull()
  }
}

export const Loading: StoryObj = {
  render: demoApp(LoadingDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Loading JSON" })
    await expect(input).toHaveAttribute("placeholder", "Enter JSON")
    await expect(canvasElement.querySelector("[data-loading], [role='status']")).not.toBeNull()
  }
}

export const Success: StoryObj = {
  render: demoApp(SuccessDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Valid JSON")).toBeVisible()
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Disabled" })
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('{ "a": 1, "B": 2 }')
  }
}

export const CustomSerialization: StoryObj = {
  render: demoApp(CustomSerializationDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Single quotes allowed" })
    await expect(input).toHaveValue("{'zeta': 1, 'alpha': 2}")
    await expect(input).not.toHaveAttribute("aria-invalid")
  }
}

export const Reformatting: StoryObj = {
  render: demoApp(CustomSerializationDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Single quotes allowed" })
    await userEvent.click(input)
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue('{\n  "alpha": 2,\n  "zeta": 1\n}'))
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const invalid = await canvas.findByRole("textbox", { name: "Starts invalid" })
    await expect(invalid).toHaveAttribute("aria-invalid", "true")
    await expect(canvas.queryByText("Unused")).toBeNull()
    await expect(canvas.getByText("Server rejected it")).toBeVisible()
    await expect(css(canvas.getByRole("textbox", { name: "With error" })).paddingTop).toBe("8px")
  }
}

export const Indenting: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const four = await canvas.findByRole("textbox", { name: "Four spaces" })
    await userEvent.click(four)
    await userEvent.type(four, "[[1,2]")
    await userEvent.tab()
    await waitFor(() => expect(four).toHaveValue("[\n    1,\n    2\n]"))
    const readOnly = canvas.getByRole("textbox", { name: "Read only" })
    await userEvent.click(readOnly)
    await userEvent.tab()
    await expect(readOnly).toHaveValue('{"kept":true}')
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Your package.json" })
    await expect(css(input).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

const themed = stylex.create({ input: { color: "rgb(250, 82, 82)" } })

export const Themed: StoryObj = {
  render: demoApp(SuccessDemo, {
    centered: true,
    config: { components: { JsonInput: { styles: { input: themed.input } } } }
  }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "JSON config" })
    await expect(css(input).color).toBe("rgb(250, 82, 82)")
    await expect(input).toHaveAttribute("data-monospace")
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
