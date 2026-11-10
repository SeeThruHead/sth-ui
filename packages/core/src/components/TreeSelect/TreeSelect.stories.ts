import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as CheckboxDemo from "./demos/checkbox.ts"
import * as CheckStrictlyDemo from "./demos/check-strictly.ts"
import * as CheckedStrategyDemo from "./demos/checked-strategy.ts"
import * as ClearableDemo from "./demos/clearable.ts"
import * as ExpandOnClickDemo from "./demos/expand-on-click.ts"
import * as MaxValuesDemo from "./demos/max-values.ts"
import * as NothingFoundDemo from "./demos/nothing-found.ts"
import * as RenderNodeExpandDemo from "./demos/render-node-expand.ts"
import * as RenderNodeDemo from "./demos/render-node.ts"
import * as RenderPillDemo from "./demos/render-pill.ts"
import * as SearchableDemo from "./demos/searchable.ts"
import * as StatesDemo from "./demos/states.ts"
import * as WithLinesDemo from "./demos/with-lines.ts"
import * as EventsDemo from "./demos/events.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/TreeSelect" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const shellOf = (input: HTMLElement) => present(input.closest<HTMLElement>("[data-variant]"))

const field = (canvasElement: HTMLElement, name: string) => within(canvasElement).findByRole("combobox", { name })

const openList = async () => {
  const list = await screen.findByRole("listbox")
  await waitFor(() => expect(css(list).opacity).toBe("1"))

  return list
}

const option = (name: string) => screen.getByRole("option", { name })

const options = () => screen.getAllByRole("option").map((item) => item.textContent)

const pills = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll("[data-with-remove]")].map((pill) => pill.textContent)

const clearOf = (input: HTMLElement) =>
  within(present(shellOf(input).parentElement)).getByRole("button", { name: "Clear" })

const pillOf = (input: HTMLElement, text: string) =>
  present(
    [...shellOf(input).querySelectorAll<HTMLElement>("[data-with-remove]")].find((pill) => pill.textContent === text)
  )

const removeOf = (input: HTMLElement, text: string) => present(pillOf(input, text).querySelector("button"))

const chevronOf = (name: string) => within(option(name)).getByRole("button")

const pause = async (ms: number) => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(ms), { timeout: ms + 1000 })
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await expect(input).toHaveAttribute("readonly")
    await expect(input).toHaveAttribute("placeholder", "Pick value")
    await expect(box(shellOf(input)).height).toBe(36)
    await expect(box(shellOf(input)).width).toBe(340)
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(shellOf(input))
    const list = await openList()
    await waitFor(() => expect(list).toHaveAttribute("aria-multiselectable", "false"))
    await expect(Math.round(box(list).width)).toBe(340)
    await expect(box(list).top).toBeGreaterThan(box(shellOf(input)).bottom)
    await expect(options()).toEqual(["Electronics", "Groceries", "Books", "Toys"])
    const electronics = option("Electronics")
    await waitFor(() => expect(electronics).toHaveAttribute("aria-level", "1"))
    await expect(electronics).toHaveAttribute("aria-expanded", "false")
    await expect(chevronOf("Electronics")).toHaveAccessibleName("Expand")
    await expect(css(chevronOf("Electronics")).transform).not.toBe("none")
    await userEvent.click(chevronOf("Electronics"))
    await waitFor(() =>
      expect(options()).toEqual(["Electronics", "Phones", "Laptops", "Headphones", "Groceries", "Books", "Toys"])
    )
    await expect(option("Electronics")).toHaveAttribute("aria-expanded", "true")
    await expect(chevronOf("Electronics")).toHaveAccessibleName("Collapse")
    await waitFor(() => expect(option("Phones")).toHaveAttribute("aria-level", "2"))
    await expect(screen.getByRole("listbox")).toBeVisible()
    await userEvent.click(option("Headphones"))
    await waitFor(() => expect(input).toHaveValue("Headphones"))
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.click(shellOf(input))
    await openList()
    await expect(option("Headphones")).toHaveAttribute("aria-selected", "true")
    await expect(present(option("Headphones").querySelector("svg"))).toBeVisible()
    await userEvent.click(option("Headphones"))
    await waitFor(() => expect(input).toHaveValue(""))
  }
}

