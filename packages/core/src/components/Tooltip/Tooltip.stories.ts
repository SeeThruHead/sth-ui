import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ArrowDemo from "./demos/arrow.ts"
import * as ColorDemo from "./demos/color.ts"
import * as DelayDemo from "./demos/delay.ts"
import * as FloatingDemo from "./demos/floating.ts"
import * as GroupDemo from "./demos/group.ts"
import * as InteractiveDemo from "./demos/interactive.ts"
import * as MultilineDemo from "./demos/multiline.ts"
import * as OffsetDemo from "./demos/offset.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Tooltip" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const body = within(document.body)

const tooltipOf = (button: HTMLElement) =>
  waitFor(() => present(document.getElementById(present(button.getAttribute("aria-describedby")))))

const settled = { timeout: 3000 }

const placed = async (tooltip: HTMLElement, side: string) => {
  await waitFor(() => expect(tooltip).toHaveAttribute("data-placement", side), settled)
  await waitFor(() => expect(css(tooltip).opacity).toBe("1"), settled)
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button with tooltip" })
    await expect(button).toHaveAttribute("aria-describedby", "usage-panel")
    await expect(body.queryByRole("tooltip")).toBeNull()
  }
}

export const Hovering: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button with tooltip" })
    await expect(body.queryByRole("tooltip")).toBeNull()
    await userEvent.hover(button)
    const tooltip = await body.findByRole("tooltip")
    await expect(tooltip).toHaveTextContent("Tooltip")
    await expect(button).toHaveAccessibleDescription("Tooltip")
    await placed(tooltip, "top")
    await expect(css(tooltip).backgroundColor).toBe("rgb(33, 37, 41)")
    await expect(css(tooltip).color).toBe("rgb(255, 255, 255)")
    await expect(css(tooltip).pointerEvents).toBe("none")
    await expect(Math.round(box(button).top - box(tooltip).bottom)).toBe(5)
    await userEvent.unhover(button)
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull())
  }
}

export const Focusing: StoryObj = {
  render: demoApp(UsageDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button with tooltip" })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await body.findByRole("tooltip")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull())
    await expect(button).toHaveFocus()
  }
}

export const Arrow: StoryObj = {
  render: demoApp(ArrowDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button with tooltip" })
    const tooltip = await tooltipOf(button)
    await placed(tooltip, "top")
    const arrow = present(tooltip.querySelector("[aria-hidden='true']"))
    await expect(css(arrow).width).toBe("4px")
    await expect(css(arrow).bottom).toBe("-2px")
    await expect(css(arrow).left).toBe("5px")
    await expect(css(arrow).backgroundColor).toBe(css(tooltip).backgroundColor)
    await expect(Math.round(box(tooltip).left)).toBe(Math.round(box(button).left))
    await expect(Math.round(box(button).top - box(tooltip).bottom)).toBe(7)
  }
}

export const Offset: StoryObj = {
  render: demoApp(OffsetDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button with tooltip" })
    const tooltip = await tooltipOf(button)
    await placed(tooltip, "right")
    await expect(Math.round(box(tooltip).left - box(button).right)).toBe(20)
  }
}

export const Multiline: StoryObj = {
  render: demoApp(MultilineDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Multiline tooltip" })
    const tooltip = await tooltipOf(button)
    await waitFor(() => expect(tooltip).toHaveAttribute("data-placement"), settled)
    await waitFor(() => expect(css(tooltip).opacity).toBe("1"), settled)
    await expect(tooltip).toHaveAttribute("data-multiline")
    await expect(css(tooltip).whiteSpace).toBe("normal")
    await expect(box(tooltip).width).toBe(220)
    await expect(box(tooltip).height).toBeGreaterThan(40)
    await expect(box(tooltip.querySelector("[aria-hidden='true']")).width).toBeGreaterThan(0)
  }
}

export const Color: StoryObj = {
  render: demoApp(ColorDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const colors = [
      ["Blue", "rgb(34, 139, 230)"],
      ["Grape", "rgb(190, 75, 219)"],
      ["Teal", "rgb(18, 184, 134)"]
    ] as const
    await Promise.all(
      colors.map(async ([name, color]) => {
        const tooltip = await tooltipOf(await canvas.findByRole("button", { name }))
        await placed(tooltip, "top")
        await expect(css(tooltip).backgroundColor).toBe(color)
        await expect(css(tooltip).color).toBe("rgb(255, 255, 255)")
      })
    )
  }
}

export const Delay: StoryObj = {
  render: demoApp(DelayDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "No delay" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Delay open - 500ms" })).toBeVisible()
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull(), settled)
  }
}

