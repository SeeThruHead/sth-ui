import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import type { Attribute } from "foldkit/html"
import type { Kit, Message } from "../../stories/harness.ts"
import { demo, demoApp, story } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as TrapsFocusDemo from "./demos/traps-focus.ts"

const meta: Meta = { title: "Miscellaneous/FocusTrap" }

export default meta

const field = ({ h }: Kit, label: string, attributes: ReadonlyArray<Attribute<Message>> = []) =>
  h.label(
    [h.Style({ display: "block", marginBottom: "8px" })],
    [`${label} `, h.input([h.AriaLabel(label), ...attributes])]
  )

const focused = () => document.activeElement

const nameOf = (element: Element | null) => element?.getAttribute("aria-label") ?? element?.textContent ?? ""

const tab = async (shift = false) => {
  await userEvent.keyboard(shift ? "{Shift>}{Tab}{/Shift}" : "{Tab}")
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Activate focus trap" })).toBeVisible()
    await expect(canvas.getByRole("textbox", { name: "Second input" })).toHaveAttribute("placeholder", "Second input")
    await expect(focused()).not.toBe(canvas.getByRole("textbox", { name: "First input" }))
  }
}

export const TrapsFocus: StoryObj = {
  render: demo(TrapsFocusDemo.view),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByRole("textbox", { name: "First name" })
    await waitFor(() => expect(focused()).toBe(first))
  }
}

