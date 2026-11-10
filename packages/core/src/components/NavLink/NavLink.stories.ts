import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { CaretRightIcon } from "@sth-ui/icons/icons/CaretRightIcon.ts"
import { FingerprintIcon } from "@sth-ui/icons/icons/FingerprintIcon.ts"
import { GaugeIcon } from "@sth-ui/icons/icons/GaugeIcon.ts"
import { HeartbeatIcon } from "@sth-ui/icons/icons/HeartbeatIcon.ts"
import type { Icon } from "@sth-ui/icons/Icon.ts"
import { present } from "../../stories/dom.ts"
import type { Kit } from "../../stories/harness.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ActiveDemo from "./demos/active.ts"
import * as NestedDemo from "./demos/nested.ts"
import type { NavLinkVariant } from "./NavLink.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as OptionsDemo from "./demos/options.ts"

const meta: Meta = { title: "Navigation/NavLink" }

export default meta

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const home = await canvas.findByRole("link", { name: "With icon" })
    await expect(home).toHaveAttribute("href", "#home")
    await expect(box(home).width).toBe(300)
    await expect(box(home).height).toBe(40.796875)
    await expect(box(canvas.getByRole("link", { name: /With description/ })).height).toBe(59.390625)
    await expect(css(home).paddingLeft).toBe("12px")
    await expect(css(within(home).getByText("With icon")).fontSize).toBe("14px")
    const disabled = canvas.getByRole("link", { name: "Disabled" })
    await expect(disabled).toHaveAttribute("aria-disabled", "true")
    await expect(css(disabled).opacity).toBe("0.4")
    await expect(css(canvas.getByText("Additional information")).color).toBe("rgb(134, 142, 150)")
    const filled = canvas.getByRole("link", { name: "Active filled" })
    await expect(filled).toHaveAttribute("data-active")
    await expect(css(filled).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(filled).color).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByRole("link", { name: "Active subtle" })).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(canvas.getByRole("link", { name: "Active subtle" })).color).toBe("rgb(24, 100, 171)")
    await expect(css(canvas.getByRole("link", { name: "Active light" })).backgroundColor).toBe("rgb(208, 235, 255)")
    const right = present(filled.lastElementChild)
    await expect(right).toHaveAttribute("data-position", "right")
    await expect(box(right).right).toBe(box(filled).right - 12)
  }
}

const sidebar: ReadonlyArray<{
  readonly icon: Icon
  readonly label: string
  readonly description?: string
  readonly right?: boolean
}> = [
  { icon: GaugeIcon, label: "Dashboard", description: "Item with description" },
  { icon: FingerprintIcon, label: "Security", right: true },
  { icon: HeartbeatIcon, label: "Activity" }
]

const menu = (kit: Kit, options: { readonly variant?: NavLinkVariant; readonly asButtons?: boolean } = {}) =>
  kit.ui.Box(kit.h, {
    w: 220,
    children: sidebar.map((item, index) =>
      kit.ui.NavLink(kit.h, {
        ...(options.asButtons === true ? { component: "button" as const } : { href: `#${item.label.toLowerCase()}` }),
        label: item.label,
        active: kit.value("active", "0") === String(index),
        onClick: kit.set("active", String(index)),
        leftSection: item.icon(kit.h, { size: 16 }),
        ...(item.description === undefined ? {} : { description: item.description }),
        ...(item.right === true ? { rightSection: CaretRightIcon(kit.h, { size: 16 }) } : {}),
        ...(options.variant === undefined ? {} : { variant: options.variant })
      })
    )
  })

export const Active: StoryObj = {
  render: demoApp(ActiveDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first, second] = await canvas.findAllByRole("button", { name: /Dashboard/ })
    const light = present(first)
    const filled = present(second)
    await expect(light).toHaveAttribute("data-active")
    await expect(css(light).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(light).color).toBe("rgb(24, 100, 171)")
    await expect(css(filled).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(within(filled).getByText("Item with description")).color).toBe("rgb(255, 255, 255)")
    await expect(css(within(filled).getByText("Item with description")).opacity).toBe("0.9")
  }
}

