import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AllowDeselectDemo from "./demos/allow-deselect.ts"
import * as CheckIconDemo from "./demos/check-icon.ts"
import * as ClearableDemo from "./demos/clearable.ts"
import * as DisabledOptionsDemo from "./demos/disabled-options.ts"
import * as GroupsDemo from "./demos/groups.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as SearchableDemo from "./demos/searchable.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/Select" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const library = (canvasElement: HTMLElement) =>
  within(canvasElement).findByRole("combobox", { name: "Your favorite library" })

const openList = async () => {
  const list = await screen.findByRole("listbox")
  await waitFor(() => expect(css(list).opacity).toBe("1"))

  return list
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await library(canvasElement)
    await expect(input).toHaveAttribute("readonly")
    await expect(input).toHaveAttribute("placeholder", "Pick value")
    await expect(css(input).cursor).toBe("pointer")
    await expect(box(input).height).toBe(36)
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await library(canvasElement)
    await userEvent.click(input)
    const list = await openList()
    await expect(within(list).getAllByRole("option")).toHaveLength(4)
    await userEvent.keyboard("v")
    await expect(input).toHaveValue("")
    await userEvent.click(within(list).getByRole("option", { name: "Vue" }))
    await waitFor(() => expect(input).toHaveValue("Vue"))
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.click(input)
    const reopened = await openList()
    const highlighted = () => reopened.querySelector("[data-combobox-selected]")?.textContent
    await waitFor(() => expect(highlighted()).toBe("Vue"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(highlighted()).not.toBe("Vue"))
    await userEvent.click(input)
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
  }
}

export const Clearable: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await library(canvasElement)).toHaveValue("React")
    await expect(within(canvasElement).getByRole("button", { name: "Clear" })).toBeVisible()
  }
}

export const Clearing: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await library(canvasElement)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(within(canvasElement).getByRole("button", { name: "Toggle options" })).toBeVisible()
  }
}

export const AllowDeselect: StoryObj = {
  render: demoApp(AllowDeselectDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("combobox", { name: "Option can be deselected" })).toHaveValue("React")
  }
}

export const Deselecting: StoryObj = {
  render: demoApp(AllowDeselectDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const kept = await canvas.findByRole("combobox", { name: "Option can NOT be deselected" })
    await userEvent.click(kept)
    await userEvent.click(within(await openList()).getByRole("option", { name: "React" }))
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await expect(kept).toHaveValue("React")
    const dropped = canvas.getByRole("combobox", { name: "Option can be deselected" })
    await userEvent.click(dropped)
    await userEvent.click(within(await openList()).getByRole("option", { name: "React" }))
    await waitFor(() => expect(dropped).toHaveValue(""))
  }
}

export const Searchable: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await library(canvasElement)).not.toHaveAttribute("readonly")
  }
}

export const Searching: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await library(canvasElement)
    await userEvent.type(input, "an")
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1))
    await userEvent.type(input, "x")
    await waitFor(() => expect(screen.getByText("Nothing found...")).toBeVisible())
  }
}

export const CheckIcon: StoryObj = {
  render: demoApp(CheckIconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("combobox", { name: "Control check icon" })).toHaveValue(
      "React"
    )
  }
}

export const CheckIconRight: StoryObj = {
  render: demoApp(CheckIconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("combobox", { name: "Control check icon" }))
    const react = within(await openList()).getByRole("option", { name: "React" })
    const row = present(react.firstElementChild)
    await expect(row.lastElementChild?.tagName.toLowerCase()).toBe("svg")
    await expect(css(row).justifyContent).toBe("space-between")
  }
}

export const Groups: StoryObj = {
  render: demoApp(GroupsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await library(canvasElement)).toHaveValue("")
  }
}

export const OpeningGroups: StoryObj = {
  render: demoApp(GroupsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await library(canvasElement))
    const list = await openList()
    await expect(within(list).getAllByRole("group")).toHaveLength(2)
    await expect(within(list).getByText("Backend")).toBeVisible()
  }
}

export const DisabledOptions: StoryObj = {
  render: demoApp(DisabledOptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await library(canvasElement)).toHaveValue("")
  }
}

export const ChoosingDisabled: StoryObj = {
  render: demoApp(DisabledOptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await library(canvasElement)
    await userEvent.click(input)
    const vue = within(await openList()).getByRole("option", { name: "Vue" })
    await expect(vue).toHaveAttribute("aria-disabled", "true")
    await userEvent.click(vue)
    await expect(input).toHaveValue("")
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const locked = await canvas.findByRole("combobox", { name: "Locked" })
    await expect(locked).toBeDisabled()
    await expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull()
    const read = canvas.getByRole("combobox", { name: "Read only" })
    await userEvent.click(read)
    await expect(screen.queryByRole("listbox")).toBeNull()
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
