import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demo, story } from "../../stories/harness.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as StylePropsDemo from "./demos/style-props.ts"
import * as ResponsiveDemo from "./demos/responsive.ts"
import * as VisibilityDemo from "./demos/visibility.ts"

const meta: Meta = { title: "Layout/Box" }

export default meta

const style = (element: HTMLElement) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "My component" })
    await expect(link).toHaveAttribute("href", "#box")
    await expect(style(link).backgroundColor).toBe("rgb(255, 107, 107)")
    await expect(style(link).marginTop).toBe("32px")
  }
}

export const StyleProps: StoryObj = {
  render: demo(StylePropsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Type")
    const spacing = style(present(canvasElement.querySelector<HTMLElement>("#spacing")))
    await expect(spacing.marginBottom).toBe("16px")
    await expect(spacing.marginTop).toBe("-12px")
    await expect(spacing.paddingTop).toBe("20px")
    await expect(spacing.paddingLeft).toBe("32px")
    await expect(spacing.width).toBe("240px")
    await expect(canvasElement.querySelector<HTMLElement>("#spacing")?.getBoundingClientRect().width).toBe(240)
    await expect(spacing.borderTopLeftRadius).toBe("16px")
    await expect(spacing.borderTopStyle).toBe("dashed")
    await expect(spacing.backgroundColor).toBe("rgb(243, 217, 250)")
    await expect(spacing.color).toBe("rgb(190, 75, 219)")
    const type = style(present(canvasElement.querySelector<HTMLElement>("#type")))
    await expect(type.fontFamily).toContain("monospace")
    await expect(type.fontSize).toBe("18px")
    await expect(type.fontWeight).toBe("700")
    await expect(type.lineHeight).toBe("23.4px")
    await expect(type.letterSpacing).toBe("2px")
    await expect(type.textTransform).toBe("uppercase")
    await expect(type.fontStyle).toBe("italic")
    await expect(type.opacity).toBe("0.8")
    await expect(type.color).toBe("rgb(134, 142, 150)")
    const layout = style(present(canvasElement.querySelector<HTMLElement>("#layout")))
    await expect(layout.display).toBe("flex")
    await expect(layout.top).toBe("4px")
    await expect(layout.backgroundColor).toBe("rgb(18, 52, 86)")
    await expect(layout.borderTopWidth).toBe("3px")
    await expect(layout.fontSize).toBe("22px")
    await expect(layout.fontFamily).toBe("Georgia, serif")
    await expect(layout.backgroundRepeat).toBe("no-repeat")
    const named = style(present(canvasElement.querySelector<HTMLElement>("#named")))
    await expect(named.borderTopColor).toBe("rgb(250, 82, 82)")
    await expect(named.color).toBe("rgb(255, 135, 135)")
    await expect(named.backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(named.fontSize).toBe("13px")
    const rawElement = present(canvasElement.querySelector<HTMLElement>("#raw"))
    const raw = style(rawElement)
    await expect(rawElement.style.borderTopWidth).toBe("4px")
    await expect(raw.borderTopStyle).toBe("none")
    await expect(raw.borderTopLeftRadius).toBe("10px")
    await expect(raw.fontSize).toBe("24px")
  }
}

const responsive = demo(ResponsiveDemo.view)

export const ResponsiveOnPhone: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(390)
    await within(canvasElement).findByText("Padding xs on phones, xl from sm up")
    const box = style(present(canvasElement.querySelector<HTMLElement>("#responsive")))
    await expect(box.paddingTop).toBe("10px")
    await expect(box.color).toBe("rgb(34, 139, 230)")
    await expect(box.fontSize).toBe("16px")
  }
}

export const ResponsiveOnDesktop: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: responsive,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Padding xs on phones, xl from sm up")
    const box = style(present(canvasElement.querySelector<HTMLElement>("#responsive")))
    await expect(box.paddingTop).toBe("32px")
    await expect(box.color).toBe("rgb(250, 82, 82)")
    await expect(box.fontSize).toBe("30px")
  }
}

const visibility = demo(VisibilityDemo.view)

export const VisibilityOnPhone: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: visibility,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const phone = await canvas.findByText("Phone only")
    await expect(phone).toBeVisible()
    await expect(phone).toHaveAttribute("data-phone-only", "")
    await expect(phone).toHaveAttribute("data-step", "2")
    await expect(phone).not.toHaveAttribute("data-off")
    await expect(canvas.getByText("Desktop only")).not.toBeVisible()
    await expect(canvas.getByRole("navigation")).toHaveTextContent("Navigation")
  }
}

export const VisibilityOnDesktop: StoryObj = {
  globals: { viewport: { value: "wide", isRotated: false } },
  render: visibility,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Desktop only")).toBeVisible()
    await expect(canvas.getByText("Phone only")).not.toBeVisible()
  }
}

export const OnEveryComponent: StoryObj = {
  render: story(({ h, ui }) => ui.Button(h, { mt: "xl", w: 300, children: ["Spaced button"] })),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Spaced button" })
    await expect(style(button).marginTop).toBe("32px")
    await expect(style(button).width).toBe("300px")
  }
}
