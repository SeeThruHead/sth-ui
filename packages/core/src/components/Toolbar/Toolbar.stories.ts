import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as AutoWidthDemo from "./demos/auto-width.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as StatesDemo from "./demos/states.ts"
import * as ToggleGroupDemo from "./demos/toggle-group.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"

const meta: Meta = { title: "Buttons/Toolbar" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const toolbar = (canvasElement: HTMLElement, name: string) => within(canvasElement).findByRole("toolbar", { name })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const bar = await toolbar(canvasElement, "Text formatting")
    const scope = within(bar)
    await expect(bar).toHaveAttribute("aria-orientation", "horizontal")
    await expect(box(bar).height).toBe(44)
    await expect(css(bar).padding).toBe("6px")
    await expect(css(bar).columnGap).toBe("12px")
    await expect(css(bar).borderTopLeftRadius).toBe("8px")
    await expect(css(bar).borderTopColor).toBe("rgb(206, 212, 218)")
    const bold = scope.getByRole("button", { name: "Bold" })
    await expect(bold).toHaveAttribute("aria-pressed", "false")
    await expect(box(bold).width).toBe(30)
    await expect(css(bold).padding).toBe("6px")
    await expect(css(bold).color).toBe("rgb(73, 80, 87)")
    await expect(css(bold).borderTopLeftRadius).toBe("2px")
    await expect(css(bold).borderTopRightRadius).toBe("0px")
    await expect(css(scope.getByRole("button", { name: "Italic" })).borderTopLeftRadius).toBe("0px")
    await expect(css(scope.getByRole("button", { name: "Underline" })).borderTopRightRadius).toBe("2px")
    const left = scope.getByRole("button", { name: "Align left" })
    await expect(left).toHaveAttribute("aria-pressed", "true")
    await expect(css(left).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(left).color).toBe("rgb(255, 255, 255)")
    await expect(scope.getAllByRole("group")).toHaveLength(2)
    const [divider] = scope.getAllByRole("separator")
    await expect(divider).toHaveAttribute("aria-orientation", "vertical")
    await expect(box(divider).width).toBe(1)
    const link = scope.getByRole("link", { name: "Mantine website" })
    await expect(link).toHaveAttribute("href", "https://mantine.dev")
    await expect(link).not.toHaveAttribute("aria-pressed")
    await waitFor(() => expect(bold).toHaveAttribute("tabindex", "0"))
    await expect(left).toHaveAttribute("tabindex", "-1")
  }
}

