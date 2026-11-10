import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as HoverDemo from "./demos/hover.ts"
import * as RtlDemo from "./demos/rtl.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Menubar" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const page = within(document.body)

const target = (canvasElement: HTMLElement, name: string) => within(canvasElement).findByRole("menuitem", { name })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole("menubar")
    await expect(bar).toHaveAttribute("aria-orientation", "horizontal")
    const targets = within(bar).getAllByRole("menuitem")
    await expect(targets).toHaveLength(4)
    await expect(targets[0]).toHaveAttribute("tabindex", "0")
    await expect(targets[1]).toHaveAttribute("tabindex", "-1")
    await expect(css(targets[0]).fontSize).toBe("14px")
    await expect(css(targets[0]).paddingLeft).toBe("12px")
    await expect(Number.parseFloat(css(targets[0]).paddingTop)).toBeCloseTo(6.667, 2)
    await expect(css(targets[0]).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(targets[0]).borderTopWidth).toBe("0px")
    await expect(css(bar).display).toBe("flex")
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const file = await target(canvasElement, "File")
    await user.click(file)
    await waitFor(() => expect(page.getByRole("menuitem", { name: "New file" })).toBeVisible())
    await expect(file).toHaveAttribute("aria-expanded", "true")
    await expect(css(file).backgroundColor).toBe("rgb(241, 243, 245)")
    await user.hover(await target(canvasElement, "Edit"))
    await waitFor(() => expect(page.getByRole("menuitem", { name: "Undo" })).toBeVisible())
    await waitFor(() => expect(page.queryByRole("menuitem", { name: "New file" })).toBeNull())
    await expect(page.getByText("Clipboard")).toBeVisible()
    await user.click(page.getByRole("menuitem", { name: "Undo" }))
    await waitFor(() => expect(within(canvasElement).getByText("Chose 1:undo")).toBeVisible())
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const file = await target(canvasElement, "File")
    file.focus()
    await user.keyboard("{ArrowRight}")
    const edit = await target(canvasElement, "Edit")
    await waitFor(() => expect(edit).toHaveFocus())
    await expect(edit).toHaveAttribute("tabindex", "0")
    await expect(file).toHaveAttribute("tabindex", "-1")
    await user.keyboard("{End}")
    await waitFor(() => expect(within(canvasElement).getByRole("menuitem", { name: "Help" })).toHaveFocus())
    await user.keyboard("{Home}")
    await waitFor(() => expect(file).toHaveFocus())
    await user.keyboard("v")
    await waitFor(() => expect(within(canvasElement).getByRole("menuitem", { name: "View" })).toHaveFocus())
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(page.getByRole("menuitem", { name: "Zoom in" })).toBeVisible())
    await user.keyboard("{Escape}")
    await waitFor(() => expect(within(canvasElement).getByRole("menuitem", { name: "View" })).toHaveFocus())
    await waitFor(() => expect(page.queryByRole("menuitem", { name: "Zoom in" })).toBeNull())
    await user.keyboard("{ArrowUp}")
    await waitFor(() => expect(page.getByRole("menuitem", { name: "Full screen" })).toBeVisible())
  }
}

export const Hover: StoryObj = {
  render: demoApp(HoverDemo),
  play: async ({ canvasElement }) => {
    await expect(await target(canvasElement, "File")).toHaveAttribute("aria-expanded", "false")
  }
}

export const Hovering: StoryObj = {
  render: demoApp(HoverDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await user.hover(await target(canvasElement, "Edit"))
    await waitFor(() => expect(page.getByRole("menuitem", { name: "Undo" })).toBeVisible())
    await user.keyboard("{Escape}")
    await waitFor(() => expect(within(canvasElement).getByRole("menuitem", { name: "Edit" })).toHaveFocus())
    const help = await target(canvasElement, "Help")
    help.focus()
    await user.keyboard("{ArrowRight}")
    await expect(help).toHaveFocus()
  }
}

export const RightToLeft: StoryObj = {
  render: demoApp(RtlDemo),
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole("menubar")
    await expect(bar).toHaveAttribute("dir", "rtl")
    const view = within(bar).getByRole("menuitem", { name: "View" })
    await expect(view).toBeDisabled()
    await expect(css(view).opacity).toBe("0.6")
    await expect(css(view).cursor).toBe("not-allowed")
  }
}

export const MovingRightToLeft: StoryObj = {
  render: demoApp(RtlDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const edit = await target(canvasElement, "Edit")
    edit.focus()
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(within(canvasElement).getByRole("menuitem", { name: "Help" })).toHaveFocus())
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(edit).toHaveFocus())
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(within(canvasElement).getByRole("menuitem", { name: "File" })).toHaveFocus())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await expect(css(await target(canvasElement, "File")).color).toBe("rgb(201, 201, 201)")
  }
}
