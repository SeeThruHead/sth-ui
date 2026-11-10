import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ClearableDemo from "./demos/clearable.ts"
import * as HidePickedDemo from "./demos/hide-picked.ts"
import * as MaxValuesDemo from "./demos/max-values.ts"
import * as SearchableDemo from "./demos/searchable.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/MultiSelect" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const libraries = (canvasElement: HTMLElement) =>
  within(canvasElement).findByRole("combobox", { name: "Your favorite libraries" })

const shellOf = (input: HTMLElement) => present(input.closest("[data-variant]"))

const pills = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll("[data-with-remove], [data-disabled][data-variant='default']")].map(
    (pill) => pill.textContent
  )

const openList = async () => {
  const list = await screen.findByRole("listbox")
  await waitFor(() => expect(css(list).opacity).toBe("1"))

  return list
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await libraries(canvasElement)
    await expect(input).toHaveAttribute("readonly")
    await expect(input).toHaveAttribute("placeholder", "Pick value")
    await expect(shellOf(input).tagName).toBe("DIV")
    await expect(box(shellOf(input)).height).toBe(36)
    await expect(box(shellOf(input)).width).toBe(340)
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await libraries(canvasElement)
    const shell = shellOf(input)
    await userEvent.click(shell)
    const list = await openList()
    await expect(Math.round(box(list).width)).toBe(340)
    await expect(box(list).top).toBeGreaterThan(box(shell).bottom)
    await userEvent.hover(within(list).getByRole("option", { name: "React" }))
    await expect(within(list).getByRole("option", { name: "React" }).firstElementChild).not.toHaveAttribute(
      "data-combobox-selected"
    )
    await userEvent.click(within(list).getByRole("option", { name: "React" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["React"]))
    await expect(screen.getByRole("listbox")).toBeVisible()
    await userEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Vue" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["React", "Vue"]))
    await expect(present(screen.getByRole("option", { name: "Vue" }).querySelector("svg"))).toBeVisible()
    await userEvent.click(screen.getByRole("option", { name: "React" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["Vue"]))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
  }
}

export const Removing: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await libraries(canvasElement)
    await userEvent.click(shellOf(input))
    await userEvent.click(within(await openList()).getByRole("option", { name: "Svelte" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["React", "Svelte"]))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    const react = present(within(canvasElement).getByText("React").parentElement)
    await userEvent.click(present(react.querySelector("button")))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["Svelte"]))
    await expect(screen.queryByRole("listbox")).toBeNull()
    await userEvent.click(shellOf(input))
    await openList()
    await userEvent.keyboard("{Escape}")
    await userEvent.click(input)
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(pills(canvasElement)).toEqual([]))
    await userEvent.keyboard("{Backspace}")
    await expect(pills(canvasElement)).toEqual([])
  }
}

export const Searchable: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await libraries(canvasElement)).not.toHaveAttribute("readonly")
  }
}

export const Searching: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await libraries(canvasElement)
    await userEvent.type(input, "an")
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1))
    await userEvent.keyboard("{Backspace}")
    await expect(pills(canvasElement)).toEqual([])
    await waitFor(() => expect(input).toHaveValue("a"))
    await userEvent.type(input, "n")
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1))
    await userEvent.click(screen.getByRole("option", { name: "Angular" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["Angular"]))
    await waitFor(() => expect(input).toHaveValue(""))
    await userEvent.type(input, "xyz")
    await waitFor(() => expect(screen.getByText("Nothing found...")).toBeInTheDocument())
  }
}

export const Clearable: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await libraries(canvasElement)
    await expect(pills(canvasElement)).toEqual(["React"])
    const clear = within(canvasElement).getByRole("button", { name: "Clear" })
    await expect(clear).toBeVisible()
    const shell = shellOf(await libraries(canvasElement))
    const chevron = present(present(clear.parentElement).lastElementChild)
    await expect(box(chevron).right).toBeLessThanOrEqual(box(shell).right)
    await expect(box(clear).right).toBeLessThanOrEqual(box(chevron).left)
  }
}

export const Clearing: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await libraries(canvasElement)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual([]))
    await expect(within(canvasElement).queryByRole("button", { name: "Clear" })).toBeNull()
    await expect(screen.queryByRole("listbox")).toBeNull()
  }
}

export const MaxValues: StoryObj = {
  render: demoApp(MaxValuesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await libraries(canvasElement)
    await userEvent.click(shellOf(input))
    const list = await openList()
    await userEvent.click(within(list).getByRole("option", { name: "React" }))
    await userEvent.click(within(list).getByRole("option", { name: "Vue" }))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["React", "Vue"]))
    await userEvent.click(within(list).getByRole("option", { name: "Svelte" }))
    await expect(pills(canvasElement)).toEqual(["React", "Vue"])
  }
}

export const HidePickedOptions: StoryObj = {
  render: demoApp(HidePickedDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(shellOf(await libraries(canvasElement)))
    const list = await openList()
    await expect(within(list).getAllByRole("option")).toHaveLength(3)
    await expect(within(list).queryByRole("option", { name: "Vue" })).toBeNull()
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByRole("combobox", { name: "Filled" })
    await expect(filled).toHaveAccessibleDescription("Too many Pills use the contrast variant")
    await expect(css(present(canvas.getAllByText("React")[0]?.parentElement)).backgroundColor).toBe(
      "rgb(255, 255, 255)"
    )
    await expect(
      [...canvasElement.querySelectorAll<HTMLInputElement>("input[name='frameworks']")].map((hidden) => hidden.value)
    ).toEqual(["React", "Vue"])
    await userEvent.click(shellOf(filled))
    const list = await openList()
    await expect(within(list).getAllByRole("group")).toHaveLength(2)
    await expect(within(list).getByRole("option", { name: "Django" })).toHaveAttribute("aria-disabled", "true")
    const locked = canvas.getByRole("combobox", { name: "Disabled frameworks" })
    await expect(locked).toBeDisabled()
    await expect(canvas.getByText("Ember")).toBeVisible()
    await expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull()
    await expect(present(canvas.getAllByText("React")[1]?.parentElement).querySelector("button")).toBeNull()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await libraries(canvasElement)
    await expect(css(shellOf(input)).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(present(within(canvasElement).getByText("React").parentElement)).backgroundColor).toBe(
      "rgb(36, 36, 36)"
    )
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
