import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ChevronPositionDemo from "./demos/chevron-position.ts"
import * as ChevronDemo from "./demos/chevron.ts"
import * as DisableCollapseDemo from "./demos/disable-collapse.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as IconsDemo from "./demos/icons.ts"
import * as LabelDemo from "./demos/label.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as SideControlsDemo from "./demos/side-controls.ts"
import * as StatesDemo from "./demos/states.ts"
import * as TransitionsDemo from "./demos/transitions.ts"
import * as UnstyledDemo from "./demos/unstyled.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "DataDisplay/Accordion" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const control = (canvasElement: HTMLElement, name: string | RegExp) =>
  present(within(canvasElement).getAllByRole("button", { name })[0])

const regionOf = (button: HTMLElement | undefined) =>
  present(document.getElementById(present(button).getAttribute("aria-controls") ?? ""))

const itemOf = (button: HTMLElement | undefined) =>
  present(present(button).closest("[data-variant]:not([data-accordion])"))

const chevronOf = (button: HTMLElement | undefined) => present(present(button).firstElementChild)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await expect(apples).toHaveAttribute("aria-expanded", "true")
    await expect(present(apples.parentElement).tagName).toBe("H3")
    await expect(regionOf(apples)).toHaveAttribute("role", "region")
    await expect(regionOf(apples)).toHaveAccessibleName(/^Apples/)
    await expect(css(chevronOf(apples)).transform).toBe("matrix(-1, 0, 0, -1, 0, 0)")
    await expect(box(chevronOf(apples)).width).toBe(15)
    await expect(css(itemOf(apples)).borderBottomWidth).toBe("1px")
    await expect(css(itemOf(apples)).borderBottomColor).toBe("rgb(222, 226, 230)")
    await expect(css(apples).paddingLeft).toBe("16px")
    await expect(css(regionOf(apples).firstElementChild?.firstElementChild).paddingTop).toBe("5px")
    await expect(Math.round(box(apples).height)).toBe(49)
    await expect(control(canvasElement, /^Bananas/)).toHaveAttribute("aria-expanded", "false")
  }
}

export const Toggling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    const bananas = control(canvasElement, /^Bananas/)
    await userEvent.click(bananas)
    await waitFor(() => expect(bananas).toHaveAttribute("aria-expanded", "true"))
    await expect(apples).toHaveAttribute("aria-expanded", "false")
    await expect(itemOf(bananas)).toHaveAttribute("data-active")
    await waitFor(() => expect(within(canvasElement).getByText(/Naturally sweet/)).toBeVisible())
    await userEvent.click(bananas)
    await waitFor(() => expect(bananas).toHaveAttribute("aria-expanded", "false"))
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    const broccoli = control(canvasElement, /^Broccoli/)
    apples.focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(broccoli).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(apples).toHaveFocus()
    await userEvent.keyboard("{ArrowUp}")
    await expect(broccoli).toHaveFocus()
    await userEvent.keyboard("{Home}")
    await expect(apples).toHaveFocus()
    await userEvent.keyboard("{End}")
    await expect(broccoli).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(broccoli).toHaveAttribute("aria-expanded", "true"))
    await userEvent.keyboard("{a}")
    await expect(broccoli).toHaveFocus()
  }
}

export const Variants: StoryObj = {
  render: demoApp(VariantsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const accordion = (variant: string) => present(canvasElement.querySelector<HTMLElement>(`#variant-${variant}`))
    const items = (variant: string) => [...accordion(variant).children]
    await waitFor(() => expect(items("contained")).toHaveLength(3))
    await expect(css(items("contained")[0]).borderTopWidth).toBe("1px")
    await expect(css(items("contained")[1]).borderTopWidth).toBe("0px")
    await expect(css(items("contained")[0]).borderTopLeftRadius).toBe("8px")
    await expect(css(items("contained")[2]).borderBottomLeftRadius).toBe("8px")
    await expect(css(items("contained")[0]).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(items("filled")[0]).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(items("filled")[1]).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(items("filled")[1]).borderTopLeftRadius).toBe("8px")
    await expect(css(items("separated")[1]).marginTop).toBe("16px")
    await expect(css(items("separated")[1]).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(items("separated")[0]).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(items("separated")[0]).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(css(items("default")[0]).borderBottomWidth).toBe("1px")
  }
}

export const Chevron: StoryObj = {
  render: demoApp(ChevronDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await expect(chevronOf(apples)).toHaveAttribute("data-rotate")
    await waitFor(() =>
      expect(css(chevronOf(apples)).transform).toBe("matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)")
    )
    await expect(css(chevronOf(control(canvasElement, /^Bananas/))).transform).toBe("none")
  }
}

export const ChevronPosition: StoryObj = {
  render: demoApp(ChevronPositionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await expect(css(apples).flexDirection).toBe("row")
    await expect(css(apples).paddingLeft).toBe("0px")
    await expect(css(chevronOf(apples)).marginLeft).toBe("16px")
    await expect(css(present(apples.lastElementChild)).marginLeft).toBe("20px")
  }
}

export const Label: StoryObj = {
  render: demoApp(LabelDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const homer = await within(canvasElement).findByRole("button", { name: "Homer Simpson" })
    await expect(within(homer).getByRole("img", { name: "Homer Simpson" })).toBeVisible()
    await expect(within(homer).getByText("Overweight, lazy, and often ignorant")).toBeVisible()
  }
}

export const Icons: StoryObj = {
  render: demoApp(IconsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const photos = await within(canvasElement).findByRole("button", { name: "Recent photos" })
    const icon = present(photos.lastElementChild)
    await expect(css(icon).marginRight).toBe("12px")
    await expect(box(icon).left).toBeLessThan(box(photos.children[1]).left)
  }
}

export const Transitions: StoryObj = {
  render: demoApp(TransitionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [slow, instant] = await within(canvasElement).findAllByRole("button", { name: /^Apples/ })
    await expect(css(regionOf(slow)).transitionDuration).toBe("1s")
    await expect(css(chevronOf(slow)).transitionDuration).toBe("1s")
    await expect(css(regionOf(instant)).transitionDuration).toBe("0s")
  }
}

export const Multiple: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await expect(apples).toHaveAttribute("aria-expanded", "true")
    await expect(control(canvasElement, /^Bananas/)).toHaveAttribute("aria-expanded", "true")
  }
}