export const Clicking: StoryObj = {
  render: story((kit) =>
    kit.h.div(
      [],
      [
        kit.ui.Button(kit.h, {
          mb: "sm",
          onClick: kit.set("active", kit.value("active", "no") === "yes" ? "no" : "yes"),
          children: [kit.value("active", "no") === "yes" ? "Deactivate" : "Activate"]
        }),
        kit.ui.FocusTrap(kit.h, {
          active: kit.value("active", "no") === "yes",
          children: [
            kit.ui.Paper(kit.h, {
              withBorder: true,
              p: "md",
              maw: 320,
              children: [field(kit, "Email"), field(kit, "Password"), kit.ui.Button(kit.h, { children: ["Sign in"] })]
            })
          ]
        })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = await canvas.findByRole("textbox", { name: "Email" })
    await expect(focused()).not.toBe(email)
    await userEvent.click(canvas.getByRole("button", { name: "Activate" }))
    await waitFor(() => expect(focused()).toBe(email))
    await tab()
    await tab()
    await expect(nameOf(focused())).toBe("Sign in")
    await tab()
    await expect(focused()).toBe(email)
    await tab(true)
    await expect(nameOf(focused())).toBe("Sign in")
    await userEvent.keyboard("a")
    await userEvent.click(canvas.getByRole("button", { name: "Deactivate" }))
    await waitFor(() => expect(nameOf(focused())).toBe("Activate"))
    await tab()
    await expect(focused()).toBe(email)
  }
}

export const InitialFocus: StoryObj = {
  render: story((kit) =>
    kit.ui.FocusTrap(kit.h, {
      children: [kit.h.div([], [field(kit, "Search"), kit.ui.FocusTrapInitialFocus(kit.h), field(kit, "Filter")])]
    })
  ),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("textbox", { name: "Search" })
    await waitFor(() => expect(focused()).toHaveAttribute("data-autofocus"))
    await tab()
    await expect(nameOf(focused())).toBe("Filter")
    await tab(true)
    await tab(true)
    await expect(nameOf(focused())).toBe("Filter")
  }
}

export const TabOrder: StoryObj = {
  render: story((kit) => {
    const { h, ui } = kit

    return ui.FocusTrap(h, {
      children: [
        h.form(
          [],
          [
            field(kit, "Plain"),
            field(kit, "Jump first", [h.Tabindex(2)]),
            field(kit, "Jump very first", [h.Tabindex(1)]),
            h.button([h.Type("button"), h.Disabled(true)], ["Disabled"]),
            h.button([h.Type("button"), h.Tabindex(-1)], ["Not in order"]),
            field(kit, "Aria hidden", [h.AriaHidden(true)]),
            field(kit, "Hidden attribute", [h.Attribute("hidden", "")]),
            h.input([h.Type("hidden"), h.AriaLabel("Hidden type")]),
            h.div([h.Style({ display: "none" })], [field(kit, "Inside display none")]),
            h.a([h.Href("#link")], ["Link"]),
            h.a([], ["Anchor without href"]),
            h.a([h.Tabindex(0)], ["Anchor with tabindex"]),
            h.div([h.Attribute("contenteditable", "true"), h.AriaLabel("Editable")], ["Edit me"]),
            h.div([h.Attribute("contenteditable", "false")], ["Not editable"]),
            h.input([h.Type("radio"), h.Name("size"), h.AriaLabel("Small")]),
            h.input([h.Type("radio"), h.Name("size"), h.AriaLabel("Medium"), h.Checked(true)]),
            h.input([h.Type("radio"), h.Name("size"), h.AriaLabel("Large")]),
            h.input([h.Type("radio"), h.Name("tone"), h.AriaLabel("Warm")]),
            h.input([h.Type("radio"), h.Name("tone"), h.AriaLabel("Cool")]),
            h.input([h.Type("radio"), h.AriaLabel("Loose")]),
            h.audio([h.Attribute("controls", ""), h.AriaLabel("Player")], []),
            h.input([h.Type("date"), h.AriaLabel("When")]),
            field(kit, "Last")
          ]
        )
      ]
    })
  }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("textbox", { name: "Plain" })
    await waitFor(() => expect(nameOf(focused())).toBe("Plain"))
    const order = ["Link", "Anchor with tabindex", "Editable", "Medium", "Warm", "Loose", "Player"]
    await order.reduce(async (previous, expected) => {
      await previous
      await tab()
      await expect(nameOf(focused())).toBe(expected)
    }, Promise.resolve())
    await tab()
    await waitFor(() => expect(nameOf(focused())).toBe("When"))
    await tab()
    await waitFor(() => expect(nameOf(focused())).toBe("Last"))
    await tab()
    await expect(nameOf(focused())).toBe("Jump very first")
    await tab()
    await expect(nameOf(focused())).toBe("Jump first")
    await tab()
    await expect(nameOf(focused())).toBe("Plain")
  }
}

export const Fallbacks: StoryObj = {
  render: story(({ h, ui }) =>
    h.div(
      [],
      [
        ui.FocusTrap(h, { children: [h.div([h.Tabindex(-1), h.AriaLabel("Only focusable")], ["Only focusable"])] }),
        ui.FocusTrap(h, {
          attributes: { root: { tabindex: "-1", "aria-label": "Trap itself" } },
          children: ["No focusable children"]
        }),
        ui.FocusTrap(h, { children: ["Nothing to focus"] })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Nothing to focus")
    await waitFor(() => expect(nameOf(focused())).toBe("Trap itself"))
    await tab()
    await expect(nameOf(focused())).toBe("Trap itself")
    canvas.getByText("Only focusable").focus()
    await tab()
    await expect(nameOf(focused())).toBe("Only focusable")
    await tab(true)
    await expect(nameOf(focused())).toBe("Only focusable")
  }
}

export const Nested: StoryObj = {
  render: story((kit) =>
    kit.ui.FocusTrap(kit.h, {
      children: [
        kit.h.div(
          [],
          [
            field(kit, "Outer"),
            kit.ui.FocusTrap(kit.h, { children: [kit.h.div([], [field(kit, "Inner one"), field(kit, "Inner two")])] }),
            field(kit, "Outer last")
          ]
        )
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("textbox", { name: "Inner two" })
    await waitFor(() => expect(nameOf(focused())).toBe("Inner one"))
    within(canvasElement).getByRole("textbox", { name: "Outer" }).focus()
    await tab()
    await expect(nameOf(focused())).toBe("Inner one")
    within(canvasElement).getByRole("textbox", { name: "Inner two" }).focus()
    await tab()
    await expect(nameOf(focused())).toBe("Inner one")
    await tab(true)
    await expect(nameOf(focused())).toBe("Inner two")
  }
}

export const ActivatingUsageDemo: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Activate focus trap" }))
    await waitFor(() => expect(focused()).toBe(canvas.getByRole("textbox", { name: "First input" })))
    await expect(canvas.getByRole("button", { name: "Deactivate focus trap" })).toBeVisible()
  }
}
