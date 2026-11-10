import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo } from "../../stories/harness.ts"
import * as ChildrenDemo from "./demos/children.ts"
import * as SanitizeDemo from "./demos/sanitize.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Typography/Typography" }

export default meta

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const tagged = (canvasElement: HTMLElement, selector: string) => present(canvasElement.querySelector(selector))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByRole("heading", { level: 1, name: "Typography styles plain HTML" })
    await expect(css(title).fontSize).toBe("34px")
    await expect(css(title).marginTop).toBe("0px")
    await expect(css(title).marginBottom).toBe("10px")
    await expect(css(canvas.getByRole("heading", { level: 2, name: "Lists" })).marginTop).toBe("32px")
    await expect(css(canvas.getByRole("heading", { level: 6, name: "An image" })).fontSize).toBe("14px")
    await expect(css(canvas.getByRole("link", { name: "rendered markdown" })).color).toBe("rgb(34, 139, 230)")
    await expect(css(canvas.getByRole("link", { name: "rendered markdown" })).textDecorationLine).toBe("none")
    await expect(css(canvas.getByText("inline code")).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(canvas.getByText("inline code")).fontFamily).toContain("monospace")
    await expect(css(canvas.getByText("Ctrl")).borderBottomWidth).toBe("3px")
    await expect(css(canvas.getByText("highlighted text")).backgroundColor).toBe("rgb(255, 236, 153)")
    const bullets = present(canvas.getByText("First item").closest("ul"))
    await expect(css(bullets).paddingInlineStart).toBe("32px")
    await expect(css(bullets).marginBottom).toBe("16px")
    await expect(css(canvas.getByText("A task list keeps its own layout").closest("ul")).paddingInlineStart).toBe(
      "40px"
    )
    const quote = canvas.getByText(/Life is like an npm install/)
    await expect(css(quote).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(quote).fontSize).toBe("18px")
    const code = canvas.getByText("const answer = 42")
    await expect(css(code).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(code.closest("pre")).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(tagged(canvasElement, "hr")).borderTopWidth).toBe("1px")
    const table = canvas.getByRole("table", { name: "Elements of the first period" })
    const [head, hydrogen, helium, foot] = within(table)
      .getAllByRole("row")
      .map((row) => present(row.firstElementChild))
    await expect(css(head).borderBottomWidth).toBe("1px")
    await expect(css(head).textAlign).toBe("start")
    await expect(css(hydrogen).borderBottomWidth).toBe("1px")
    await expect(css(helium).borderBottomWidth).toBe("0px")
    await expect(css(foot).borderTopWidth).toBe("1px")
    await expect(css(canvas.getByText("Elements of the first period")).color).toBe("rgb(134, 142, 150)")
    const opened = canvas.getByText("Opened details")
    const closed = canvas.getByText("Closed details")
    await expect(css(opened).cursor).toBe("pointer")
    await expect(css(opened, "::after").transform).not.toBe(css(closed, "::after").transform)
    await expect(canvas.getByText("Shown until the summary is clicked.")).toBeVisible()
    await expect(canvas.queryByText("Hidden until the summary is clicked.")).not.toBeVisible()
    await expect(css(opened.closest("details")).borderTopWidth).toBe("1px")
    const image = canvas.getByRole("img", { name: "A blue swatch" })
    await expect(css(image).maxWidth).toBe("100%")
    await expect(css(canvas.getByText("The last paragraph has no bottom margin.")).marginBottom).toBe("0px")
  }
}

export const Opening: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const closed = await canvas.findByText("Closed details")
    const before = css(closed, "::after").transform
    await userEvent.click(closed)
    await expect(canvas.getByText("Hidden until the summary is clicked.")).toBeVisible()
    await waitFor(() => expect(css(closed, "::after").transform).not.toBe(before))
    await expect(css(closed, "::before").width).toBe("20px")
  }
}

export const Sanitizing: StoryObj = {
  render: demo(SanitizeDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const paragraph = await canvas.findByText(/A paragraph inside a section/)
    await expect(paragraph.hasAttribute("onclick")).toBe(false)
    await expect(paragraph.hasAttribute("style")).toBe(false)
    await expect(canvasElement.querySelector("section, script, style")).toBeNull()
    await expect(canvas.getByText(/A script link/).hasAttribute("href")).toBe(false)
    await expect(canvas.getByText(/a data link/).hasAttribute("href")).toBe(false)
    const real = canvas.getByRole("link", { name: "a real link" })
    await expect(real.getAttribute("href")).toBe("https://mantine.dev")
    await expect(real.getAttribute("title")).toBe("Mantine")
    await expect(tagged(canvasElement, "br")).toBeInTheDocument()
    await expect(Reflect.get(window, "injected")).toBeUndefined()
  }
}

export const Children: StoryObj = {
  render: demo(ChildrenDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("heading", { level: 2, name: "Components inside" })).toBeVisible()
    await expect(canvas.getByText(/Components keep their own styles/)).toBeVisible()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const mark = await canvas.findByText("highlighted text")
    await expect(css(mark).backgroundColor).toBe("rgb(252, 196, 25)")
    await expect(css(mark).color).toBe("rgb(0, 0, 0)")
    await expect(css(canvas.getByText("inline code")).color).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByText(/Life is like an npm install/)).backgroundColor).toBe("rgb(31, 31, 31)")
  }
}
