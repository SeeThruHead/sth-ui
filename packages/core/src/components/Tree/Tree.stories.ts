import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as AsyncLoadingDemo from "./demos/async-loading.ts"
import * as CheckStrictlyDemo from "./demos/check-strictly.ts"
import * as CheckedDemo from "./demos/checked.ts"
import * as ControllerDemo from "./demos/controller.ts"
import * as ExpandedStateDemo from "./demos/expanded-state.ts"
import * as DragDropAllowDemo from "./demos/drag-drop-allow.ts"
import * as DragDropHandleDemo from "./demos/drag-drop-handle.ts"
import * as DragDropDemo from "./demos/drag-drop.ts"
import * as LinesDemo from "./demos/lines.ts"
import * as PlainDemo from "./demos/plain.ts"
import * as SearchFilterDemo from "./demos/search-filter.ts"
import * as SearchFuzzyDemo from "./demos/search-fuzzy.ts"
import * as SearchHighlightDemo from "./demos/search-highlight.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as FlatDemo from "./demos/flat.ts"
import * as VirtualizedDemo from "./demos/virtualized.ts"

const meta: Meta = { title: "DataDisplay/Tree" }

export default meta

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const item = (tree: HTMLElement, value: string) =>
  present(tree.querySelector<HTMLElement>(`[role="treeitem"][data-value="${CSS.escape(value)}"]`))

const label = (root: HTMLElement, value: string) =>
  present(item(root, value).querySelector<HTMLElement>("[data-tree-label]"))

const tree = (canvasElement: HTMLElement, name: string) => within(canvasElement).findByRole("tree", { name })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await expect(root).toHaveAttribute("data-with-lines")
    await expect(root).toHaveAttribute("aria-multiselectable", "false")
    const roots = [...root.children]
    await expect(roots).toHaveLength(4)
    await expect(roots[0]).toHaveAttribute("tabindex", "0")
    await expect(roots[1]).toHaveAttribute("tabindex", "-1")
    await expect(item(root, "src")).toHaveAttribute("aria-expanded", "false")
    await expect(item(root, "package.json")).not.toHaveAttribute("aria-expanded")
    await expect(within(root).getByText("src")).toBeVisible()
    await expect(within(root).queryByText("components")).toBeNull()
    await expect(label(root, "src").querySelector("[data-icon='folder-simple']")).not.toBeNull()
  }
}

export const Expanding: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await userEvent.click(within(root).getByText("src"))
    await waitFor(() => expect(item(root, "src")).toHaveAttribute("aria-expanded", "true"))
    await expect(item(root, "src")).toHaveFocus()
    const components = label(root, "src/components")
    await expect(css(components).paddingLeft).toBe("20px")
    await expect(label(root, "src").querySelector("[data-icon='folder-open']")).not.toBeNull()
    await expect(item(root, "src/components")).toHaveAttribute("data-level", "2")
    await expect(css(item(root, "src/components"), "::before").borderTopWidth).toBe("1px")
    await expect(css(item(root, "src/components"), "::after").height).toBe("12px")
    await userEvent.click(within(root).getByText("src"))
    await waitFor(() => expect(within(root).queryByText("components")).toBeNull())
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await userEvent.tab()
    await expect(item(root, "src")).toHaveFocus()
    await waitFor(() => expect(css(label(root, "src")).outlineStyle).toBe("solid"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(item(root, "node_modules")).toHaveFocus())
    await waitFor(() => expect(css(label(root, "src")).outlineStyle).toBe("none"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(item(root, "node_modules")).toHaveAttribute("aria-expanded", "true"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(item(root, "node_modules/react")).toHaveFocus())
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(item(root, "node_modules")).toHaveFocus())
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(item(root, "node_modules")).toHaveAttribute("aria-expanded", "false"))
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(item(root, "src")).toHaveFocus())
    await userEvent.keyboard(" ")
    await waitFor(() => expect(item(root, "src")).toHaveAttribute("aria-expanded", "true"))
    await expect(item(root, "src")).toHaveFocus()
  }
}

