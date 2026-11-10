import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "../../stories/harness.ts"
import * as GroupsDemo from "./demos/groups.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Extensions/Spotlight" }

export default meta

const page = within(document.body)

const opened = () => waitFor(async () => expect(await page.findByRole("dialog")).toBeVisible())

const closed = () => waitFor(() => expect(page.queryByRole("dialog")).toBeNull())

const search = () => page.getByRole("textbox")

const actions = () => page.getAllByRole("button").filter((button) => button.hasAttribute("data-action"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Open spotlight" })).toBeVisible()
    await expect(page.queryByRole("dialog")).toBeNull()
  }
}

export const Searching: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open spotlight" }))
    await opened()
    await waitFor(() => expect(search()).toHaveFocus())
    await expect(actions()).toHaveLength(3)
    await userEvent.keyboard("dash")
    await waitFor(() => expect(actions()).toHaveLength(1))
    await waitFor(() => expect(page.getByText("Dash", { selector: "mark" })).toBeVisible())
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(actions()[0]).toHaveAttribute("data-selected", "true"))
    await userEvent.keyboard("{Enter}")
    await closed()
    await expect(await canvas.findByText(/Triggered dashboard/)).toBeVisible()
    await userEvent.keyboard("{Control>}k{/Control}")
    await opened()
    await waitFor(() => expect(search()).toHaveValue(""))
    await userEvent.type(search(), "zzz")
    await expect(await page.findByText("Nothing found...")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await closed()
    await userEvent.click(canvas.getByRole("button", { name: "Open spotlight" }))
    await opened()
    await userEvent.click(await page.findByRole("button", { name: /Home/ }))
    await closed()
    await expect(await canvas.findByText(/Triggered home/)).toBeVisible()
  }
}

export const Groups: StoryObj = {
  render: demoApp(GroupsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Open grouped spotlight" })).toBeVisible()
    await expect(canvas.getByText("Nothing yet")).toBeVisible()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(GroupsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open grouped spotlight" }))
    await opened()
    await expect(page.getByRole("group", { name: "Pages" })).toBeVisible()
    await expect(page.getByRole("group", { name: "Fruits" })).toBeVisible()
    await expect(actions()).toHaveLength(7)
    await expect(page.getByText("Up and down to move, Enter to choose")).toBeVisible()
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(actions()[0]).toHaveAttribute("data-selected", "true"))
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(actions()[6]).toHaveAttribute("data-selected", "true"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(actions()[0]).toHaveAttribute("data-selected", "true"))
    await userEvent.keyboard("{Tab}")
    await userEvent.type(search(), "pref")
    await waitFor(() => expect(actions()).toHaveLength(1))
    await userEvent.keyboard("{Enter}")
    await expect(await canvas.findByText("Triggered settings")).toBeVisible()
    await expect(page.getByRole("dialog")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await closed()
    await userEvent.keyboard("/")
    await opened()
    await waitFor(() => expect(search()).toHaveValue("pref"))
    await userEvent.keyboard("{Escape}")
    await closed()
    await userEvent.keyboard("{Meta>}j{/Meta}")
    await opened()
    await userEvent.clear(search())
    await userEvent.click(await page.findByRole("button", { name: /Home/ }))
    await closed()
    await expect(await canvas.findByText("Triggered home")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("switch", { name: "Disabled" })).not.toBeChecked()
    await expect(canvas.getByText("Triggered: none")).toBeVisible()
  }
}

export const Configuring: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Triggered: none")).toBeVisible()
    await userEvent.keyboard("{Control>}{Shift>}p{/Shift}{/Control}")
    await opened()
    await userEvent.type(search(), "new")
    await waitFor(() => expect(actions()).toHaveLength(2))
    await waitFor(() => expect(actions()[0]).toHaveAttribute("data-selected", "true"))
    await userEvent.keyboard("{Enter}")
    await expect(await canvas.findByText("Triggered: new")).toBeVisible()
    await expect(page.getByRole("dialog")).toBeVisible()
    await userEvent.clear(search())
    await waitFor(() => expect(page.getByText("An action with only a description")).toBeVisible())
    await userEvent.keyboard("{Escape}")
    await closed()
    await userEvent.click(canvas.getByRole("switch", { name: "Shift + Ctrl + P opens it" }))
    await waitFor(() => expect(canvas.getByRole("switch", { name: "Shift + Ctrl + P opens it" })).not.toBeChecked())
    await userEvent.keyboard("{Control>}{Shift>}p{/Shift}{/Control}")
    await expect(page.queryByRole("dialog")).toBeNull()
    await userEvent.click(canvas.getByRole("switch", { name: "Disabled" }))
    await waitFor(() => expect(canvas.getByRole("switch", { name: "Disabled" })).toBeChecked())
    await userEvent.click(canvas.getByRole("button", { name: "Open" }))
    await expect(page.queryByRole("dialog")).toBeNull()
    await userEvent.click(canvas.getByRole("switch", { name: "Disabled" }))
    await opened()
  }
}
