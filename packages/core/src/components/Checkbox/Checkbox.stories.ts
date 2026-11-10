import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AnchorDemo from "./demos/anchor.ts"
import * as ErrorDemo from "./demos/error.ts"
import * as GroupDemo from "./demos/group.ts"
import * as GroupDisabledDemo from "./demos/group-disabled.ts"
import * as GroupOptionsDemo from "./demos/group-options.ts"
import * as IconColorDemo from "./demos/icon-color.ts"
import * as IconDemo from "./demos/icon.ts"
import * as IndeterminateDemo from "./demos/indeterminate.ts"
import * as LightDemo from "./demos/light-variant.ts"
import * as MaxDemo from "./demos/max-selected.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as CardDemo from "./demos/card.ts"
import * as CardGroupDemo from "./demos/card-group.ts"
import * as CardStatesDemo from "./demos/card-states.ts"
import * as IndicatorDemo from "./demos/indicator.ts"

const meta: Meta = { title: "Inputs/Checkbox" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const iconOf = (checkbox: HTMLElement) => present(checkbox.nextElementSibling)

const blue = "rgb(34, 139, 230)"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "I agree to sell my privacy" })
    await expect(checkbox).toBeChecked()
    await expect(box(checkbox).width).toBe(20)
    await expect(css(checkbox).backgroundColor).toBe(blue)
    await expect(css(checkbox).borderTopLeftRadius).toBe("4px")
    await waitFor(() => expect(css(iconOf(checkbox)).opacity).toBe("1"))
    await expect(css(iconOf(checkbox)).color).toBe("rgb(255, 255, 255)")
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole("checkbox", { name: "I agree to sell my privacy" })
    await userEvent.click(canvas.getByText("I agree to sell my privacy"))
    await waitFor(() => expect(checkbox).not.toBeChecked())
    await waitFor(() => expect(css(checkbox).backgroundColor).toBe("rgb(255, 255, 255)"))
    await expect(css(checkbox).borderTopColor).toBe("rgb(206, 212, 218)")
    checkbox.focus()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(checkbox).toBeChecked())
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const named = (name: string) => canvas.getByRole("checkbox", { name })
    await expect(await canvas.findByRole("checkbox", { name: "Default checkbox" })).not.toBeChecked()
    await expect(named("Indeterminate checkbox")).toHaveAttribute("aria-checked", "mixed")
    const dash = box(iconOf(named("Indeterminate checkbox")).querySelector("svg"))
    const frame = box(named("Indeterminate checkbox"))
    await expect(Math.abs(dash.top + dash.height / 2 - (frame.top + frame.height / 2))).toBeLessThan(1)
    await expect(css(named("Indeterminate checkbox")).backgroundColor).toBe(blue)
    await expect(named("Checked checkbox")).toBeChecked()
    await expect(css(named("Outline checked checkbox")).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(named("Outline checked checkbox")).borderTopColor).toBe(blue)
    await expect(css(iconOf(named("Outline checked checkbox"))).color).toBe(blue)
    await expect(named("Disabled checkbox")).toHaveAttribute("aria-disabled", "true")
    await expect(css(named("Disabled checked checkbox")).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(iconOf(named("Disabled checked checkbox"))).color).toBe("rgb(173, 181, 189)")
    await expect(css(canvas.getByText("Disabled checkbox")).color).toBe("rgb(173, 181, 189)")
  }
}

export const ClickingStates: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Default checkbox" })
    await userEvent.click(checkbox)
    await expect(checkbox).not.toBeChecked()
  }
}

export const LightVariant: StoryObj = {
  render: demoApp(LightDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const light = await canvas.findByRole("checkbox", { name: "Light checkbox" })
    await expect(css(light).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(light).borderTopColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(iconOf(light)).color).toBe("rgb(24, 100, 171)")
    await expect(css(canvas.getByRole("checkbox", { name: "Teal light checkbox" })).backgroundColor).not.toBe(
      css(light).backgroundColor
    )
  }
}

export const TogglingLight: StoryObj = {
  render: demoApp(LightDemo),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Light indeterminate checkbox" })
    await userEvent.click(checkbox)
    await waitFor(() => expect(checkbox).toHaveAttribute("aria-checked", "mixed"))
  }
}

export const Error: StoryObj = {
  render: demoApp(ErrorDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("checkbox", { name: "With boolean error" })
    await expect(plain).toHaveAttribute("aria-invalid", "true")
    await expect(css(plain).borderTopColor).toBe("rgb(250, 82, 82)")
    const [message, quiet] = canvas.getAllByRole("checkbox", { name: "With error message" })
    await expect(present(message)).toHaveAccessibleDescription("Must be checked")
    await expect(css(canvas.getByText("Must be checked")).color).toBe("rgb(250, 82, 82)")
    await expect(css(present(quiet)).borderTopColor).toBe("rgb(206, 212, 218)")
  }
}

export const TogglingError: StoryObj = {
  render: demoApp(ErrorDemo),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "With boolean error" })
    await userEvent.click(checkbox)
    await waitFor(() => expect(checkbox).toBeChecked())
  }
}