export const Selecting: StoryObj = {
  render: demoApp(PlainDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Plain files")
    const user = userEvent.setup()
    await user.click(within(root).getByText("package.json"))
    await waitFor(() => expect(item(root, "package.json")).toHaveAttribute("aria-selected", "true"))
    await expect(css(label(root, "package.json")).backgroundColor).toBe("rgb(241, 243, 245)")
    await user.keyboard("{Shift>}")
    await user.click(within(root).getByText("src"))
    await user.keyboard("{/Shift}")
    await waitFor(() => expect(item(root, "src")).toHaveAttribute("aria-selected", "true"))
    await expect(item(root, "node_modules")).toHaveAttribute("aria-selected", "true")
    await expect(item(root, "package.json")).toHaveAttribute("aria-selected", "true")
    await expect(item(root, "tsconfig.json")).toHaveAttribute("aria-selected", "false")
    item(root, "src").focus()
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(item(root, "node_modules")).toHaveFocus())
  }
}

export const Checked: StoryObj = {
  render: demoApp(CheckedDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await expect(css(label(root, "src")).paddingLeft).toBe("0px")
    await expect(within(root).getByRole("checkbox", { name: "Check src" })).not.toBeChecked()
  }
}

export const Checking: StoryObj = {
  render: demoApp(CheckedDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await userEvent.click(within(root).getByRole("checkbox", { name: "Check node_modules" }))
    await waitFor(() => expect(within(root).getByRole("checkbox", { name: "Check node_modules" })).toBeChecked())
    await expect(item(root, "node_modules")).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(present(item(root, "node_modules").querySelector("[data-toggle]")))
    await waitFor(() => expect(item(root, "node_modules")).toHaveAttribute("aria-expanded", "false"))
    await userEvent.click(within(root).getByRole("checkbox", { name: "Check src" }))
    await waitFor(() => expect(within(root).getByRole("checkbox", { name: "Check src" })).toBeChecked())
    await userEvent.click(within(root).getByRole("checkbox", { name: "Check src" }))
    await waitFor(() => expect(within(root).getByRole("checkbox", { name: "Check src" })).not.toBeChecked())
  }
}

export const CheckStrictly: StoryObj = {
  render: demoApp(CheckStrictlyDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await expect(within(root).getByRole("checkbox", { name: "Check src" })).not.toBeChecked()
  }
}

export const CheckingStrictly: StoryObj = {
  render: demoApp(CheckStrictlyDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await userEvent.click(within(root).getByRole("checkbox", { name: "Check src" }))
    await waitFor(() => expect(within(root).getByRole("checkbox", { name: "Check src" })).toBeChecked())
    item(root, "src").focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(item(root, "src")).toHaveAttribute("aria-expanded", "true"))
    await expect(within(root).getByRole("checkbox", { name: "Check src/components" })).not.toBeChecked()
  }
}

export const ExpandedState: StoryObj = {
  render: demoApp(ExpandedStateDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await expect(item(root, "src")).toHaveAttribute("aria-expanded", "true")
    await expect(within(root).getByText("Accordion.tsx")).toBeVisible()
    await expect(item(root, "node_modules")).toHaveAttribute("aria-expanded", "false")
  }
}

export const Lines: StoryObj = {
  render: demoApp(LinesDemo),
  play: async ({ canvasElement }) => {
    const root = await within(canvasElement).findByRole("tree")
    await expect(root).not.toHaveAttribute("aria-label")
    await expect(within(root).getByText("Accordion.tsx")).toBeVisible()
    const deep = item(root, "node_modules/@mantine/core/index.d.ts")
    await expect(deep).toHaveAttribute("data-level", "4")
    await expect(css(label(root, "node_modules/@mantine/core/index.d.ts")).paddingLeft).toBe("60px")
    await expect(css(item(root, "node_modules/react"), "::after").bottom).toBe("0px")
    await expect(css(item(root, "node_modules/@mantine"), "::after").height).toBe("12px")
    await expect(css(item(root, "node_modules"), "::before").content).toBe("none")
  }
}

export const Controller: StoryObj = {
  render: demoApp(ControllerDemo),
  play: async ({ canvasElement }) => {
    await expect(await tree(canvasElement, "Files")).toBeVisible()
    await expect(within(canvasElement).getByRole("button", { name: "Expand all" })).toBeVisible()
  }
}

