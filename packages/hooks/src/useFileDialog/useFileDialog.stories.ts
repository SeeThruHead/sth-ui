import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useFileDialog" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No files picked")).toBeVisible()
  }
}

const dialog = () => waitFor(() => present(document.querySelector<HTMLInputElement>("input[data-sth-file-dialog]")))

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Pick images" }))
    const input = await dialog()
    await expect(input).toHaveAttribute("accept", "image/*")
    await expect(input).toHaveAttribute("multiple")
    const files = new DataTransfer()
    files.items.add(new File(["a"], "cat.png", { type: "image/png" }))
    files.items.add(new File(["b"], "dog.png", { type: "image/png" }))
    Reflect.set(input, "files", files.files)
    input.dispatchEvent(new Event("change"))
    await expect(await canvas.findByText("Picked: cat.png, dog.png")).toBeVisible()
    await waitFor(() => expect(document.querySelector("input[data-sth-file-dialog]")).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Pick images" }))
    const again = await dialog()
    again.dispatchEvent(new Event("cancel"))
    await expect(await canvas.findByText("The dialog was closed")).toBeVisible()
  }
}
