import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AcceptDemo from "./demos/accept.ts"
import * as BothSectionsDemo from "./demos/both-sections.ts"
import * as ClearableDemo from "./demos/clearable.ts"
import * as ErrorDemo from "./demos/error.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as SectionsDemo from "./demos/sections.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as ValueComponentDemo from "./demos/value-component.ts"

const meta: Meta = { title: "Inputs/FileInput" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const fileFieldOf = (button: HTMLElement) =>
  present(button.closest("div:has(> input[type='file'])")?.querySelector<HTMLInputElement>("input[type='file']"))

const file = (name: string) => new File(["contents"], name, { type: "text/plain" })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Input label" })
    await expect(button).toHaveAccessibleDescription("Input description")
    await expect(within(button).getByText("Input placeholder")).toBeVisible()
    await expect(css(within(button).getByText("Input placeholder")).color).toBe("rgb(173, 181, 189)")
    await expect(box(button).height).toBe(36)
    await expect(box(present(button.parentElement)).width).toBe(340)
    await expect(css(button).cursor).toBe("pointer")
    await expect(css(fileFieldOf(button)).display).toBe("none")
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Input label" })
    const field = fileFieldOf(button)
    field.addEventListener("click", () => field.setAttribute("data-opened", ""), { once: true })
    await userEvent.click(button)
    await waitFor(() => expect(field).toHaveAttribute("data-opened"))
    await expect(field).not.toHaveAttribute("multiple")
  }
}

export const Uploading: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Input label" })
    await userEvent.upload(fileFieldOf(button), file("cv.pdf"))
    await waitFor(() => expect(within(button).getByText("cv.pdf")).toBeVisible())
  }
}

export const Multiple: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Upload files" })
    await expect(fileFieldOf(button)).toHaveAttribute("multiple")
    await userEvent.upload(fileFieldOf(button), [file("a.txt"), file("b.txt")])
    await waitFor(() => expect(within(button).getByText("a.txt, b.txt")).toBeVisible())
  }
}

export const Accept: StoryObj = {
  render: demoApp(AcceptDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Upload files" })
    await expect(fileFieldOf(button)).toHaveAttribute("accept", "image/png,image/jpeg")
  }
}

export const Clearable: StoryObj = {
  render: demoApp(ClearableDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Upload files" })
    await expect(within(canvasElement).queryByRole("button", { name: "Clear" })).toBeNull()
    const field = fileFieldOf(button)
    await userEvent.upload(field, file("notes.txt"))
    const clear = await within(canvasElement).findByRole("button", { name: "Clear" })
    await userEvent.click(clear)
    await waitFor(() => expect(within(button).getByText("Upload files")).toBeVisible())
    await expect(fileFieldOf(button)).not.toBe(field)
    await expect(within(canvasElement).queryByRole("button", { name: "Clear" })).toBeNull()
  }
}

export const ValueComponent: StoryObj = {
  render: demoApp(ValueComponentDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Upload files" })
    await userEvent.upload(fileFieldOf(button), [file("one.png"), file("two.png")])
    await waitFor(() => expect(within(button).getByText("two.png")).toBeVisible())
    await expect(css(present(within(button).getByText("one.png").parentElement)).borderTopLeftRadius).toBe("16000px")
  }
}

export const Error: StoryObj = {
  render: demoApp(ErrorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("button", { name: "Boolean error" })
    await expect(css(within(plain).getByText("Boolean error")).color).toBe("rgb(250, 82, 82)")
    await expect(css(plain).borderTopColor).toBe("rgb(250, 82, 82)")
    await expect(canvas.getByRole("button", { name: "With error message" })).toHaveAccessibleDescription("Invalid name")
  }
}

export const Sections: StoryObj = {
  render: demoApp(SectionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [left, right] = await within(canvasElement).findAllByRole("button", { name: "Attach your CV" })
    await expect(css(left).paddingLeft).toBe("34px")
    await expect(css(right).paddingRight).toBe("34px")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const locked = await canvas.findByRole("button", { name: "Disabled" })
    await expect(locked).toBeDisabled()
    await expect(fileFieldOf(locked)).toBeDisabled()
    const modes = canvas.getByRole("button", { name: "Right section only" })
    await expect(fileFieldOf(modes)).toHaveAttribute("name", "cv")
    await expect(fileFieldOf(modes)).toHaveAttribute("form", "cv-form")
    await expect(fileFieldOf(modes)).toHaveAttribute("capture", "user")
    await userEvent.upload(fileFieldOf(modes), file("cv.pdf"))
    await waitFor(() => expect(within(modes).getByText("cv.pdf")).toBeVisible())
    await expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull()
    const only = canvas.getByRole("button", { name: "Clear only" })
    const section = present(only.parentElement?.querySelector("svg"))
    await expect(section).toBeVisible()
    await userEvent.upload(fileFieldOf(only), file("cv.pdf"))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible())
    await expect(present(only.parentElement).querySelectorAll("svg")).toHaveLength(1)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Input label" })
    await expect(css(button).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const BothSections: StoryObj = {
  render: demoApp(BothSectionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Clear and icon" })
    await userEvent.upload(fileFieldOf(button), file("cv.pdf"))
    const clear = await within(canvasElement).findByRole("button", { name: "Clear" })
    await expect(present(clear.parentElement).querySelectorAll("svg")).toHaveLength(2)
    await waitFor(() => expect(css(button).paddingRight).toBe("50px"))
    await expect(box(present(clear.parentElement).querySelectorAll("svg")[1]).right).toBeLessThan(box(button).right)
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