export const ExpandingAll: StoryObj = {
  render: demoApp(ControllerDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = await tree(canvasElement, "Files")
    await userEvent.click(canvas.getByRole("button", { name: "Expand all" }))
    await waitFor(() => expect(within(root).getByText("Accordion.tsx")).toBeVisible())
    await expect(item(root, "node_modules/@mantine/form")).toHaveAttribute("aria-expanded", "true")
    await userEvent.click(canvas.getByRole("button", { name: "Collapse all" }))
    await waitFor(() => expect(within(root).queryByText("Accordion.tsx")).toBeNull())
    await userEvent.click(within(root).getByText("src"))
    await waitFor(() => expect(canvas.getByText("Expanded 1 times")).toBeVisible())
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = await tree(canvasElement, "Many files")
    await expect(root).toHaveAttribute("aria-multiselectable", "true")
    await expect(item(root, "package.json")).toHaveAttribute("aria-selected", "true")
    await expect(within(item(root, "src")).getByText("components", { selector: "div" })).not.toBeVisible()
    await userEvent.click(within(root).getByText("tsconfig.json"))
    await waitFor(() => expect(canvas.getByText("Selected: package.json, tsconfig.json")).toBeVisible())
    const user = userEvent.setup()
    await user.keyboard("{Shift>}")
    await user.click(within(root).getByText("node_modules"))
    await user.keyboard("{/Shift}")
    await waitFor(() => expect(canvas.getByText("Selected: package.json, tsconfig.json, node_modules")).toBeVisible())
    await userEvent.click(within(root).getByText("src"))
    await waitFor(() => expect(within(root).getByText("components", { selector: "div" })).toBeVisible())
    await expect(css(label(root, "src/components")).paddingLeft).toBe("32px")
    item(root, "package.json").focus()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(canvas.getByText("Checked: package.json")).toBeVisible())
    await expect(item(root, "src")).toHaveAttribute("aria-expanded", "true")
    item(root, "src").focus()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(item(root, "src")).toHaveAttribute("aria-expanded", "true"))
    await userEvent.click(canvas.getByText(/^Checked:/))
    await waitFor(() => expect(canvas.getByText("Selected: nothing")).toBeVisible())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Many files")
    await expect(css(label(root, "package.json")).backgroundColor).toBe("rgb(59, 59, 59)")
  }
}

const dragEvent = (type: string, transfer: DataTransfer, clientY = 0) =>
  new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer, clientY })

const settle = async () => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(120))
}

const startDrag = async (source: HTMLElement) => {
  const transfer = new DataTransfer()
  source.dispatchEvent(dragEvent("dragstart", transfer))
  await settle()

  return transfer
}

const hover = async (target: HTMLElement, transfer: DataTransfer, fraction: number) => {
  const box = target.getBoundingClientRect()
  const event = dragEvent("dragover", transfer, box.top + box.height * fraction)
  target.dispatchEvent(event)
  await settle()

  return event
}

const finish = async (source: HTMLElement, target: HTMLElement, transfer: DataTransfer) => {
  target.dispatchEvent(dragEvent("drop", transfer))
  source.dispatchEvent(dragEvent("dragend", transfer))
  await settle()
}

const parentValue = (root: HTMLElement, value: string) =>
  item(root, value).parentElement?.closest("[role='treeitem']")?.getAttribute("data-value") ?? null

export const DragDrop: StoryObj = {
  render: demoApp(DragDropDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    await expect(label(root, "package.json")).toHaveAttribute("draggable", "true")
    await expect(within(canvasElement).getByText("Dropped 0 times")).toBeVisible()
  }
}

export const Dropping: StoryObj = {
  render: demoApp(DragDropDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    const source = label(root, "package.json")
    const transfer = await startDrag(source)
    await expect(transfer.getData("text/plain")).toBe("package.json")
    await expect(source).toHaveAttribute("data-dragging")
    await expect(css(source).opacity).toBe("0.4")
    const target = label(root, "src/components")
    const over = await hover(target, transfer, 0.75)
    await expect(over.defaultPrevented).toBe(true)
    await expect(target).toHaveAttribute("data-drag-over", "inside")
    await expect(css(target).backgroundColor).toBe("rgb(208, 235, 255)")
    await hover(target, transfer, 0.1)
    await expect(target).toHaveAttribute("data-drag-over", "before")
    await expect(css(target, "::before").height).toBe("2px")
    await hover(target, transfer, 0.75)
    await finish(source, target, transfer)
    await waitFor(() => expect(parentValue(root, "package.json")).toBe("src/components"))
    await expect(within(canvasElement).getByText("Dropped 1 times")).toBeVisible()
    await expect(label(root, "package.json")).not.toHaveAttribute("data-dragging")
  }
}