export const Clicking: StoryObj = {
  render: story((kit) => menu(kit, { asButtons: true })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const security = await canvas.findByRole("button", { name: "Security" })
    await userEvent.click(security)
    await waitFor(() => expect(security).toHaveAttribute("data-active"))
    await expect(canvas.getByRole("button", { name: /Dashboard/ })).not.toHaveAttribute("data-active")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}{Enter}")
    await waitFor(() => expect(canvas.getByRole("button", { name: /Dashboard/ })).toHaveAttribute("data-active"))
  }
}

export const Nested: StoryObj = {
  render: demoApp(NestedDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "First parent link" })
    const second = canvas.getByRole("button", { name: "Second parent link" })
    await expect(first).toHaveAttribute("aria-expanded", "false")
    await expect(first).toHaveAttribute("aria-controls", "first-parent-children")
    await expect(present(canvasElement.querySelector("#first-parent-children"))).not.toBeVisible()
    await expect(second).toHaveAttribute("aria-expanded", "true")
    await expect(second).toHaveAttribute("data-expanded")
    const child = present(canvas.getAllByRole("link", { name: "Third child link" }).at(-1))
    await expect(child).toBeVisible()
    await expect(box(child).left).toBe(box(second).left + 28)
    const chevron = present(second.lastElementChild)
    await expect(chevron).toHaveAttribute("data-rotate")
    await expect(css(chevron).transform).toBe("matrix(0, 1, -1, 0, 0, 0)")
    await expect(present(first.lastElementChild)).not.toHaveAttribute("data-rotate")
  }
}

export const Toggling: StoryObj = {
  render: demoApp(NestedDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "First parent link" })
    await userEvent.click(first)
    await waitFor(() => expect(first).toHaveAttribute("aria-expanded", "true"))
    await expect(canvas.getByRole("button", { name: "Nested parent link" })).toBeVisible()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(first).toHaveAttribute("aria-expanded", "false"))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(first).toHaveAttribute("aria-expanded", "true"))
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const long = await canvas.findByText("A label far too long for the sidebar")
    await expect(present(long.parentElement)).toHaveAttribute("data-no-wrap")
    await expect(css(long.parentElement).whiteSpace).toBe("nowrap")
    await expect(box(long.parentElement).height).toBe(43.390625)
    await expect(present(long.parentElement).scrollWidth).toBeGreaterThan(present(long.parentElement).clientWidth)
    await expect(canvas.getByRole("button", { name: "Sign out" })).toHaveAttribute("type", "button")
    await expect(css(canvas.getByRole("link", { name: "Lime" })).color).toBe("rgb(0, 0, 0)")
    await expect(canvas.queryByRole("link", { name: "Not in the page" })).toBeNull()
    const still = canvas.getByRole("button", { name: "Opened, still" })
    await expect(present(still.lastElementChild)).not.toHaveAttribute("data-rotate")
    await expect(canvas.getByRole("link", { name: "Shown" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Disabled button" })).toBeDisabled()
    await expect(canvas.getByRole("link", { name: "Home" }).querySelector("svg")).not.toBeNull()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story((kit) => kit.ui.Group(kit.h, { children: [menu(kit), menu(kit, { variant: "filled" })] })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [light, filled] = await canvas.findAllByRole("link", { name: /Dashboard/ })
    const first = present(light)
    const second = present(filled)
    await expect(css(first).backgroundColor).toMatch(/^color\(srgb 0\.04705\d* 0\.19607\d* 0\.3352\d*\)$/)
    await expect(css(first).color).toBe("rgb(231, 245, 255)")
    await expect(css(second).backgroundColor).toBe("rgb(25, 113, 194)")
    await expect(css(present(canvas.getAllByRole("link", { name: "Activity" }).at(0))).color).toBe("rgb(201, 201, 201)")
  }
}

export const ChoosingActiveDemo: StoryObj = {
  render: demoApp(ActiveDemo),
  play: async ({ canvasElement }) => {
    const [security] = await within(canvasElement).findAllByRole("button", { name: "Security" })
    await userEvent.click(present(security))
    await waitFor(() => expect(security).toHaveAttribute("data-active"))
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
