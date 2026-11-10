import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import { present } from "@sth-ui/core/stories/dom.ts"
import { ui } from "@sth-ui/core/Ui.ts"
import { Option } from "effect"
import * as Scene from "foldkit/scene"
import type { Message } from "./model.ts"
import { measured, scrolled } from "./testing.ts"
import * as EmptyDemo from "./demos/empty.ts"
import * as PlainDemo from "./demos/plain.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Data table/DataTable" }

export default meta

const bodyRows = (canvasElement: HTMLElement) => [...canvasElement.querySelectorAll("tbody tr[data-row-id]")]

const closeMenu = async (canvas: ReturnType<typeof within>, name: string) => {
  await userEvent.keyboard("{Escape}")
  await waitFor(() => expect(canvas.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false"))
}

const firstTitles = (canvasElement: HTMLElement, count: number) =>
  bodyRows(canvasElement)
    .slice(0, count)
    .map((row) => row.querySelectorAll("td")[1]?.textContent ?? "")

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const table = await canvas.findByRole("table", { name: "Games" })
    await expect(within(table).getByRole("columnheader", { name: /Title/ })).toBeVisible()
    await expect(within(table).queryByRole("columnheader", { name: /Added/ })).toBeNull()
    await expect(canvas.getByText("Tetris 1")).toBeVisible()
    await expect(table).toHaveAttribute("aria-rowcount", "2001")
    await expect(bodyRows(canvasElement).length).toBeLessThan(60)
  }
}

export const Sorting: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sort = await canvas.findByRole("button", { name: "Title" })
    await userEvent.click(sort)
    await waitFor(() => expect(firstTitles(canvasElement, 2)).toEqual(["Castlevania 1", "Castlevania 2"]))
    await expect(canvas.getByRole("columnheader", { name: /Title/ })).toHaveAttribute("aria-sort", "ascending")
    await userEvent.click(sort)
    await waitFor(() => expect(firstTitles(canvasElement, 1)).toEqual(["Zelda 200"]))
    await userEvent.click(sort)
    await waitFor(() => expect(firstTitles(canvasElement, 1)).toEqual(["Tetris 1"]))
    await expect(canvas.getByText("Sort none, hidden added")).toBeVisible()
  }
}

export const Searching: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByRole("searchbox", { name: "Search titles" }), "pokemon 12")
    await waitFor(() => expect(firstTitles(canvasElement, 2)).toEqual(["Pokémon 12", "Pokémon 112"]))
    await expect(
      firstTitles(canvasElement, 30).every((title) => title.startsWith("Pokémon") && title.includes("12"))
    ).toBe(true)
    await userEvent.clear(canvas.getByRole("searchbox", { name: "Search titles" }))
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search titles" }), "nothing like this")
    await waitFor(() => expect(canvas.getByText("No rows to show")).toBeVisible())
  }
}

export const Filtering: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await canvas.findByRole("button", { name: "Filter System" }))
    await userEvent.click(await body.findByRole("checkbox", { name: "Super NES" }))
    await waitFor(() => expect(canvas.getByRole("table")).toHaveAttribute("aria-rowcount", "501"))
    await userEvent.click(body.getByRole("checkbox", { name: "NES" }))
    await waitFor(() => expect(canvas.getByRole("table")).toHaveAttribute("aria-rowcount", "1001"))
    await closeMenu(canvas, "Filter System")
    await userEvent.click(canvas.getByRole("button", { name: "Filter Rating" }))
    const from = await body.findByRole("spinbutton", { name: "From" })
    await userEvent.click(from)
    await waitFor(() => expect(from).toHaveFocus())
    await userEvent.keyboard("4")
    await waitFor(() => expect(Number(canvas.getByRole("table").getAttribute("aria-rowcount"))).toBeLessThan(1001))
    await userEvent.click(body.getByRole("button", { name: "Clear Rating filter" }))
    await waitFor(() => expect(canvas.getByRole("table")).toHaveAttribute("aria-rowcount", "1001"))
    await closeMenu(canvas, "Filter Rating")
    await userEvent.click(canvas.getByRole("button", { name: "Filter Verified" }))
    await userEvent.click(await body.findByRole("button", { name: "No" }))
    await waitFor(() => expect(Number(canvas.getByRole("table").getAttribute("aria-rowcount"))).toBeLessThan(1001))
    await closeMenu(canvas, "Filter Verified")
    await userEvent.click(canvas.getByRole("button", { name: "Filter Title" }))
    const title = await body.findByRole("textbox", { name: "Title contains" })
    await userEvent.click(title)
    await waitFor(() => expect(title).toHaveFocus())
    await userEvent.keyboard("zelda 1")
    await waitFor(() => expect(firstTitles(canvasElement, 1)[0]).toMatch(/^Zelda 1/))
  }
}

