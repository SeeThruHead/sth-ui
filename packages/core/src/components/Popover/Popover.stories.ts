import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ArrowDemo from "./demos/arrow.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as PositionsDemo from "./demos/positions.ts"
import * as SameWidthDemo from "./demos/same-width.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Popover" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const body = within(document.body)

const panels = (button: HTMLElement): ReadonlyArray<Element> => [
  ...document.querySelectorAll(`[id="${button.id.replace(/-button$/, "")}-panel"]`)
]

const openOwnPanel = async (button: HTMLElement): Promise<Element> => {
  const before = panels(button)
  await userEvent.click(button)

  return waitFor(() => present(panels(button).find((panel) => !before.includes(panel))))
}

const panelWith = (text: RegExp) => present(body.getByText(text).closest("[data-placement], [id$='-panel']"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle popover" })
    await expect(button).toHaveAttribute("aria-expanded", "false")
    await expect(body.queryByText(/opens when the button is clicked/)).toBeNull()
  }
}

export const Opening: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle popover" })
    await userEvent.click(button)
    const text = await body.findByText(/opens when the button is clicked/)
    const panel = panelWith(/opens when the button is clicked/)
    await waitFor(() => expect(css(panel).opacity).toBe("1"))
    await expect(button).toHaveAttribute("aria-expanded", "true")
    await expect(button).toHaveAttribute("aria-controls", panel.id)
    await expect(box(panel).width).toBe(200)
    await expect(css(panel).borderTopColor).toBe("rgb(233, 236, 239)")
    await expect(css(panel).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(panel).paddingTop).toBe("12px")
    await expect(css(panel).paddingLeft).toBe("16px")
    await expect(css(panel).boxShadow).not.toBe("none")
    await expect(css(panel).zIndex).toBe("300")
    await expect(canvasElement.contains(panel)).toBe(false)
    await waitFor(() => expect(panel).toHaveAttribute("data-placement", "bottom"))
    await expect(panel).toHaveAttribute("data-position", "bottom")
    await expect(box(panel).top).toBeGreaterThanOrEqual(box(button).bottom + 8)
    const arrow = present(panel.querySelector("[aria-hidden='true']:not(svg)"))
    await expect(box(arrow).width).toBeCloseTo(7 * Math.SQRT2, 0)
    await expect(text).toBeVisible()
  }
}

export const ClosingWithEscape: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle popover" })
    const panel = await openOwnPanel(button)
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(panel.isConnected).toBe(false))
    await expect(button).toHaveAttribute("aria-expanded", "false")
    await expect(button).toHaveFocus()
  }
}

export const ClosingFromOutside: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle popover" })
    const panel = await openOwnPanel(button)
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
    await userEvent.click(document.body)
    await waitFor(() => expect(panel.isConnected).toBe(false))
    await expect(button).toHaveAttribute("aria-expanded", "false")
  }
}

export const Arrow: StoryObj = {
  render: demoApp(ArrowDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Target element" })
    await body.findByText(/Arrow position can be changed/)
    const panel = panelWith(/Arrow position can be changed/)
    await waitFor(() => expect(panel).toHaveAttribute("data-placement", "bottom"))
    await expect(body.getByText(/Arrow position can be changed/)).toBeVisible()
    await expect(css(panel).opacity).toBe("1")
    const arrow = present(panel.querySelector("[aria-hidden='true']"))
    await expect(css(arrow).top).toBe("-3.5px")
    await expect(css(arrow).left).toBe("5px")
    await expect(css(arrow).borderBottomColor).toBe("rgba(0, 0, 0, 0)")
    await expect(Math.round(box(panel).left)).toBe(Math.round(box(button).left))
  }
}

export const SameWidth: StoryObj = {
  render: demoApp(SameWidthDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Toggle popover" })).toBeVisible()
  }
}