export const Delaying: StoryObj = {
  render: demoApp(DelayDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slow = await canvas.findByRole("button", { name: "Delay open - 500ms" })
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull(), settled)
    const started = performance.now()
    await userEvent.hover(slow)
    await body.findByRole("tooltip", {}, { timeout: 3000 })
    await expect(performance.now() - started).toBeGreaterThanOrEqual(450)
    await expect(body.getByRole("tooltip")).toHaveTextContent("Opened after 500ms")
    await userEvent.unhover(slow)
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull())
    await userEvent.hover(canvas.getByRole("button", { name: "No delay" }))
    await expect(await body.findByRole("tooltip")).toHaveTextContent("Opens at once")
  }
}

export const DelayingClose: StoryObj = {
  render: demoApp(DelayDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const late = await within(canvasElement).findByRole("button", { name: "Delay close - 500ms" })
    await userEvent.hover(late)
    await expect(await body.findByRole("tooltip")).toHaveTextContent("Closes after 500ms")
    const started = performance.now()
    await userEvent.unhover(late)
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull(), settled)
    await expect(performance.now() - started).toBeGreaterThanOrEqual(450)
    await userEvent.hover(late)
    await body.findByRole("tooltip")
    await userEvent.unhover(late)
    await userEvent.hover(late)
    await expect(waitFor(() => expect(body.queryByRole("tooltip")).toBeNull(), { timeout: 700 })).rejects.toThrow()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(ArrowDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button with tooltip" })
    const tooltip = await tooltipOf(button)
    await placed(tooltip, "top")
    await expect(css(tooltip).backgroundColor).toBe("rgb(233, 236, 239)")
    await expect(css(tooltip).color).toBe("rgb(0, 0, 0)")
  }
}

const hoverAway = async (button: HTMLElement) => {
  await userEvent.hover(button)
  await waitFor(() => expect(button).toHaveAttribute("data-open"))
  await userEvent.unhover(button)
  const tooltip = await tooltipOf(button)
  await waitFor(() => expect(tooltip).toBeVisible(), settled)
}

export const HoveringOpened: StoryObj = {
  render: demoApp(ArrowDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await hoverAway(await within(canvasElement).findByRole("button", { name: "Button with tooltip" }))
  }
}

export const HoveringOffset: StoryObj = {
  render: demoApp(OffsetDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await hoverAway(await within(canvasElement).findByRole("button", { name: "Button with tooltip" }))
  }
}

export const HoveringMultiline: StoryObj = {
  render: demoApp(MultilineDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await hoverAway(await within(canvasElement).findByRole("button", { name: "Multiline tooltip" }))
  }
}

export const HoveringColors: StoryObj = {
  render: demoApp(ColorDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await hoverAway(await within(canvasElement).findByRole("button", { name: "Grape" }))
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const styledButton = await canvas.findByRole("button", { name: "Styled" })
    const styled = await tooltipOf(styledButton)
    await placed(styled, "bottom")
    await expect(canvasElement.contains(styled)).toBe(true)
    await expect(css(styled).backgroundColor).toBe("rgb(250, 176, 5)")
    await expect(css(styled).color).not.toBe("rgb(255, 255, 255)")
    await expect(css(styled).borderTopLeftRadius).toBe("32px")
    await expect(css(styled).zIndex).toBe("500")
    const styledArrow = present(styled.querySelector("[aria-hidden='true']"))
    await expect(css(styledArrow).width).toBe("8px")
    await expect(css(styledArrow).borderTopLeftRadius).toBe("2px")
    await expect(
      Math.abs(box(styledArrow).left + box(styledArrow).width / 2 - (box(styled).left + box(styled).width / 2))
    ).toBeLessThanOrEqual(1)
    await expect(Math.round(box(styled).top - box(styledButton).bottom)).toBe(9)
    const off = canvas.getByRole("button", { name: "Disabled" })
    await expect(off).toHaveAttribute("aria-disabled", "true")
    await expect(body.queryByText("Disabled tooltip")).toBeNull()
    await userEvent.hover(off)
    await expect(body.queryByText("Disabled tooltip")).toBeNull()
    const endButton = canvas.getByRole("button", { name: "End" })
    await expect(body.queryByText("End tooltip")).toBeNull()
    await userEvent.hover(endButton)
    const end = await tooltipOf(endButton)
    await placed(end, "top")
    const endArrow = present(end.querySelector("[aria-hidden='true']"))
    await expect(Number.parseFloat(css(endArrow).left)).toBeCloseTo(box(end).width - 9, 1)
  }
}

export const Group: StoryObj = {
  render: demoApp(GroupDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole("button", { name: /Button/ })).toHaveLength(3)
  }
}

