import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Kit } from "../../stories/harness.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as StatesDemo from "./demos/states.ts"
import * as GroupDemo from "./demos/group.ts"

const meta: Meta = { title: "Buttons/ActionIcon" }

export default meta

const star = ({ h }: Kit) => StarIcon(h, { size: "70%", weight: "fill" })

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const width = (element: Element | null | undefined) => element?.getBoundingClientRect().width ?? 0

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const settings = await within(canvasElement).findByRole("button", { name: "Settings" })
    await expect(width(settings)).toBe(28)
    await expect(css(settings).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(width(settings.querySelector("svg"))).toBeCloseTo(18.2, 1)
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByRole("button", { name: "Star filled" })
    await expect(width(filled)).toBe(28)
    await expect(css(filled).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(canvas.getByRole("button", { name: "Star outline" })).borderTopColor).toBe("rgb(34, 139, 230)")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(width(await canvas.findByRole("button", { name: "Size xs" }))).toBe(18)
    await expect(width(canvas.getByRole("button", { name: "Size xl" }))).toBe(44)
    await expect(width(canvas.getByRole("button", { name: "Size input-md" }))).toBe(42)
    await expect(width(canvas.getByRole("button", { name: "Size 40" }))).toBe(40)
    await expect(width(canvas.getByRole("button", { name: "Size 3rem" }))).toBe(48)
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saving = await canvas.findByRole("button", { name: "Saving" })
    await expect(saving).toBeDisabled()
    await expect(saving).toHaveAttribute("aria-busy", "true")
    await expect(css(saving.lastElementChild).opacity).toBe("0")
    const unavailable = canvas.getByRole("button", { name: "Unavailable" })
    await expect(unavailable).toBeDisabled()
    await expect(css(unavailable).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(canvas.getByRole("button", { name: "Gradient" })).backgroundImage).toContain("linear-gradient")
    await expect(css(canvas.getByRole("button", { name: "Gradient" })).borderTopLeftRadius).toBe("32px")
    await expect(css(canvas.getByRole("button", { name: "Contrast" })).color).toBe("rgb(0, 0, 0)")
    await expect(css(canvas.getByRole("button", { name: "Custom colour" })).backgroundColor).toBe("rgb(112, 72, 232)")
  }
}

export const Clicking: StoryObj = {
  render: story((kit) =>
    kit.ui.ActionIcon(kit.h, { onClick: kit.log("starred"), label: "Add star", children: [star(kit)] })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Add star" }))
    await waitFor(() => expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("starred"))
  }
}

export const Group: StoryObj = {
  render: demo(GroupDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const decrease = await canvas.findByRole("button", { name: "Decrease" })
    const count = canvas.getByText("12")
    await expect(css(decrease).borderTopRightRadius).toBe("0px")
    await expect(count.getBoundingClientRect().height).toBe(28)
    await expect(count.getBoundingClientRect().left).toBe(decrease.getBoundingClientRect().right)
    await expect(canvas.getByRole("group", { name: "Tools" })).toHaveAttribute("data-orientation", "vertical")
    await expect(canvas.getByText("3").getBoundingClientRect().height).toBe(34)
    await expect(css(canvas.getByRole("button", { name: "Up" })).borderBottomWidth).toBe("1px")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