export const Icon: StoryObj = {
  render: demoApp(IconDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("checkbox", { name: "Custom icon" })
    const mixed = canvas.getByRole("checkbox", { name: "Custom icon: indeterminate" })
    await expect(present(iconOf(plain).querySelector("svg"))).toBeVisible()
    await expect(iconOf(plain).querySelector("path")?.getAttribute("d")).not.toBe(
      iconOf(mixed).querySelector("path")?.getAttribute("d")
    )
  }
}

export const TogglingIcon: StoryObj = {
  render: demoApp(IconDemo),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Custom icon" })
    await userEvent.click(checkbox)
    await waitFor(() => expect(checkbox).not.toBeChecked())
  }
}

export const IconColor: StoryObj = {
  render: demoApp(IconColorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Bright lime checkbox" })
    await expect(box(checkbox).width).toBe(24)
    await expect(css(checkbox).backgroundColor).toBe("rgb(169, 227, 75)")
    await expect(css(iconOf(checkbox)).color).toBe("rgb(31, 31, 31)")
  }
}

export const TogglingIconColor: StoryObj = {
  render: demoApp(IconColorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Bright lime checkbox" })
    await userEvent.click(checkbox)
    await waitFor(() => expect(checkbox).not.toBeChecked())
  }
}

export const Indeterminate: StoryObj = {
  render: demoApp(IndeterminateDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("checkbox", { name: "Receive all notifications" })).not.toBeChecked()
    await expect(
      css(canvas.getByRole("checkbox", { name: "Receive sms notifications" }).closest("[data-size]")).marginLeft
    ).toBe("33px")
  }
}

export const SelectingAll: StoryObj = {
  render: demoApp(IndeterminateDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const all = await canvas.findByRole("checkbox", { name: "Receive all notifications" })
    await userEvent.click(canvas.getByRole("checkbox", { name: "Receive sms notifications" }))
    await waitFor(() => expect(all).toHaveAttribute("aria-checked", "mixed"))
    await userEvent.click(all)
    await waitFor(() => expect(all).toBeChecked())
    await expect(canvas.getByRole("checkbox", { name: "Receive push notifications" })).toBeChecked()
    await userEvent.click(all)
    await waitFor(() => expect(canvas.getByRole("checkbox", { name: "Receive email notifications" })).not.toBeChecked())
  }
}

export const Anchor: StoryObj = {
  render: demoApp(AnchorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("link", { name: "terms and conditions" })).toHaveAttribute(
      "href",
      "https://mantine.dev"
    )
    await expect(canvas.getByRole("checkbox", { name: "I accept terms and conditions" })).not.toBeChecked()
  }
}

export const TogglingAnchor: StoryObj = {
  render: demoApp(AnchorDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "I accept terms and conditions" })
    await userEvent.click(checkbox)
    await waitFor(() => expect(checkbox).toBeChecked())
  }
}

export const Group: StoryObj = {
  render: demoApp(GroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByRole("group", { name: "Select your favorite frameworks/libraries" })
    await expect(group).toHaveAccessibleDescription("This is anonymous")
    await expect(within(group).getAllByRole("checkbox")).toHaveLength(4)
    await expect(within(group).getByRole("checkbox", { name: "React" })).toBeChecked()
    await expect(canvas.getByText("*")).toBeVisible()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(GroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const vue = await canvas.findByRole("checkbox", { name: "Vue" })
    await userEvent.click(vue)
    await waitFor(() => expect(vue).toBeChecked())
    await userEvent.click(canvas.getByRole("checkbox", { name: "React" }))
    await waitFor(() => expect(canvas.getByRole("checkbox", { name: "React" })).not.toBeChecked())
  }
}

export const GroupDisabled: StoryObj = {
  render: demoApp(GroupDisabledDemo),
  play: async ({ canvasElement }) => {
    const boxes = await within(canvasElement).findAllByRole("checkbox")
    await Promise.all(boxes.map((checkbox) => expect(checkbox).toHaveAttribute("aria-disabled", "true")))
  }
}

export const MaxSelected: StoryObj = {
  render: demoApp(MaxDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("checkbox", { name: "Angular" })).not.toHaveAttribute("aria-disabled")
  }
}