export const Toggling: StoryObj = {
  render: demoApp(ToggleGroupDemo),
  play: async ({ canvasElement }) => {
    const scope = within(await toolbar(canvasElement, "Text formatting"))
    await userEvent.click(scope.getByRole("button", { name: "Bold" }))
    await waitFor(() => expect(scope.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true"))
    await userEvent.click(scope.getByRole("button", { name: "Underline" }))
    await waitFor(() =>
      expect(scope.getByRole("button", { name: "Underline" })).toHaveAttribute("aria-pressed", "true")
    )
    await expect(scope.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(scope.getByRole("button", { name: "Bold" }))
    await waitFor(() => expect(scope.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false"))
    await userEvent.click(scope.getByRole("button", { name: "Align right" }))
    await waitFor(() =>
      expect(scope.getByRole("button", { name: "Align right" })).toHaveAttribute("aria-pressed", "true")
    )
    await expect(scope.getByRole("button", { name: "Align left" })).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(scope.getByRole("button", { name: "Align right" }))
    await waitFor(() =>
      expect(scope.getByRole("button", { name: "Align right" })).toHaveAttribute("aria-pressed", "false")
    )
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(ToggleGroupDemo),
  play: async ({ canvasElement }) => {
    const scope = within(await toolbar(canvasElement, "Text formatting"))
    const names = ["Bold", "Italic", "Underline", "Align left", "Align center", "Align right"]
    const buttons = names.map((name) => scope.getByRole("button", { name }))
    await waitFor(() => expect(buttons[0]).toHaveAttribute("tabindex", "0"))
    await userEvent.tab()
    await expect(buttons[0]).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}")
    await expect(buttons[3]).toHaveFocus()
    await expect(buttons[3]).toHaveAttribute("tabindex", "0")
    await expect(buttons[0]).toHaveAttribute("tabindex", "-1")
    await userEvent.keyboard("{End}")
    await expect(buttons[5]).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(buttons[0]).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}")
    await expect(buttons[5]).toHaveFocus()
    await userEvent.keyboard("{Home}{ArrowDown}")
    await expect(buttons[0]).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(buttons[0]).toHaveAttribute("aria-pressed", "true"))
  }
}

export const ToggleGroup: StoryObj = {
  render: demoApp(ToggleGroupDemo),
  play: async ({ canvasElement }) => {
    const scope = within(await toolbar(canvasElement, "Text formatting"))
    await expect(scope.getAllByRole("button")).toHaveLength(6)
  }
}

export const Variants: StoryObj = {
  render: demoApp(VariantsDemo),
  play: async ({ canvasElement }) => {
    const light = within(await toolbar(canvasElement, "Light")).getByRole("button", { name: "Bold" })
    await expect(css(light).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(light).color).toBe("rgb(24, 100, 171)")
    const grape = await toolbar(canvasElement, "Grape, small")
    const small = within(grape).getByRole("button", { name: "Bold" })
    await expect(box(small).width).toBe(26)
    await expect(css(grape).padding).toBe("5px")
    await expect(css(grape).borderTopLeftRadius).toBe("32px")
    await expect(css(small).borderTopLeftRadius).toBe("27px")
    await expect(css(small).backgroundColor).toBe("rgb(190, 75, 219)")
    const vertical = await toolbar(canvasElement, "Vertical")
    await expect(vertical).toHaveAttribute("aria-orientation", "vertical")
    const [first, second] = within(vertical).getAllByRole("button")
    await expect(box(first).width).toBe(36)
    await expect(Math.round(box(second).top)).toBe(Math.round(box(first).bottom))
    await expect(css(first).borderBottomLeftRadius).toBe("0px")
    await expect(within(vertical).getAllByRole("separator")[0]).toHaveAttribute("aria-orientation", "horizontal")
    await expect(box(within(vertical).getAllByRole("separator")[0]).height).toBe(1)
  }
}

export const AutoContrast: StoryObj = {
  render: demoApp(AutoContrastDemo),
  play: async ({ canvasElement }) => {
    const plain = within(await toolbar(canvasElement, "Lime")).getByRole("button", { name: "Bold" })
    await expect(css(plain).backgroundColor).toBe("rgb(169, 227, 75)")
    await expect(css(plain).color).toBe("rgb(255, 255, 255)")
    const contrast = within(await toolbar(canvasElement, "Lime with contrast")).getByRole("button", { name: "Bold" })
    await expect(css(contrast).color).toBe("oklch(0 0 0)")
  }
}

export const AutoWidth: StoryObj = {
  render: demoApp(AutoWidthDemo),
  play: async ({ canvasElement }) => {
    const scope = within(await toolbar(canvasElement, "Document"))
    const save = scope.getByRole("button", { name: "Save" })
    await expect(save).toHaveAttribute("data-auto-width")
    await expect(box(save).width).toBeGreaterThan(30)
    await expect(css(save).paddingLeft).toBe("7.5px")
    await expect(css(save).borderTopLeftRadius).toBe("2px")
    await expect(scope.getByRole("button", { name: "Bold" })).not.toHaveAttribute("aria-pressed")
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo),
  play: async ({ canvasElement }) => {
    const scope = within(await toolbar(canvasElement, "Text formatting"))
    const italic = scope.getByRole("button", { name: "Italic" })
    await expect(italic).toBeDisabled()
    await expect(css(italic).cursor).toBe("not-allowed")
    await expect(css(italic).backgroundColor).toBe("rgb(233, 236, 239)")
    const left = scope.getByRole("button", { name: "Align left" })
    await expect(left).toBeDisabled()
    await expect(css(left).backgroundColor).toBe("rgb(206, 212, 218)")
    await expect(css(left).color).toBe("rgb(134, 142, 150)")
    await waitFor(() => expect(scope.getByRole("button", { name: "Bold" })).toHaveAttribute("tabindex", "0"))
    await userEvent.tab()
    await userEvent.keyboard("{ArrowRight}")
    await expect(scope.getByRole("button", { name: "Underline" })).toHaveFocus()
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const plain = await toolbar(canvasElement, "Plain")
    await expect(css(plain).borderTopWidth).toBe("0px")
    await expect(plain).not.toHaveAttribute("data-with-border")
    const scope = within(plain)
    const right = scope.getByRole("button", { name: "Align right" })
    await expect(right).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(right)
    await waitFor(() => expect(right).toHaveAttribute("aria-pressed", "true"))
    const locked = scope.getByRole("button", { name: "Locked" })
    await expect(css(locked).backgroundColor).toBe("rgb(206, 212, 218)")
    right.focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(right).toHaveFocus()
    await userEvent.keyboard("{Home}{ArrowLeft}")
    await expect(scope.getByRole("button", { name: "Align left" })).toHaveFocus()
    const side = await toolbar(canvasElement, "Side")
    const alignment = within(side).getByRole("group", { name: "Alignment" })
    const [top, middle, bottom] = within(alignment)
      .getAllByRole("button")
      .map((button) => present(button))
    await expect(css(top).borderTopRightRadius).toBe("2px")
    await expect(css(top).borderBottomRightRadius).toBe("0px")
    await expect(css(middle).borderTopLeftRadius).toBe("0px")
    await expect(css(bottom).borderBottomLeftRadius).toBe("2px")
    await expect(css(within(side).getByRole("button", { name: "Only" })).borderTopLeftRadius).toBe("2px")
    await userEvent.click(present(top))
    await waitFor(() => expect(top).toHaveAttribute("aria-pressed", "true"))
    present(top).focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(middle).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(middle).toHaveFocus()
    const only = within(side).getByRole("button", { name: "Only" })
    only.focus()
    await expect(only).toHaveAttribute("tabindex", "0")
    await userEvent.click(present(middle))
    await waitFor(() => expect(only).toBeDisabled())
    await waitFor(() => expect(middle).toHaveAttribute("tabindex", "0"))
    await expect(only).toHaveAttribute("tabindex", "-1")
    const help = within(canvasElement).getByRole("link", { name: "Help" })
    await expect(help).not.toHaveAttribute("target")
    await expect(present(help.closest("[role='toolbar']"))).not.toHaveAttribute("aria-label")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const bar = await toolbar(canvasElement, "Text formatting")
    const bold = within(bar).getByRole("button", { name: "Bold" })
    await expect(css(bar).borderTopColor).toBe("rgb(66, 66, 66)")
    await expect(css(bold).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(bold).color).toBe("rgb(184, 184, 184)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