export const DroppingBeside: StoryObj = {
  render: demoApp(DragDropDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    const source = label(root, "tsconfig.json")
    const transfer = await startDrag(source)
    const target = label(root, "package.json")
    await hover(target, transfer, 0.2)
    await expect(target).toHaveAttribute("data-drag-over", "before")
    await hover(target, transfer, 0.8)
    await expect(target).toHaveAttribute("data-drag-over", "after")
    await expect(css(target, "::after").height).toBe("2px")
    await hover(target, transfer, 0.2)
    await finish(source, target, transfer)
    await waitFor(() =>
      expect([...root.children].map((node) => node.getAttribute("data-value"))).toEqual([
        "src",
        "tsconfig.json",
        "package.json"
      ])
    )
    const folder = label(root, "src")
    const again = await startDrag(folder)
    const child = await hover(label(root, "src/components/Tree.tsx"), again, 0.5)
    await expect(child.defaultPrevented).toBe(false)
    await expect(label(root, "src/components/Tree.tsx")).not.toHaveAttribute("data-drag-over")
    const beside = label(root, "package.json")
    await hover(beside, again, 0.2)
    await expect(beside).toHaveAttribute("data-drag-over", "before")
    beside.dispatchEvent(
      new DragEvent("dragleave", { bubbles: true, dataTransfer: again, relatedTarget: beside.lastElementChild })
    )
    await settle()
    await expect(beside).toHaveAttribute("data-drag-over", "before")
    beside.dispatchEvent(new DragEvent("dragleave", { bubbles: true, dataTransfer: again, relatedTarget: root }))
    await settle()
    await expect(beside).not.toHaveAttribute("data-drag-over")
    folder.dispatchEvent(dragEvent("dragend", again))
    await settle()
    await expect(folder).not.toHaveAttribute("data-dragging")
  }
}

export const DragDropAllow: StoryObj = {
  render: demoApp(DragDropAllowDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Project")
    await expect(label(root, "components")).toHaveAttribute("draggable", "false")
    await expect(label(root, "pages")).toHaveAttribute("draggable", "true")
  }
}

export const Refusing: StoryObj = {
  render: demoApp(DragDropAllowDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Project")
    const source = label(root, "package.json")
    const transfer = await startDrag(source)
    const locked = label(root, "components")
    await hover(locked, transfer, 0.7)
    await expect(locked).not.toHaveAttribute("data-drag-over")
    await hover(locked, transfer, 0.1)
    await expect(locked).toHaveAttribute("data-drag-over", "before")
    await hover(label(root, "components/Header.tsx"), transfer, 0.2)
    await expect(label(root, "components/Header.tsx")).not.toHaveAttribute("data-drag-over")
    await finish(source, label(root, "components/Header.tsx"), transfer)
    await expect(parentValue(root, "package.json")).toBeNull()
    const pages = await startDrag(label(root, "pages/about.tsx"))
    await hover(label(root, "pages"), pages, 0.1)
    await finish(label(root, "pages/about.tsx"), label(root, "pages"), pages)
    await waitFor(() => expect(parentValue(root, "pages/about.tsx")).toBeNull())
  }
}

export const DragDropHandle: StoryObj = {
  render: demoApp(DragDropHandleDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Notes")
    await expect(within(root).getByRole("button", { name: "Drag todo.md" })).toHaveAttribute("data-tree-drag-handle")
  }
}

export const DraggingByHandle: StoryObj = {
  render: demoApp(DragDropHandleDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Notes")
    const source = label(root, "todo.md")
    const refused = new DataTransfer()
    const blocked = dragEvent("dragstart", refused)
    source.dispatchEvent(blocked)
    await settle()
    await expect(blocked.defaultPrevented).toBe(true)
    await expect(source).not.toHaveAttribute("data-dragging")
    within(root)
      .getByRole("button", { name: "Drag todo.md" })
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    root.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    const transfer = await startDrag(source)
    await expect(source).toHaveAttribute("data-dragging")
    const target = label(root, "archive")
    await hover(target, transfer, 0.75)
    await finish(source, target, transfer)
    await waitFor(() => expect(parentValue(root, "todo.md")).toBe("archive"))
  }
}