export const OpeningSameWidth: StoryObj = {
  render: demoApp(SameWidthDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle popover" })
    await userEvent.click(button)
    await body.findByText(/same width as its target/)
    const panel = panelWith(/same width as its target/)
    await waitFor(() => expect(box(panel).width).toBe(280))
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
  }
}

export const Positions: StoryObj = {
  render: demoApp(PositionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Open to the right" })
    await within(canvasElement).findByText("16px away, on the right")
    const panel = panelWith(/16px away, on the right/)
    await waitFor(() => expect(panel).toHaveAttribute("data-placement", "right"))
    await expect(css(panel).opacity).toBe("1")
    await expect(canvasElement.contains(panel)).toBe(true)
    await expect(css(panel).zIndex).toBe("400")
    await expect(css(panel).borderTopLeftRadius).toBe("8px")
    await expect(Math.round(box(panel).left - box(button).right)).toBe(21)
    const arrow = present(panel.querySelector("[aria-hidden='true']"))
    await expect(css(arrow).left).toBe("-5px")
    await expect(css(arrow).borderBottomLeftRadius).toBe("2px")
    await expect(box(arrow).width).toBeCloseTo(10 * Math.SQRT2, 0)
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Toggle popover" })).toBeEnabled()
    await expect(canvas.getByRole("button", { name: "Enable popover" })).toBeVisible()
    await expect(body.queryByText(/always hidden/)).toBeNull()
  }
}

export const TogglingDisabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Toggle popover" })
    await userEvent.click(button)
    await expect(body.queryByText(/always hidden/)).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Enable popover" }))
    await expect(await canvas.findByRole("button", { name: "Disable popover" })).toBeVisible()
    await userEvent.click(button)
    const text = await body.findByText(/always hidden/, {}, { timeout: 3000 })
    await waitFor(() => expect(text).toBeVisible(), { timeout: 3000 })
  }
}

const reopen = async (button: HTMLElement) => {
  await userEvent.click(button)
  await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "false"))
  await userEvent.click(button)
  await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "true"))
  const panel = present(document.getElementById(present(button.getAttribute("aria-controls"))))
  await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))

  return panel
}

export const ReopeningArrow: StoryObj = {
  render: demoApp(ArrowDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Target element" })
    await reopen(button)
  }
}

export const ReopeningPositions: StoryObj = {
  render: demoApp(PositionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: /Open to the right/ })
    await reopen(button)
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const end = await canvas.findByRole("button", { name: "Arrow at the end" })
    const endPanel = present(document.getElementById(present(end.getAttribute("aria-controls"))))
    await waitFor(() => expect(endPanel).toHaveAttribute("data-placement", "top"))
    await expect(box(endPanel).width).toBe(256)
    await expect(css(endPanel).borderTopLeftRadius).toBe("16px")
    const endArrow = present(endPanel.querySelector("[aria-hidden='true']"))
    await expect(css(endArrow).left).toBe(`${endPanel.clientWidth - 19}px`)
    await expect(css(endArrow).borderBottomRightRadius).toBe("3px")
    const centre = canvas.getByRole("button", { name: "Arrow in the centre" })
    const centrePanel = present(document.getElementById(present(centre.getAttribute("aria-controls"))))
    await waitFor(() => expect(centrePanel).toHaveAttribute("data-placement", "left"))
    const centreArrow = present(centrePanel.querySelector("[aria-hidden='true']"))
    await expect(Math.round(box(centreArrow).top + box(centreArrow).height / 2)).toBe(
      Math.round(box(centre).top + box(centre).height / 2)
    )
    const reopened = await reopen(end)
    await expect(within(reopened).getByRole("button", { name: "Save" })).toHaveFocus()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(ArrowDemo, { centered: true }),
  play: async () => {
    await body.findByText(/Arrow position can be changed/)
    const panel = panelWith(/Arrow position can be changed/)
    await expect(css(panel).borderTopColor).toBe("rgb(66, 66, 66)")
    await expect(css(panel).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
