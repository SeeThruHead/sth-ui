import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as GroupsDemo from "./demos/groups.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as ScrollDemo from "./demos/scroll.ts"
import * as SearchableDemo from "./demos/searchable.ts"
import * as ViewportDemo from "./demos/viewport.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/Combobox" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Your favorite grocery" })
    await expect(input).toHaveAttribute("placeholder", "Pick value")
    await expect(box(input).height).toBe(36)
    await expect(box(input).width).toBe(340)
    await expect(within(canvasElement).getByRole("button", { name: "Toggle options" })).toBeVisible()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Your favorite grocery" })
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle options" }))
    const list = await screen.findByRole("listbox")
    await expect(within(list).getAllByRole("option")).toHaveLength(5)
    await waitFor(() => expect(box(list).top).toBeGreaterThan(box(input).bottom))
    await expect(Math.round(box(list).width)).toBe(Math.round(box(input).width))
    const bananas = within(list).getByRole("option", { name: "🍌 Bananas" })
    await expect(css(bananas.firstElementChild).paddingTop).toBe("6px")
    await userEvent.hover(bananas)
    await waitFor(() => expect(css(bananas.firstElementChild).backgroundColor).toBe("rgb(248, 249, 250)"))
    await expect(bananas.firstElementChild).not.toHaveAttribute("data-combobox-selected")
    await userEvent.click(bananas)
    await waitFor(() => expect(input).toHaveValue("🍌 Bananas"))
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.click(input)
    await userEvent.keyboard("{ArrowDown}")
    const reopened = await screen.findByRole("listbox")
    const checked = within(reopened).getByRole("option", { name: "🍌 Bananas" })
    await expect(checked).toHaveAttribute("aria-selected", "true")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", "grocery-item-1"))
    await expect(css(present(checked.querySelector("svg"))).opacity).toBe("1")
    await expect(within(reopened).getByRole("option", { name: "🍎 Apples" }).querySelector("svg")).toBeNull()
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", "grocery-item-0"))
    await expect(css(present(checked.querySelector("svg"))).opacity).toBe("0.4")
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", "grocery-item-1"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", "grocery-item-2"))
    await waitFor(() =>
      expect(css(present(screen.getByRole("option", { name: "🥦 Broccoli" }).firstElementChild)).backgroundColor).toBe(
        "rgb(34, 139, 230)"
      )
    )
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(input).toHaveValue("🥦 Broccoli"))
  }
}

export const Searchable: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Grocery" })
    await expect(input).toHaveAttribute("placeholder", "Search value")
  }
}

export const Searching: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Grocery" })
    await userEvent.type(input, "ch")
    const list = await screen.findByRole("listbox")
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(4))
    await userEvent.type(input, "zz")
    await waitFor(() => expect(within(screen.getByRole("listbox")).getByText("Nothing found")).toBeVisible())
    await userEvent.clear(input)
    await userEvent.type(input, "kiwi")
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1))
    await userEvent.click(await screen.findByRole("option", { name: "🥝 Kiwi" }))
    await waitFor(() => expect(input).toHaveValue("🥝 Kiwi"))
  }
}

export const Groups: StoryObj = {
  render: demoApp(GroupsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("combobox", { name: "Grocery" })).toHaveValue("")
  }
}

export const OpeningGroups: StoryObj = {
  render: demoApp(GroupsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Toggle options" }))
    const list = await screen.findByRole("listbox")
    const groups = within(list).getAllByRole("group")
    await expect(groups).toHaveLength(2)
    await waitFor(() => expect(within(list).getByText("Vegetables")).toBeVisible())
    await expect(css(within(list).getByText("Fruits")).color).toBe("rgb(134, 142, 150)")
  }
}

export const Scroll: StoryObj = {
  render: demoApp(ScrollDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("combobox", { name: "Grocery" })).toHaveAttribute(
      "placeholder",
      "Pick value"
    )
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(ScrollDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Toggle options" }))
    const list = await screen.findByRole("listbox")
    await expect(within(list).getAllByRole("option")).toHaveLength(29)
    await waitFor(() => expect(box(list).height).toBeLessThan(215))
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("combobox", { name: "Size" })
    await expect(input).toHaveValue("Medium")
    await expect(box(input).height).toBe(50)
    await expect(input).toHaveAccessibleDescription("Pick again One size per order")
    await expect(css(input).borderTopColor).toBe("rgb(250, 82, 82)")
    await expect(present(input.parentElement).querySelector("button")).toBeNull()
    await expect(present(canvasElement.querySelector("input[name='size']"))).toHaveValue("md")
    await userEvent.clear(input)
    await userEvent.type(input, "l")
    const large = await screen.findByRole("option", { name: "Large" })
    await expect(large).toHaveAttribute("aria-disabled", "true")
    await expect(large.querySelector("svg")).toBeNull()
    await userEvent.type(input, "zz")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.clear(input)
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(2))
    await expect(screen.getByText("Made to order")).toBeVisible()
    await expect(canvas.getByRole("combobox", { name: /Locked/ })).toBeDisabled()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Your favorite grocery" })
    await expect(css(input).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const FitsViewport: StoryObj = {
  render: demoApp(ViewportDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "A long list" })
    await userEvent.click(input)
    await userEvent.keyboard("{ArrowDown}")
    const list = await screen.findByRole("listbox")
    await waitFor(() => expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight))
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
  }
}
