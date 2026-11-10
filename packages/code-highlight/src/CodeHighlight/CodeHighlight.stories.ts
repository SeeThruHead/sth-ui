import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Code highlight/CodeHighlight" }

export default meta

const blocks = (canvasElement: HTMLElement) => Array.from(canvasElement.querySelectorAll<HTMLElement>("pre code"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(blocks(canvasElement)).toHaveLength(7))
    const [plain, collapsed, tabs] = blocks(canvasElement)
    await expect(present(plain).textContent).toBe(
      "const add = (a, b) => {\n  return a + b\n}\n\nfunction twice(x) {\n  return add(x, x)\n}"
    )
    await expect(present(plain).querySelector(".token-keyword")).toBeNull()
    await expect(present(collapsed).querySelectorAll(".token-keyword").length).toBeGreaterThan(5)
    await expect(present(collapsed)).toHaveClass("language-ts")
    await expect(present(tabs).textContent).toBe("const add = 1")
    await expect(canvas.getAllByRole("button", { name: "Copy code" })).toHaveLength(3)
    await expect(canvas.getByRole("button", { name: "Copy it code" })).toBeVisible()
    await expect(canvas.getAllByRole("button", { name: "Show all" })).toHaveLength(2)
    await expect(present(canvasElement.querySelector("[data-collapsed]"))).toBeVisible()
    await expect(present(canvasElement.querySelector("[data-extra-control]"))).toHaveTextContent("ts")
    await expect(canvas.getByRole("tab", { name: "TS add.ts" })).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByRole("tab", { name: "JS twice.js" })).toBeVisible()
    await expect(canvas.getByText("useState()")).toHaveAttribute("data-with-border")
    const inline = present(
      Array.from(canvasElement.querySelectorAll("code")).find((code) => code.textContent === "const x")
    )
    await expect(inline.querySelector(".token-keyword")).toHaveTextContent("const")
    await expect(canvasElement.querySelector("[data-code-color-scheme='dark'] [aria-hidden] div")).toHaveTextContent(
      "1"
    )
    const [, , , light, bordered, dark, unnamed] = blocks(canvasElement)
    await expect(present(light).querySelector(".token-keyword")).toHaveTextContent("const")
    await expect(present(bordered).closest("[data-with-border]")).not.toHaveAttribute("data-code-color-scheme")
    await expect(present(dark).closest("pre")).toHaveAttribute("data-with-offset")
    await expect(canvas.getByRole("tab", { name: "dark.ts" })).toHaveAttribute("data-color-scheme", "dark")
    await expect(present(unnamed).textContent).toBe("no name")
  }
}

export const Interacting: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findAllByRole("button", { name: "Show all" }).then((buttons) => present(buttons.at(-1)))
    )
    await expect(await canvas.findByText("Last event: expanded true")).toBeVisible()
    await expect(canvasElement.querySelector("[data-collapsed]")).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Show less" }))
    await expect(await canvas.findByText("Last event: expanded false")).toBeVisible()
    await userEvent.click(present(canvas.getAllByRole("button", { name: "Show all" })[0]))
    await userEvent.click(present(canvas.getAllByRole("button", { name: "Copy code" })[0]))
    await expect((await canvas.findAllByRole("button", { name: "Copied" })).length).toBeGreaterThan(0)
    const failing = spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"))
    await userEvent.click(canvas.getByRole("button", { name: "Copy it code" }))
    await waitFor(() => expect(failing).toHaveBeenCalled())
    await expect(canvas.getByRole("button", { name: "Copy it code" })).toBeVisible()
    failing.mockRestore()
    await userEvent.click(canvas.getByRole("tab", { name: "? notes.txt" }))
    await expect(await canvas.findByText("Last event: tab 1")).toBeVisible()
    await waitFor(() => expect(present(blocks(canvasElement)[2]).textContent).toBe("plain words"))
    await expect(present(blocks(canvasElement)[2]).querySelector(".token-keyword")).toBeNull()
  }
}
