import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as ColorsDemo from "./demos/colors.ts"
import * as ContentDemo from "./demos/content.ts"
import * as ExtrasDemo from "./demos/extras.ts"
import * as ImagesDemo from "./demos/images.ts"
import * as StylesDemo from "./demos/styles.ts"
import * as TablesDemo from "./demos/tables.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "Tiptap/RichTextEditor" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const editor = await canvas.findByRole("textbox")
    await expect(
      await within(editor).findByRole("heading", { name: "Welcome to Mantine rich text editor" })
    ).toBeVisible()
    await expect(canvas.getByRole("toolbar")).toBeVisible()
    const bold = canvas.getByRole("button", { name: "Bold" })
    await userEvent.click(within(editor).getByText("Headings (h1-h6)"))
    await userEvent.keyboard("{Control>}a{/Control}")
    await userEvent.click(bold)
    await waitFor(() => expect(bold).toHaveAttribute("aria-pressed", "true"))
    await expect(within(editor).getByText("Headings (h1-h6)").tagName).toBe("STRONG")
    await expect(canvas.getByRole("button", { name: "Undo" })).toBeEnabled()
    await expect(canvas.getByRole("button", { name: "Redo" })).toBeDisabled()
  }
}

export const Variants: StoryObj = {
  render: demoApp(VariantsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const editor = await canvas.findByRole("textbox")
    await waitFor(() =>
      expect(editor.querySelector("[data-placeholder]")).toHaveAttribute("data-placeholder", "Write something")
    )
    await expect(canvas.getByRole("button", { name: "Make bold" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Task list" })).toBeEnabled()
    await waitFor(() => expect(canvas.getByRole("button", { name: "Decrease task level" })).toBeDisabled())
    await expect(canvas.getByRole("button", { name: "Delete table" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Insert table" })).toBeDisabled()
    await userEvent.click(editor)
    await userEvent.click(canvas.getByRole("button", { name: "Task list" }))
    const star = canvas.getByRole("button", { name: "Star" })
    await userEvent.click(star)
    await waitFor(() => expect(canvas.getByRole("button", { name: "Star" })).toHaveAttribute("aria-pressed", "true"))
    await expect(canvas.getByRole("button", { name: "Status" })).not.toHaveAttribute("data-interactive")
    await expect(canvas.getByRole("button", { name: "Locked" })).toBeDisabled()
    await userEvent.click(canvas.getByRole("button", { name: "Link" }))
    const external = await within(document.body).findByRole("button", { name: "Open link in the same tab" })
    await expect(external).not.toHaveAttribute("title")
  }
}

export const Content: StoryObj = {
  render: demoApp(ContentDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const editor = await canvas.findByRole("textbox")
    await userEvent.click(canvas.getByRole("button", { name: "Load sample" }))
    await expect(await within(editor).findByRole("heading", { level: 6, name: "Heading 6" })).toBeVisible()
    await expect(within(editor).getByText("inline code").closest("code")).not.toBeNull()
    await expect(within(editor).getByText("A quote")).toBeVisible()
    await expect(within(editor).getByText("const answer = 42")).toBeVisible()
    await expect(await canvas.findByText(/[1-9][0-9]* characters of HTML/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Hide editor" }))
    await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Show editor" }))
    await expect(await canvas.findByRole("textbox")).toBeVisible()
  }
}

export const Linking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const editor = await canvas.findByRole("textbox")
    await userEvent.click(within(editor).getByText("Headings (h1-h6)"))
    await userEvent.click(canvas.getByRole("button", { name: "Link" }))
    await expect(await page.findByRole("textbox", { name: "Enter URL" })).toHaveValue("")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("textbox", { name: "Enter URL" })).toBeNull(), { timeout: 3000 })
    await userEvent.click(within(editor).getByText("Headings (h1-h6)"))
    await userEvent.keyboard("{Control>}a{/Control}")
    await userEvent.click(canvas.getByRole("button", { name: "Link" }))
    const url = await page.findByRole("textbox", { name: "Enter URL" })
    await expect(url).toHaveValue("https://tiptap.dev/")
    await userEvent.clear(url)
    await userEvent.type(url, "https://sth.dev", { delay: 20 })
    await waitFor(() => expect(url).toHaveValue("https://sth.dev"))
    url.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }))
    await waitFor(() => expect(page.queryByRole("textbox", { name: "Enter URL" })).toBeNull(), { timeout: 3000 })
    await waitFor(
      () =>
        expect(within(editor).getByText("Headings (h1-h6)").closest("a")).toHaveAttribute("href", "https://sth.dev"),
      { timeout: 3000 }
    )
    await waitFor(() => expect(canvas.getByRole("button", { name: "Link" })).toHaveAttribute("data-active"), {
      timeout: 3000
    })
    await userEvent.click(canvas.getByRole("button", { name: "Link" }))
    const again = await page.findByRole("textbox", { name: "Enter URL" })
    await expect(again).toHaveValue("https://sth.dev")
    const external = page.getByRole("button", { name: "Open link in a new tab" })
    await expect(external).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(external)
    await expect(await page.findByRole("button", { name: "Open link in the same tab" })).not.toHaveAttribute(
      "aria-pressed"
    )
    await userEvent.click(page.getByRole("button", { name: "Save" }))
    await waitFor(
      () => expect(within(editor).getByText("Headings (h1-h6)").closest("a")).not.toHaveAttribute("target", "_blank"),
      { timeout: 3000 }
    )
    await waitFor(() => expect(page.queryByRole("textbox", { name: "Enter URL" })).toBeNull(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Link" }))
    const last = await page.findByRole("textbox", { name: "Enter URL" })
    await waitFor(() => expect(page.getByRole("button", { name: "Open link in the same tab" })).toBeVisible())
    await userEvent.clear(last)
    await userEvent.click(page.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(within(editor).getByText("Headings (h1-h6)").closest("a")).toBeNull(), { timeout: 3000 })
  }
}

export const Colors: StoryObj = {
  render: demoApp(ColorsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const editor = await canvas.findByRole("textbox")
    const text = () => within(editor).getByText("Apply some colors to this text")
    await userEvent.click(text())
    await userEvent.keyboard("{Control>}a{/Control}")
    await userEvent.click(canvas.getByRole("button", { name: "Text color" }))
    await userEvent.click(await page.findByRole("button", { name: "Color picker" }))
    await waitFor(async () => expect((await page.findAllByRole("slider"))[0]).toBeVisible())
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryAllByRole("slider")).toHaveLength(0), { timeout: 3000 })
    await userEvent.click(text())
    await userEvent.keyboard("{Control>}a{/Control}")
    const red = canvas.getByRole("button", { name: "Set text color #F03E3E" })
    await userEvent.click(red)
    await waitFor(() => expect(red).toHaveAttribute("data-active"), { timeout: 3000 })
    await expect(text().closest(`span[style*="color"]`)).toHaveStyle({ color: "rgb(240, 62, 62)" })
    const picker = canvas.getByRole("button", { name: "Text color" })
    await userEvent.click(picker)
    await userEvent.click(await page.findByRole("button", { name: "Set text color #228be6" }))
    await waitFor(() => expect(text().closest(`span[style*="color"]`)).toHaveStyle({ color: "rgb(34, 139, 230)" }), {
      timeout: 3000
    })
    await waitFor(() => expect(page.queryByRole("button", { name: "Cancel" })).toBeNull(), { timeout: 3000 })
    await userEvent.click(picker)
    await userEvent.click(await page.findByRole("button", { name: "Color picker" }))
    const [saturation, hue] = await page.findAllByRole("slider")
    await waitFor(() => expect(saturation).toBeVisible())
    await userEvent.click(present(hue))
    await waitFor(
      () => expect(text().closest(`span[style*="color"]`)).not.toHaveStyle({ color: "rgb(34, 139, 230)" }),
      {
        timeout: 3000
      }
    )
    await userEvent.click(page.getByRole("button", { name: "Color palette" }))
    await waitFor(async () => expect(await page.findByRole("button", { name: "Cancel" })).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "Color picker" }))
    await userEvent.click(await page.findByRole("button", { name: "Save" }))
    await waitFor(() => expect(page.queryAllByRole("slider")).toHaveLength(0), { timeout: 3000 })
    await userEvent.click(picker)
    await userEvent.click(await page.findByRole("button", { name: "Clear color" }))
    await waitFor(() => expect(text().closest(`span[style*="color"]`)).toBeNull(), { timeout: 3000 })
    await userEvent.click(picker)
    await userEvent.click(await page.findByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(page.queryByRole("button", { name: "Cancel" })).toBeNull(), { timeout: 3000 })
    await userEvent.click(red)
    await userEvent.click(canvas.getByRole("button", { name: "Unset color" }))
    await waitFor(() => expect(text().closest(`span[style*="color"]`)).toBeNull(), { timeout: 3000 })
  }
}

