import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "../../stories/harness.ts"
import * as FullScreenDemo from "./demos/fullScreen.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Extensions/Dropzone" }

export default meta

const file = (name: string, type: string, size = 10) => new File(["x".repeat(size)], name, { type })

const carrying = (...files: ReadonlyArray<File>): ReadonlyArray<File> => files

const transfer = (files: ReadonlyArray<File>) => {
  const data = new DataTransfer()
  files.forEach((item) => data.items.add(item))

  return data
}

const drag = (type: string, target: Element, files?: ReadonlyArray<File>) =>
  target.dispatchEvent(
    new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      ...(files === undefined ? {} : { dataTransfer: transfer(files) })
    })
  )

const picker = () => waitFor(() => expect(document.body.querySelector("input[type=file]")).not.toBeNull())

const pickerInput = () =>
  document.body.querySelector<HTMLInputElement>("input[type=file]") ?? document.createElement("input")

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: /Drag images here/ })).toBeVisible()
    await expect(canvas.getByText("No files yet")).toBeVisible()
  }
}

export const Dropping: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const zone = await canvas.findByRole("button", { name: /Drag images here/ })
    const inner = canvas.getByText("Drag images here or click to select files")
    drag("dragenter", zone, carrying(file("photo.png", "image/png")))
    await waitFor(() => expect(zone).toHaveAttribute("data-accept"))
    await expect(zone.querySelector("[data-icon=upload]")).not.toBeNull()
    drag("dragenter", inner, carrying(file("photo.png", "image/png")))
    drag("dragleave", inner)
    await expect(zone).toHaveAttribute("data-accept")
    drag("dragleave", zone)
    await waitFor(() => expect(zone).toHaveAttribute("data-idle"))
    drag("dragenter", zone, carrying(file("doc.pdf", "application/pdf")))
    await waitFor(() => expect(zone).toHaveAttribute("data-reject"))
    await expect(zone.querySelector("[data-icon=x]")).not.toBeNull()
    drag("dragover", zone, carrying(file("doc.pdf", "application/pdf")))
    drag("drop", zone, carrying(file("doc.pdf", "application/pdf")))
    await expect(await canvas.findByText(/Rejected doc.pdf \(File type must be one of image\/png/)).toBeVisible()
    await expect(zone).toHaveAttribute("data-idle")
    drag("dragenter", zone, carrying())
    drag("dragenter", zone)
    drag("dragleave", zone)
    drag("drop", zone)
    await expect(canvas.getByText(/Rejected doc.pdf/)).toBeVisible()
    drag("drop", zone, carrying(file("photo.png", "image/png")))
    await expect(await canvas.findByText("Accepted photo.png")).toBeVisible()
    drag("dragover", document.body, carrying(file("photo.png", "image/png")))
    drag("drop", document.body, carrying(file("photo.png", "image/png")))
    await userEvent.click(zone)
    await picker()
    await userEvent.upload(pickerInput(), file("chosen.png", "image/png"))
    await expect(await canvas.findByText("Accepted chosen.png")).toBeVisible()
    zone.focus()
    await userEvent.keyboard("{Enter}")
    await picker()
    await fireEvent(pickerInput(), new Event("cancel"))
    await expect(await canvas.findByText("Cancelled")).toBeVisible()
    await userEvent.keyboard("a")
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Drop one PDF here, or use the button" })).toBeVisible()
    await expect(canvas.getByRole("switch", { name: "Loading" })).not.toBeChecked()
  }
}

