import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ClearButtonDemo from "./demos/clear-button.ts"
import * as ComponentDemo from "./demos/component.ts"
import * as CompoundDemo from "./demos/compound.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as ErrorDemo from "./demos/error.ts"
import * as InputWrapperOrderDemo from "./demos/input-wrapper-order.ts"
import * as LoadingDemo from "./demos/loading.ts"
import * as PlaceholderDemo from "./demos/placeholder.ts"
import * as SectionsDemo from "./demos/sections.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as SuccessDemo from "./demos/success.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as WrapperDemo from "./demos/wrapper.ts"

const meta: Meta = { title: "Inputs/Input" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const placeholderColor = (element: Element) => getComputedStyle(element, "::placeholder").color

const custom = stylex.create({ clear: { color: "rgb(1, 2, 3)" } })

const gray = "rgb(206, 212, 218)"

const red = "rgb(250, 82, 82)"

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox")
    await expect(input).toHaveAttribute("placeholder", "Input component")
    await expect(box(input).height).toBe(36)
    await expect(box(input).width).toBe(340)
    await expect(css(input).paddingLeft).toBe("12px")
    await expect(css(input).fontSize).toBe("14px")
    await expect(css(input).lineHeight).toBe("34px")
    await expect(css(input).borderTopColor).toBe(gray)
    await expect(css(input).borderTopLeftRadius).toBe("8px")
    await expect(css(input).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(placeholderColor(input)).toBe("rgb(173, 181, 189)")
    await expect(input.parentElement).toHaveAttribute("data-variant", "default")
    await expect(input.parentElement).toHaveAttribute("data-size", "sm")
    await expect(input).not.toBeRequired()
  }
}

export const Focusing: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("textbox")
    await userEvent.click(input)
    await expect(input).toHaveFocus()
    await waitFor(() => expect(css(input).borderTopColor).toBe("rgb(34, 139, 230)"))
    await expect(css(input).outlineStyle).toBe("none")
  }
}

export const Loading: StoryObj = {
  render: demo(LoadingDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const loader = await canvas.findByRole("status", { name: "Loading" })
    const section = present(loader.parentElement)
    await expect(section).toHaveAttribute("data-position", "right")
    await expect(box(section).width).toBe(34)
    await expect(box(loader).width).toBe(17)
    await expect(css(canvas.getByRole("textbox")).paddingRight).toBe("34px")
  }
}

export const Sections: StoryObj = {
  render: demoApp(SectionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = await canvas.findByPlaceholderText("Your email")
    const left = present(email.previousElementSibling)
    await expect(left).toHaveAttribute("data-position", "left")
    await expect(box(left).width).toBe(34)
    await expect(css(left).color).toBe("rgb(134, 142, 150)")
    await expect(css(left).pointerEvents).toBe("none")
    await expect(css(email).paddingLeft).toBe("34px")
    await expect(email.parentElement).toHaveAttribute("data-with-left-section")
    const clear = canvas.getByRole("button", { name: "Clear input" })
    await expect(css(clear.parentElement).pointerEvents).toBe("all")
    await expect(css(clear).backgroundColor).toBe("rgb(255, 255, 255)")
  }
}

export const Clearing: StoryObj = {
  render: demoApp(ClearButtonDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByPlaceholderText("Clearable input")
    await expect(input).toHaveValue("clearable")
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull()
    await userEvent.type(input, "hi")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible())
    await expect(input).toHaveValue("hi")
  }
}

export const ClearingSections: StoryObj = {
  render: demoApp(SectionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Clear input" }))
    await waitFor(() => expect(canvas.getByPlaceholderText("Clearable input")).toHaveValue(""))
    await userEvent.type(canvas.getByPlaceholderText("Clearable input"), "a")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Clear input" })).toBeVisible())
  }
}

export const ClearButton: StoryObj = {
  render: demoApp(ClearButtonDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const clear = await within(canvasElement).findByRole("button", { name: "Clear" })
    await expect(box(clear).width).toBe(22)
    await expect(css(clear).backgroundColor).toBe("rgb(255, 255, 255)")
  }
}