export const Extras: StoryObj = {
  render: demoApp(ExtrasDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const editor = await canvas.findByRole("textbox")
    const invisible = canvas.getByRole("button", { name: "Toggle invisible characters" })
    await waitFor(() => expect(invisible).toHaveAttribute("data-active"), { timeout: 3000 })
    await userEvent.click(invisible)
    await waitFor(() => expect(invisible).not.toHaveAttribute("data-active"), { timeout: 3000 })
    await userEvent.click(within(editor).getByText("Some text to fold away"))
    const details = canvas.getByRole("button", { name: "Toggle collapsible section" })
    await userEvent.click(details)
    await waitFor(() => expect(details).toHaveAttribute("data-active"), { timeout: 3000 })
    await expect(editor.querySelector("[data-type='details']")).not.toBeNull()
    await userEvent.click(details)
    await waitFor(() => expect(details).not.toHaveAttribute("data-active"), { timeout: 3000 })
    const source = canvas.getByRole("button", { name: "Switch between text/source code" })
    await userEvent.click(source)
    await expect(await canvas.findByText("Source code mode")).toBeVisible()
    await waitFor(() => expect(within(editor).getByText(/<p>Some text to fold away<\/p>/)).toBeVisible(), {
      timeout: 3000
    })
    await userEvent.click(source)
    await expect(await canvas.findByText("Text mode")).toBeVisible()
    await waitFor(() => expect(within(editor).getByText("Some text to fold away").tagName).toBe("P"), { timeout: 3000 })
  }
}

