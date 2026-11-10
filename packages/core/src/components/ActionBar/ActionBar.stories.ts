import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp, story } from "../../stories/harness.ts"
import * as ActionBar from "./ActionBar.ts"
import * as CloseOnEscapeDemo from "./demos/close-on-escape.ts"
import * as PlacementDemo from "./demos/placement.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as WithActionsDemo from "./demos/with-actions.ts"

const meta: Meta = { title: "Overlays/ActionBar" }

export default meta

const page = within(document.body)

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const bar = () => page.queryByRole("group", { name: "Actions" })

const settled = async () =>
  waitFor(() => expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(css(bar()?.parentElement).transform))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("checkbox", { name: "Select all" })).not.toBeChecked()
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(6)
    await expect(bar()).toBeNull()
  }
}

export const Selecting: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("checkbox", { name: "6. Carbon" }))
    await waitFor(() => expect(bar()).not.toBeNull())
    await settled()
    const opened = present(bar())
    await expect(opened).toHaveTextContent("1 selected")
    await expect(Math.round(window.innerHeight - box(opened).bottom)).toBe(30)
    await expect(Math.abs(box(opened).left + box(opened).width / 2 - window.innerWidth / 2)).toBeLessThan(1)
    await expect(css(opened).paddingTop).toBe("10px")
    await expect(css(opened).paddingLeft).toBe("12px")
    await expect(css(opened).columnGap).toBe("12px")
    await expect(css(opened).borderTopWidth).toBe("1px")
    await expect(css(opened).boxShadow).not.toBe("none")
    const divider = within(opened).getByRole("separator")
    await expect(box(divider).width).toBe(1)
    await expect(css(divider).backgroundColor).toBe("rgb(206, 212, 218)")
    await expect(canvas.getByRole("checkbox", { name: "Select all" })).toHaveAttribute("data-indeterminate")
    await user.click(canvas.getByRole("checkbox", { name: "Select all" }))
    await waitFor(() => expect(opened).toHaveTextContent("5 selected"))
    await user.keyboard("{Escape}")
    await expect(bar()).not.toBeNull()
    await user.click(within(opened).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(bar()).toBeNull())
    await expect(canvas.getByRole("checkbox", { name: "6. Carbon" })).not.toBeChecked()
  }
}

export const SelectingWithActions: StoryObj = {
  render: demoApp(WithActionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("checkbox", { name: "39. Yttrium" }))
    await user.click(canvas.getByRole("checkbox", { name: "56. Barium" }))
    await waitFor(() => expect(bar()).not.toBeNull())
    await settled()
    const opened = present(bar())
    await expect(opened).toHaveTextContent("2 rows selected")
    await expect(within(opened).getAllByRole("separator")).toHaveLength(2)
    await expect(box(within(opened).getByRole("button", { name: "Move to folder" })).width).toBe(34)
    await user.click(canvas.getByRole("checkbox", { name: "39. Yttrium" }))
    await user.click(canvas.getByRole("checkbox", { name: "56. Barium" }))
    await waitFor(() => expect(bar()).toBeNull())
  }
}

export const SelectingPlaced: StoryObj = {
  render: demoApp(PlacementDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("checkbox", { name: "Select all" }))
    await waitFor(() => expect(bar()).not.toBeNull())
    await settled()
    const opened = present(bar())
    await expect(Math.round(window.innerHeight - box(opened).bottom)).toBe(20)
    await expect(Math.round(document.documentElement.clientWidth - box(opened).right)).toBe(20)
  }
}

export const ClosingOnEscape: StoryObj = {
  render: demoApp(CloseOnEscapeDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("checkbox", { name: "7. Nitrogen" }))
    await waitFor(() => expect(bar()).not.toBeNull())
    await user.keyboard("a")
    await expect(bar()).not.toBeNull()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(bar()).toBeNull())
    await expect(canvas.getByRole("checkbox", { name: "7. Nitrogen" })).not.toBeChecked()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("checkbox", { name: "58. Cerium" }))
    await waitFor(() => expect(bar()).not.toBeNull())
    const opened = present(bar())
    await expect(css(opened).backgroundColor).toBe("rgb(36, 36, 36)")
    await expect(css(within(opened).getByRole("separator")).backgroundColor).toBe("rgb(66, 66, 66)")
  }
}

const showsList = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(await canvas.findByRole("checkbox", { name: "Select all" })).toBeVisible()
  await expect(canvas.getAllByRole("checkbox")).toHaveLength(6)
  await expect(bar()).toBeNull()
}

export const WithActions: StoryObj = {
  render: demoApp(WithActionsDemo),
  play: async ({ canvasElement }) => showsList(canvasElement)
}

export const Placement: StoryObj = {
  render: demoApp(PlacementDemo),
  play: async ({ canvasElement }) => showsList(canvasElement)
}

export const CloseOnEscape: StoryObj = {
  render: demoApp(CloseOnEscapeDemo),
  play: async ({ canvasElement }) => showsList(canvasElement)
}

export const KeptMounted: StoryObj = {
  render: story(({ h, ui, log }) =>
    ui.ActionBar(h, {
      model: ActionBar.init({ id: "kept" }),
      toParentMessage: (message) => log(message._tag),
      keepMounted: true,
      children: [
        ui.Text(h, { children: ["Kept in the page"] }),
        ui.ActionBarDivider(h, { attributes: { root: { role: "presentation" } } }),
        ui.ActionBarCloseButton(h, { onClose: log("close"), unstyled: true })
      ]
    })
  ),
  play: async () => {
    const kept = await page.findByText("Kept in the page")
    await expect(kept).not.toBeVisible()
    await expect(page.queryByRole("separator")).toBeNull()
  }
}

export const ClosingFromParent: StoryObj = {
  render: story(({ h, ui, log }) =>
    ui.ActionBar(h, {
      model: ActionBar.init({ id: "opened", opened: true }),
      toParentMessage: (message) => log(message._tag),
      ariaLabel: "Bulk actions",
      attributes: { root: { role: "toolbar" } },
      children: [ui.ActionBarCloseButton(h, { onClose: log("close requested") })]
    })
  ),
  play: async ({ canvasElement }) => {
    const opened = await page.findByRole("toolbar", { name: "Bulk actions" })
    await userEvent.setup().click(within(opened).getByRole("button", { name: "Close" }))
    await expect(await within(canvasElement).findByText(/close requested/)).toBeVisible()
    await expect(page.getByRole("toolbar", { name: "Bulk actions" })).toBeVisible()
  }
}
