import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import type { Kit } from "../../stories/harness.ts"
import { demo, story } from "../../stories/harness.ts"
import { cardSection } from "./Card.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as SectionsDemo from "./demos/sections.ts"
import * as AsLinkDemo from "./demos/as-link.ts"
import * as PaddingAndShadowDemo from "./demos/padding-and-shadow.ts"
import * as HorizontalDemo from "./demos/horizontal.ts"

const meta: Meta = { title: "Data display/Card" }

export default meta

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

const fjords = ({ h, ui }: Kit) =>
  ui.Card(h, {
    shadow: "sm",
    padding: "lg",
    withBorder: true,
    w: "100%",
    maw: 340,
    attributes: { root: { "aria-label": "Norway Fjord Adventures" } },
    children: [
      cardSection({ children: [ui.Image(h, { src: "images/mountains.svg", h: 160, alt: "Norway" })] }),
      ui.Group(h, {
        justify: "space-between",
        mt: "md",
        mb: "xs",
        children: [
          ui.Text(h, { fw: 500, children: ["Norway Fjord Adventures"] }),
          ui.Badge(h, { color: "pink", children: ["On Sale"] })
        ]
      }),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [
          "With Fjord Tours you can explore more of the magical fjord landscapes with tours and activities on and around the fjords of Norway"
        ]
      }),
      ui.Button(h, { color: "blue", fullWidth: true, mt: "md", children: ["Book classic tour now"] })
    ]
  })

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = await canvas.findByLabelText("Norway Fjord Adventures")
    const image = canvas.getByRole("img", { name: "Norway" })
    await expect(box(card).width).toBe(340)
    await expect(css(card).paddingTop).toBe("20px")
    await expect(css(card).borderTopWidth).toBe("1px")
    await expect(css(card).borderTopLeftRadius).toBe("8px")
    await expect(css(card).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(box(image).top).toBe(box(card).top + 1)
    await expect(box(image).width).toBe(340 - 2)
    await expect(present(image.parentElement)).toHaveAttribute("data-first-section")
    await expect(canvas.getByRole("button", { name: "Book classic tour now" }).getBoundingClientRect().width).toBe(
      340 - 2 - 40
    )
  }
}

export const Horizontal: StoryObj = {
  render: demo(HorizontalDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = await canvas.findByLabelText("Project progress")
    const cover = present(canvas.getByRole("img", { name: "Project cover" }).parentElement)
    await expect(css(card).flexDirection).toBe("row")
    await expect(box(cover).left).toBe(box(card).left + 1)
    await expect(css(cover).borderInlineEndWidth).toBe("1px")
    await expect(css(cover).borderInlineStartStyle).toBe("none")
    await expect(css(cover).paddingTop).toBe("12px")
    await expect(cover).toHaveAttribute("data-orientation", "horizontal")
    await expect(present(canvas.getByText("Project tasks").parentElement)).toHaveAttribute("data-last-section")
  }
}

export const Sections: StoryObj = {
  render: demo(SectionsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = await canvas.findByLabelText("Review pictures")
    const header = present(canvas.getByText("Review pictures").closest("[data-first-section]"))
    const picture = present(canvas.getByRole("img", { name: "Uploaded picture" }).parentElement)
    const footer = present(canvas.getByText("Uploaded by Ana").parentElement)
    await expect(css(header).borderTopStyle).toBe("none")
    await expect(css(header).borderBottomWidth).toBe("1px")
    await expect(css(header).paddingLeft).toBe("16px")
    await expect(box(header).width).toBe(400 - 2)
    await expect(css(picture).marginLeft).toBe("-16px")
    await expect(css(picture).marginTop).toBe("12px")
    await expect(css(footer).borderTopStyle).toBe("none")
    await expect(css(footer).borderBottomStyle).toBe("none")
    await expect(footer).toHaveAttribute("data-last-section")
    await expect(box(footer).bottom).toBe(box(card).bottom - 1)
    await expect(canvas.getByRole("button", { name: "More actions" })).toBeVisible()
  }
}

export const AsLink: StoryObj = {
  render: demo(AsLinkDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "You've won a million dollars in cash!" })
    await expect(link).toHaveAttribute("href", "#article")
    await expect(css(link).textDecorationLine).toBe("none")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story((kit) => fjords(kit), { centered: true }),
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByLabelText("Norway Fjord Adventures")
    await expect(css(card).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(card).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const PaddingAndShadow: StoryObj = {
  render: demo(PaddingAndShadowDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByLabelText("Plain card")
    await expect(css(card).paddingLeft).toBe("32px")
    await expect(css(card).borderTopLeftRadius).toBe("0px")
    await expect(css(card).boxShadow).not.toBe("none")
    await expect(card).not.toHaveAttribute("data-with-border")
    await expect(box(within(card).getByRole("img", { name: "Edge to edge" })).width).toBe(320)
  }
}