export const PickingMany: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite items")
    await userEvent.click(shellOf(input))
    const list = await openList()
    await waitFor(() => expect(list).toHaveAttribute("aria-multiselectable", "true"))
    await expect(Math.round(box(list).width)).toBe(340)
    await expect(options()).toHaveLength(18)
    await userEvent.click(option("iPhone"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["iPhone"]))
    await userEvent.click(option("Phones"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["iPhone", "Phones"]))
    await expect(screen.getByRole("listbox")).toBeVisible()
    await userEvent.click(option("iPhone"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["Phones"]))
  }
}

export const Checking: StoryObj = {
  render: demoApp(CheckboxDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Select categories")
    await userEvent.click(shellOf(input))
    await openList()
    await waitFor(() => expect(option("Phones")).toHaveAttribute("aria-checked", "false"))
    await userEvent.click(option("Phones"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["iPhone", "Samsung Galaxy", "Google Pixel"]))
    await waitFor(() => expect(option("Phones")).toHaveAttribute("aria-checked", "true"))
    await expect(option("Electronics")).toHaveAttribute("aria-checked", "mixed")
    await expect(option("iPhone")).toHaveAttribute("aria-level", "3")
    await expect(
      css(present(option("Phones").querySelector("[aria-hidden='true'] svg")?.parentElement?.parentElement))
        .backgroundColor
    ).toBe("rgb(34, 139, 230)")
  }
}

export const Searching: StoryObj = {
  render: demoApp(EventsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Single")
    await userEvent.click(input)
    await userEvent.type(input, "bro")
    await waitFor(() => expect(options()).toEqual(["Groceries", "Vegetables", "Broccoli"]))
    await userEvent.click(option("Broccoli"))
    await waitFor(() => expect(input).toHaveValue("Broccoli"))
    await waitFor(() => expect(within(canvasElement).getByText(/Changed broccoli/)).toBeVisible())
    await pause(100)
    await userEvent.click(input)
    await openList()
    await waitFor(() => expect(options()).toContain("Broccoli"))
    await expect(options()).toContain("Fruits")
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(shellOf(input))
    await openList()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(option("Electronics")).toHaveAttribute("data-active"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(options()).toContain("Phones"))
    await userEvent.keyboard("{ArrowDown}{ArrowRight}")
    await waitFor(() => expect(options()).toContain("iPhone"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(options()).not.toContain("iPhone"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(option("Electronics")).toHaveAttribute("data-active"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(options()).not.toContain("Phones"))
  }
}

const closed =
  (label: string, check?: (input: HTMLElement) => Promise<void>) =>
  async ({ canvasElement }: { readonly canvasElement: HTMLElement }) => {
    const input = await field(canvasElement, label)
    await expect(input).toBeVisible()
    await check?.(input)
  }

export const MultipleMode: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: closed("Your favorite items")
}

export const CheckboxMode: StoryObj = {
  render: demoApp(CheckboxDemo, { centered: true }),
  play: closed("Select categories")
}

export const Searchable: StoryObj = {
  render: demoApp(SearchableDemo, { centered: true }),
  play: closed("Your favorite item", async (input) => {
    await expect(input).not.toHaveAttribute("readonly")
  })
}

export const NothingFound: StoryObj = {
  render: demoApp(NothingFoundDemo, { centered: true }),
  play: closed("Your favorite item")
}

export const Clearable: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: closed("Your favorite item", async (input) => {
    await expect(input).toHaveValue("iPhone")
    await expect(clearOf(input)).toBeVisible()
  })
}

export const ExpandOnClick: StoryObj = {
  render: demoApp(ExpandOnClickDemo, { centered: true }),
  play: closed("Your favorite item")
}

export const WithLines: StoryObj = {
  render: demoApp(WithLinesDemo, { centered: true }),
  play: closed("Without connecting lines")
}

export const CheckStrictly: StoryObj = {
  render: demoApp(CheckStrictlyDemo, { centered: true }),
  play: closed("Select items")
}

export const CheckedStrategy: StoryObj = {
  render: demoApp(CheckedStrategyDemo, { centered: true }),
  play: closed("checkedStrategy: parent")
}

export const MaxValues: StoryObj = {
  render: demoApp(MaxValuesDemo, { centered: true }),
  play: closed("Pick up to 3 items")
}

export const RenderNode: StoryObj = {
  render: demoApp(RenderNodeDemo, { centered: true }),
  play: closed("Your favorite item")
}

export const RenderNodeExpand: StoryObj = {
  render: demoApp(RenderNodeExpandDemo, { centered: true }),
  play: closed("Your favorite item")
}

export const RenderPill: StoryObj = {
  render: demoApp(RenderPillDemo, { centered: true }),
  play: closed("Categories", async (input) => {
    await expect(pillOf(input, "Phones").querySelector("svg")).not.toBeNull()
  })
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: closed("Read only", async (input) => {
    await expect(input).toHaveValue("iPhone")
  })
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(CheckboxDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Select categories")
    await userEvent.click(shellOf(input))
    await openList()
    await expect(css(chevronOf("Electronics")).color).toBe("rgb(130, 130, 130)")
  }
}

export const Clearing: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(clearOf(input))
    await waitFor(() => expect(input).toHaveValue(""))
    await expect(within(present(shellOf(input).parentElement)).queryByRole("button", { name: "Clear" })).toBeNull()
  }
}