export const Configuring: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const zone = await canvas.findByRole("button", { name: "Drop one PDF here, or use the button" })
    drag("drop", zone, carrying(file("secret.pdf", "application/pdf")))
    await expect(await canvas.findByText("Rejected secret")).toBeVisible()
    drag("drop", zone, carrying(file("a.pdf", "application/pdf"), file("b.pdf", "application/pdf")))
    await expect(await canvas.findByText("Rejected too-many-files, too-many-files")).toBeVisible()
    drag("drop", zone, carrying(file("tiny.pdf", "application/pdf", 1)))
    await expect(await canvas.findByText("Rejected file-too-small")).toBeVisible()
    drag("dragenter", zone, carrying(file("a.pdf", "application/pdf")))
    await waitFor(() => expect(zone).toHaveAttribute("data-accept"))
    drag("drop", zone, carrying(file("a.pdf", "application/pdf")))
    await expect(await canvas.findByText("Accepted a.pdf")).toBeVisible()
    drag("dragenter", zone, carrying(file("a.png", "image/png")))
    await waitFor(() => expect(zone).toHaveAttribute("data-reject"))
    drag("dragleave", zone)
    await userEvent.click(zone)
    await expect(document.body.querySelector("input[type=file]")).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Select a PDF" }))
    await picker()
    await userEvent.upload(pickerInput(), file("picked.pdf", "application/pdf"))
    await expect(await canvas.findByText("Accepted picked.pdf")).toBeVisible()
    await userEvent.click(canvas.getByRole("switch", { name: "Loading" }))
    await waitFor(() => expect(zone).toHaveAttribute("data-loading"))
    drag("drop", zone, carrying(file("late.pdf", "application/pdf")))
    await userEvent.click(canvas.getByRole("switch", { name: "Loading" }))
    await waitFor(() => expect(zone).not.toHaveAttribute("data-loading"))
    await userEvent.click(canvas.getByRole("switch", { name: "Disabled" }))
    await waitFor(() => expect(zone).toHaveAttribute("data-disabled"))
    await expect(zone).toHaveAttribute("aria-disabled", "true")
    drag("dragenter", zone, carrying(file("a.pdf", "application/pdf")))
    await expect(zone).toHaveAttribute("data-idle")
    await expect(canvas.getByText("Accepted picked.pdf")).toBeVisible()
    await userEvent.click(canvas.getByRole("switch", { name: "Disabled" }))
    const full = canvas.getByRole("button", { name: "Drop PDFs anywhere" })
    const screen = full.parentElement ?? full
    await expect(screen).toHaveStyle({ opacity: "0" })
    drag("dragenter", document.body, carrying())
    drag("dragenter", document.body, carrying(file("a.pdf", "application/pdf")))
    drag("dragenter", document.body, carrying(file("a.pdf", "application/pdf")))
    await waitFor(() => expect(screen).toHaveStyle({ opacity: "1" }))
    drag("dragleave", document.body)
    await expect(screen).toHaveStyle({ opacity: "1" })
    drag("dragleave", document.body)
    await waitFor(() => expect(screen).toHaveStyle({ opacity: "0" }))
    drag("dragenter", document.body, carrying(file("a.pdf", "application/pdf")))
    drag("drop", full, carrying(file("one.pdf", "application/pdf"), file("two.pdf", "application/pdf")))
    await expect(await canvas.findByText("Accepted one.pdf, two.pdf")).toBeVisible()
    await waitFor(() => expect(screen).toHaveStyle({ opacity: "0" }))
  }
}

export const FullScreen: StoryObj = {
  render: demoApp(FullScreenDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Drag a file over the window")).toBeVisible()
    await expect(canvas.getByRole("switch", { name: "Accept files dropped anywhere" })).toBeChecked()
  }
}

export const DroppingAnywhere: StoryObj = {
  render: demoApp(FullScreenDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Drag a file over the window")).toBeVisible()
    const still = canvasElement.querySelector("[data-loading]") ?? canvasElement
    drag("drop", still, carrying(file("ignored.png", "image/png")))
    drag("dragleave", document.body)
    drag("dragenter", document.body)
    drag("dragenter", document.body, carrying(file("a.png", "image/png")))
    const full = await within(document.body).findByRole("button", { name: "Drop files anywhere" })
    await waitFor(() => expect(full.parentElement).toHaveStyle({ opacity: "1" }))
    drag("drop", full, carrying(file("a.png", "image/png")))
    await expect(await canvas.findByText("Dropped a.png")).toBeVisible()
    await userEvent.click(canvas.getByRole("switch", { name: "Accept files dropped anywhere" }))
    await waitFor(() => expect(canvas.getByRole("switch", { name: "Accept files dropped anywhere" })).not.toBeChecked())
    drag("dragenter", document.body, carrying(file("b.png", "image/png")))
    const again = await within(document.body).findByRole("button", { name: "Drop files anywhere" })
    await expect(again).not.toBe(full)
    await expect(again.parentElement).toHaveStyle({ opacity: "0" })
  }
}
