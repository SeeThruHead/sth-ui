import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useListState" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Apple")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Append" })).toBeVisible()
  }
}

const order = (root: HTMLElement) =>
  ["Apple", "Banana", "Cherry", "Item 1", "Item 2"]
    .flatMap((name) => within(root).queryAllByText(name))
    .toSorted((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((element) => element.textContent)

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Append" }))
    await userEvent.click(canvas.getByRole("button", { name: "Prepend" }))
    await expect(await canvas.findByText("Item 2")).toBeVisible()
    await expect(order(canvasElement)).toEqual(["Item 2", "Apple", "Banana", "Cherry", "Item 1"])
    await userEvent.click(canvas.getByRole("button", { name: "Pop" }))
    await userEvent.click(canvas.getByRole("button", { name: "Swap first two" }))
    await waitFor(() => expect(order(canvasElement)).toEqual(["Apple", "Item 2", "Banana", "Cherry"]))
    await userEvent.click(canvas.getByRole("button", { name: "First to last" }))
    await waitFor(() => expect(order(canvasElement)).toEqual(["Item 2", "Banana", "Cherry", "Apple"]))
    await userEvent.click(present(canvasElement.querySelector<HTMLElement>("[data-with-remove] button")))
    await waitFor(() => expect(order(canvasElement)).toEqual(["Banana", "Cherry", "Apple"]))
  }
}
