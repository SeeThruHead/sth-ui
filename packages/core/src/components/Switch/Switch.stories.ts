import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as GroupDemo from "./demos/group.ts"
import * as GroupDisabledDemo from "./demos/group-disabled.ts"
import * as IconLabelsDemo from "./demos/icon-labels.ts"
import * as LabelsDemo from "./demos/labels.ts"
import * as MaxDemo from "./demos/max-selected.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as StatesDemo from "./demos/states.ts"
import * as ThumbIconDemo from "./demos/thumb-icon.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/Switch" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const thumbOf = (track: HTMLElement) => present(track.firstElementChild)

const blue = "rgb(34, 139, 230)"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "I agree to sell my privacy" })
    await expect(track).toBeChecked()
    await expect(box(track).width).toBe(38)
    await expect(box(track).height).toBe(20)
    await expect(css(track).backgroundColor).toBe(blue)
    await waitFor(() => expect(Math.round(box(thumbOf(track)).right)).toBe(Math.round(box(track).right - 2.5)))
    await expect(box(thumbOf(track)).width).toBe(14)
    await expect(css(thumbOf(track).firstElementChild).backgroundColor).toBe(blue)
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const track = await canvas.findByRole("switch", { name: "I agree to sell my privacy" })
    await userEvent.click(canvas.getByText("I agree to sell my privacy"))
    await waitFor(() => expect(track).not.toBeChecked())
    await waitFor(() => expect(css(track).backgroundColor).toBe("rgb(222, 226, 230)"))
    await waitFor(() => expect(Math.round(box(thumbOf(track)).left)).toBe(Math.round(box(track).left + 2.5)))
    track.focus()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(track).toBeChecked())
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("switch", { name: "Default switch" })).not.toBeChecked()
    await expect(canvas.getByRole("switch", { name: "Checked switch" })).toBeChecked()
    const disabled = canvas.getByRole("switch", { name: "Disabled checked switch" })
    await expect(disabled).toHaveAttribute("aria-disabled", "true")
    await expect(css(disabled).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(thumbOf(disabled)).backgroundColor).toBe("rgb(248, 249, 250)")
  }
}

export const TogglingStates: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "Default switch" })
    await userEvent.click(track)
    await waitFor(() => expect(track).toBeChecked())
  }
}

export const InnerLabels: StoryObj = {
  render: demoApp(LabelsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const xl = await canvas.findByRole("switch", { name: "Switch xl" })
    await expect(box(xl).height).toBe(36)
    await expect(box(xl).width).toBeGreaterThanOrEqual(72)
    await expect(xl).toHaveTextContent("OFF")
    await expect(box(canvas.getByRole("switch", { name: "Switch xs" })).height).toBe(16)
  }
}

export const SwitchingLabels: StoryObj = {
  render: demoApp(LabelsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const md = await within(canvasElement).findByRole("switch", { name: "Switch md" })
    await userEvent.click(md)
    await waitFor(() => expect(md).toHaveTextContent("ON"))
  }
}

export const IconLabels: StoryObj = {
  render: demoApp(IconLabelsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "Dark theme" })
    await expect(box(track.querySelector("svg")).width).toBe(16)
    await expect(box(track).height).toBe(24)
  }
}

export const SwitchingIcons: StoryObj = {
  render: demoApp(IconLabelsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "Dark theme" })
    const moon = present(track.querySelector("path")).getAttribute("d")
    await userEvent.click(track)
    await waitFor(() => expect(present(track.querySelector("path")).getAttribute("d")).not.toBe(moon))
    await waitFor(() => expect(css(track).backgroundColor).toBe("rgb(66, 66, 66)"))
  }
}

export const ThumbIcon: StoryObj = {
  render: demoApp(ThumbIconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "Switch with thumb icon" })
    await expect(thumbOf(track)).not.toHaveAttribute("data-with-thumb-indicator")
    await expect(box(thumbOf(track).querySelector("svg")).width).toBe(12)
  }
}

export const SwitchingThumbIcon: StoryObj = {
  render: demoApp(ThumbIconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "Switch with thumb icon" })
    await userEvent.click(track)
    await waitFor(() => expect(css(track).backgroundColor).toBe("rgb(18, 184, 134)"))
  }
}

export const Group: StoryObj = {
  render: demoApp(GroupDemo),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Select your favorite frameworks/libraries" })
    await expect(within(group).getAllByRole("switch")).toHaveLength(4)
    await expect(within(group).getByRole("switch", { name: "React" })).toBeChecked()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(GroupDemo),
  play: async ({ canvasElement }) => {
    const vue = await within(canvasElement).findByRole("switch", { name: "Vue" })
    await userEvent.click(vue)
    await waitFor(() => expect(vue).toBeChecked())
  }
}

export const MaxSelected: StoryObj = {
  render: demoApp(MaxDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("switch", { name: "Angular" })).not.toHaveAttribute("aria-disabled")
  }
}

export const ReachingTheMax: StoryObj = {
  render: demoApp(MaxDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("switch", { name: "Svelte" }))
    await waitFor(() => expect(canvas.getByRole("switch", { name: "Vue" })).toHaveAttribute("aria-disabled", "true"))
  }
}

export const GroupDisabled: StoryObj = {
  render: demoApp(GroupDisabledDemo),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("group", { name: "Select your favorite framework/library" })
    await expect(group).toHaveAccessibleDescription("This is anonymous")
    await Promise.all(
      within(group)
        .getAllByRole("switch")
        .map((track) => expect(track).toHaveAttribute("aria-disabled", "true"))
    )
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByRole("switch", { name: "Label on the left" })
    await expect(box(left).height).toBe(30)
    await expect(css(left).borderTopLeftRadius).toBe("2px")
    await expect(box(left).left).toBeGreaterThan(box(canvas.getByText("Label on the left")).right)
    await expect(left).toHaveAccessibleDescription("Large, small radius Needs a decision")
    await expect(left).toHaveAttribute("aria-invalid", "true")
    await expect(thumbOf(left).childElementCount).toBe(0)
    await expect(present(canvasElement.querySelector("input[type='hidden'][name='left']"))).toHaveValue("yes")
    const locked = canvas.getByRole("switch", { name: "Read only" })
    await userEvent.click(locked)
    await expect(locked).not.toBeChecked()
    await userEvent.click(left)
    await waitFor(() => expect(left).not.toBeChecked())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const track = await within(canvasElement).findByRole("switch", { name: "Default switch" })
    await expect(css(track).backgroundColor).toBe("rgb(59, 59, 59)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
