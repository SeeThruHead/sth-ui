import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as GroupDemo from "./demos/group.ts"
import * as GroupDisabledDemo from "./demos/group-disabled.ts"
import * as IconColorDemo from "./demos/icon-color.ts"
import * as IconDemo from "./demos/icon.ts"
import * as LightDemo from "./demos/light-variant.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as CardGroupDemo from "./demos/card-group.ts"
import * as IndicatorDemo from "./demos/indicator.ts"

const meta: Meta = { title: "Inputs/Radio" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const iconOf = (radio: HTMLElement) => present(radio.nextElementSibling)

const blue = "rgb(34, 139, 230)"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radio = await within(canvasElement).findByRole("radio", { name: "I cannot be unchecked" })
    await expect(radio).not.toBeChecked()
    await expect(box(radio).width).toBe(20)
    await expect(css(radio).borderTopLeftRadius).toBe("1000px")
    await expect(css(iconOf(radio)).opacity).toBe("0")
  }
}

export const Checking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const radio = await canvas.findByRole("radio", { name: "I cannot be unchecked" })
    const label = canvas.getByText("I cannot be unchecked")
    await expect(document.querySelectorAll("#usage")).toHaveLength(1)
    await userEvent.click(label)
    await waitFor(() => expect(radio).toBeChecked())
    await waitFor(() => expect(css(radio).backgroundColor).toBe(blue))
    await waitFor(() => expect(css(iconOf(radio)).opacity).toBe("1"))
    await waitFor(() => expect(box(iconOf(radio)).width).toBe(8))
    await userEvent.click(radio)
    await expect(radio).toBeChecked()
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("radio", { name: "Default radio" })).not.toBeChecked()
    await expect(css(canvas.getByRole("radio", { name: "Checked radio" })).backgroundColor).toBe(blue)
    const outline = canvas.getByRole("radio", { name: "Outline checked radio" })
    await expect(css(outline).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(iconOf(outline)).color).toBe(blue)
    const disabled = canvas.getByRole("radio", { name: "Disabled checked radio" })
    await expect(disabled).toHaveAttribute("aria-disabled", "true")
    await expect(css(disabled).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(iconOf(disabled)).color).toBe("rgb(173, 181, 189)")
  }
}

export const CheckingStates: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radio = await within(canvasElement).findByRole("radio", { name: "Default radio" })
    await userEvent.click(radio)
    await waitFor(() => expect(radio).toBeChecked())
    await userEvent.click(within(canvasElement).getByRole("radio", { name: "Disabled radio" }))
    await expect(within(canvasElement).getByRole("radio", { name: "Disabled radio" })).not.toBeChecked()
  }
}

export const LightVariant: StoryObj = {
  render: demoApp(LightDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radio = await within(canvasElement).findByRole("radio", { name: "Light radio" })
    await expect(css(radio).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(iconOf(radio)).color).toBe("rgb(24, 100, 171)")
  }
}

export const Icon: StoryObj = {
  render: demoApp(IconDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radio = await within(canvasElement).findByRole("radio", { name: "Custom check icon" })
    await expect(radio).toBeChecked()
    await expect(box(iconOf(radio).querySelector("svg")).width).toBe(8)
    await expect(present(canvasElement.querySelector("input[type='hidden'][name='check']"))).toHaveValue("check")
  }
}

export const IconColor: StoryObj = {
  render: demoApp(IconColorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radio = await within(canvasElement).findByRole("radio", { name: "Custom icon color" })
    await expect(css(radio).backgroundColor).toBe("rgb(169, 227, 75)")
    await expect(css(iconOf(radio)).color).toBe("rgb(31, 31, 31)")
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radios = await within(canvasElement).findAllByRole("radio")
    await expect(radios).toHaveLength(3)
    await Promise.all(radios.map((radio) => expect(radio).toHaveAttribute("aria-disabled", "true")))
    await expect(within(canvasElement).getByRole("radio", { name: "React" })).toBeChecked()
  }
}

export const Group: StoryObj = {
  render: demoApp(GroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByRole("radiogroup", { name: "Select your favorite framework/library" })
    await expect(group).toHaveAccessibleDescription("This is anonymous")
    await expect(within(group).getAllByRole("radio")).toHaveLength(4)
    await expect(within(group).getByRole("radio", { name: "React" })).toHaveAttribute("tabindex", "0")
    await expect(group).toHaveAttribute("aria-orientation", "horizontal")
    await expect(canvas.queryByRole("textbox")).toBeNull()
    await expect(canvas.getByText("*")).toBeVisible()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(GroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByText("Svelte"))
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Svelte" })).toBeChecked())
    await expect(present(canvasElement.querySelector("input[name='favoriteFramework']"))).toHaveValue("svelte")
    canvas.getByRole("radio", { name: "Svelte" }).focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Angular" })).toHaveFocus())
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Angular" })).toBeChecked())
    await expect(canvas.getByRole("radio", { name: "Svelte" })).not.toBeChecked()
  }
}

