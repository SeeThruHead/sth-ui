import type { Meta, StoryObj } from "@storybook/html-vite"
import type { Html } from "foldkit/html"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { present } from "../../stories/dom.ts"
import type { Kit } from "../../stories/harness.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as ColorsDemo from "./demos/colors.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as PositionDemo from "./demos/position.ts"
import * as InvertedDemo from "./demos/inverted.ts"
import * as VerticalDemo from "./demos/vertical.ts"
import * as IconsAndContrastDemo from "./demos/icons-and-contrast.ts"
import { tabsList, tabsPanel, tabsTab } from "./Tabs.ts"
import type { TabsChild, TabsOptions } from "./Tabs.ts"

const meta: Meta = { title: "Navigation/Tabs" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const selected = (kit: Kit, id: string, initial: string): string | null => {
  const value = kit.value(id, initial)

  return value === "" ? null : value
}

const tabs = (kit: Kit, id: string, initial: string, options: TabsOptions, children: ReadonlyArray<TabsChild>) =>
  kit.ui.Tabs(kit.h, {
    id,
    value: selected(kit, id, initial),
    onChange: (value) => kit.set(id, value ?? ""),
    ...options,
    children
  })

const gallery = (kit: Kit, id: string, options: TabsOptions = {}) =>
  tabs(kit, id, "gallery", options, [
    tabsList({
      children: [
        tabsTab({ value: "gallery", leftSection: ImageIcon(kit.h, { size: 12 }), children: ["Gallery"] }),
        tabsTab({ value: "messages", leftSection: ChatCircleIcon(kit.h, { size: 12 }), children: ["Messages"] }),
        tabsTab({ value: "settings", leftSection: GearSixIcon(kit.h, { size: 12 }), children: ["Settings"] })
      ]
    }),
    tabsPanel({ value: "gallery", pt: "xs", children: ["Gallery tab content"] }),
    tabsPanel({ value: "messages", pt: "xs", children: ["Messages tab content"] }),
    tabsPanel({ value: "settings", pt: "xs", children: ["Settings tab content"] })
  ])

const frame = (kit: Kit, children: ReadonlyArray<Html>) =>
  kit.ui.Stack(kit.h, { w: "100%", maw: 540, gap: "xl", children })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tab = await canvas.findByRole("tab", { name: "Gallery" })
    const list = canvas.getByRole("tablist")
    await expect(tab).toHaveAttribute("aria-selected", "true")
    await expect(tab).toHaveAttribute("id", "usage-tab-gallery")
    await expect(tab).toHaveAttribute("aria-controls", "usage-panel-gallery")
    await expect(canvas.getByRole("tab", { name: "Messages" })).toHaveAttribute("tabindex", "-1")
    await expect(box(tab).height).toBe(36)
    await expect(css(tab).paddingLeft).toBe("16px")
    await expect(css(tab).borderBottomWidth).toBe("2px")
    await expect(css(tab).borderBottomColor).toBe("rgb(34, 139, 230)")
    await expect(css(tab).borderTopLeftRadius).toBe("8px")
    await expect(css(tab).borderBottomLeftRadius).toBe("0px")
    const line = present(list.firstElementChild)
    await expect(box(line).height).toBe(2)
    await expect(box(line).bottom).toBe(box(list).bottom)
    await expect(css(line).backgroundColor).toBe("rgb(222, 226, 230)")
    const label = within(tab).getByText("Gallery")
    await expect(box(label).left - box(present(tab.querySelector("svg"))).right).toBe(10)
    await expect(box(tab).width).toBeCloseTo(16 + 12 + 10 + box(label).width + 16, 1)
    const panel = canvas.getByRole("tabpanel", { name: "Gallery" })
    await expect(panel).toHaveTextContent("Gallery tab content")
    await expect(canvas.getByText("Messages tab content")).not.toBeVisible()
  }
}

