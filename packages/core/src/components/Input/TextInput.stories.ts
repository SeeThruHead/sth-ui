import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/text-input/configurator.ts"
import * as ControlledDemo from "./demos/text-input/controlled.ts"
import * as DisabledDemo from "./demos/text-input/disabled.ts"
import * as ErrorDemo from "./demos/text-input/error.ts"
import * as LoadingDemo from "./demos/text-input/loading.ts"
import * as SectionsDemo from "./demos/text-input/sections.ts"
import * as StylesApiDemo from "./demos/text-input/styles-api.ts"
import * as SuccessDemo from "./demos/text-input/success.ts"
import * as TypesDemo from "./demos/text-input/types.ts"
import * as UsageDemo from "./demos/text-input/usage.ts"

const meta: Meta = { title: "Inputs/TextInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const red = "rgb(250, 82, 82)"

const theme = stylex.create({ input: { letterSpacing: "1px" }, label: { textTransform: "uppercase" } })

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Input label" })
    await expect(input).toHaveAccessibleDescription("Input description")
    await expect(input).toHaveAttribute("id", "usage")
    await expect(box(input).height).toBe(36)
    await expect(css(input).borderTopColor).toBe("rgb(206, 212, 218)")
    await expect(css(canvas.getByText("Input label")).fontWeight).toBe("600")
    await expect(css(input.parentElement).marginTop).toBe("5px")
    await expect(box(input.parentElement?.parentElement).width).toBe(340)
  }
}

export const Loading: StoryObj = {
  render: demo(LoadingDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const loader = await within(canvasElement).findByRole("status", { name: "Loading" })
    await expect(present(loader.parentElement)).toHaveAttribute("data-position", "right")
  }
}

export const Sections: StoryObj = {
  render: demo(SectionsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [left, right] = await canvas.findAllByRole("textbox", { name: "Your email" })
    await expect(css(present(left)).paddingLeft).toBe("34px")
    await expect(css(present(right)).paddingRight).toBe("34px")
    await expect(css(present(right).parentElement?.parentElement).marginTop).toBe("16px")
  }
}

export const Controlled: StoryObj = {
  render: demoApp(ControlledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Type your name")).toBeVisible()
  }
}

export const Typing: StoryObj = {
  render: demoApp(ControlledDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByRole("textbox", { name: "Your name" }), "Ana")
    await waitFor(() => expect(canvas.getByText("Hello, Ana")).toBeVisible())
    await expect(canvas.getByRole("textbox", { name: "Your name" })).toHaveValue("Ana")
  }
}

export const Error: StoryObj = {
  render: demo(ErrorDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const asBoolean = await canvas.findByRole("textbox", { name: "Boolean error" })
    await expect(asBoolean).toHaveAttribute("aria-invalid", "true")
    await expect(css(asBoolean).borderTopColor).toBe(red)
    const withMessage = canvas.getByRole("textbox", { name: "With error message" })
    await expect(withMessage).toHaveAccessibleDescription("Invalid name")
    await expect(css(canvas.getByText("Invalid name")).color).toBe(red)
  }
}

export const Success: StoryObj = {
  render: demo(SuccessDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Text Input" })
    await expect(input).toHaveAccessibleDescription("Looks good!")
    await expect(css(input).borderTopColor).toBe("rgb(9, 146, 104)")
  }
}

export const Disabled: StoryObj = {
  render: demo(DisabledDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Disabled input" })
    await expect(input).toBeDisabled()
    await expect(css(input).opacity).toBe("0.6")
  }
}

export const Types: StoryObj = {
  render: demo(TypesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByLabelText("Password input")).toHaveAttribute("type", "password")
    await expect(canvas.getByLabelText("Date input")).toHaveAttribute("type", "date")
    await expect(canvas.getByLabelText("Date time input")).toHaveAttribute("type", "datetime-local")
  }
}

export const StylesApi: StoryObj = {
  render: demo(StylesApiDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Label" })
    await expect(css(input).borderTopStyle).toBe("dashed")
    await expect(css(canvas.getByText("Label")).color).toBe("rgb(190, 75, 219)")
    await expect(css(canvas.getByText("Description")).fontStyle).toBe("italic")
    await expect(present(canvas.getByText("Label").querySelector("span"))).toHaveTextContent("*")
    await expect(input).toHaveAccessibleDescription("Error Description")
  }
}

export const StylePropsOnTheRoot: StoryObj = {
  render: story(({ h, ui }) =>
    ui.TextInput(h, { id: "spaced", mt: 24, label: "Spaced", placeholder: "Only the root moves" })
  ),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox", { name: "Spaced" })
    const root = present(input.parentElement?.parentElement)
    await expect(css(root).marginTop).toBe("24px")
    await expect(css(input.parentElement).marginTop).toBe("0px")
  }
}

export const ThemeConfig: StoryObj = {
  render: story(
    ({ h, ui }) =>
      ui.Stack(h, {
        children: [
          ui.TextInput(h, { id: "themed", label: "Themed", placeholder: "From the theme" }),
          ui.InputBase(h, {
            id: "base",
            component: "button",
            pointer: true,
            label: "Pick a colour",
            children: [ui.InputPlaceholder(h, { children: ["Nothing picked"] })]
          })
        ]
      }),
    {
      config: {
        components: {
          TextInput: {
            defaultProps: { variant: "filled", size: "md" },
            styles: { input: theme.input, label: theme.label }
          }
        }
      }
    }
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Themed" })
    await expect(css(input).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(box(input).height).toBe(42)
    await expect(css(input).letterSpacing).toBe("1px")
    await expect(css(canvas.getByText("Themed")).textTransform).toBe("uppercase")
    const button = canvas.getByRole("button", { name: "Pick a colour" })
    await expect(css(button).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByText("Pick a colour")).textTransform).toBe("none")
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