export const OpeningSeveral: StoryObj = {
  render: demoApp(MultipleDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    const broccoli = control(canvasElement, /^Broccoli/)
    await userEvent.click(broccoli)
    await waitFor(() => expect(broccoli).toHaveAttribute("aria-expanded", "true"))
    await expect(apples).toHaveAttribute("aria-expanded", "true")
    await userEvent.click(apples)
    await waitFor(() => expect(apples).toHaveAttribute("aria-expanded", "false"))
    await expect(broccoli).toHaveAttribute("aria-expanded", "true")
  }
}

export const DisableCollapse: StoryObj = {
  render: demoApp(DisableCollapseDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await expect(apples).toHaveAttribute("aria-expanded", "true")
  }
}

export const KeepingOneOpen: StoryObj = {
  render: demoApp(DisableCollapseDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await userEvent.click(apples)
    await expect(apples).toHaveAttribute("aria-expanded", "true")
    await userEvent.click(control(canvasElement, /^Bananas/))
    await waitFor(() => expect(apples).toHaveAttribute("aria-expanded", "false"))
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const bananas = await within(canvasElement).findByRole("button", { name: /^Bananas/ })
    await expect(bananas).toBeDisabled()
    await expect(css(bananas).opacity).toBe("0.4")
    await expect(css(bananas).cursor).toBe("not-allowed")
  }
}

export const SideControls: StoryObj = {
  render: demoApp(SideControlsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const first = await within(canvasElement).findByRole("button", { name: "Control 1" })
    const more = within(present(first.parentElement)).getByRole("button", { name: "More options" })
    await expect(box(more).left).toBeGreaterThan(box(first).right - 1)
    await userEvent.click(first)
    await waitFor(() => expect(within(canvasElement).getByText("Panel 1")).toBeVisible())
  }
}

export const Unstyled: StoryObj = {
  render: demoApp(UnstyledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const apples = await within(canvasElement).findByRole("button", { name: /^Apples/ })
    await expect(css(itemOf(apples)).borderBottomWidth).toBe("0px")
    await expect(css(apples).paddingLeft).toBe("6px")
    await expect(css(apples).display).toBe("inline-block")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("button", { name: "Sixth" })
    const rounded = present(canvasElement.querySelector<HTMLElement>("#rounded"))
    const apples = within(rounded).getByRole("button", { name: /^Apples/ })
    await expect(present(apples.parentElement).tagName).toBe("H2")
    await expect(css(itemOf(apples)).borderTopLeftRadius).toBe("32px")
    await expect(box(chevronOf(apples)).width).toBe(24)
    await expect(box(present(chevronOf(apples).firstElementChild)).width).toBe(20)
    await expect(chevronOf(apples)).not.toHaveAttribute("data-rotate")
    await expect(css(chevronOf(apples)).transform).toBe("matrix(1, 0, 0, 1, 0, 0)")
    const broccoli = within(rounded).getByRole("button", { name: /^Broccoli/ })
    broccoli.focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(broccoli).toHaveFocus()
    const unmounted = present(canvasElement.querySelector<HTMLElement>("#unmounted"))
    await expect(present(within(unmounted).getByRole("button", { name: /^Apples/ }).parentElement).tagName).toBe("H4")
    await expect(within(unmounted).getByRole("button", { name: /^Apples/ }).firstElementChild?.childElementCount).toBe(
      0
    )
    await expect(within(unmounted).queryByText(/Crisp and refreshing/)).toBeNull()
    await expect(box(chevronOf(within(unmounted).getByRole("button", { name: /^Apples/ }))).width).toBe(24)
    await expect(within(unmounted).getByText("Stays in the page")).toBeInTheDocument()
    await expect(within(unmounted).getByRole("button", { name: "+ Kept mounted" })).toBeVisible()
    await userEvent.click(within(unmounted).getByRole("button", { name: /^Apples/ }))
    await waitFor(() => expect(within(unmounted).getByText(/Crisp and refreshing/)).toBeVisible())
    await expect(present(canvas.getByRole("button", { name: "Fifth" }).parentElement).tagName).toBe("H5")
    await expect(present(canvas.getByRole("button", { name: "Sixth" }).parentElement).tagName).toBe("H6")
    await expect(canvas.getByText("Plain child")).toBeVisible()
    await expect(canvas.getByText("Extra")).toBeVisible()
    await expect(css(canvas.getByTestId("panel")).fontStyle).toBe("italic")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(VariantsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByRole("button", { name: /^Apples/ })
    const separated = present(canvasElement.querySelector("#variant-separated"))
    await waitFor(() => expect(css(separated.children[0]).backgroundColor).toBe("rgb(36, 36, 36)"))
    await expect(css(separated.children[1]).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
