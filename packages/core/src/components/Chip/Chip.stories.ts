import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DeselectDemo from "./demos/deselect.ts"
import * as GroupDemo from "./demos/group.ts"
import * as IconDemo from "./demos/icon.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/Chip" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const blue = "rgb(34, 139, 230)"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const chip = await within(canvasElement).findByRole("checkbox", { name: "Awesome chip" })
    await expect(chip).toBeChecked()
    await expect(box(chip).height).toBe(28)
    await expect(css(chip).backgroundColor).toBe(blue)
    await expect(css(chip).color).toBe("rgb(255, 255, 255)")
    await expect(css(chip).paddingLeft).toBe("10px")
    await expect(box(chip.querySelector("svg")).width).toBe(12)
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const chip = await within(canvasElement).findByRole("checkbox", { name: "Awesome chip" })
    await userEvent.click(chip)
    await waitFor(() => expect(chip).not.toBeChecked())
    await expect(css(chip).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(css(chip).paddingLeft).toBe("20px")
    await expect(chip.querySelector("svg")).toBeNull()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(chip).toBeChecked())
  }
}

export const Icon: StoryObj = {
  render: demoApp(IconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const chip = await within(canvasElement).findByRole("checkbox", { name: "Forbidden" })
    await expect(css(chip).backgroundColor).toBe("rgb(250, 82, 82)")
    await expect(box(chip.querySelector("svg")).width).toBe(16)
  }
}

export const TogglingIcon: StoryObj = {
  render: demoApp(IconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const chip = await within(canvasElement).findByRole("checkbox", { name: "Forbidden" })
    await userEvent.click(chip)
    await waitFor(() => expect(chip).not.toBeChecked())
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const outline = await canvas.findByRole("checkbox", { name: "Outline checked" })
    await expect(css(outline).borderTopColor).toBe(blue)
    await expect(css(outline).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByRole("checkbox", { name: "Outline default" })).borderTopColor).toBe(
      "rgb(222, 226, 230)"
    )
    await expect(css(canvas.getByRole("checkbox", { name: "Light checked" })).backgroundColor).toBe(
      "rgb(208, 235, 255)"
    )
    await expect(css(canvas.getByRole("checkbox", { name: "Filled checked" })).backgroundColor).toBe(blue)
    const disabled = canvas.getByRole("checkbox", { name: "Filled checked disabled" })
    await expect(disabled).toBeDisabled()
    await expect(css(disabled).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(disabled).color).toBe("rgb(173, 181, 189)")
    await expect(css(disabled.querySelector("svg")).color).toBe("rgb(173, 181, 189)")
  }
}

export const ClickingStates: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const chip = await within(canvasElement).findByRole("checkbox", { name: "Outline default" })
    await userEvent.click(chip)
    await expect(chip).not.toBeChecked()
  }
}

export const Group: StoryObj = {
  render: demoApp(GroupDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole("radio")).toHaveLength(3)
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(3)
    await expect(canvas.getByRole("radio", { name: "Single chip" })).not.toBeChecked()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(GroupDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first, second] = await canvas.findAllByRole("radio")
    await userEvent.click(present(first))
    await waitFor(() => expect(present(first)).toBeChecked())
    await userEvent.click(present(second))
    await waitFor(() => expect(present(second)).toBeChecked())
    await expect(present(first)).not.toBeChecked()
    await userEvent.click(present(second))
    await expect(present(second)).toBeChecked()
    const many = canvas.getAllByRole("checkbox")
    await userEvent.click(present(many[0]))
    await waitFor(() => expect(present(many[0])).toBeChecked())
    await userEvent.click(present(many[2]))
    await waitFor(() => expect(present(many[2])).toBeChecked())
    await expect(present(many[0])).toBeChecked()
    await userEvent.click(present(many[0]))
    await waitFor(() => expect(present(many[0])).not.toBeChecked())
  }
}

export const Deselect: StoryObj = {
  render: demoApp(DeselectDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("radio", { name: "First" })).toBeChecked()
  }
}

export const Deselecting: StoryObj = {
  render: demoApp(DeselectDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("radio", { name: "First" })
    await userEvent.click(first)
    await waitFor(() => expect(first).not.toBeChecked())
    await userEvent.click(canvas.getByRole("radio", { name: "Third" }))
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Third" })).toBeChecked())
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const xl = await canvas.findByRole("checkbox", { name: "Extra large" })
    await expect(box(xl).height).toBe(40)
    await expect(css(xl).borderTopLeftRadius).toBe("2px")
    await expect(present(canvasElement.querySelector("input[name='xl']"))).toHaveValue("on")
    await expect(css(canvas.getByRole("checkbox", { name: "Auto contrast" })).color).not.toBe("rgb(255, 255, 255)")
    const plain = canvas.getByRole("checkbox", { name: "No icon" })
    await userEvent.click(plain)
    await waitFor(() => expect(plain).toBeChecked())
    await expect(plain.querySelector("svg")).toBeNull()
    await expect(present(canvasElement.querySelector("input[name='plain']"))).toHaveValue("yes")
    const locked = canvas.getByRole("checkbox", { name: "Read only" })
    await userEvent.click(locked)
    await expect(locked).toBeChecked()
    const single = canvas.getByRole("radio", { name: "Single" })
    await userEvent.click(single)
    await waitFor(() => expect(single).toBeChecked())
    await userEvent.click(single)
    await expect(single).toBeChecked()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const chip = await within(canvasElement).findByRole("checkbox", { name: "Light default" })
    await expect(css(chip).backgroundColor).toBe("rgb(59, 59, 59)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