export const Hovering: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const root = await tree(canvasElement, "Files")
    const src = label(root, "src")
    await userEvent.hover(src)
    await waitFor(() => expect(src).toHaveAttribute("data-hovered"))
    await expect(item(root, "src")).toHaveAttribute("data-hovered")
    await userEvent.hover(label(root, "package.json"))
    await waitFor(() => expect(src).not.toHaveAttribute("data-hovered"))
    await expect(label(root, "package.json")).toHaveAttribute("data-hovered")
    await userEvent.unhover(root)
    await waitFor(() => expect(label(root, "package.json")).not.toHaveAttribute("data-hovered"))
  }
}

export const AsyncLoading: StoryObj = {
  render: demoApp(AsyncLoadingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const documents = await canvas.findByRole("treeitem", { name: "Documents" })
    await expect(documents).toHaveAttribute("aria-expanded", "false")
    await expect(canvas.getByRole("treeitem", { name: "Photos" })).toHaveAttribute("aria-expanded", "false")
    await expect(canvas.getByRole("treeitem", { name: "README.md" })).not.toHaveAttribute("aria-expanded")
  }
}

export const LoadingChildren: StoryObj = {
  render: demoApp(AsyncLoadingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const documents = await canvas.findByRole("treeitem", { name: "Documents" })
    await user.click(within(documents).getByText("Documents"))
    await waitFor(() => expect(documents).toHaveAttribute("aria-expanded", "true"))
    const loading = present(await waitFor(() => present(documents.querySelector("[data-loading]"))))
    await expect(present(loading.firstElementChild?.firstElementChild).getBoundingClientRect().width).toBe(16)
    const file = await canvas.findByRole("treeitem", { name: "documents/file-1.txt" }, { timeout: 3000 })
    await expect(documents.querySelector("[data-loading]")).toBeNull()
    await expect(file).toHaveAttribute("data-level", "2")
    const subfolder = canvas.getByRole("treeitem", { name: "documents/subfolder" })
    await expect(subfolder).toHaveAttribute("aria-expanded", "false")
    await user.click(within(documents).getByText("Documents"))
    await user.click(within(documents).getByText("Documents"))
    await expect(documents.querySelector("[data-loading]")).toBeNull()
    await expect(canvas.getAllByRole("treeitem", { name: /^documents\/file/ })).toHaveLength(2)
    await user.click(within(subfolder).getByText("documents/subfolder"))
    await expect(
      await canvas.findByRole("treeitem", { name: "documents/subfolder/file-2.txt" }, { timeout: 3000 })
    ).toHaveAttribute("data-level", "3")
  }
}

const visibleNames = (canvasElement: HTMLElement) =>
  within(canvasElement)
    .queryAllByRole("treeitem")
    .filter((row) => row.checkVisibility())
    .map((row) => row.getAttribute("data-value"))

const showsSearch = async (canvasElement: HTMLElement, placeholder: string) => {
  const canvas = within(canvasElement)
  await expect(await canvas.findByRole("textbox", { name: "Search files" })).toHaveAttribute("placeholder", placeholder)
  await expect(visibleNames(canvasElement)).toEqual(["src", "public", "package.json", "tsconfig.json"])
}

export const SearchFilter: StoryObj = {
  render: demoApp(SearchFilterDemo),
  play: async ({ canvasElement }) => showsSearch(canvasElement, "Search...")
}

export const FilteringBySearch: StoryObj = {
  render: demoApp(SearchFilterDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const search = await canvas.findByRole("textbox", { name: "Search files" })
    await user.type(search, "TREE")
    await waitFor(() =>
      expect(visibleNames(canvasElement)).toEqual(["src", "src/components", "src/components/Tree.tsx"])
    )
    await expect(canvas.getByRole("treeitem", { name: /^src/ })).toHaveAttribute("aria-expanded", "true")
    await user.clear(search)
    await user.type(search, "hooks")
    await waitFor(() =>
      expect(visibleNames(canvasElement)).toEqual([
        "src",
        "src/hooks",
        "src/hooks/use-debounce.ts",
        "src/hooks/use-media-query.ts"
      ])
    )
    await user.clear(search)
    await waitFor(() => expect(visibleNames(canvasElement)).toEqual(["src", "public", "package.json", "tsconfig.json"]))
  }
}

export const SearchFuzzy: StoryObj = {
  render: demoApp(SearchFuzzyDemo),
  play: async ({ canvasElement }) => showsSearch(canvasElement, "Fuzzy search...")
}

