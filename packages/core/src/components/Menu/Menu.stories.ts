import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as PositionDemo from "./demos/position.ts"
import * as ContextMenuDemo from "./demos/context-menu.ts"
import * as ArrowDemo from "./demos/arrow.ts"
import * as HoverDemo from "./demos/hover.ts"
import * as SearchDemo from "./demos/search.ts"
import * as SubmenusDemo from "./demos/submenus.ts"
import * as SelectableDemo from "./demos/selectable.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Menu" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const body = within(document.body)

const settled = { timeout: 3000 }

const openMenu = async (button: HTMLElement) => {
  await userEvent.click(button)
  const menu = await body.findByRole("menu", {}, settled)
  await waitFor(() => expect(css(menu).opacity).toBe("1"), settled)

  return menu
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle menu" })
    await expect(button).toHaveAttribute("aria-haspopup", "menu")
    await expect(button).toHaveAttribute("aria-expanded", "false")
    await expect(css(button).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(body.queryByRole("menu")).toBeNull()
  }
}

export const Opening: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle menu" })
    const menu = await openMenu(button)
    const items = within(menu).getAllByRole("menuitem")
    await expect(items.map((item) => item.textContent)).toEqual([
      "Settings",
      "Messages",
      "Gallery",
      "Search⌘K",
      "Transfer my data",
      "Delete my account"
    ])
    await expect(within(menu).getByRole("group", { name: "Application" })).toBeVisible()
    await expect(within(menu).getByRole("group", { name: "Danger zone" })).toBeVisible()
    await expect(within(menu).getAllByRole("separator")).toHaveLength(1)
    await expect(box(menu).width).toBe(200)
    await expect(Math.round(box(menu).top - box(button).bottom)).toBe(8)
    await expect(css(within(menu).getByText("Delete my account")).color).toBe("rgb(250, 82, 82)")
    await expect(css(within(menu).getByText("Application")).fontSize).toBe("12px")
    await expect(button).toHaveAttribute("aria-expanded", "true")
  }
}

export const Selecting: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Toggle menu" })
    const menu = await openMenu(button)
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Gallery" }))
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull(), settled)
    await expect(canvas.getByText("Chose gallery")).toBeVisible()
    await waitFor(() => expect(button).toHaveFocus())
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Toggle menu" })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    const menu = await body.findByRole("menu", {}, settled)
    await waitFor(() => expect(menu).toHaveFocus())
    const settings = within(menu).getByRole("menuitem", { name: "Settings" })
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", settings.id))
    await expect(present(settings.firstElementChild)).toHaveAttribute("data-menu-active")
    await expect(css(settings.firstElementChild).backgroundColor).toBe("rgb(241, 243, 245)")
    await userEvent.keyboard("{ArrowDown}")
    const messages = within(menu).getByRole("menuitem", { name: "Messages" })
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", messages.id))
    await userEvent.keyboard("{ArrowDown}")
    const gallery = within(menu).getByRole("menuitem", { name: "Gallery" })
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", gallery.id))
    await userEvent.keyboard("t")
    const transfer = within(menu).getByRole("menuitem", { name: "Transfer my data" })
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", transfer.id))
    await userEvent.keyboard("{Home}")
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", settings.id))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", messages.id))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", gallery.id))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(canvas.getByText("Chose gallery")).toBeVisible(), settled)
    await userEvent.keyboard("{ArrowDown}")
    const again = await body.findByRole("menu", {}, settled)
    await waitFor(() => expect(again).toHaveFocus(), settled)
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(again.isConnected).toBe(false), settled)
    await expect(button).toHaveFocus()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Toggle menu" })
    const menu = await openMenu(button)
    await expect(css(menu).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(within(menu).getByText("Settings")).color).toBe("rgb(201, 201, 201)")
  }
}

export const DisabledItems: StoryObj = {
  render: demoApp(DisabledDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Toggle menu" })).toBeVisible()
    await expect(body.queryByRole("menu")).toBeNull()
  }
}

