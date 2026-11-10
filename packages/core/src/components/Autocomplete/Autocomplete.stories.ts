import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ClearableDemo from "./demos/clearable.ts"
import * as GroupsDemo from "./demos/groups.ts"
import * as LimitDemo from "./demos/limit.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/Autocomplete" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const options = () => within(screen.getByRole("listbox")).getAllByRole("option")

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Your favorite library" })
    await expect(input).not.toHaveAttribute("readonly")
    await expect(input).toHaveAttribute("placeholder", "Pick value or enter anything")
    await expect(within(canvasElement).queryByRole("button")).toBeNull()
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Your favorite library" })
    await userEvent.type(input, "an")
    await waitFor(() => expect(options()).toHaveLength(1))
    await expect(options()[0]).toHaveAccessibleName("Angular")
    await expect(present(options()[0]).querySelector("svg")).toBeNull()
    await userEvent.type(input, "ything")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue("anything"))
    await userEvent.clear(input)
    await userEvent.type(input, "v")
    await waitFor(() => expect(options()).toHaveLength(2))
    await userEvent.click(screen.getByRole("option", { name: "Vue" }))
    await waitFor(() => expect(input).toHaveValue("Vue"))
    await userEvent.click(within(canvasElement).getByText("Your favorite library"))
    await expect(input).toHaveValue("Vue")
  }
}

export const Clearable: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Clearable autocomplete" })
    await expect(input).toHaveValue("React")
    await expect(within(canvasElement).getByRole("button", { name: "Clear" })).toBeVisible()
  }
}

export const Clearing: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Clearable autocomplete" })
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(within(canvasElement).queryByRole("button")).toBeNull()
  }
}

export const Limit: StoryObj = {
  render: demoApp(LimitDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "100 000 options autocomplete" })
    await expect(input).toHaveAttribute("placeholder", "Use limit to optimize performance")
  }
}

export const Limiting: StoryObj = {
  render: demoApp(LimitDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "100 000 options autocomplete" })
    await userEvent.type(input, "99")
    await waitFor(() => expect(options()[0]).toHaveAccessibleName("Option 99"), { timeout: 5000 })
    await expect(options()).toHaveLength(5)
  }
}

export const Groups: StoryObj = {
  render: demoApp(GroupsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("combobox", { name: "Your favorite library" })).toHaveValue("")
  }
}

export const OpeningGroups: StoryObj = {
  render: demoApp(GroupsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement).findByRole("combobox", { name: "Your favorite library" })
    await userEvent.type(input, "e")
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("group")).toHaveLength(2))
    await expect(options()).toHaveLength(2)
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const read = await canvas.findByRole("combobox", { name: "Read only" })
    await expect(read).toHaveAttribute("readonly")
    await expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull()
    await expect(canvas.getByRole("combobox", { name: "Disabled" })).toBeDisabled()
    const wrong = canvas.getByRole("combobox", { name: "Error" })
    await expect(wrong).toHaveValue("Rust")
    await expect(css(wrong).borderTopColor).toBe("rgb(250, 82, 82)")
    await expect(wrong).toHaveAccessibleDescription("Pick a frontend library")
  }
}

export const NothingFound: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const wrong = await within(canvasElement).findByRole("combobox", { name: "Error" })
    await userEvent.type(wrong, "x")
    await waitFor(() => expect(screen.getByText("No such library")).toBeInTheDocument())
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
