import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demo, demoApp, story } from "../../stories/harness.ts"
import * as WithSectionDemo from "./demos/with-section.ts"
import * as ClickingDemo from "./demos/with-section.ts"
import { groupButton, groupSection } from "./ButtonGroup.ts"
import { present } from "../../stories/dom.ts"
import * as VerticalDemo from "./demos/vertical.ts"

const meta: Meta = { title: "Buttons/ButtonGroup" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: story(({ h, ui }) =>
    ui.ButtonGroup(h, {
      attributes: { group: { "aria-label": "Formatting" } },
      children: ["First", "Second", "Third"].map((label) => groupButton({ variant: "default", children: [label] }))
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByRole("group", { name: "Formatting" })
    await expect(group).toHaveAttribute("data-orientation", "horizontal")
    const first = canvas.getByRole("button", { name: "First" })
    const second = canvas.getByRole("button", { name: "Second" })
    const third = canvas.getByRole("button", { name: "Third" })
    await expect(css(first).borderTopRightRadius).toBe("0px")
    await expect(css(first).borderTopLeftRadius).toBe("8px")
    await expect(css(first).borderRightWidth).toBe("1px")
    await expect(css(second).borderTopLeftRadius).toBe("0px")
    await expect(css(third).borderTopRightRadius).toBe("8px")
    await expect(second.getBoundingClientRect().left).toBe(first.getBoundingClientRect().right)
  }
}

export const Vertical: StoryObj = {
  render: demo(VerticalDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const top = await canvas.findByRole("button", { name: "Top" })
    const middle = canvas.getByRole("button", { name: "Middle" })
    await expect(canvas.getByRole("group")).toHaveAttribute("data-orientation", "vertical")
    await expect(css(top).borderBottomWidth).toBe("1px")
    await expect(css(top).borderBottomLeftRadius).toBe("0px")
    await expect(css(middle).borderTopWidth).toBe("1px")
    await expect(middle.getBoundingClientRect().top).toBe(top.getBoundingClientRect().bottom)
  }
}

export const WithSection: StoryObj = {
  render: demoApp(WithSectionDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const section = await canvas.findByText("135")
    await expect(css(section).borderTopLeftRadius).toBe("0px")
    await expect(css(section).borderRightWidth).toBe("1px")
    await expect(css(section).height).toBe("36px")
  }
}

export const Clicking: StoryObj = {
  render: demoApp(ClickingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Increase" }))
    await waitFor(() => expect(canvas.getByText("136")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Increase" }))
    await waitFor(() => expect(canvas.getByText("137")).toBeVisible())
    await userEvent.click(canvas.getByRole("button", { name: "Decrease" }))
    await waitFor(() => expect(canvas.getByText("136")).toBeVisible())
  }
}

export const SectionStyles: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Stack(h, {
      align: "flex-start",
      children: [
        ui.ButtonGroup(h, { children: [groupSection({ children: ["Filled section"] })] }),
        ui.ButtonGroup(h, {
          children: [
            groupSection({ size: "xl", radius: "xl", color: "grape", variant: "light", children: ["Light xl"] }),
            groupSection({
              size: "compact-sm",
              radius: 2,
              variant: "gradient",
              gradient: { from: "teal", to: "lime" },
              children: ["Gradient"]
            }),
            groupSection({ color: "yellow", autoContrast: true, children: ["Contrast"] }),
            groupSection({ color: "#ffec99", autoContrast: true, children: ["Custom contrast"] }),
            groupSection({ color: "yellow", variant: "light", autoContrast: true, children: ["Light contrast"] }),
            groupSection({ color: "yellow", variant: "light", children: ["Light yellow"] })
          ]
        })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByText("Filled section")
    await expect(css(filled).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(filled).borderTopRightRadius).toBe("8px")
    const light = canvas.getByText("Light xl")
    await expect(css(light).height).toBe("60px")
    await expect(css(light).borderTopLeftRadius).toBe("32px")
    const gradient = canvas.getByText("Gradient")
    await expect(css(gradient).height).toBe("26px")
    await expect(css(gradient).backgroundImage).toContain("linear-gradient")
    await expect(css(canvas.getByText("Contrast")).color).not.toBe("rgb(255, 255, 255)")
    await expect(["rgb(0, 0, 0)", "oklch(0 0 0)"]).toContain(css(canvas.getByText("Custom contrast")).color)
    await expect(css(canvas.getByText("Light contrast")).color).toBe(css(canvas.getByText("Light yellow")).color)
  }
}