export const Tables: StoryObj = {
  render: demoApp(TablesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const editor = await canvas.findByRole("textbox")
    await userEvent.click(within(editor).getByText("Insert a table below"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Delete table" })).toBeDisabled(), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Insert table" }))
    const cell = await page.findByRole("button", { name: "Insert 3 × 2 table" })
    await userEvent.hover(cell)
    await waitFor(async () => expect(await page.findByText("3 × 2")).toBeVisible())
    await userEvent.unhover(cell)
    await userEvent.hover(page.getByRole("button", { name: "Insert 1 × 1 table" }))
    present(page.getByRole("button", { name: "Insert 1 × 1 table" }).parentElement).dispatchEvent(
      new MouseEvent("mouseleave")
    )
    await waitFor(() => expect(page.getAllByText("Insert table").length).toBeGreaterThan(0))
    await userEvent.click(page.getByRole("button", { name: "Insert 3 × 2 table" }))
    await waitFor(() => expect(editor.querySelectorAll("tr")).toHaveLength(2), { timeout: 3000 })
    await expect(editor.querySelectorAll("th")).toHaveLength(3)
    await waitFor(() => expect(canvas.getByRole("button", { name: "Add column after" })).toBeEnabled(), {
      timeout: 3000
    })
    await userEvent.click(canvas.getByRole("button", { name: "Add column after" }))
    await waitFor(() => expect(editor.querySelectorAll("th")).toHaveLength(4), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Toggle header row" }))
    await waitFor(() => expect(editor.querySelectorAll("th")).toHaveLength(0), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Delete table" }))
    await waitFor(() => expect(editor.querySelector("table")).toBeNull(), { timeout: 3000 })
  }
}

const imageFile = (name: string) =>
  new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], name, { type: "image/svg+xml" })

const transfer = (files: ReadonlyArray<File>) => {
  const data = new DataTransfer()
  files.forEach((item) => data.items.add(item))

  return data
}

const withText = (data: DataTransfer, text: string) => {
  data.setData("text/plain", text)

  return data
}