export const NothingMatching: StoryObj = {
  render: demoApp(NothingFoundDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(input)
    await userEvent.type(input, "zzz")
    const list = await openList()
    await waitFor(() => expect(within(list).getByText("Nothing found...")).toBeVisible())
    await expect(
      within(list)
        .queryAllByRole("option")
        .every((item) => item.getAttribute("aria-disabled") === "true")
    ).toBe(true)
  }
}

export const ExpandingOnClick: StoryObj = {
  render: demoApp(ExpandOnClickDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(shellOf(input))
    await openList()
    await userEvent.click(option("Groceries"))
    await waitFor(() => expect(options()).toContain("Fruits"))
    await expect(input).toHaveValue("")
    await userEvent.click(option("Groceries"))
    await waitFor(() => expect(options()).not.toContain("Fruits"))
  }
}

export const WithoutLines: StoryObj = {
  render: demoApp(WithLinesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Without connecting lines")
    await userEvent.click(shellOf(input))
    await openList()
    await expect(option("iPhone").querySelectorAll("[data-tree-select-option] > span:not([role])")).toHaveLength(1)
    await expect(css(present(option("iPhone").querySelector("[data-tree-select-option]"))).paddingInlineStart).toBe(
      "54px"
    )
  }
}

export const Lines: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite items")
    await userEvent.click(shellOf(input))
    await openList()
    const content = present(option("iPhone").querySelector<HTMLElement>("[data-tree-select-option]"))
    await expect(css(content).paddingInlineStart).toBe("59px")
    const lines = [...content.children].slice(0, 3)
    await expect(lines.map((line) => css(line).insetInlineStart)).toEqual(["18px", "38px", "38px"])
    await expect(css(lines[0]).borderInlineStartWidth).toBe("1px")
    await expect(css(lines[2]).width).toBe("10px")
    const last = present(option("Headphones").querySelector("[data-tree-select-option]"))
    await expect(Number.parseFloat(css(last.children[0]).height)).toBeCloseTo(box(last).height / 2, 1)
    await expect(
      css(present(option("Electronics").querySelector("[data-tree-select-option]"))).paddingInlineStart
    ).toBe("8px")
  }
}

export const Strict: StoryObj = {
  render: demoApp(CheckStrictlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Select items")
    await userEvent.click(shellOf(input))
    await openList()
    await userEvent.click(option("Phones"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["Phones"]))
    await waitFor(() => expect(option("iPhone")).toHaveAttribute("aria-checked", "false"))
    await expect(option("Electronics")).toHaveAttribute("aria-checked", "false")
    await userEvent.click(removeOf(input, "Phones"))
    await waitFor(() => expect(pills(canvasElement)).toEqual([]))
  }
}

export const Strategies: StoryObj = {
  render: demoApp(CheckedStrategyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const pick = async (label: string) => {
      const input = await field(canvasElement, label)
      await userEvent.click(shellOf(input))
      await openList()
      await userEvent.click(option("Laptops"))
      await userEvent.keyboard("{Escape}")
      await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())

      return [...shellOf(input).querySelectorAll("[data-with-remove]")].map((pill) => pill.textContent)
    }
    await expect(await pick("checkedStrategy: child (default)")).toEqual(["MacBook", "ThinkPad"])
    await expect(await pick("checkedStrategy: all")).toEqual(["MacBook", "ThinkPad", "Laptops"])
    await expect(await pick("checkedStrategy: parent")).toEqual(["Laptops"])
  }
}

export const Limiting: StoryObj = {
  render: demoApp(MaxValuesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Pick up to 3 items")
    await userEvent.click(shellOf(input))
    await openList()
    await userEvent.click(option("iPhone"))
    await userEvent.click(option("Books"))
    await userEvent.click(option("Toys"))
    await userEvent.click(option("Apples"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["iPhone", "Books", "Toys"]))
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(pills(canvasElement)).toEqual(["iPhone", "Books"]))
  }
}