export const FilteringFuzzily: StoryObj = {
  render: demoApp(SearchFuzzyDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await user.type(await within(canvasElement).findByRole("textbox", { name: "Search files" }), "acrd")
    await waitFor(() =>
      expect(visibleNames(canvasElement)).toEqual(["src", "src/components", "src/components/Accordion.tsx"])
    )
  }
}

export const SearchHighlight: StoryObj = {
  render: demoApp(SearchHighlightDemo),
  play: async ({ canvasElement }) => showsSearch(canvasElement, "Search...")
}

export const HighlightingSearch: StoryObj = {
  render: demoApp(SearchHighlightDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.type(await canvas.findByRole("textbox", { name: "Search files" }), "use")
    await waitFor(() =>
      expect(visibleNames(canvasElement)).toEqual([
        "src",
        "src/components",
        "src/hooks",
        "src/hooks/use-debounce.ts",
        "src/hooks/use-media-query.ts",
        "public",
        "package.json",
        "tsconfig.json"
      ])
    )
    const marks = Array.from(canvasElement.querySelectorAll("mark")).map((mark) => mark.textContent)
    await expect(marks).toEqual(["use", "use"])
  }
}

export const Virtualized: StoryObj = {
  render: demoApp(VirtualizedDemo),
  play: async ({ canvasElement }) => {
    const largeTree = await within(canvasElement).findByRole("tree", { name: "Large tree" })
    await waitFor(() => expect(within(largeTree).getByText("File 1.1.1")).toBeVisible())
    const rows = within(largeTree).getAllByRole("treeitem")
    await expect(rows.length).toBeLessThan(60)
    await expect(rows[0]).toHaveAttribute("tabindex", "0")
    await expect(rows[0]).toHaveAttribute("aria-expanded", "true")
    await expect(largeTree).toHaveAttribute("data-with-lines")
    const file = present(within(largeTree).getByText("File 1.1.1").closest("[role=treeitem]"))
    await expect(file).toHaveAttribute("data-level", "3")
    await expect(file).toHaveAttribute("data-parent", "group-1-folder-1")
    const markers = Array.from(file.querySelectorAll(":scope > span"))
    await expect(markers).toHaveLength(2)
    await expect(getComputedStyle(present(markers[0])).borderLeftWidth).toBe("1px")
  }
}

export const ScrollingVirtualized: StoryObj = {
  render: demoApp(VirtualizedDemo),
  play: async ({ canvasElement }) => {
    const largeTree = await within(canvasElement).findByRole("tree", { name: "Large tree" })
    await waitFor(() => expect(within(largeTree).getByText("Group 1")).toBeVisible())
    const scroller = present(largeTree.querySelector<HTMLElement>("[role=list]"))
    scroller.scrollTo({ top: scroller.scrollHeight })
    await waitFor(() => expect(within(largeTree).getByText("Group 30")).toBeVisible())
    await expect(within(largeTree).queryByText("Group 1")).toBeNull()
    await waitFor(() => expect(within(largeTree).getByText("File 30.10.5")).toBeVisible())
    const file = present(within(largeTree).getByText("File 30.10.5").closest("[role=treeitem]"))
    await expect(file.querySelectorAll(":scope > span")).toHaveLength(1)
  }
}

export const ExpandingVirtualized: StoryObj = {
  render: demoApp(VirtualizedDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const largeTree = await within(canvasElement).findByRole("tree", { name: "Large tree" })
    await user.click(await within(largeTree).findByText("Folder 1.2"))
    await waitFor(() => expect(within(largeTree).getByText("File 1.2.1")).toBeVisible())
    const group = present(within(largeTree).getByText("Group 1").closest<HTMLElement>("[role=treeitem]"))
    group.focus()
    await user.keyboard("{ArrowDown}")
    await waitFor(() =>
      expect(present(within(largeTree).getByText("Folder 1.1").closest("[role=treeitem]"))).toHaveFocus()
    )
  }
}

export const Flat: StoryObj = {
  render: demoApp(FlatDemo),
  play: async ({ canvasElement }) => {
    const flat = await within(canvasElement).findByRole("tree", { name: "Flat tree" })
    const rows = within(flat).getAllByRole("treeitem")
    await expect(rows[0]).toHaveAttribute("tabindex", "0")
    await expect(rows[0]?.querySelectorAll(":scope > span")).toHaveLength(0)
    await expect(flat).not.toHaveAttribute("data-with-lines")
  }
}
