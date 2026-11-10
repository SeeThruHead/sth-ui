import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useLocalStorage" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Store teal" })).toBeVisible()
  }
}

export const Storing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Store teal" }))
    await expect(await canvas.findByText("Stored color: teal")).toBeVisible()
    await expect(localStorage.getItem("sth-hooks-demo-color")).toBe('"teal"')
    localStorage.setItem("sth-hooks-demo-color", '"grape"')
    window.dispatchEvent(new StorageEvent("storage", { key: "sth-hooks-demo-color" }))
    await expect(await canvas.findByText("Stored color: grape")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Remove" }))
    await expect(await canvas.findByText("Stored color: none")).toBeVisible()
    const blocked = spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("storage is blocked")
    })
    await userEvent.click(canvas.getByRole("button", { name: "Store grape" }))
    await expect(await canvas.findByText(/storage is blocked/)).toBeVisible()
    blocked.mockRestore()
    await userEvent.click(canvas.getByRole("button", { name: "Store grape" }))
    await waitFor(() => expect(canvas.queryByText(/storage is blocked/)).toBeNull())
    localStorage.removeItem("sth-hooks-demo-color")
  }
}