export const ReachingTheMax: StoryObj = {
  render: demoApp(MaxDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("checkbox", { name: "Svelte" }))
    await waitFor(() =>
      expect(canvas.getByRole("checkbox", { name: "Angular" })).toHaveAttribute("aria-disabled", "true")
    )
    await expect(canvas.getByRole("checkbox", { name: "Vue" })).toHaveAttribute("aria-disabled", "true")
    await expect(canvas.getByRole("checkbox", { name: "React" })).not.toHaveAttribute("aria-disabled")
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByRole("checkbox", { name: "Label on the left" })
    await expect(box(left).width).toBe(36)
    await expect(css(left).borderTopLeftRadius).toBe("8px")
    await expect(box(left).left).toBeGreaterThan(box(canvas.getByText("Label on the left")).right)
    await expect(left).toHaveAccessibleDescription("Extra large, medium radius")
    await expect(present(canvasElement.querySelector("input[type='hidden'][name='left']"))).toHaveValue("yes")
    await expect(css(iconOf(canvas.getByRole("checkbox", { name: "Auto contrast" }))).color).not.toBe(
      "rgb(255, 255, 255)"
    )
    const locked = canvas.getByRole("checkbox", { name: "Read only" })
    await expect(locked).toHaveAttribute("aria-readonly", "true")
    await userEvent.click(locked)
    await expect(locked).not.toBeChecked()
    await userEvent.click(left)
    await waitFor(() => expect(left).not.toBeChecked())
    await expect(canvas.getByRole("checkbox", { name: "Select row" })).not.toBeChecked()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Default checkbox" })
    await expect(css(checkbox).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(checkbox).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const GroupOptions: StoryObj = {
  render: demoApp(GroupOptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = await canvas.findByRole("checkbox", { name: "Email" })
    await expect(box(email).width).toBe(24)
    await expect(canvas.getAllByRole("group")[0]).toHaveAccessibleDescription("Pick at least two")
    await expect(present(canvasElement.querySelector("input[type='hidden'][name='channels']"))).toHaveValue("email")
    await userEvent.click(canvas.getByRole("checkbox", { name: "SMS" }))
    await waitFor(() => expect(canvas.getByRole("checkbox", { name: "SMS" })).toBeChecked())
    const locked = canvas.getByRole("checkbox", { name: "Email updates" })
    await expect(locked).toHaveAttribute("aria-readonly", "true")
  }
}

export const Indicator: StoryObj = {
  render: demo(IndicatorDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll("[data-variant]")).toHaveLength(9))
    const indicators = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-variant]"))
    const [empty, checked, , disabled, disabledChecked] = indicators
    await expect(getComputedStyle(present(empty)).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(getComputedStyle(present(empty)).width).toBe("20px")
    await expect(getComputedStyle(present(checked)).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(present(checked?.firstElementChild)).opacity).toBe("1")
    await expect(disabled).toHaveAttribute("data-disabled")
    await expect(getComputedStyle(present(disabled)).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(getComputedStyle(present(disabledChecked?.firstElementChild)).color).toBe("rgb(173, 181, 189)")
    const outline = present(indicators[6])
    await expect(getComputedStyle(outline).width).toBe("30px")
    await expect(getComputedStyle(outline).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(getComputedStyle(outline).borderTopLeftRadius).toBe("32px")
    await expect(indicators[2]?.querySelector("rect")).not.toBeNull()
  }
}

export const Card: StoryObj = {
  render: demoApp(CardDemo),
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole("checkbox", { name: /mantine\/core/ })
    await expect(card).toHaveAttribute("aria-checked", "false")
    await expect(card).toHaveAttribute("data-with-border")
    await expect(getComputedStyle(card).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(getComputedStyle(card).paddingTop).toBe("16px")
  }
}

export const CheckingCard: StoryObj = {
  render: demoApp(CardDemo),
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole("checkbox", { name: /mantine\/core/ })
    await userEvent.setup().click(card)
    await waitFor(() => expect(card).toHaveAttribute("aria-checked", "true"))
    await expect(card).toHaveAttribute("data-checked")
    await expect(card.querySelector("[data-checked][data-variant]")).not.toBeNull()
    await waitFor(() => expect(getComputedStyle(card).borderTopColor).toBe("rgb(34, 139, 230)"))
  }
}

export const CardGroup: StoryObj = {
  render: demoApp(CardGroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole("checkbox")).toHaveLength(3)
    await expect(canvas.getByText("CurrentValue: –")).toBeVisible()
  }
}

export const PickingCards: StoryObj = {
  render: demoApp(CardGroupDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    await user.click(await canvas.findByRole("checkbox", { name: /mantine\/hooks/ }))
    await user.click(canvas.getByRole("checkbox", { name: /mantine\/core/ }))
    await waitFor(() => expect(canvas.getByText("CurrentValue: mantine/hooks, mantine/core")).toBeVisible())
    await user.click(canvas.getByRole("checkbox", { name: /mantine\/hooks/ }))
    await waitFor(() => expect(canvas.getByText("CurrentValue: mantine/core")).toBeVisible())
  }
}

export const CardStates: StoryObj = {
  render: demoApp(CardStatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const some = await canvas.findByRole("checkbox", { name: /Some packages/ })
    await expect(some).toHaveAttribute("aria-checked", "mixed")
    await expect(some).toHaveAttribute("data-indeterminate")
    await expect(some).not.toHaveAttribute("data-with-border")
    await expect(getComputedStyle(some).borderTopLeftRadius).toBe("32px")
    const locked = canvas.getByRole("checkbox", { name: /Locked/ })
    await expect(locked).toBeDisabled()
    await expect(getComputedStyle(locked).cursor).toBe("not-allowed")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
