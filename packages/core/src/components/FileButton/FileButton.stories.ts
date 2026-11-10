import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demoApp } from "../../stories/harness.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as ResetDemo from "./demos/reset.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Buttons/FileButton" }

export default meta

const fieldIn = (canvasElement: HTMLElement) =>
  present(canvasElement.querySelector<HTMLInputElement>("input[type='file']"))

const image = (name: string) => new File(["pixels"], name, { type: "image/png" })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Upload image" })).toBeVisible()
    const field = fieldIn(canvasElement)
    await expect(field).toHaveAttribute("accept", "image/png,image/jpeg")
    await expect(field).not.toBeVisible()
    await expect(field).not.toHaveAttribute("multiple")
  }
}

export const PickingFile: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Upload image" })
    const field = fieldIn(canvasElement)
    const clicked = fn((event: Event) => event.preventDefault())
    field.addEventListener("click", clicked, { once: true })
    await userEvent.setup().click(button)
    await waitFor(() => expect(clicked).toHaveBeenCalledOnce())
    await userEvent.upload(field, image("avatar.png"))
    await waitFor(() => expect(canvas.getByText("Picked file: avatar.png")).toBeVisible())
  }
}

export const Multiple: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("button", { name: "Upload image" })
    const field = fieldIn(canvasElement)
    await expect(field).toHaveAttribute("multiple")
    await userEvent.upload(field, [image("one.png"), image("two.png")])
    await waitFor(() => expect(canvas.getByText("Picked files:")).toBeVisible())
    await expect(canvas.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["one.png", "two.png"])
  }
}

export const Reset: StoryObj = {
  render: demoApp(ResetDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const reset = await canvas.findByRole("button", { name: "Reset" })
    await expect(reset).toBeDisabled()
    const field = fieldIn(canvasElement)
    await expect(field).toHaveAttribute("name", "image")
    await expect(field).toHaveAttribute("form", "profile")
    await expect(field).toHaveAttribute("capture", "user")
    await expect(field).toHaveAttribute("data-testid", "image-field")
    await userEvent.upload(field, image("photo.png"))
    await waitFor(() => expect(canvas.getByText("Picked file: photo.png")).toBeVisible())
    await expect(fieldIn(canvasElement)).toBeDisabled()
    await expect(fieldIn(canvasElement)).not.toHaveAttribute("accept")
    await userEvent.setup().click(reset)
    await waitFor(() => expect(canvas.queryByText("Picked file: photo.png")).toBeNull())
    await expect(fieldIn(canvasElement)).not.toBe(field)
    await expect(fieldIn(canvasElement).files).toHaveLength(0)
  }
}