export const MovingThroughGroup: StoryObj = {
  render: demoApp(GroupDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "Button 1" })
    await userEvent.hover(first)
    await expect(await body.findByRole("tooltip", {}, { timeout: 3000 })).toHaveTextContent("Tooltip 1")
    await userEvent.unhover(first)
    const started = performance.now()
    await userEvent.hover(canvas.getByRole("button", { name: "Button 2" }))
    await waitFor(() => expect(body.getByRole("tooltip")).toHaveTextContent("Tooltip 2"))
    await expect(performance.now() - started).toBeLessThan(400)
    await expect(body.getAllByRole("tooltip")).toHaveLength(1)
  }
}

export const Floating: StoryObj = {
  render: demoApp(FloatingDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Hover over the box to see tooltip")).toBeVisible()
    await expect(body.queryByRole("tooltip")).toBeNull()
  }
}

const placements = [
  { position: "top", x: 60, y: 20, anchor: (rect: DOMRect) => [rect.left + rect.width / 2, rect.bottom] },
  { position: "bottom", x: 60, y: 40, anchor: (rect: DOMRect) => [rect.left + rect.width / 2, rect.top] },
  { position: "left", x: 50, y: 30, anchor: (rect: DOMRect) => [rect.right, rect.top + rect.height / 2] }
]

export const FollowingPointer: StoryObj = {
  render: demoApp(FloatingDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const target = present((await within(canvasElement).findByText("Hover over the box to see tooltip")).parentElement)
    const area = box(target)
    const user = userEvent.setup()
    await user.pointer({ target, coords: { clientX: area.left + 20, clientY: area.top + 20 } })
    const tooltip = await body.findByRole("tooltip")
    await waitFor(() => expect(tooltip).toHaveStyle({ visibility: "visible" }))
    await expect(tooltip).toHaveTextContent("Tooltip")
    await waitFor(() => expect(Math.round(box(tooltip).left)).toBe(Math.round(area.left + 30)))
    await user.pointer({ target, coords: { clientX: area.left + 60, clientY: area.top + 30 } })
    await waitFor(() => expect(Math.round(box(tooltip).left)).toBe(Math.round(area.left + 70)))
    await expect(Math.round(box(tooltip).top + box(tooltip).height / 2)).toBe(Math.round(area.top + 30))
    await userEvent.unhover(target)
    await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull())
    await placements.reduce(async (previous, expected) => {
      await previous
      await user.click(within(canvasElement).getByRole("button", { name: expected.position }))
      await user.pointer({ target, coords: { clientX: area.left + 60, clientY: area.top + 30 } })
      const shown = await body.findByRole("tooltip")
      await waitFor(() =>
        expect(expected.anchor(box(shown)).map(Math.round)).toEqual([
          Math.round(area.left + expected.x),
          Math.round(area.top + expected.y)
        ])
      )
      await userEvent.unhover(target)
      await waitFor(() => expect(body.queryByRole("tooltip")).toBeNull())
    }, Promise.resolve())
    const second = present(within(canvasElement).getByText("Coloured, multiline, offset 20").parentElement)
    await userEvent.hover(second)
    await expect(await body.findByRole("tooltip")).toHaveTextContent("A coloured tooltip")
    await userEvent.unhover(second)
    const disable = within(canvasElement).getByRole("checkbox", { name: "Disable the second" })
    await user.click(disable)
    await waitFor(() => expect(disable).toBeChecked())
    await userEvent.hover(second)
    await expect(waitFor(() => expect(body.getByRole("tooltip")).toBeVisible(), { timeout: 300 })).rejects.toThrow()
  }
}

export const Interactive: StoryObj = {
  render: demoApp(InteractiveDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Interactive tooltip" })
    const tooltip = await tooltipOf(button)
    await expect(tooltip).not.toBeVisible()
    await expect(css(tooltip).animationDuration).toBe("0.3s")
  }
}

export const UsingInteractive: StoryObj = {
  render: demoApp(InteractiveDemo, { centered: "spacious" }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Interactive tooltip" })
    await userEvent.hover(button)
    const tooltip = await tooltipOf(button)
    await waitFor(() => expect(tooltip).toBeVisible(), settled)
    await userEvent.unhover(button)
    await userEvent.hover(tooltip)
    await expect(css(tooltip).pointerEvents).toBe("auto")
    await expect(waitFor(() => expect(tooltip).not.toBeVisible(), { timeout: 400 })).rejects.toThrow()
    await expect(within(tooltip).getByRole("link", { name: "A link inside the tooltip" })).toBeVisible()
    await userEvent.unhover(tooltip)
    await waitFor(() => expect(tooltip).not.toBeVisible(), settled)
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
