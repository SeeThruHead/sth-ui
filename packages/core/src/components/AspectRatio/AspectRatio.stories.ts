import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { demo } from "../../stories/harness.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as SquareByDefaultDemo from "./demos/square-by-default.ts"
import * as BareImageDemo from "./demos/bare-image.ts"
import * as EmbedDemo from "./demos/embed.ts"
import * as FlexDemo from "./demos/flex.ts"

const meta: Meta = { title: "Layout/AspectRatio", globals: { viewport: { value: "wide", isRotated: false } } }

export default meta

const box = (element: HTMLElement | null | undefined) => present(element?.getBoundingClientRect())

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const image = await within(canvasElement).findByRole("img", { name: "Mountains at dawn" })
    await waitFor(() => expect(image).toHaveAttribute("src", "images/mountains.svg"))
    await expect(box(image).width).toBe(300)
    await expect(box(image).height).toBe(200)
  }
}

export const SquareByDefault: StoryObj = {
  render: demo(SquareByDefaultDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const square = await canvas.findByText("Square")
    await expect(box(square).height).toBe(box(square).width)
    const tall = canvas.getByText("Tall, 1 by 2")
    await expect(box(tall).height).toBe(240)
  }
}

const css = (element: HTMLElement) => getComputedStyle(element)

export const BareImageWithOverlay: StoryObj = {
  render: demo(BareImageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = await canvas.findByRole("img", { name: "Bare mountains" })
    const root = present(image.parentElement)
    await waitFor(() => expect(box(image).width).toBe(320))
    await expect(box(image).height).toBe(180)
    await expect(css(image).objectFit).toBe("cover")
    const overlay = await canvas.findByTestId("overlay")
    await expect(box(overlay).height).toBe(180)
    await expect(box(overlay).top).toBe(box(root).top)
    await expect(css(overlay).position).toBe("absolute")
  }
}

export const Flex: StoryObj = {
  render: demo(FlexDemo.view),
  play: async ({ canvasElement }) => {
    const image = await within(canvasElement).findByRole("img", { name: "Avatar" })
    await waitFor(() => expect(box(image).width).toBe(100))
    await expect(box(image).height).toBe(100)
  }
}

export const Embed: StoryObj = {
  render: demo(EmbedDemo.view),
  play: async ({ canvasElement }) => {
    const frame = await waitFor(() => present(canvasElement.querySelector("iframe")))
    await waitFor(() => expect(box(frame).width).toBe(400))
    await expect(box(frame).height).toBe(225)
    await expect(css(frame).objectFit).toBe("fill")
  }
}

export const ChangingChildren: StoryObj = {
  render: demo((h, ui) =>
    ui.AspectRatio(h, { ratio: 2, w: 200, attributes: { root: { "data-testid": "ratio" } }, children: [] })
  ),
  play: async ({ canvasElement }) => {
    const root = await within(canvasElement).findByTestId("ratio")
    const added = document.createElement("div")
    const style = document.createElement("style")
    root.append(added, style)
    await waitFor(() => expect(box(added).height).toBe(100))
    await expect(style.getAttribute("style")).toBeNull()
  }
}