export const OpeningDisabledItems: StoryObj = {
  render: demoApp(DisabledDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const menu = await openMenu(await canvas.findByRole("button", { name: "Toggle menu" }))
    const gallery = within(menu).getByRole("menuitem", { name: "Gallery" })
    await expect(gallery).toHaveAttribute("aria-disabled", "true")
    await expect(gallery.firstElementChild).toHaveAttribute("data-disabled")
    await expect(css(gallery.firstElementChild).opacity).toBe("0.6")
    await expect(within(menu).getByRole("menuitem", { name: /^Search/ })).toHaveAttribute("aria-disabled", "true")
    await expect(within(menu).getAllByRole("separator")).toHaveLength(1)
    await expect(within(menu).queryByRole("presentation")).toBeNull()
    await userEvent.click(gallery)
    await expect(menu.isConnected).toBe(true)
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Delete my account" }))
    await waitFor(() => expect(canvas.getByText("Chose delete")).toBeVisible(), settled)
  }
}

export const Position: StoryObj = {
  render: demoApp(PositionDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Open to the right" })).toBeVisible()
    await expect(body.queryByRole("menu")).toBeNull()
  }
}

export const OpeningPosition: StoryObj = {
  render: demoApp(PositionDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Open to the right" })
    const menu = await openMenu(button)
    await waitFor(() => expect(menu).toHaveAttribute("data-placement", "right"), settled)
    await expect(canvasElement.contains(menu)).toBe(true)
    await expect(Math.round(box(menu).left - box(button).right)).toBe(16)
    await expect(Math.round(box(menu).top)).toBe(Math.round(box(button).top))
    await expect(box(menu).width).toBe(224)
    await expect(css(menu).borderTopLeftRadius).toBe("8px")
    await expect(css(menu).zIndex).toBe("400")
    await waitFor(() => expect(menu).toHaveFocus(), settled)
    await userEvent.keyboard("p")
    const settings = within(menu).getByRole("menuitem", { name: "Settings" })
    await waitFor(() => expect(menu).toHaveAttribute("aria-activedescendant", settings.id))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(canvas.getByText("Chose settings")).toBeVisible(), settled)
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Saving menu" })
    await expect(button).toHaveAttribute("aria-disabled", "true")
    await expect(button).toHaveAttribute("aria-busy", "true")
    await userEvent.click(button)
    await expect(body.queryByRole("menu")).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Finish saving" }))
    await waitFor(() => expect(button).not.toHaveAttribute("aria-disabled"))
    const menu = await openMenu(button)
    await expect(Math.round(box(menu).width)).toBe(Math.round(box(button).width))
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Cancel" }))
    await waitFor(() => expect(canvas.getByText("Chose cancel")).toBeVisible(), settled)
  }
}

const pointAt = (element: Element) => {
  const rect = element.getBoundingClientRect()
  document
    .elementFromPoint(rect.left + 4, rect.top + 4)
    ?.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: rect.left + 4, clientY: rect.top + 4 }))
}

export const Hover: StoryObj = {
  render: demoApp(HoverDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Hover to open" })
    pointAt(button)
    const menu = await screen.findByRole("menu")
    pointAt(await within(menu).findByRole("menuitem", { name: "Settings" }))
    await expect(screen.getByRole("menu")).toBeInTheDocument()
    document.body.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 1, clientY: 1 }))
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    pointAt(canvas.getByRole("button", { name: "Hover or click" }))
    await expect(await screen.findByRole("menu")).toBeInTheDocument()
    document.body.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 1, clientY: 1 }))
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
  }
}