export const Images: StoryObj = {
  render: demoApp(ImagesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [editor, plain] = await canvas.findAllByRole("textbox")
    if (editor === undefined || plain === undefined) throw new Error("two editors expected")
    await userEvent.click(within(editor).getByText("Upload an image"))
    const [control, plainControl] = canvas.getAllByRole("button", { name: "Upload image" })
    if (control === undefined || plainControl === undefined) throw new Error("two controls expected")
    await waitFor(() => expect(control).toBeEnabled(), { timeout: 3000 })
    const input = present(control.closest("div")?.querySelector<HTMLInputElement>("input[type=file]"))
    await userEvent.click(control)
    await userEvent.upload(input, [imageFile("photo.svg"), imageFile("logo.svg"), imageFile("fail.svg")])
    await waitFor(() => expect(editor.querySelector("img[src='images/avatar-1.svg']")).not.toBeNull(), {
      timeout: 3000
    })
    await waitFor(() => expect(within(editor).getByRole("img", { name: "logo.svg" })).toBeVisible(), { timeout: 3000 })
    await expect(editor.querySelectorAll("img")).toHaveLength(3)
    await waitFor(() => expect(editor.querySelectorAll("img")).toHaveLength(2), { timeout: 6000 })
    const content = present(editor.querySelector(".ProseMirror") ?? editor)
    content.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: withText(transfer([new File(["x"], "a.txt")]), "x")
      })
    )
    content.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer([imageFile("pasted.svg")])
      })
    )
    await waitFor(() => expect(editor.querySelectorAll("img")).toHaveLength(3), { timeout: 3000 })
    const box = content.getBoundingClientRect()
    content.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        clientX: box.left + 4,
        clientY: box.top + 4,
        dataTransfer: transfer([imageFile("dropped.svg")])
      })
    )
    await waitFor(() => expect(editor.querySelectorAll("img")).toHaveLength(4), { timeout: 3000 })
    editor.dispatchEvent(new Event("sth-image-files", { bubbles: true }))
    editor.dispatchEvent(new CustomEvent("sth-image-files", { bubbles: true, detail: { nothing: true } }))
    await expect(editor.querySelectorAll("img")).toHaveLength(4)
    await userEvent.click(within(plain).getByText("No uploads here"))
    const plainInput = present(plainControl.closest("div")?.querySelector<HTMLInputElement>("input[type=file]"))
    await userEvent.upload(plainInput, [new File(["png"], "photo.png", { type: "image/png" })])
    await expect(plain.querySelector("img")).toBeNull()
  }
}

const spanWith = (root: Element, text: string) =>
  present(Array.from(root.querySelectorAll("span")).find((span) => span.textContent === text))

export const Styles: StoryObj = {
  render: demoApp(StylesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getAllByRole("textbox")).toHaveLength(3))
    const [highlighted, unhighlighted, bare] = canvas.getAllByRole("textbox")
    const block = present(present(highlighted).querySelector("pre"))
    await waitFor(() =>
      expect(getComputedStyle(spanWith(block, "// Greets everyone")).color).toBe("rgb(173, 181, 189)")
    )
    await expect(getComputedStyle(spanWith(block, "const")).color).toBe("rgb(112, 72, 232)")
    await expect(getComputedStyle(spanWith(block, "42")).color).toBe("rgb(28, 126, 214)")
    const sql = present(present(highlighted).querySelectorAll("pre")[1])
    await expect(getComputedStyle(spanWith(sql, "1")).color).toBe("rgb(28, 126, 214)")
    const plainBlock = present(present(unhighlighted).querySelector("pre"))
    await expect(getComputedStyle(plainBlock).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(getComputedStyle(spanWith(plainBlock, "const")).color).toBe(getComputedStyle(plainBlock).color)
    const title = within(present(bare)).getByRole("heading", { level: 2 })
    await expect(getComputedStyle(title).fontSize).toBe("24px")
    await expect(getComputedStyle(within(present(bare)).getByText("inline code")).backgroundColor).toBe(
      "rgba(0, 0, 0, 0)"
    )
  }
}

export const StylesDark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StylesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getAllByRole("textbox")).toHaveLength(3))
    const block = present(present(canvas.getAllByRole("textbox")[0]).querySelector("pre"))
    await waitFor(() => expect(getComputedStyle(spanWith(block, "const")).color).toBe("rgb(177, 151, 252)"))
    await expect(getComputedStyle(spanWith(block, "// Greets everyone")).color).toBe("rgb(130, 130, 130)")
  }
}
