import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demo, demoApp, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"
import { present } from "../../stories/dom.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as CenteredContentDemo from "./demos/centered-content.ts"

const meta: Meta = { title: "Overlays/Overlay" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const middle = (box: DOMRect) => box.top + box.height / 2

const overlayOf = (canvasElement: HTMLElement, label: string) => canvasElement.querySelector(`[aria-label="${label}"]`)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = await canvas.findByRole("img", { name: "A boat sailing past the mountains" })
    const overlay = overlayOf(canvasElement, "Dark overlay")
    await expect(css(overlay).backgroundColor).toBe("color(srgb 0 0 0 / 0.85)")
    await expect(overlay?.getBoundingClientRect().height).toBeCloseTo(image.getBoundingClientRect().height, 0)
    await expect(canvas.getByRole("button", { name: "Toggle overlay" }).getBoundingClientRect().width).toBe(200)
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByText(/text under the overlay/)
    const plain = overlayOf(canvasElement, "Default")
    await expect(css(plain).backgroundColor).toBe("rgba(0, 0, 0, 0.6)")
    await expect(css(plain).position).toBe("absolute")
    await expect(css(plain).zIndex).toBe("200")
    await expect(plain?.getBoundingClientRect().height).toBe(120)
    await expect(css(overlayOf(canvasElement, "Color")).backgroundColor).toContain("0.85")
    await expect(css(overlayOf(canvasElement, "Gradient")).backgroundImage).toContain("linear-gradient")
    const blurred = overlayOf(canvasElement, "Blur")
    await expect(css(blurred).backdropFilter).toBe("blur(3px)")
    await expect(css(blurred).borderTopLeftRadius).toBe("8px")
    await expect(css(blurred).zIndex).toBe("5")
  }
}

export const CenteredContent: StoryObj = {
  render: demo(CenteredContentDemo.view),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Upgrade" })
    const overlay = overlayOf(canvasElement, "Centered")
    await expect(overlay).toHaveAttribute("data-center")
    await expect(middle(button.getBoundingClientRect())).toBeCloseTo(
      middle(present(overlay?.getBoundingClientRect())),
      0
    )
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, value, set }) =>
    ui.Stack(h, {
      children: [
        ui.Text(h, { children: [value("open", "yes") === "yes" ? "Overlay showing" : "Overlay hidden"] }),
        ...(value("open", "yes") === "yes"
          ? [
              ui.Overlay(h, {
                fixed: true,
                component: "section",
                blur: "2px",
                onClick: set("open", "no"),
                attributes: { root: { "aria-label": "Fixed overlay" } }
              })
            ]
          : [])
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const overlay = await canvas.findByRole("region", { name: "Fixed overlay" })
    await expect(overlay).toHaveAttribute("data-fixed")
    await expect(css(overlay).position).toBe("fixed")
    await expect(overlay.getBoundingClientRect().width).toBe(window.innerWidth)
    await userEvent.click(overlay)
    await waitFor(() => expect(canvas.getByText("Overlay hidden")).toBeVisible())
  }
}

export const TogglingUsageDemo: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle overlay" }))
    await waitFor(() => expect(overlayOf(canvasElement, "Dark overlay")).toBeNull())
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