export const ContextMenu: StoryObj = {
  render: demoApp(ContextMenuDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const mouse = await canvas.findByText("Right-click anywhere in this box")
    const rect = mouse.getBoundingClientRect()
    const click = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 20,
      clientY: rect.top + 10
    })
    mouse.dispatchEvent(click)
    await expect(click.defaultPrevented).toBe(true)
    const menu = await screen.findByRole("menu")
    await waitFor(() => expect(Math.round(menu.getBoundingClientRect().left)).toBe(Math.round(rect.left + 20)))
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Paste" }))
    await expect(await canvas.findByText("Chose paste")).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    const touch = canvas.getByText(/press and hold on a touch screen/)
    const spot = touch.getBoundingClientRect()
    const press = (type: string) =>
      touch.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          touches:
            type === "touchstart"
              ? [new Touch({ identifier: 1, target: touch, clientX: spot.left + 30, clientY: spot.top + 5 })]
              : []
        })
      )
    press("touchstart")
    press("touchend")
    await expect(await screen.findByRole("menu", {}, { timeout: 600 }).catch(() => null)).toBeNull()
    press("touchstart")
    const held = await screen.findByRole("menu", {}, { timeout: 3000 })
    await waitFor(() => expect(held).toBeVisible(), { timeout: 3000 })
    await waitFor(() => expect(Math.round(held.getBoundingClientRect().left)).toBe(Math.round(spot.left + 30)))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    const off = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    canvas.getByText("The browser's own menu here").dispatchEvent(off)
    await expect(off.defaultPrevented).toBe(false)
    await userEvent.click(canvas.getByRole("button", { name: "Hide regions" }))
    await waitFor(() => expect(canvas.queryByText("Right-click anywhere in this box")).toBeNull())
  }
}

export const SelectableItems: StoryObj = {
  render: demoApp(SelectableDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "View" })).toBeVisible()
    await expect(canvas.getByText("Showing bookmarks, newest, comfortable")).toBeVisible()
  }
}

export const ChoosingSelectableItems: StoryObj = {
  render: demoApp(SelectableDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "View" }))
    const bookmarks = await screen.findByRole("menuitemcheckbox", { name: "Show bookmarks" })
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible())
    await expect(bookmarks).toHaveAttribute("aria-checked", "true")
    await expect(bookmarks.querySelector("svg")).not.toBeNull()
    const urls = screen.getByRole("menuitemcheckbox", { name: "Show full URLs" })
    await expect(urls).toHaveAttribute("aria-checked", "false")
    await userEvent.click(urls)
    await waitFor(() =>
      expect(screen.getByRole("menuitemcheckbox", { name: "Show full URLs" })).toHaveAttribute("aria-checked", "true")
    )
    await expect(screen.getByRole("menu")).toBeVisible()
    await expect(canvas.getByText("Showing bookmarks, urls, newest, comfortable")).toBeVisible()
    await userEvent.click(screen.getByRole("menuitem", { name: "Reset view" }))
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await expect(canvas.getByText("Showing nothing, newest, comfortable")).toBeVisible()

    await userEvent.click(canvas.getByRole("button", { name: "Sort" }))
    const newest = await screen.findByRole("menuitemradio", { name: /Newest first/ })
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible())
    await expect(newest).toHaveAttribute("aria-checked", "true")
    await expect(within(newest).getByText("✓")).toBeVisible()
    const refresh = screen.getByRole("menuitem", { name: "Refresh" })
    await expect(getComputedStyle(present(refresh.firstElementChild?.firstElementChild)).width).toBe("12px")
    await userEvent.click(refresh)
    await expect(screen.getByRole("menu")).toBeVisible()
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Oldest first" }))
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await expect(canvas.getByText("Showing nothing, oldest, comfortable")).toBeVisible()

    await userEvent.click(canvas.getByRole("button", { name: "Density" }))
    const comfortable = await screen.findByRole("menuitemradio", { name: "Comfortable" })
    await expect(comfortable.querySelector("[data-checked]")).not.toBeNull()
    const compact = screen.getByRole("menuitemradio", { name: "Compact" })
    await expect(present(compact.firstElementChild).children).toHaveLength(1)
    await userEvent.click(compact)
    await waitFor(() =>
      expect(screen.getByRole("menuitemradio", { name: "Compact" })).toHaveAttribute("aria-checked", "true")
    )
    await expect(canvas.getByText("Showing nothing, oldest, compact")).toBeVisible()
  }
}

