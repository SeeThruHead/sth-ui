import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fireEvent, spyOn, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "../../stories/harness.ts"
import * as DownloadsDemo from "./demos/downloads.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Extensions/Lightbox" }

export default meta

const page = within(document.body)

const dialog = () => waitFor(async () => expect(await page.findByRole("dialog", { name: "Gallery" })).toBeVisible())

const announced = (text: string) =>
  waitFor(() => expect(page.getAllByRole("status").some((status) => status.textContent === text)).toBe(true))

const activeImage = () =>
  document.body.querySelector<HTMLElement>("[data-lightbox-slide]:not([inert]) img") ?? document.body

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Open Mountains at dawn" })).toBeVisible()
    await expect(page.queryByRole("dialog")).toBeNull()
  }
}

export const Browsing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open A quiet forest" }))
    await dialog()
    await announced("Slide 2 of 3: A quiet forest")
    await expect(page.getByText("2 / 3")).toBeVisible()
    await expect(page.getByText("A quiet forest", { selector: "div" })).toBeVisible()
    await userEvent.click(page.getByRole("button", { name: "Next slide" }))
    await announced("Slide 3 of 3: Desert dunes")
    await expect(page.getByRole("button", { name: "Next slide" })).toHaveAttribute("aria-disabled", "true")
    await expect(await canvas.findByText("Showing 3")).toBeVisible()
    await userEvent.click(page.getByRole("button", { name: "Previous slide" }))
    await announced("Slide 2 of 3: A quiet forest")
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}")
    await announced("Slide 2 of 3: A quiet forest")
    await userEvent.keyboard("{ArrowRight}")
    await announced("Slide 3 of 3: Desert dunes")
    await userEvent.click(page.getByRole("button", { name: "Go to slide 1" }))
    await announced("Slide 1 of 3: Mountains at dawn")
    await expect(page.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true")
    await userEvent.click(page.getByRole("button", { name: "Hide thumbnails" }))
    await waitFor(() => expect(page.queryByRole("button", { name: "Go to slide 2" })).toBeNull())
    await userEvent.keyboard("t")
    await expect(await page.findByRole("button", { name: "Go to slide 2" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Previous slide" })).toHaveAttribute("aria-disabled", "true")
    await userEvent.click(page.getByRole("button", { name: "Close" }))
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await expect(await canvas.findByText("Closed")).toBeVisible()
  }
}

export const Zooming: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open Mountains at dawn" }))
    await dialog()
    await waitFor(() => expect(activeImage()).toHaveAttribute("data-zoom-enabled"))
    await userEvent.click(activeImage())
    await waitFor(() => expect(activeImage()).toHaveAttribute("data-zoomed"))
    await userEvent.keyboard("{ArrowRight}")
    await announced("Slide 1 of 3: Mountains at dawn")
    await waitFor(() => expect(activeImage().style.transform).toContain("translate(-25px"))
    await userEvent.keyboard("{ArrowDown}")
    await fireEvent.pointerDown(activeImage(), { clientX: 300, clientY: 300 })
    await fireEvent.pointerMove(document.body, { clientX: 340, clientY: 300 })
    await fireEvent.pointerUp(document.body, { clientX: 340, clientY: 300 })
    await fireEvent.click(activeImage())
    await expect(activeImage()).toHaveAttribute("data-zoomed")
    await fireEvent.wheel(activeImage(), { deltaY: 0 })
    await fireEvent.wheel(activeImage(), { deltaY: -100, clientX: 400, clientY: 300 })
    await waitFor(() => expect(activeImage().style.transform).toContain("scale(2.2)"))
    await userEvent.keyboard("z")
    await waitFor(() => expect(activeImage()).not.toHaveAttribute("data-zoomed"))
    await fireEvent.pointerDown(activeImage(), { clientX: 300, clientY: 300 })
    await fireEvent.pointerUp(document.body, { clientX: 300, clientY: 300 })
    await fireEvent.pointerMove(document.body, { clientX: 340, clientY: 300 })
    await userEvent.keyboard("{Control>}z{/Control}")
    await expect(activeImage()).not.toHaveAttribute("data-zoomed")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
  }
}

export const FullscreenAndDownload: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open Mountains at dawn" }))
    await dialog()
    const clicked = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    await userEvent.click(page.getByRole("button", { name: "Download" }))
    await waitFor(() => expect(clicked).toHaveBeenCalled())
    clicked.mockRestore()
    const entered = spyOn(Element.prototype, "requestFullscreen").mockResolvedValue(undefined)
    await userEvent.click(page.getByRole("button", { name: "Enter fullscreen" }))
    await waitFor(() => expect(entered).toHaveBeenCalledOnce())
    const stale = spyOn(Document.prototype, "fullscreenElement", "get").mockReturnValue(document.documentElement)
    document.dispatchEvent(new Event("fullscreenchange"))
    await expect(await page.findByRole("button", { name: "Exit fullscreen" })).toBeVisible()
    stale.mockRestore()
    await userEvent.click(page.getByRole("button", { name: "Exit fullscreen" }))
    document.dispatchEvent(new Event("fullscreenchange"))
    await expect(await page.findByRole("button", { name: "Enter fullscreen" })).toBeVisible()
    await userEvent.keyboard("f")
    await waitFor(() => expect(entered).toHaveBeenCalledTimes(2))
    const current = spyOn(Document.prototype, "fullscreenElement", "get").mockReturnValue(document.documentElement)
    document.dispatchEvent(new Event("fullscreenchange"))
    await expect(await page.findByRole("button", { name: "Exit fullscreen" })).toBeVisible()
    const exited = spyOn(Document.prototype, "exitFullscreen").mockResolvedValue(undefined)
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(exited).toHaveBeenCalledOnce())
    current.mockRestore()
    document.dispatchEvent(new Event("fullscreenchange"))
    entered.mockRestore()
    exited.mockRestore()
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
  }
}

