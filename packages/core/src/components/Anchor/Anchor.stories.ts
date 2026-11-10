import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demo, story } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as TextPropsDemo from "./demos/text-props.ts"
import * as UnderlineStoryDemo from "./demos/underline-story.ts"

const meta: Meta = { title: "Navigation/Anchor" }

export default meta

const decoration = (element: Element) => getComputedStyle(element).textDecorationLine

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "Anchor component" })
    await expect(link).toHaveAttribute("href", "https://mantine.dev/")
    await expect(link).toHaveAttribute("target", "_blank")
    await expect(link).toHaveAttribute("rel", "noreferrer")
    await expect(link).toHaveAttribute("data-underline", "hover")
    await expect(getComputedStyle(link).color).toBe("rgb(34, 139, 230)")
    await expect(decoration(link)).toBe("none")
  }
}

const underlineStory = demo(UnderlineStoryDemo.view)

export const Underline: StoryObj = {
  render: underlineStory,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(decoration(await canvas.findByRole("link", { name: "Underline hover" }))).toBe("none")
    await expect(decoration(canvas.getByRole("link", { name: "Underline not-hover" }))).toBe("underline")
    await expect(decoration(canvas.getByRole("link", { name: "Underline always" }))).toBe("underline")
    await expect(decoration(canvas.getByRole("link", { name: "Underline never" }))).toBe("none")
  }
}

export const TextProps: StoryObj = {
  render: demo(TextPropsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const gradient = await canvas.findByRole("link", { name: "Gradient anchor" })
    await expect(gradient).toHaveAttribute("data-variant", "gradient")
    await expect(getComputedStyle(gradient).backgroundImage).toContain("linear-gradient")
    await expect(getComputedStyle(gradient).fontSize).toBe("20px")
    await expect(decoration(gradient)).toBe("none")
    const small = canvas.getByRole("link", { name: "Small red anchor" })
    await expect(getComputedStyle(small).fontSize).toBe("12px")
    await expect(getComputedStyle(small).color).toBe("rgb(250, 82, 82)")
    const clamped = canvas.getByRole("link", { name: /long anchor/ })
    await expect(clamped.getBoundingClientRect().height).toBeLessThan(30)
    await expect(clamped).toHaveAttribute("download", "notes.txt")
    await expect(clamped).toHaveAttribute("data-line-clamp")
    const truncated = canvas.getByRole("link", { name: "Truncated anchor" })
    await expect(truncated).toHaveAttribute("data-truncate", "start")
    await expect(truncated).toHaveAttribute("data-inline")
    await expect(truncated).toHaveAttribute("data-inherit")
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, log }) =>
    ui.Anchor(h, { component: "button", onClick: log("clicked anchor"), children: ["Anchor as a button"] })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Anchor as a button" })
    await expect(button).toHaveAttribute("type", "button")
    await expect(getComputedStyle(button).borderTopWidth).toBe("0px")
    await expect(getComputedStyle(button).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await userEvent.click(button)
    await waitFor(() => expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("clicked anchor"))
  }
}