export const Arrow: StoryObj = {
  render: demoApp(ArrowDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Menu with an arrow" })).toBeVisible()
  }
}

export const OpeningArrow: StoryObj = {
  render: demoApp(ArrowDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Menu with an arrow" }))
    const menu = await screen.findByRole("menu")
    await waitFor(() => expect(menu).toBeVisible())
    const arrow = present(menu.querySelector<HTMLElement>(":scope > [aria-hidden='true']"))
    await waitFor(() => expect(arrow.getBoundingClientRect().top).toBeLessThan(menu.getBoundingClientRect().top))
    await expect(getComputedStyle(arrow).width).toBe("10px")
    await expect(arrow.offsetLeft).toBe(12)
    await expect(getComputedStyle(arrow).borderTopLeftRadius).toBe("2px")
  }
}

export const Search: StoryObj = {
  render: demoApp(SearchDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Pick a fruit" })).toBeVisible()
  }
}

export const Searching: StoryObj = {
  render: demoApp(SearchDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Pick a fruit" }))
    const field = await screen.findByRole("textbox", { name: "Search fruit" })
    await waitFor(() => expect(field).toHaveFocus())
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible())
    await expect(getComputedStyle(field).borderTopWidth).toBe("0px")
    await userEvent.keyboard("an")
    await waitFor(() => expect(screen.getAllByRole("menuitem")).toHaveLength(3))
    await userEvent.keyboard(" ")
    await expect(field).toHaveValue("an ")
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(screen.getAllByRole("menuitem")).toHaveLength(3))
    await userEvent.keyboard("{ArrowDown}")
    await userEvent.keyboard("{ArrowDown}")
    await expect(field).toHaveFocus()
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Mango" })).toHaveAttribute("data-active"))
    await userEvent.keyboard("{Enter}")
    await expect(await canvas.findByText("Chose mango")).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Pick a fruit" }))
    const again = await screen.findByRole("textbox", { name: "Search fruit" })
    await expect(again).toHaveValue("")
    await waitFor(() => expect(again).toHaveFocus())
    await userEvent.click(screen.getByRole("menuitem", { name: "Cherry" }))
    await expect(await canvas.findByText("Chose cherry")).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Pick a fruit" }))
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Search fruit" })).toHaveFocus())
    await userEvent.tab()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
  }
}

export const Submenus: StoryObj = {
  render: demoApp(SubmenusDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "File" })).toBeVisible()
  }
}

export const OpeningSubmenus: StoryObj = {
  render: demoApp(SubmenusDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "File" }))
    const share = await screen.findByRole("menuitem", { name: "Share" })
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible())
    await expect(share).toHaveAttribute("aria-haspopup", "menu")
    await expect(share).toHaveAttribute("aria-expanded", "false")
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Share" })).toHaveAttribute("data-active"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(2))
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Share" })).toHaveAttribute("aria-expanded", "true")
    )
    const submenu = present(screen.getAllByRole("menu").find((menu) => within(menu).queryByText("Email") !== null))
    await waitFor(() => expect(submenu).toBeVisible())
    await waitFor(() =>
      expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(share.getBoundingClientRect().right)
    )
    await expect(Math.round(submenu.getBoundingClientRect().top)).toBe(Math.round(share.getBoundingClientRect().top))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(1), { timeout: 3000 })
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("menu")))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Export/ })).toHaveAttribute("data-active"))
    await userEvent.keyboard("{Enter}")
    const png = await screen.findByRole("menuitem", { name: "PNG" })
    await waitFor(() => expect(screen.getByText("Formats")).toBeVisible())
    await userEvent.click(png)
    await expect(await canvas.findByText("Chose png")).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "File" }))
    await userEvent.hover(await screen.findByRole("menuitem", { name: "Share" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Copy link" }))
    await expect(await canvas.findByText("Chose link")).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "File" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "New file" }))
    await expect(await canvas.findByText("Chose new")).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "File" }))
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible())
    await userEvent.tab()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull(), { timeout: 3000 })
  }
}