export const Variants: StoryObj = {
  render: demoApp(VariantsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [outline, pills] = await canvas.findAllByRole("tab", { name: "Gallery" })
    const outlined = present(outline)
    await expect(css(outlined).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(css(outlined).borderBottomColor).toBe("rgb(255, 255, 255)")
    await expect(outlined.querySelectorAll(":scope > span[aria-hidden]")).toHaveLength(2)
    const pill = present(pills)
    await expect(css(pill).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(pill).color).toBe("rgb(255, 255, 255)")
    await expect(css(pill).borderBottomLeftRadius).toBe("8px")
    const [, pillList] = canvas.getAllByRole("tablist")
    await expect(css(pillList).columnGap).toBe("6px")
    await expect(present(pillList).querySelector(":scope > span")).toBeNull()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const messages = await canvas.findByRole("tab", { name: "Messages" })
    await userEvent.click(messages)
    await waitFor(() => expect(messages).toHaveAttribute("aria-selected", "true"))
    await expect(canvas.getByRole("tabpanel", { name: "Messages" })).toBeVisible()
    await expect(canvas.getByText("Gallery tab content")).not.toBeVisible()
  }
}

const vertical = (kit: Kit, id: string, options: TabsOptions) =>
  tabs(kit, id, "gallery", { orientation: "vertical", ...options }, [
    tabsList({
      children: [
        tabsTab({ value: "gallery", children: ["Gallery"] }),
        tabsTab({ value: "messages", children: ["Messages"] }),
        tabsTab({ value: "settings", children: ["Settings"] })
      ]
    }),
    tabsPanel({ value: "gallery", px: "md", children: ["Gallery tab content"] }),
    tabsPanel({ value: "messages", px: "md", children: ["Messages tab content"] }),
    tabsPanel({ value: "settings", px: "md", children: ["Settings tab content"] })
  ])

export const Keyboard: StoryObj = {
  render: story((kit) => frame(kit, [gallery(kit, "keyboard"), vertical(kit, "keyboard-vertical", {})])),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const top = within(present((await canvas.findAllByRole("tablist"))[0]))
    const tab = (name: string) => top.getByRole("tab", { name })
    await userEvent.click(tab("Gallery"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(tab("Messages")).toHaveAttribute("aria-selected", "true"))
    await expect(tab("Messages")).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    await waitFor(() => expect(tab("Gallery")).toHaveAttribute("aria-selected", "true"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(tab("Settings")).toHaveAttribute("aria-selected", "true"))
    await userEvent.keyboard("{Home}")
    await expect(tab("Gallery")).toHaveFocus()
    await expect(tab("Settings")).toHaveAttribute("aria-selected", "true")
    await userEvent.keyboard("{End}{ArrowDown}a")
    await expect(tab("Settings")).toHaveFocus()
    const side = within(present(canvas.getAllByRole("tablist")[1]))
    await userEvent.click(side.getByRole("tab", { name: "Gallery" }))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(side.getByRole("tab", { name: "Messages" })).toHaveAttribute("aria-selected", "true"))
    await userEvent.keyboard("{ArrowRight}{ArrowUp}{ArrowUp}")
    await waitFor(() => expect(side.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true"))
  }
}

const chat = (
  kit: Kit,
  id: string,
  options: TabsOptions,
  extra: { readonly disabled?: boolean; readonly pull?: boolean }
) =>
  tabs(kit, id, "chat", options, [
    tabsList({
      children: [
        tabsTab({ value: "chat", children: ["Chat"] }),
        tabsTab({ value: "gallery", children: ["Gallery"] }),
        tabsTab({ value: "settings", disabled: extra.disabled === true, children: ["Settings"] }),
        tabsTab({ value: "account", ...(extra.pull === true ? { ml: "auto" } : {}), children: ["Account"] })
      ]
    })
  ])

export const DisabledAndActivation: StoryObj = {
  render: story((kit) =>
    frame(kit, [
      chat(kit, "disabled", {}, { disabled: true }),
      chat(kit, "manual", { activateTabWithKeyboard: false, loop: false }, {})
    ])
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [disabled, manual] = await canvas.findAllByRole("tablist")
    const first = within(present(disabled))
    const second = within(present(manual))
    await expect(first.getByRole("tab", { name: "Settings" })).toBeDisabled()
    await expect(css(first.getByRole("tab", { name: "Settings" })).opacity).toBe("0.5")
    await userEvent.click(first.getByRole("tab", { name: "Gallery" }))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(first.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true"))
    await userEvent.click(second.getByRole("tab", { name: "Gallery" }))
    await waitFor(() => expect(second.getByRole("tab", { name: "Gallery" })).toHaveAttribute("aria-selected", "true"))
    await userEvent.keyboard("{ArrowRight}")
    await expect(second.getByRole("tab", { name: "Settings" })).toHaveFocus()
    await expect(second.getByRole("tab", { name: "Gallery" })).toHaveAttribute("aria-selected", "true")
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    await expect(second.getByRole("tab", { name: "Account" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(second.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true"))
  }
}

export const Position: StoryObj = {
  render: demoApp(PositionDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [center, grow, pull] = (await canvas.findAllByRole("tablist")).map(present)
    const centered = within(present(center)).getByRole("tab", { name: "First tab" })
    await expect(box(centered).left - box(center).left).toBeGreaterThan(100)
    const grown = within(present(grow)).getAllByRole("tab")
    await expect(box(grown[0] ?? null).width).toBe(270)
    await expect(present(grow)).toHaveAttribute("data-grow")
    const account = within(present(pull)).getByRole("tab", { name: "Account" })
    await expect(box(account).right).toBe(box(pull).right)
  }
}

export const Colors: StoryObj = {
  render: demoApp(ColorsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [teal] = await canvas.findAllByRole("tab", { name: "Teal tab" })
    const [, blue] = canvas.getAllByRole("tab", { name: "Blue tab" })
    await expect(css(teal).borderBottomColor).toBe("rgb(18, 184, 134)")
    await expect(css(blue).borderBottomColor).toBe("rgb(34, 139, 230)")
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo),
  play: async ({ canvasElement }) => {
    const settings = await within(canvasElement).findByRole("tab", { name: "Settings" })
    await expect(settings).toBeDisabled()
    await expect(settings).toHaveAttribute("data-disabled")
  }
}

export const Inverted: StoryObj = {
  render: demoApp(InvertedDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tab = await canvas.findByRole("tab", { name: "Chat" })
    const list = canvas.getByRole("tablist")
    await expect(tab).toHaveAttribute("data-inverted")
    await expect(css(tab).borderTopWidth).toBe("2px")
    await expect(css(tab).borderBottomLeftRadius).toBe("8px")
    await expect(box(present(list.firstElementChild)).top).toBe(box(list).top)
    await expect(box(canvas.getByRole("tabpanel", { name: "Chat" })).bottom).toBeLessThanOrEqual(box(list).top)
  }
}

export const Vertical: StoryObj = {
  render: demoApp(VerticalDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [left, right, outlined, outlinedRight] = (await canvas.findAllByRole("tablist")).map(present)
    const leftTab = within(present(left)).getByRole("tab", { name: "Gallery" })
    await expect(left).toHaveAttribute("aria-orientation", "vertical")
    await expect(css(leftTab).borderRightWidth).toBe("2px")
    await expect(css(leftTab).borderTopLeftRadius).toBe("8px")
    await expect(css(leftTab).borderTopRightRadius).toBe("0px")
    await expect(box(present(left).firstElementChild).width).toBe(2)
    const rightTab = within(present(right)).getByRole("tab", { name: "Gallery" })
    await expect(css(rightTab).borderLeftWidth).toBe("2px")
    await expect(box(right).left).toBeGreaterThan(box(canvas.getAllByText("Gallery tab content")[1] ?? null).left)
    await expect(right).toHaveAttribute("data-placement", "right")
    await expect(css(within(present(outlined)).getByRole("tab", { name: "Gallery" })).borderRightColor).toBe(
      "rgb(255, 255, 255)"
    )
    await expect(css(within(present(outlinedRight)).getByRole("tab", { name: "Gallery" })).borderLeftColor).toBe(
      "rgb(255, 255, 255)"
    )
    await expect(css(canvas.getAllByRole("tabpanel", { name: "Gallery" })[0]?.parentElement).display).toBe("flex")
  }
}

export const Deactivation: StoryObj = {
  render: story((kit) =>
    tabs(kit, "deactivate", "first", { allowTabDeactivation: true, keepMounted: false, radius: "xs" }, [
      tabsList({
        children: [
          tabsTab({ value: "first", children: ["First tab"] }),
          tabsTab({ value: "second", children: ["Second tab"] })
        ]
      }),
      tabsPanel({ value: "first", children: ["First panel"] }),
      tabsPanel({ value: "second", keepMounted: true, children: ["Second panel"] })
    ])
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("tab", { name: "First tab" })
    await expect(css(first).borderTopLeftRadius).toBe("2px")
    await expect(canvas.getByText("Second panel")).not.toBeVisible()
    await userEvent.click(first)
    await waitFor(() => expect(first).toHaveAttribute("aria-selected", "false"))
    await expect(first).toHaveAttribute("tabindex", "0")
    await expect(canvas.queryByText("First panel")).toBeNull()
    await userEvent.click(canvas.getByRole("tab", { name: "Second tab" }))
    await waitFor(() => expect(canvas.getByText("Second panel")).toBeVisible())
  }
}

export const IconsAndContrast: StoryObj = {
  render: demoApp(IconsAndContrastDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByRole("tab", { name: "Lime" })).color).toBe("rgb(0, 0, 0)")
    const settings = canvas.getByRole("tab", { name: "Settings" })
    await expect(present(settings.lastElementChild)).toHaveAttribute("data-position", "right")
    await expect(css(settings.lastElementChild).marginLeft).toBe("10px")
    const chatTab = canvas.getByRole("tab", { name: "Chat" })
    await expect(css(chatTab.firstElementChild).marginRight).toBe("0px")
    await expect(chatTab).not.toHaveAttribute("aria-controls")
    await expect(css(canvas.getByRole("tab", { name: "More" }).firstElementChild).marginLeft).toBe("0px")
    await expect(css(canvas.getByRole("tab", { name: "Archived" })).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(canvas.getByText("Plain content between the parts stays as it is")).toBeVisible()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story((kit) => frame(kit, [gallery(kit, "dark"), gallery(kit, "dark-outline", { variant: "outline" })])),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [list] = await canvas.findAllByRole("tablist")
    await expect(css(present(list).firstElementChild).backgroundColor).toBe("rgb(66, 66, 66)")
    const [, outline] = canvas.getAllByRole("tab", { name: "Gallery" })
    await expect(css(outline ?? null).borderBottomColor).toBe("rgb(36, 36, 36)")
  }
}

const switchesTo =
  (name: string) =>
  async ({ canvasElement }: { readonly canvasElement: HTMLElement }) => {
    const [tab] = await within(canvasElement).findAllByRole("tab", { name })
    await userEvent.click(present(tab))
    await waitFor(() => expect(tab).toHaveAttribute("aria-selected", "true"))
  }

export const SwitchingVariants: StoryObj = { render: demoApp(VariantsDemo), play: switchesTo("Messages") }

export const SwitchingColors: StoryObj = { render: demoApp(ColorsDemo), play: switchesTo("Blue tab") }

export const SwitchingPastDisabled: StoryObj = { render: demoApp(DisabledDemo), play: switchesTo("Gallery") }

export const SwitchingPositions: StoryObj = { render: demoApp(PositionDemo), play: switchesTo("Second tab") }

export const SwitchingInverted: StoryObj = { render: demoApp(InvertedDemo), play: switchesTo("Gallery") }

export const SwitchingVertical: StoryObj = { render: demoApp(VerticalDemo), play: switchesTo("Messages") }

export const SwitchingPills: StoryObj = { render: demoApp(IconsAndContrastDemo), play: switchesTo("Settings") }

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
