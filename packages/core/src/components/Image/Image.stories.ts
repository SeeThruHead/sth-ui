import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { pictureState, pictureTimeout, present } from "../../stories/dom.ts"
import { demo, story } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as HeightDemo from "./demos/height.ts"
import * as ContainDemo from "./demos/contain.ts"
import * as FallbackDemo from "./demos/fallback.ts"

const meta: Meta = { title: "Data display/Image" }

export default meta

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

const loaded = async (image: HTMLElement) => {
  await waitFor(
    () =>
      expect(image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0, pictureState(image)).toBe(
        true
      ),
    pictureTimeout
  )
}

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const image = await within(canvasElement).findByRole("img", { name: "A sailing boat" })
    await loaded(image)
    await expect(box(image).width).toBe(600)
    await expect(css(image).borderTopLeftRadius).toBe("8px")
    await expect(css(image).objectFit).toBe("cover")
  }
}

export const Height: StoryObj = {
  render: demo(HeightDemo.view),
  play: async ({ canvasElement }) => {
    const image = await within(canvasElement).findByRole("img", { name: "Mountains at dusk" })
    await loaded(image)
    await expect(box(image).height).toBe(200)
    await expect(box(image).width).toBe(600)
  }
}

export const Contain: StoryObj = {
  render: demo(ContainDemo.view),
  play: async ({ canvasElement }) => {
    const image = await within(canvasElement).findByRole("img", { name: "A forest at sunset" })
    await loaded(image)
    await expect(css(image).objectFit).toBe("contain")
    await expect(box(image).height).toBe(200)
    await expect(box(image).width).toBeCloseTo(200 * (800 / 450), 0)
  }
}

export const Fallback: StoryObj = {
  render: demo(FallbackDemo.view),
  play: async ({ canvasElement }) => {
    const image = await within(canvasElement).findByRole("img", { name: "A picture that failed to load" })
    await waitFor(() => expect(image.hasAttribute("data-fallback"), pictureState(image)).toBe(true), pictureTimeout)
    await expect(image).toHaveAttribute("src", "images/placeholder.svg")
    await loaded(image)
  }
}

export const Switching: StoryObj = {
  render: story(({ h, ui, value, set, log }) =>
    ui.Stack(h, {
      maw: 300,
      children: [
        ui.Image(h, {
          src: value("src", "images/missing.png"),
          fallbackSrc: "images/placeholder.svg",
          onError: log("error"),
          alt: "Picture"
        }),
        ui.Group(h, {
          children: [
            ui.Button(h, { size: "xs", onClick: set("src", "images/sailing.svg"), children: ["Sailing"] }),
            ui.Button(h, { size: "xs", onClick: set("src", "images/gone.png"), children: ["Broken"] })
          ]
        }),
        ui.Image(h, { alt: "No source" }),
        ui.Image(h, { src: "", fallbackSrc: "images/placeholder.svg", alt: "Empty source" }),
        ui.Image(h, { src: "images/nope.png", alt: "Broken without fallback" }),
        ui.Image(h, { src: "images/nope.png", fallbackSrc: "images/also-missing.png", alt: "Broken fallback" }),
        ui.Image(h, { src: "images/forest.svg", attributes: { root: { "aria-label": "Named by aria-label" } } })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = await canvas.findByRole("img", { name: "Picture" })
    await waitFor(() => expect(image.hasAttribute("data-fallback"), pictureState(image)).toBe(true), pictureTimeout)
    await waitFor(
      () => expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("error"),
      pictureTimeout
    )
    await userEvent.click(canvas.getByRole("button", { name: "Sailing" }))
    await waitFor(() => expect(image).toHaveAttribute("src", "images/sailing.svg"))
    await expect(image).not.toHaveAttribute("data-fallback")
    await userEvent.click(canvas.getByRole("button", { name: "Broken" }))
    await waitFor(() => expect(image).toHaveAttribute("src", "images/placeholder.svg"), pictureTimeout)
    await expect(image).toHaveAttribute("data-fallback")
    await expect(canvas.getByRole("img", { name: "No source" })).not.toHaveAttribute("src")
    await waitFor(
      () => expect(canvas.getByRole("img", { name: "Empty source" })).toHaveAttribute("src", "images/placeholder.svg"),
      pictureTimeout
    )
    await expect(canvas.getByRole("img", { name: "Empty source" })).toHaveAttribute("data-fallback")
    const broken = canvas.getByRole("img", { name: "Broken fallback" })
    await waitFor(() => expect(broken).toHaveAttribute("src", "images/also-missing.png"), pictureTimeout)
    await expect(canvas.getByRole("img", { name: "Broken without fallback" })).toHaveAttribute("src", "images/nope.png")
    await expect(canvas.getByRole("img", { name: "Broken without fallback" })).not.toHaveAttribute("data-fallback")
    await expect(canvas.getByRole("img", { name: "Named by aria-label" })).not.toHaveAttribute("alt")
  }
}