const album = () => waitFor(async () => expect(await page.findByRole("dialog", { name: "Album" })).toBeVisible())

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Open the custom slide" })).toBeVisible()
  }
}

export const CustomSlides: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open the custom slide" }))
    await album()
    await announced("Slide 3 of 4")
    await expect(page.getByRole("heading", { name: "A custom slide" })).toBeVisible()
    await expect(page.queryByRole("button", { name: "Download" })).toBeNull()
    await userEvent.click(page.getByRole("textbox", { name: "Note" }))
    await userEvent.keyboard("{ArrowRight}")
    await announced("Slide 3 of 4")
    await userEvent.click(page.getByRole("button", { name: "Like (0)" }))
    await userEvent.keyboard("{ArrowLeft}")
    await announced("Slide 3 of 4")
    await expect(await page.findByRole("button", { name: "Like (1)" })).toBeVisible()
    await userEvent.click(page.getByRole("button", { name: "Like this" }))
    await expect(await page.findByRole("button", { name: "Like (2)" })).toBeVisible()
    await userEvent.click(page.getByRole("button", { name: "Next slide" }))
    await announced("Slide 4 of 4")
    await userEvent.click(page.getByRole("button", { name: "Next slide" }))
    await announced("Slide 1 of 4")
    await expect(page.getByText("First")).toBeVisible()
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }))
    const prevented = new KeyboardEvent("keydown", { key: "t", cancelable: true })
    prevented.preventDefault()
    document.dispatchEvent(prevented)
    await expect(page.getByText("First")).toBeVisible()
    await userEvent.click(page.getByRole("button", { name: "Go to slide 2" }))
    await announced("Slide 2 of 4: A short clip")
    await expect(document.body.querySelector("video[data-active]")).not.toBeNull()
    await userEvent.click(page.getByRole("button", { name: "Download" }))
    const region = page.getByRole("region", { name: "Slides" })
    region.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        changedTouches: [new Touch({ identifier: 1, target: region, clientX: 100, clientY: 100 })]
      })
    )
    region.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [new Touch({ identifier: 1, target: region, clientX: 160, clientY: 120 })]
      })
    )
    region.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [] }))
    region.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, changedTouches: [] }))
    region.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        changedTouches: [new Touch({ identifier: 2, target: region, clientX: 100, clientY: 100 })]
      })
    )
    region.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [] }))
    await expect(page.getByRole("dialog", { name: "Album" })).toBeVisible()
    region.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        changedTouches: [new Touch({ identifier: 3, target: region, clientX: 100, clientY: 100 })]
      })
    )
    region.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [new Touch({ identifier: 3, target: region, clientX: 110, clientY: 260 })]
      })
    )
    await waitFor(() => expect(page.queryByRole("dialog", { name: "Album" })).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Open the custom slide" }))
    await album()
    const backdrop = document.body.querySelector("[data-lightbox-slide]:not([inert]) > div") ?? document.body
    await userEvent.click(backdrop)
    await waitFor(() => expect(page.queryByRole("dialog", { name: "Album" })).toBeNull())
  }
}

const urlOf = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href

  return input.url
}

const statusFor = (url: string) => (url.includes("missing") ? 404 : 200)

export const Downloads: StoryObj = {
  render: demoApp(DownloadsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const clicked = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    const fetched = spyOn(window, "fetch")
    fetched.mockImplementation((input) => Promise.resolve(new Response("x", { status: statusFor(urlOf(input)) })))
    await userEvent.click(await canvas.findByRole("button", { name: "data" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(1))
    await userEvent.click(canvas.getByRole("button", { name: "same origin" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(2))
    await userEvent.click(canvas.getByRole("button", { name: "bad name" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(3))
    await userEvent.click(canvas.getByRole("button", { name: "folder" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(4))
    await userEvent.click(canvas.getByRole("button", { name: "cross origin" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(5))
    await userEvent.click(canvas.getByRole("button", { name: "missing" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(6))
    await userEvent.click(canvas.getByRole("button", { name: "refused" }))
    await userEvent.click(canvas.getByRole("button", { name: "broken" }))
    fetched.mockRejectedValue(new Error("offline"))
    await userEvent.click(canvas.getByRole("button", { name: "same origin" }))
    await waitFor(() => expect(clicked).toHaveBeenCalledTimes(7))
    fetched.mockRestore()
    clicked.mockRestore()
    await userEvent.click(canvas.getByRole("button", { name: "Open empty" }))
    await dialog()
    await expect(page.queryByRole("button", { name: "Next slide" })).toBeNull()
    await expect(page.queryByRole("button", { name: "Download" })).toBeNull()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
  }
}
