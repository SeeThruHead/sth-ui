import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as SearchableDemo from "./demos/searchable.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/ComboboxPopover" }

export default meta

const page = within(document.body)

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const listbox = () => page.findByRole("listbox")

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByRole("button", { name: "Select framework" })
    await expect(target).toHaveAttribute("aria-haspopup", "listbox")
    await expect(target).toHaveAttribute("aria-expanded", "false")
    await expect(target.getBoundingClientRect().width).toBeGreaterThanOrEqual(200)
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Select framework" }))
    const list = await listbox()
    await waitFor(() => expect(list).toHaveFocus())
    await expect(within(list).getAllByRole("option")).toHaveLength(4)
    await expect(css(list.parentElement).paddingTop).toBe("4px")
    await user.click(within(list).getByText("Vue"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Vue" })).toHaveFocus())
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull())
    await user.click(canvas.getByRole("button", { name: "Vue" }))
    const reopened = await listbox()
    await expect(within(reopened).getByRole("option", { name: "Vue" })).toHaveAttribute("aria-selected", "true")
    await expect(within(reopened).getByRole("option", { name: "Vue" }).querySelector("svg")).not.toBeNull()
    await user.click(within(reopened).getByText("Vue"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Select framework" })).toBeVisible())
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const target = await canvas.findByRole("button", { name: "Select framework" })
    target.focus()
    await user.keyboard("{Enter}")
    const list = await listbox()
    await waitFor(() => expect(list).toHaveFocus())
    await user.keyboard("{ArrowDown}{ArrowDown}")
    const angular = within(list).getByRole("option", { name: "Angular" })
    await waitFor(() => expect(list).toHaveAttribute("aria-activedescendant", angular.id))
    await expect(angular.firstElementChild).toHaveAttribute("data-combobox-selected")
    await user.keyboard("{ArrowUp}{ArrowUp}")
    await waitFor(() =>
      expect(list).toHaveAttribute("aria-activedescendant", within(list).getByRole("option", { name: "Svelte" }).id)
    )
    await user.keyboard("{Enter}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Svelte" })).toHaveFocus())
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull())
    await user.keyboard("{Enter}")
    const reopened = await listbox()
    await waitFor(() => expect(reopened).toHaveFocus())
    await user.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull())
  }
}

export const Searchable: StoryObj = {
  render: demoApp(SearchableDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Select framework" })).toBeVisible()
    await expect(within(canvasElement).getByRole("button", { name: "Select option" })).toBeVisible()
  }
}

export const Searching: StoryObj = {
  render: demoApp(SearchableDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Select framework" }))
    const search = await page.findByPlaceholderText("Search...")
    await waitFor(() => expect(search).toHaveFocus())
    await expect(css(search).borderTopWidth).toBe("0px")
    await user.keyboard("an")
    const list = await listbox()
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1))
    await user.keyboard("{Enter}")
    await waitFor(() => expect(page.getByRole("listbox")).toBeVisible())
    await user.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Angular" })).toBeVisible())
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull())
    await user.click(canvas.getByRole("button", { name: "Angular" }))
    await waitFor(() => expect(document.activeElement).toHaveAttribute("placeholder", "Search..."))
    await expect(document.activeElement).toHaveValue("")
    await user.keyboard("zzz")
    await waitFor(() => expect(page.getByText("Nothing found...")).toBeVisible())
  }
}

export const HeaderAndFooter: StoryObj = {
  render: demoApp(SearchableDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "With a header" }))
    const list = await listbox()
    const header = await page.findByText("Frameworks")
    const footer = page.getByText("4 frameworks")
    await expect(header.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(footer.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    await expect(css(header).borderBottomWidth).toBe("1px")
    await expect(css(header).borderBottomColor).toBe("rgb(233, 236, 239)")
    await expect(css(footer).borderTopWidth).toBe("1px")
    await expect(css(footer).paddingTop).toBe("6px")
    await expect(within(list).queryByText("Frameworks")).toBeNull()
  }
}

export const Limiting: StoryObj = {
  render: demoApp(SearchableDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await user.click(await within(canvasElement).findByRole("button", { name: "Select option" }))
    const list = await listbox()
    await expect(within(list).getAllByRole("option")).toHaveLength(5)
    await waitFor(() => expect(page.getByPlaceholderText("Search...")).toHaveFocus())
    await user.keyboard("9")
    await waitFor(() => expect(within(list).getAllByRole("option")[0]).toHaveTextContent("Option 9"))
  }
}

export const Multiple: StoryObj = {
  render: demoApp(MultipleDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Select frameworks" })).toBeVisible()
  }
}

export const ChoosingMany: StoryObj = {
  render: demoApp(MultipleDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Select frameworks" }))
    const list = await listbox()
    await expect(list).toHaveAttribute("aria-multiselectable", "true")
    await user.click(within(list).getByText("React"))
    await user.click(within(list).getByText("Vue"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "React, Vue" })).toBeVisible())
    await waitFor(() => expect(page.getByRole("listbox")).toBeVisible())
    await user.click(within(list).getByText("React"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Vue" })).toBeVisible())
  }
}

export const Groups: StoryObj = {
  render: demoApp(MultipleDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Select technology" }))
    const list = await listbox()
    await waitFor(() => expect(within(list).getByText("Frontend")).toBeVisible())
    await expect(within(list).getByText("Backend")).toBeVisible()
    const vue = within(list).getByRole("option", { name: "Vue" })
    await expect(vue).toHaveAttribute("aria-disabled", "true")
    await user.click(within(list).getByText("Vue"))
    await expect(canvas.getByRole("button", { name: "Select technology" })).toBeVisible()
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
    await waitFor(() =>
      expect(list).toHaveAttribute("aria-activedescendant", within(list).getByRole("option", { name: "Node.js" }).id)
    )
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole("button", { name: "React" })).toHaveLength(2)
    const hidden = present(canvasElement.querySelector<HTMLInputElement>("input[type=hidden][name=framework]"))
    await expect(hidden).toHaveValue("Vue")
    await expect(hidden).toHaveAttribute("form", "framework-form")
    const locked = present(canvasElement.querySelector<HTMLInputElement>("input[type=hidden][name=locked]"))
    await expect(locked).toHaveValue("React")
    await expect(locked).not.toHaveAttribute("form")
  }
}

export const Deselecting: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const [locked, deselect] = await canvas.findAllByRole("button", { name: "React" })
    await user.click(present(locked))
    await user.click(within(await listbox()).getByText("React"))
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull())
    await expect(canvas.getAllByRole("button", { name: "React" })).toHaveLength(2)
    await user.click(present(deselect))
    await user.click(within(await listbox()).getByText("React"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Can deselect (default)" })).toBeVisible())
  }
}

export const CheckOnTheRight: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("button", { name: "Vue" }))
    const vue = within(await listbox()).getByRole("option", { name: "Vue" })
    await expect(vue.firstElementChild).toHaveAttribute("data-reverse")
    await expect(vue.firstElementChild?.lastElementChild?.tagName).toBe("svg")
    await user.keyboard("{Escape}")
    await user.click(canvas.getByRole("button", { name: "Open dropdown" }))
    await waitFor(() => expect(page.getByText("No options available")).toBeVisible())
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "React" })).toBeVisible()
  }
}