export const Selecting: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("checkbox", { name: "Select Tetris 1" }))
    await waitFor(() => expect(canvas.getByText("1 selected")).toBeVisible())
    await userEvent.keyboard("{Shift>}")
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select Mario 1" }))
    await userEvent.keyboard("{/Shift}")
    await waitFor(() => expect(canvas.getByText("5 selected")).toBeVisible())
    await expect(canvas.queryByText("Opened game-1")).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Archive" }))
    await waitFor(() => expect(canvas.getByText("Archived 5 of 2000")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Select all 2,000" }))
    await waitFor(() => expect(canvas.getByText("2,000 selected")).toBeVisible())
    await expect(canvas.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-checked", "true")
    await userEvent.click(canvas.getByRole("button", { name: "Clear selection" }))
    await waitFor(() => expect(canvas.queryByRole("toolbar", { name: "Selected rows" })).toBeNull())
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select all rows" }))
    await waitFor(() => expect(canvas.getByText("2,000 selected")).toBeVisible())
  }
}

export const OpeningRows: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByText("Zelda 1"))
    await waitFor(() => expect(canvas.getByText("Opened game-2")).toBeVisible())
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = await canvas.findByRole("group", { name: "Games" })
    rows.focus()
    await waitFor(() => expect(rows).toHaveAttribute("aria-activedescendant", "games-row-game-1"))
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await waitFor(() => expect(rows).toHaveAttribute("aria-activedescendant", "games-row-game-3"))
    await userEvent.keyboard(" ")
    await waitFor(() => expect(canvas.getByText("1 selected")).toBeVisible())
    await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}")
    await waitFor(() => expect(canvas.getByText("3 selected")).toBeVisible())
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(canvas.getByText("Opened game-5")).toBeVisible())
    await userEvent.keyboard("{End}")
    await waitFor(() => expect(rows).toHaveAttribute("aria-activedescendant", "games-row-game-2000"))
    await waitFor(() => expect(canvasElement.querySelector("#games-row-game-2000")).not.toBeNull())
    await expect(rows.scrollTop).toBeGreaterThan(0)
    await userEvent.keyboard("{Home}")
    await waitFor(() => expect(rows.scrollTop).toBe(0))
    rows.blur()
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = await canvas.findByRole("group", { name: "Games" })
    await canvas.findByText("Tetris 1")
    rows.scrollTo({ top: 36 * 1000 })
    await waitFor(() => expect(canvasElement.querySelector("#games-row-game-1001")).not.toBeNull())
    await expect(canvas.queryByText("Tetris 1")).toBeNull()
    await expect(bodyRows(canvasElement).length).toBeLessThan(60)
  }
}

export const ChoosingColumns: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await canvas.findByRole("button", { name: "Choose columns" }))
    await expect(body.queryByRole("checkbox", { name: "Title" })).toBeNull()
    await userEvent.click(await body.findByRole("checkbox", { name: "Added" }))
    await waitFor(() => expect(canvas.getByRole("columnheader", { name: /Added/ })).toBeVisible())
    await userEvent.click(body.getByRole("checkbox", { name: "Rating" }))
    await waitFor(() => expect(canvas.queryByRole("columnheader", { name: /Rating/ })).toBeNull())
    await expect(canvas.getByText("Sort none, hidden rating")).toBeVisible()
  }
}

const rowCount = (canvas: ReturnType<typeof within>) => Number(canvas.getByRole("table").getAttribute("aria-rowcount"))

const typeInto = async (field: HTMLElement, text: string) => {
  await userEvent.click(field)
  await waitFor(() => expect(field).toHaveFocus())
  await userEvent.keyboard(text)
}

