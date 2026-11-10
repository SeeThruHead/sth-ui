import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Code highlight/JsonViewer" }

export default meta

const tree = async (canvasElement: HTMLElement, name: string) =>
  within(await within(canvasElement).findByRole("tree", { name }))

const trees = async (canvasElement: HTMLElement) => {
  const all = await within(canvasElement).findAllByRole("tree", { name: "JSON" })

  return all.map((element) => within(element))
}

const rowWith = (scope: ReturnType<typeof within>, text: RegExp) =>
  present(scope.getAllByRole("treeitem").find((row: HTMLElement) => text.test(row.textContent ?? "")))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const plain = await tree(canvasElement, "package")
    await expect(rowWith(plain, /^package: \{/)).toHaveAttribute("data-root")
    await expect(rowWith(plain, /^keywords: \[\.\.\.\]/)).toHaveAttribute("aria-expanded", "false")
    await expect(plain.getByText('"Mantine"')).toHaveAttribute("data-value-type", "string")
    await expect(rowWith(plain, /^empty: \{\}/)).not.toHaveAttribute("aria-expanded")
    const [rich, grouped, all] = await trees(canvasElement)
    const richTree = present(rich)
    await expect(richTree.getByText("float")).toBeVisible()
    await expect(richTree.getByText("int")).toBeVisible()
    await expect(richTree.getByText("bool")).toBeVisible()
    await expect(richTree.getAllByText("3 items")[0]).toBeVisible()
    await expect(rowWith(richTree, /^"name": /)).toBeVisible()
    await expect(present(canvasElement.querySelector("[data-highlight='added']"))).toBeVisible()
    await waitFor(() =>
      expect(present(canvasElement.querySelector("[data-jv-line-numbers]")).children.length).toBeGreaterThan(10)
    )
    await expect(present(grouped).getByText("5 keys")).toBeVisible()
    const allTree = present(all)
    await expect(allTree.getByText("[Circular]")).toBeVisible()
    await expect(allTree.getByText('"2024-05-09"')).toBeVisible()
    await expect(allTree.getByText("10")).toBeVisible()
    await expect(within(canvasElement).getAllByRole("button", { name: "Expand all" })).toHaveLength(1)
  }
}

export const Expanding: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const plain = await tree(canvasElement, "package")
    await userEvent.click(rowWith(plain, /^keywords:/))
    await expect(await plain.findByText('"react"')).toBeVisible()
    rowWith(plain, /^keywords:/).focus()
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(plain.queryByText('"react"')).toBeNull())
    await userEvent.keyboard("{ArrowRight}")
    await expect(await plain.findByText('"react"')).toBeVisible()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(document.activeElement?.textContent).toBe('"react"'))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(document.activeElement?.textContent).toBe('"components"'))
    await userEvent.keyboard("{ArrowUp}{ArrowLeft}")
    await waitFor(() => expect(document.activeElement?.textContent).toMatch(/^keywords/))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(plain.queryByText('"react"')).toBeNull())
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(document.activeElement?.textContent).toMatch(/^package/))
    await userEvent.keyboard("{ArrowLeft}{ArrowRight}")
    await waitFor(() => expect(document.activeElement?.textContent).toMatch(/^name/))
    await userEvent.keyboard("{Control>}c{/Control}")
    await expect(document.activeElement?.textContent).toMatch(/^name/)
  }
}

export const RichFeatures: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [rich, grouped] = await trees(canvasElement)
    const richTree = present(rich)
    await userEvent.click(richTree.getByRole("button", { name: "show more" }))
    await expect(await richTree.findByRole("button", { name: "show less" })).toHaveAttribute("aria-expanded", "true")
    richTree.getByRole("button", { name: "show less" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(richTree.getByRole("button", { name: "show less" })).toHaveFocus()
    await userEvent.click(richTree.getByRole("button", { name: "show less" }))
    await userEvent.click(rowWith(richTree, /^"version"/))
    await expect(await canvas.findByText(/^Selected: version;/)).toBeVisible()
    const nameRow = rowWith(richTree, /^"name"/)
    nameRow.focus()
    await userEvent.keyboard("{Control>}c{/Control}")
    await waitFor(() => expect(within(nameRow).getByRole("button", { name: "Copied" })).toBeInTheDocument())
    const versionRow = rowWith(richTree, /^"version"/)
    const selection = present(window.getSelection())
    selection.selectAllChildren(versionRow)
    versionRow.focus()
    await userEvent.keyboard("{Meta>}c{/Meta}")
    await expect(within(versionRow).getByRole("button", { name: "Copy" })).toBeInTheDocument()
    selection.removeAllRanges()
    const failing = spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"))
    await userEvent.keyboard("{Meta>}c{/Meta}")
    await waitFor(() => expect(failing).toHaveBeenCalled())
    await expect(within(versionRow).getByRole("button", { name: "Copy" })).toBeInTheDocument()
    failing.mockRestore()
    await userEvent.click(canvas.getByRole("button", { name: "Copy JSON" }))
    await expect(await canvas.findByRole("button", { name: "Copied", hidden: false })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Collapse all" }))
    await expect(await canvas.findByText(/expanded 0$/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Expand all" }))
    await expect(await canvas.findByText(/expanded [1-9]/)).toBeVisible()
    const groupedTree = present(grouped)
    await userEvent.click(rowWith(groupedTree, /^items:/))
    await userEvent.click(await waitFor(() => rowWith(groupedTree, /^\[5\.\.\.9\]/)))
    await expect(await groupedTree.findByText("7")).toBeVisible()
    await userEvent.click(rowWith(groupedTree, /^extra:/))
    await expect(await groupedTree.findByText("... 2 more keys")).toBeVisible()
    await userEvent.click(rowWith(groupedTree, /^short:/))
    await expect(await groupedTree.findByText("... 1 more items")).toBeVisible()
  }
}
