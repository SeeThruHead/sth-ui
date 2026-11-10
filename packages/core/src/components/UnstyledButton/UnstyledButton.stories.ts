import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demo, story } from "../../stories/harness.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as StylePropsDemo from "./demos/style-props.ts"

const meta: Meta = { title: "Buttons/UnstyledButton" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button without styles" })
    await expect(getComputedStyle(button).borderTopWidth).toBe("0px")
    await expect(getComputedStyle(button).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(getComputedStyle(button).paddingTop).toBe("0px")
  }
}

export const StyleProps: StoryObj = {
  render: demo(StylePropsDemo.view),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button without styles" })
    await expect(button).toHaveAttribute("data-kind", "card")
    await expect(getComputedStyle(button).paddingTop).toBe("16px")
    await expect(getComputedStyle(button).fontFamily).toBe(getComputedStyle(present(button.parentElement)).fontFamily)
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, log }) =>
    h.div(
      [],
      [
        ui.UnstyledButton(h, { onClick: log("button"), children: ["Plain button"] }),
        ui.UnstyledButton(h, { component: "a", href: "#top", children: ["Plain link"] }),
        ui.UnstyledButton(h, { component: "div", onClick: log("div"), label: "Div button", children: ["⋯"] }),
        ui.UnstyledButton(h, { component: "span", disabled: true, onClick: log("span"), children: ["Disabled span"] }),
        ui.UnstyledButton(h, { type: "submit", disabled: true, onClick: log("submit"), children: ["Disabled submit"] })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("button", { name: "Plain button" })
    await expect(plain).toHaveAttribute("type", "button")
    await expect(getComputedStyle(plain).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await userEvent.click(plain)
    await expect(canvas.getByRole("link", { name: "Plain link" })).toHaveAttribute("href", "#top")
    const div = canvas.getByRole("button", { name: "Div button" })
    await expect(div).toHaveAttribute("tabindex", "0")
    await userEvent.click(div)
    const span = canvas.getByRole("button", { name: "Disabled span" })
    await expect(span).toHaveAttribute("aria-disabled", "true")
    await expect(span).toHaveAttribute("tabindex", "-1")
    await userEvent.click(span)
    await expect(canvas.getByRole("button", { name: "Disabled submit" })).toHaveAttribute("type", "submit")
    await userEvent.click(plain)
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent(/^button, div, button$/)
    )
  }
}

export const KeyboardFocus: StoryObj = {
  render: story(({ h, ui }) => ui.UnstyledButton(h, { children: ["Focus me"] })),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Focus me" })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(getComputedStyle(button).outlineStyle).toBe("solid")
  }
}

export const KeyboardActivation: StoryObj = {
  render: story(({ h, ui, log }) =>
    h.div(
      [],
      [
        ui.UnstyledButton(h, { component: "div", onClick: log("div"), children: ["Div button"] }),
        ui.UnstyledButton(h, { component: "span", onClick: log("span"), children: ["Span button"] })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const div = await canvas.findByRole("button", { name: "Div button" })
    div.focus()
    await userEvent.keyboard("{Enter}")
    await userEvent.keyboard("a")
    await userEvent.tab()
    await userEvent.keyboard(" ")
    await expect(await canvas.findByText("div, span")).toBeVisible()
  }
}
