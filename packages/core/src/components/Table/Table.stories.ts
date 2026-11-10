import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as BordersDemo from "./demos/borders.ts"
import * as CaptionsDemo from "./demos/captions.ts"
import * as DataDemo from "./demos/data.ts"
import * as SelectionDemo from "./demos/selection.ts"
import * as StatesDemo from "./demos/states.ts"
import * as StickyDemo from "./demos/sticky.ts"
import * as TabularDemo from "./demos/tabular.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalDemo from "./demos/vertical.ts"

const meta: Meta = { title: "Typography/Table" }

export default meta

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const bodyRows = (table: HTMLElement) => Array.from(table.querySelectorAll("tbody > tr"))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    await expect(within(table).getAllByRole("columnheader")).toHaveLength(4)
    await expect(bodyRows(table)).toHaveLength(5)
    await expect(css(table).fontSize).toBe("14px")
    await expect(css(table).borderCollapse).toBe("collapse")
    const header = within(table).getByRole("columnheader", { name: "Element name" })
    await expect(css(header).textAlign).toBe("start")
    await expect(css(header).paddingTop).toBe("7px")
    await expect(css(header).paddingLeft).toBe("10px")
    const rows = bodyRows(table)
    await expect(css(rows[0]).borderBottomWidth).toBe("1px")
    await expect(css(rows[0]).borderBottomColor).toBe("rgb(222, 226, 230)")
    await expect(css(rows[4]).borderBottomWidth).toBe("0px")
    await expect(rows[0]).toHaveAttribute("data-with-row-border")
    await expect(table).toHaveAttribute("data-variant", "default")
  }
}

export const Data: StoryObj = {
  render: demo(DataDemo.view),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    const caption = within(table).getByText("Some elements from periodic table")
    await expect(caption).toHaveAttribute("data-side", "bottom")
    await expect(css(caption).color).toBe("rgb(134, 142, 150)")
    await expect(css(caption).marginTop).toBe("10px")
    await expect(table.querySelectorAll("tfoot th")).toHaveLength(4)
    await expect(within(table).getByRole("cell", { name: "Carbon" })).toBeVisible()
  }
}

export const Borders: StoryObj = {
  render: demo(BordersDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const striped = await canvas.findByRole("table", { name: "Striped" })
    await expect(css(striped).borderTopWidth).toBe("1px")
    await expect(striped).toHaveAttribute("data-with-table-border")
    const rows = bodyRows(striped)
    await expect(css(rows[0]).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(rows[1]).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(rows[0]).toHaveAttribute("data-striped", "odd")
    await expect(rows[0]).toHaveAttribute("data-hover")
    const cells = Array.from(present(rows[0]).children)
    await expect(css(cells[0]).borderLeftWidth).toBe("0px")
    await expect(css(cells[0]).borderRightWidth).toBe("1px")
    await expect(css(cells[3]).borderRightWidth).toBe("0px")
    await expect(cells[0]).toHaveAttribute("data-with-column-border")
    const even = canvas.getByRole("table", { name: "Even" })
    const evenRows = bodyRows(even)
    await expect(css(evenRows[1]).backgroundColor).toBe("rgb(231, 245, 255)")
    await expect(css(evenRows[0]).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(evenRows[0]).borderBottomWidth).toBe("0px")
    await expect(css(even).tableLayout).toBe("fixed")
    await expect(css(evenRows[0]?.firstElementChild).paddingLeft).toBe("32px")
    await expect(css(evenRows[0]?.firstElementChild).paddingTop).toBe("16px")
    await expect(evenRows[0]?.lastElementChild).toHaveAttribute("colspan", "2")
    const caption = within(even).getByText("Even rows striped")
    await expect(caption).toHaveAttribute("data-side", "top")
    await expect(css(caption).marginBottom).toBe("10px")
    await expect(css(even).captionSide).toBe("top")
  }
}

export const Captions: StoryObj = {
  render: demo(CaptionsDemo.view),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    await expect(table.querySelectorAll("tfoot th")).toHaveLength(4)
    await expect(css(table.querySelector("tfoot tr")).borderBottomWidth).toBe("1px")
  }
}

export const Vertical: StoryObj = {
  render: demo(VerticalDemo.view),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    await expect(table).toHaveAttribute("data-variant", "vertical")
    const epic = within(table).getByText("Epic name")
    await expect(css(epic).fontWeight).toBe("600")
    await expect(css(epic).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(epic.getBoundingClientRect().width).toBe(160)
  }
}

export const TabularNumbers: StoryObj = {
  render: demo(TabularDemo.view),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    await expect(table).toHaveAttribute("data-tabular-nums")
    await expect(css(table).fontVariantNumeric).toBe("tabular-nums")
    await expect(within(table).getByText("2,214,411,234")).toBeVisible()
  }
}

export const StickyHeader: StoryObj = {
  render: demo(StickyDemo.view),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    const head = present(table.querySelector("thead"))
    await expect(head).toHaveAttribute("data-sticky")
    await expect(css(head).position).toBe("sticky")
    const [first, second] = within(table).getAllByRole("columnheader")
    await expect(css(first).position).toBe("sticky")
    await expect(css(first).top).toBe("0px")
    await expect(css(first).boxShadow).toContain("inset")
    await expect(css(first).borderRightWidth).toBe("0px")
    await expect(css(second, "::before").content).toBe('""')
    await expect(css(first, "::before").content).toBe("none")
    const inner = present(table.parentElement)
    await expect(css(inner).maxHeight).toBe("300px")
    await expect(css(inner).minWidth).toBe("500px")
    await expect(css(inner.parentElement).overflowX).toBe("auto")
  }
}

export const Selection: StoryObj = {
  render: demoApp(SelectionDemo),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole("table")
    await expect(within(table).getAllByRole("checkbox")).toHaveLength(5)
    await expect(css(table.parentElement).minWidth).toBe("500px")
  }
}

export const SelectingRows: StoryObj = {
  render: demoApp(SelectionDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole("checkbox", { name: "Select Carbon" })
    await userEvent.setup().click(checkbox)
    await waitFor(() => expect(checkbox).toBeChecked())
    const row = present(checkbox.closest("tr"))
    await waitFor(() => expect(css(row).backgroundColor).not.toBe("rgba(0, 0, 0, 0)"))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(BordersDemo.view),
  play: async ({ canvasElement }) => {
    const striped = await within(canvasElement).findByRole("table", { name: "Striped" })
    await expect(css(striped).borderTopColor).toBe("rgb(66, 66, 66)")
    await expect(css(bodyRows(striped)[0]).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const spans = await canvas.findByRole("table", { name: "Spans" })
    const header = within(spans).getAllByRole("rowheader")[0]
    await expect(header).toHaveAttribute("rowspan", "2")
    await expect(header).toHaveAttribute("scope", "row")
    await expect(bodyRows(spans)[0]).toHaveAttribute("data-position", "1")
    await expect(css(bodyRows(spans)[0]).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(spans.parentElement).maxHeight).toBe("160px")
    await expect(css(spans.parentElement).minWidth).toBe("400px")
    const bodyOnly = canvas.getByRole("table", { name: "Body only" })
    await expect(bodyOnly.querySelector("thead")).toBeNull()
    await expect(bodyRows(bodyOnly)[0]).not.toHaveAttribute("data-striped")
    await expect(canvas.getByRole("table", { name: "Empty" }).children).toHaveLength(0)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