export const RenderingNodes: StoryObj = {
  render: demoApp(RenderNodeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(shellOf(input))
    await openList()
    await expect(within(option("Electronics")).queryByRole("button")).toBeNull()
    await expect(option("Electronics").querySelectorAll("svg")).toHaveLength(1)
    await userEvent.click(option("MacBook"))
    await waitFor(() => expect(input).toHaveValue("MacBook"))
  }
}

export const ExpandingRenderedNodes: StoryObj = {
  render: demoApp(RenderNodeExpandDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Your favorite item")
    await userEvent.click(shellOf(input))
    await openList()
    await userEvent.click(within(option("Groceries")).getByRole("button", { name: "Expand" }))
    await waitFor(() => expect(options()).toContain("Vegetables"))
    await expect(input).toHaveValue("")
    await expect(screen.getByRole("listbox")).toBeVisible()
  }
}

export const RenderingPills: StoryObj = {
  render: demoApp(RenderPillDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Categories")
    await expect(pills(canvasElement)).toEqual(["Phones", "Headphones"])
    await userEvent.click(removeOf(input, "Phones"))
    await waitFor(() => expect(pills(canvasElement)).toEqual(["Headphones"]))
  }
}

export const Overflowing: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const readOnly = await field(canvasElement, "Read only")
    await userEvent.click(shellOf(readOnly))
    await pause(200)
    await expect(screen.queryByRole("listbox")).toBeNull()
    await expect(await field(canvasElement, "Disabled")).toBeDisabled()
    await expect(await field(canvasElement, "With error")).toHaveAttribute("aria-invalid", "true")
    const overflow = shellOf(await field(canvasElement, "Two pills at most"))
    await expect([...overflow.querySelectorAll("[data-with-remove]")].map((pill) => pill.textContent)).toEqual([
      "iPhone",
      "Google Pixel"
    ])
    await expect(within(overflow).getByText("+1 more")).toBeVisible()
    await expect(canvas.getByText("and 2 others")).toBeVisible()
    await userEvent.click(clearOf(present(overflow.querySelector("input"))))
    await waitFor(() => expect(within(overflow).queryByText("+1 more")).toBeNull())
    const labelled = await field(canvasElement, "Chevron labels")
    await userEvent.click(labelled)
    const list = await openList()
    await waitFor(() => expect(within(option("Electronics")).getByRole("button")).toHaveAccessibleName("Open"))
    await expect(option("Groceries")).toHaveAttribute("aria-expanded", "true")
    await expect(within(option("Groceries")).getByRole("button")).toHaveAccessibleName("Close")
    await expect(
      present(list.querySelector("[data-tree-select-option]")?.parentElement?.parentElement).style.maxHeight
    ).toBe("120px")
  }
}

export const DisabledOptions: StoryObj = {
  render: demoApp(EventsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Toys disabled")
    await userEvent.click(shellOf(input))
    await openList()
    await expect(option("Toys")).toHaveAttribute("aria-disabled", "true")
    await expect(css(present(option("Toys").querySelector("[data-tree-select-option]"))).opacity).toBe("0.35")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    const plain = await field(canvasElement, "Plain")
    await userEvent.click(shellOf(plain))
    await openList()
    await userEvent.click(option("Headphones"))
    await waitFor(() => expect(within(canvasElement).getByText(/Changed headphones \| Closed$/)).toBeVisible())
    await waitFor(() => expect(plain).toHaveValue("Headphones"))
    await expect(pillOf(await field(canvasElement, "Unknown value"), "retired")).toBeVisible()
  }
}

export const MultipleSearch: StoryObj = {
  render: demoApp(EventsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const input = await field(canvasElement, "Multiple")
    await userEvent.click(input)
    await userEvent.type(input, "app")
    await waitFor(() => expect(options()).toEqual(["Groceries", "Fruits", "Apples"]))
    await userEvent.click(option("Apples"))
    await waitFor(() => expect(within(canvasElement).getByText(/Changed apples/)).toBeVisible())
    await expect(input).toHaveValue("app")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await userEvent.click(input)
    await openList()
    await waitFor(() => expect(options()).toContain("Apples"))
    await expect(option("Fruits")).toHaveAttribute("aria-expanded", "true")
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