export const Component: StoryObj = {
  render: demo(ComponentDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Button input" })
    await expect(button).toHaveAttribute("type", "button")
    await expect(css(button).cursor).toBe("pointer")
    await expect(box(button).height).toBe(36)
    const select = canvas.getByRole("combobox", { name: "Number" })
    await expect(within(select).getAllByRole("option")).toHaveLength(2)
    await expect(css(select).paddingRight).toBe("34px")
  }
}

export const Wrapper: StoryObj = {
  render: demo(WrapperDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Input label" })
    await expect(input).toHaveAttribute("id", "wrapper-demo")
    await expect(input).toHaveAttribute("aria-describedby", "wrapper-demo-error wrapper-demo-description")
    await expect(input).not.toHaveAttribute("aria-invalid")
    await expect(input).toHaveAccessibleDescription("Input error Input description")
    const label = present(canvasElement.querySelector("label"))
    await expect(css(label).fontWeight).toBe("600")
    await expect(css(label).fontSize).toBe("14px")
    await expect(label.querySelector("span")).toBeNull()
    await expect(css(canvas.getByText("Input description")).fontSize).toBe("12px")
    await expect(css(canvas.getByText("Input description")).color).toBe("rgb(134, 142, 150)")
    await expect(css(canvas.getByText("Input error")).color).toBe(red)
    await expect(css(input.parentElement).marginTop).toBe("5px")
    await expect(css(input.parentElement).marginBottom).toBe("5px")
    await expect(css(input).borderTopColor).toBe(gray)
  }
}

export const WrapperOrder: StoryObj = {
  render: demo(InputWrapperOrderDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first, second] = await canvas.findAllByRole("textbox")
    await expect(css(present(first).parentElement).marginTop).toBe("0px")
    await expect(css(present(first).parentElement).marginBottom).toBe("5px")
    await expect(present(first).parentElement?.nextElementSibling).toHaveTextContent("Description below the input")
    await expect(present(second)).toHaveAccessibleDescription("both below the input Error and description are")
    await expect(present(second).parentElement?.nextElementSibling).toHaveTextContent("Error and description are")
  }
}

export const Error: StoryObj = {
  render: demo(ErrorDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const asBoolean = await canvas.findByRole("textbox", { name: "Error as boolean" })
    await expect(asBoolean).toHaveAttribute("aria-invalid", "true")
    await expect(asBoolean).not.toHaveAttribute("aria-describedby")
    await expect(css(asBoolean).borderTopColor).toBe(red)
    await expect(placeholderColor(asBoolean)).toBe(red)
    const plain = canvas.getByRole("textbox", { name: "Without error styles on input" })
    await expect(css(plain).borderTopColor).toBe(gray)
    await expect(plain).toHaveAttribute("aria-invalid", "true")
    await expect(canvas.getAllByText("Something went wrong")).toHaveLength(2)
    await expect(plain.parentElement).not.toHaveAttribute("data-error")
  }
}

export const Success: StoryObj = {
  render: demo(SuccessDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const asBoolean = await canvas.findByRole("textbox", { name: "Success as boolean" })
    await expect(css(asBoolean).borderTopColor).toBe("rgb(9, 146, 104)")
    await expect(asBoolean).not.toHaveAttribute("aria-invalid")
    await expect(asBoolean.parentElement).toHaveAttribute("data-success")
    const message = canvas.getByText("Username is available")
    await expect(css(message).color).toBe("rgb(9, 146, 104)")
    await expect(canvas.getByRole("textbox", { name: "Success as text" })).toHaveAccessibleDescription(
      "Username is available"
    )
  }
}

export const Compound: StoryObj = {
  render: demo(CompoundDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const label = await canvas.findByText("Input label")
    await expect(present(label.parentElement)).toHaveAttribute("data-required")
    await expect(css(label.parentElement).fontWeight).toBe("600")
    await expect(css(canvas.getByText("Input description").parentElement).fontSize).toBe("12px")
    await expect(css(canvas.getByText("Input error").parentElement).color).toBe(red)
  }
}

