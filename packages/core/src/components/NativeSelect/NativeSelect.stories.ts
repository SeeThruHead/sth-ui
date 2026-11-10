import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DividersDemo from "./demos/dividers.ts"
import * as GroupsDemo from "./demos/groups.ts"
import * as SectionsDemo from "./demos/sections.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/NativeSelect" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const chevronOf = (select: HTMLElement) => present(select.parentElement?.querySelector("[data-combobox-chevron]"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const select = await within(canvasElement).findByRole("combobox", { name: "Input label" })
    await expect(select.tagName).toBe("SELECT")
    await expect(select).toHaveValue("React")
    await expect(within(select).getAllByRole("option")).toHaveLength(3)
    await expect(css(select).cursor).toBe("pointer")
    await expect(css(select).height).toBe("36px")
    const chevron = chevronOf(select)
    await expect(chevron.getBoundingClientRect().width).toBe(18)
    await expect(css(chevron).color).toBe("rgb(134, 142, 150)")
    await expect(css(chevron.parentElement).pointerEvents).toBe("none")
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.setup().selectOptions(await canvas.findByRole("combobox", { name: "Input label" }), "Vue")
    await waitFor(() => expect(canvas.getByText("Selected: Vue")).toBeVisible())
  }
}

export const Groups: StoryObj = {
  render: demo(GroupsDemo.view),
  play: async ({ canvasElement }) => {
    const select = await within(canvasElement).findByRole("combobox", { name: "Grouped options" })
    const groups = within(select).getAllByRole("group")
    await expect(groups[0]).toHaveAttribute("label", "Frontend libraries")
    await expect(within(select).getByRole("option", { name: "Vue" })).toBeDisabled()
    await expect(select).toHaveValue("react")
  }
}

export const Dividers: StoryObj = {
  render: demo(DividersDemo.view),
  play: async ({ canvasElement }) => {
    const select = await within(canvasElement).findByRole("combobox", { name: "With dividers" })
    await expect(select).toHaveValue("Select library")
    await expect(select.querySelector("hr")).not.toBeNull()
    await expect(within(select).getAllByRole("group")).toHaveLength(2)
  }
}

export const Sections: StoryObj = {
  render: demo(SectionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByRole("combobox", { name: "Left section" })
    await expect(css(left).paddingLeft).toBe("34px")
    const right = canvas.getByRole("combobox", { name: "Right section" })
    await expect(right.parentElement?.querySelector("[data-combobox-chevron]")).toBeNull()
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("combobox", { name: "Disabled NativeSelect" })).toBeDisabled()
    const error = canvas.getByRole("combobox", { name: "Boolean error" })
    await expect(error).toHaveAttribute("aria-invalid", "true")
    await expect(chevronOf(error)).toHaveAttribute("data-error")
    await expect(css(chevronOf(error)).color).toBe("rgb(250, 82, 82)")
    await expect(canvas.getByText("Error message")).toBeVisible()
    await expect(canvas.getByText("Looks good!")).toBeVisible()
    await expect(chevronOf(canvas.getByRole("combobox", { name: "Large" })).getBoundingClientRect().width).toBe(28)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const select = await within(canvasElement).findByRole("combobox", { name: "Input label" })
    await expect(css(chevronOf(select)).color).toBe("rgb(105, 105, 105)")
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
