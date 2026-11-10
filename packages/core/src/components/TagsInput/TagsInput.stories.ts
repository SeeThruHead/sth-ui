import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AcceptOnBlurDemo from "./demos/accept-on-blur.ts"
import * as ClearableDemo from "./demos/clearable.ts"
import * as DuplicatesDemo from "./demos/duplicates.ts"
import * as MaxTagsDemo from "./demos/max-tags.ts"
import * as SplitCharsDemo from "./demos/split-chars.ts"
import * as SuggestionsDemo from "./demos/suggestions.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/TagsInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const field = (canvasElement: HTMLElement, name = "Press Enter to submit a tag") =>
  within(canvasElement).findByRole("combobox", { name })

const tagsIn = (element: Element | null) =>
  [...present(element).querySelectorAll("[data-with-remove]")].map((pill) => pill.textContent)

const tags = (canvasElement: HTMLElement) => tagsIn(canvasElement)

const rendered = async () => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(150))
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await expect(input).not.toHaveAttribute("readonly")
    await expect(input).toHaveAttribute("placeholder", "Enter tag")
    await expect(box(input.closest("[data-variant]")).height).toBe(36)
    await expect(within(canvasElement).queryByRole("button")).toBeNull()
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await userEvent.type(input, "Effect{Enter}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["Effect"]))
    await expect(input).toHaveValue("")
    await userEvent.type(input, "  {Enter}")
    await userEvent.type(input, "foldkit,")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["Effect", "foldkit"]))
    await userEvent.type(input, "EFFECT{Enter}")
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(tags(canvasElement)).toEqual(["Effect", "foldkit"])
    await rendered()
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["Effect"]))
    await userEvent.click(present(within(canvasElement).getByText("Effect").parentElement?.querySelector("button")))
    await waitFor(() => expect(tags(canvasElement)).toEqual([]))
    await userEvent.click(input)
    await userEvent.paste("a, b,,c")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["a", "b", "c"]))
  }
}

export const Clearable: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await field(canvasElement)
    await expect(tags(canvasElement)).toEqual(["React"])
    await expect(within(canvasElement).getByRole("button", { name: "Clear" })).toBeVisible()
  }
}

export const Clearing: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await userEvent.type(input, "draft")
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(tags(canvasElement)).toEqual([]))
    await expect(input).toHaveValue("")
  }
}

export const MaxTags: StoryObj = {
  render: demoApp(MaxTagsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await userEvent.type(input, "third{Enter}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["first", "second", "third"]))
    await userEvent.type(input, "fourth{Enter}")
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(tags(canvasElement)).toEqual(["first", "second", "third"])
  }
}

export const SplitChars: StoryObj = {
  render: demoApp(SplitCharsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await userEvent.type(input, "one two|three,")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["one", "two", "three"]))
  }
}

export const Suggestions: StoryObj = {
  render: demoApp(SuggestionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await field(canvasElement)).toHaveAttribute("placeholder", "Pick tag from list")
  }
}

export const PickingSuggestions: StoryObj = {
  render: demoApp(SuggestionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await userEvent.type(input, "re")
    await screen.findByRole("option", { name: "React" })
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["re"]))
    await userEvent.type(input, "an")
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant"))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["re", "Angular"]))
    await userEvent.type(input, "r")
    await userEvent.click(await screen.findByRole("option", { name: "React" }))
    await waitFor(() => expect(tags(canvasElement)).toEqual(["re", "Angular", "React"]))
    await userEvent.type(input, "Solid")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["re", "Angular", "React", "Solid"]))
    await userEvent.click(present(input.closest("[data-variant]")))
    await waitFor(() => expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1))
  }
}

export const AcceptOnBlur: StoryObj = {
  render: demoApp(AcceptOnBlurDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const kept = await field(canvasElement, "Value IS accepted on blur")
    await userEvent.type(kept, "Vue")
    await userEvent.tab()
    await waitFor(() => expect(tagsIn(kept.closest("[data-variant]"))).toEqual(["Vue"]))
    const dropped = await field(canvasElement, "Value IS NOT accepted on blur")
    await userEvent.type(dropped, "Vue")
    await userEvent.tab()
    await expect(tagsIn(dropped.closest("[data-variant]"))).toEqual([])
  }
}

export const Duplicates: StoryObj = {
  render: demoApp(DuplicatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement)
    await userEvent.type(input, "same{Enter}")
    await userEvent.type(input, "same{Enter}")
    await waitFor(() => expect(tags(canvasElement)).toEqual(["same", "same"]))
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