export const GroupDisabled: StoryObj = {
  render: demoApp(GroupDisabledDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByRole("radiogroup", { name: "Select your favorite framework/library" })
    await expect(within(group).getAllByRole("radio")).toHaveLength(3)
    await userEvent.click(canvas.getByText("Angular"))
    await expect(canvas.getByRole("radio", { name: "Angular" })).not.toBeChecked()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const radio = await within(canvasElement).findByRole("radio", { name: "Default radio" })
    await expect(css(radio).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByRole("radio", { name: "Label on the left" })
    await expect(box(left).width).toBe(30)
    await expect(css(left).borderTopLeftRadius).toBe("2px")
    await expect(box(left).left).toBeGreaterThan(box(canvas.getByText("Label on the left")).right)
    await expect(left).toHaveAccessibleDescription("Large, small radius Pick this one")
    await expect(css(left).borderTopColor).toBe("rgb(250, 82, 82)")
    const contrast = canvas.getByRole("radio", { name: "Auto contrast" })
    await expect(contrast).toHaveAttribute("aria-invalid", "true")
    await expect(css(iconOf(contrast)).color).not.toBe("rgb(255, 255, 255)")
    const hidden = present(canvasElement.querySelector("input[type='hidden'][name='bare']"))
    await expect(hidden).toHaveValue("")
    await userEvent.click(canvas.getByRole("radio", { name: "Unlabelled radio" }))
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Unlabelled radio" })).toBeChecked())
    await waitFor(() =>
      expect(present(canvasElement.querySelector("input[type='hidden'][name='bare']"))).toHaveValue("on")
    )
    const sizes = canvas.getByRole("radiogroup", { name: "Size" })
    await expect(sizes).toHaveAttribute("aria-orientation", "vertical")
    await expect(sizes).not.toHaveAttribute("aria-describedby")
    await expect(box(within(sizes).getByRole("radio", { name: "Small" })).width).toBe(16)
    await expect(within(sizes).getByRole("radio", { name: "Large" })).toHaveAccessibleDescription("Costs more")
    await userEvent.click(within(sizes).getByRole("radio", { name: "Large" }))
    await waitFor(() => expect(within(sizes).getByRole("radio", { name: "Large" })).toBeChecked())
  }
}

export const Indicator: StoryObj = {
  render: demo(IndicatorDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll("[data-variant]")).toHaveLength(7))
    const [empty, checked, disabled, disabledChecked, outline] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>("[data-variant]")
    )
    await expect(getComputedStyle(present(empty)).borderTopLeftRadius).toBe("1000px")
    await expect(getComputedStyle(present(checked)).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(present(checked?.firstElementChild)).opacity).toBe("1")
    await expect(getComputedStyle(present(disabled)).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(getComputedStyle(present(disabledChecked?.firstElementChild)).color).toBe("rgb(173, 181, 189)")
    await expect(getComputedStyle(present(outline)).width).toBe("30px")
    await expect(getComputedStyle(present(outline)).borderTopColor).toBe("rgb(190, 75, 219)")
  }
}

export const CardGroup: StoryObj = {
  render: demoApp(CardGroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const npm = await canvas.findByRole("radio", { name: /^npm/ })
    await expect(npm).toHaveAttribute("aria-checked", "false")
    await expect(npm).toHaveAttribute("name", "manager")
    await expect(canvas.getByText("CurrentValue: –")).toBeVisible()
    await expect(canvas.getByRole("radio", { name: "Unavailable" })).toBeDisabled()
  }
}

export const PickingCards: StoryObj = {
  render: demoApp(CardGroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("radio", { name: /yarn/ }))
    await waitFor(() => expect(canvas.getByText("CurrentValue: yarn")).toBeVisible())
    await expect(canvas.getByRole("radio", { name: /yarn/ })).toHaveAttribute("data-checked")
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas.getByText("CurrentValue: pnpm")).toBeVisible())
    await expect(canvas.getByRole("radio", { name: /pnpm/ })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas.getByText("CurrentValue: npm")).toBeVisible())
    await user.keyboard("{ArrowUp}")
    await waitFor(() => expect(canvas.getByText("CurrentValue: pnpm")).toBeVisible())
    await user.keyboard("a")
    await expect(canvas.getByText("CurrentValue: pnpm")).toBeVisible()
    const left = canvas.getByRole("radio", { name: "left" })
    left.focus()
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(canvas.getByRole("radio", { name: "right" })).toHaveAttribute("aria-checked", "true"))
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(canvas.getByRole("radio", { name: "left" })).toHaveAttribute("aria-checked", "true"))
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