export const FilteringRanges: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await canvas.findByRole("button", { name: "Filter Region" }))
    const japan = await body.findByRole("checkbox", { name: "Japan" })
    await userEvent.click(japan)
    await waitFor(() => expect(rowCount(canvas)).toBe(801))
    await userEvent.click(japan)
    await waitFor(() => expect(rowCount(canvas)).toBe(2001))
    await closeMenu(canvas, "Filter Region")
    await userEvent.click(canvas.getByRole("button", { name: "Filter Size" }))
    const sizeTo = await body.findByRole("spinbutton", { name: "To" })
    await typeInto(sizeTo, "1")
    await waitFor(() => expect(rowCount(canvas)).toBe(1))
    await userEvent.clear(sizeTo)
    await waitFor(() => expect(rowCount(canvas)).toBe(2001))
    await userEvent.click(body.getByRole("button", { name: "Clear Size filter" }))
    await closeMenu(canvas, "Filter Size")
    await userEvent.click(canvas.getByRole("button", { name: "Filter Verified" }))
    await userEvent.click(await body.findByRole("button", { name: "Yes" }))
    await waitFor(() => expect(rowCount(canvas)).toBe(1334))
    await closeMenu(canvas, "Filter Verified")
    await userEvent.click(canvas.getByRole("button", { name: "Choose columns" }))
    await userEvent.click(await body.findByRole("checkbox", { name: "Added" }))
    await closeMenu(canvas, "Choose columns")
    await userEvent.click(await canvas.findByRole("button", { name: "Filter Added" }))
    const from = await body.findByLabelText("From")
    await userEvent.click(from)
    await userEvent.keyboard("2024-01-01")
    await waitFor(() => expect(rowCount(canvas)).toBeLessThan(1334))
    const narrowed = rowCount(canvas)
    const to = body.getByLabelText("To")
    await userEvent.click(to)
    await userEvent.keyboard("2024-06-30")
    await waitFor(() => expect(rowCount(canvas)).toBeLessThan(narrowed))
    await userEvent.clear(to)
    await waitFor(() => expect(rowCount(canvas)).toBe(narrowed))
  }
}

export const Plain: StoryObj = {
  render: demoApp(PlainDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = await canvas.findByRole("group", { name: "Plain games" })
    await expect(canvas.queryByRole("searchbox")).toBeNull()
    await expect(canvas.queryByRole("checkbox")).toBeNull()
    await expect(canvas.queryByRole("button", { name: "Choose columns" })).toBeNull()
    const [first, second] = bodyRows(canvasElement)
    await expect(getComputedStyle(present(second)).backgroundColor).not.toBe(
      getComputedStyle(present(first)).backgroundColor
    )
    await expect(getComputedStyle(present(first?.querySelectorAll("td")[1])).textAlign).toBe("center")
    await expect(getComputedStyle(present(first?.querySelectorAll("td")[0])).paddingLeft).toBe("10px")
    await expect(rows).toHaveStyle({ height: "240px" })
  }
}

export const PlainKeyboard: StoryObj = {
  render: demoApp(PlainDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = await canvas.findByRole("group", { name: "Plain games" })
    rows.focus()
    await userEvent.keyboard("a")
    await waitFor(() => expect(rows).toHaveAttribute("aria-activedescendant", "plain-row-game-1"))
    await userEvent.keyboard("{PageDown}")
    await waitFor(() => expect(rows).toHaveAttribute("aria-activedescendant", "plain-row-game-7"))
    await userEvent.keyboard("{PageUp}")
    await waitFor(() => expect(rows).toHaveAttribute("aria-activedescendant", "plain-row-game-1"))
    await userEvent.keyboard("{ArrowUp}")
    await expect(rows).toHaveAttribute("aria-activedescendant", "plain-row-game-1")
    rows.blur()
  }
}

export const Empty: StoryObj = {
  render: demoApp(EmptyDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("No games imported yet")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Import games" })).toBeVisible()
    await expect(canvas.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-disabled", "true")
  }
}

export const Importing: StoryObj = {
  render: demoApp(EmptyDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Import games" }))
    await userEvent.click(await canvas.findByRole("checkbox", { name: "Select game-2" }))
    await waitFor(() => expect(canvas.getByText("1 selected")).toBeVisible())
    await expect(canvas.getByRole("group", { name: "Imported games" }).getBoundingClientRect().height).toBe(480)
  }
}

const liftTable = (message: Message) => UsageDemo.Message.GotTable({ message })

const sees = (text: string) =>
  Scene.tap(({ html }) => {
    Option.getOrThrowWith(Scene.getByText(text)(html), () => new Error(`The scene does not show ${text}`))
  })

export const SceneHelpers: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Tetris 1")
    const config = {
      update: UsageDemo.update,
      view: (model: UsageDemo.Model, h: Parameters<typeof UsageDemo.view>[1]) => UsageDemo.view(model, h, ui)
    }
    Scene.scene(
      config,
      Scene.given(UsageDemo.init()),
      measured(liftTable),
      sees("Tetris 1"),
      Scene.click(Scene.role("button", { name: "Title" })),
      scrolled(liftTable, "games"),
      sees("Sort title asc, hidden added")
    )
    Scene.scene(
      config,
      Scene.given(UsageDemo.init()),
      measured(liftTable, { viewportHeight: 300, coarse: true }),
      Scene.click(Scene.role("button", { name: "Rating" })),
      scrolled(liftTable, "games", 0),
      sees("Sort rating asc, hidden added")
    )
  }
}