export const Placeholder: StoryObj = {
  render: demo(PlaceholderDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const text = await within(canvasElement).findByText("Placeholder content")
    await expect(css(text).color).toBe("rgb(173, 181, 189)")
    await expect(present(text.closest("button"))).toHaveAttribute("type", "button")
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByPlaceholderText("Variant filled")
    await expect(css(filled).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(css(filled).borderTopColor).toBe("rgba(0, 0, 0, 0)")
    const unstyled = canvas.getByPlaceholderText("Variant unstyled")
    await expect(css(unstyled).paddingLeft).toBe("0px")
    await expect(css(unstyled).backgroundColor).toBe("rgba(0, 0, 0, 0)")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByPlaceholderText("Size xs")
    const sizes = ["xs", "sm", "md", "lg", "xl"]
    await expect(sizes.map((size) => box(canvas.getByPlaceholderText(`Size ${size}`)).height)).toEqual([
      30, 36, 42, 50, 60
    ])
    await expect(sizes.map((size) => css(canvas.getByPlaceholderText(`Size ${size}`)).fontSize)).toEqual([
      "12px",
      "14px",
      "16px",
      "18px",
      "20px"
    ])
  }
}

export const Disabled: StoryObj = {
  render: demo(DisabledDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const disabled = await canvas.findByPlaceholderText("Disabled input")
    await expect(disabled).toBeDisabled()
    await expect(css(disabled).opacity).toBe("0.6")
    await expect(css(disabled).cursor).toBe("not-allowed")
    await expect(css(disabled).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(disabled.parentElement).toHaveAttribute("data-disabled")
    const readOnly = canvas.getByRole("textbox", { name: "Read only" })
    await expect(readOnly).toHaveAttribute("readonly")
    await expect(css(readOnly).caretColor).toBe("rgba(0, 0, 0, 0)")
    const area = canvas.getByPlaceholderText("Multiline, xl radius")
    await expect(area.tagName).toBe("TEXTAREA")
    await expect(css(area).paddingTop).toBe("5.5px")
    await expect(css(area).borderTopLeftRadius).toBe("32px")
    await expect(box(area).height).toBeGreaterThan(36)
    await expect(area.parentElement).toHaveAttribute("data-multiline")
  }
}

export const Events: StoryObj = {
  render: story(({ h, ui, log }) =>
    ui.Input(h, {
      placeholder: "Events",
      onFocus: log("focused"),
      onBlur: log("blurred"),
      onChange: (value) => log(`changed ${value}`)
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByPlaceholderText("Events")
    await userEvent.type(input, "ok")
    await userEvent.tab()
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("focused, changed ok, blurred")
    )
  }
}

export const Options: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Stack(h, {
      maw: 340,
      children: [
        ui.Input(h, {
          placeholder: "Wide sections",
          leftSection: AtIcon(h, { size: 16 }),
          leftSectionWidth: 50,
          leftSectionPointerEvents: "auto",
          rightSection: "kg",
          rightSectionWidth: "3rem",
          loading: true,
          loadingPosition: "left",
          type: "email",
          name: "email",
          autoComplete: "email",
          inputSize: "20",
          required: true,
          size: "md"
        }),
        ui.Input(h, { placeholder: "No aria", withAria: false, id: "plain", required: true, error: "Nope" }),
        ui.Input(h, { placeholder: "Unstyled error", variant: "unstyled", error: true, success: true }),
        ui.Input(h, { placeholder: "Plain success", success: true, withSuccessStyles: false }),
        ui.Input(h, { placeholder: "Own id", id: "own-id" }),
        ui.InputClearButton(h, { label: "Styled clear", styles: { root: custom.clear } })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const wide = await canvas.findByPlaceholderText("Wide sections")
    await expect(css(wide).paddingLeft).toBe("50px")
    await expect(css(wide).paddingRight).toBe("48px")
    await expect(canvas.getByRole("status", { name: "Loading" }).parentElement).toHaveAttribute("data-position", "left")
    await expect(css(canvas.getByRole("status", { name: "Loading" }).parentElement).pointerEvents).toBe("auto")
    await expect(wide).toHaveAttribute("type", "email")
    await expect(wide).toHaveAttribute("name", "email")
    await expect(wide).toHaveAttribute("autocomplete", "email")
    await expect(wide).toHaveAttribute("size", "20")
    await expect(wide).toBeRequired()
    await expect(canvas.getByText("kg")).toHaveAttribute("data-position", "right")
    const plain = canvas.getByPlaceholderText("No aria")
    await expect(plain).not.toHaveAttribute("id")
    await expect(plain).not.toHaveAttribute("aria-invalid")
    await expect(plain).not.toBeRequired()
    await expect(css(plain).borderTopColor).toBe(red)
    const unstyled = canvas.getByPlaceholderText("Unstyled error")
    await expect(css(unstyled).borderTopColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(unstyled).color).toBe(red)
    await expect(unstyled.parentElement).not.toHaveAttribute("data-success")
    await expect(css(canvas.getByPlaceholderText("Plain success")).borderTopColor).toBe(gray)
    await expect(canvas.getByPlaceholderText("Own id")).toHaveAttribute("id", "own-id")
    await expect(css(canvas.getByRole("button", { name: "Styled clear" })).color).toBe("rgb(1, 2, 3)")
  }
}

export const WrapperOptions: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Stack(h, {
      maw: 340,
      children: [
        ui.InputWrapper(h, {
          id: "large",
          size: "lg",
          label: "Large label",
          description: "Large description",
          success: "Large success",
          required: true,
          withAsterisk: false,
          labelElement: "div",
          input: (wiring) => ui.Input(h, { ...wiring, size: "lg", success: true })
        }),
        ui.InputWrapper(h, {
          id: "bare",
          required: true,
          inputWrapperOrder: ["input", "label"],
          label: "Label after",
          input: (wiring) => ui.Input(h, { ...wiring, required: true })
        }),
        ui.InputLabel(h, { htmlFor: "bare", labelElement: "div", size: "xs", children: ["Small label"] }),
        ui.InputSuccess(h, { id: "done", size: "xl", children: ["All done"] }),
        ui.InputWrapper(h, {
          id: "unlabelled",
          description: "Only a description",
          error: true,
          input: (wiring) =>
            ui.Input(h, {
              ...wiring,
              error: true,
              component: "button",
              children: [ui.InputPlaceholder(h, { error: true, children: ["Pick a date"] })]
            })
        })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const large = await canvas.findByText("Large label")
    await expect(large.tagName).toBe("DIV")
    await expect(css(large).fontSize).toBe("18px")
    await expect(large.querySelector("span")).toBeNull()
    await expect(css(canvas.getByText("Large description")).fontSize).toBe("16px")
    await expect(canvas.getByText("Large success")).toHaveAttribute("id", "large-success")
    await expect(present(canvasElement.querySelector("#large"))).toHaveAttribute(
      "aria-describedby",
      "large-success large-description"
    )
    const bare = present(canvasElement.querySelector("#bare"))
    await expect(bare).not.toHaveAttribute("aria-describedby")
    await expect(present(bare.parentElement?.nextElementSibling)).toHaveTextContent("Label after *")
    await expect(css(canvas.getByText("Small label").parentElement).fontSize).toBe("12px")
    await expect(canvas.getByText("All done").parentElement).toHaveAttribute("id", "done")
    await expect(css(canvas.getByText("All done").parentElement).fontSize).toBe("18px")
    const unlabelled = present(canvasElement.querySelector("#unlabelled"))
    await expect(unlabelled).toHaveAccessibleDescription("Only a description")
    await expect(present(unlabelled.closest("[data-error]")).querySelector("label")).toBeNull()
    await expect(canvas.getByText("Pick a date")).toHaveAttribute("data-error")
    await expect(css(canvas.getByText("Pick a date")).color).toBe(red)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(ErrorDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("textbox", { name: "Without error styles on input" })
    await expect(css(plain).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(plain).borderTopColor).toBe("rgb(66, 66, 66)")
    await expect(css(canvas.getByRole("textbox", { name: "Error as boolean" })).borderTopColor).toBe("rgb(224, 49, 49)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByPlaceholderText("Input component")).toBeVisible()
  }
}
