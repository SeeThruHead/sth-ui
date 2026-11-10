import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as InlineDemo from "./demos/inline.ts"
import * as MaxValueDemo from "./demos/max-value.ts"
import * as OffsetDemo from "./demos/offset.ts"
import * as PositionsDemo from "./demos/positions.ts"
import * as ProcessingDemo from "./demos/processing.ts"
import * as ShowZeroDemo from "./demos/show-zero.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "DataDisplay/Indicator" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const dotOf = (avatar: HTMLElement) => present(present(avatar.closest("[data-inline]")).firstElementChild)

const avatar = async (canvasElement: HTMLElement, name: string) =>
  present(
    (await within(canvasElement).findByRole("img", { name })).closest<HTMLElement>("[data-inline] > *:last-child")
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const picture = await avatar(canvasElement, "Avatar 1")
    const dot = dotOf(picture)
    await expect(box(dot).width).toBe(10)
    await expect(box(dot).height).toBe(10)
    await expect(css(dot).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(dot).borderTopLeftRadius).toBe("16000px")
    await expect(css(dot).zIndex).toBe("200")
    await expect(Math.round(box(dot).left + 5)).toBe(Math.round(box(picture).right))
    await expect(Math.round(box(dot).top + 5)).toBe(Math.round(box(picture).top))
    await expect(present(picture.parentElement)).toHaveAttribute("data-inline")
  }
}

export const Inline: StoryObj = {
  render: demo(InlineDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const dot = dotOf(await avatar(canvasElement, "Avatar 2"))
    await expect(dot).toHaveTextContent("New")
    await expect(dot).toHaveAttribute("data-with-label")
    await expect(box(dot).height).toBe(16)
    await expect(css(dot).paddingLeft).toBe("5px")
    await expect(css(dot).color).toBe("rgb(255, 255, 255)")
    await expect(css(dot).fontSize).toBe("12px")
  }
}

export const Offset: StoryObj = {
  render: demo(OffsetDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const picture = await avatar(canvasElement, "Avatar 3")
    const dot = dotOf(picture)
    await expect(box(dot).width).toBe(16)
    await expect(css(dot).borderTopWidth).toBe("2px")
    await expect(css(dot).borderTopColor).toBe("rgb(255, 255, 255)")
    await expect(css(dot).backgroundColor).toBe("rgb(250, 82, 82)")
    await expect(Math.round(box(dot).right - 8)).toBe(Math.round(box(picture).right - 7))
    await expect(Math.round(box(dot).bottom - 8)).toBe(Math.round(box(picture).bottom - 7))
  }
}

export const Processing: StoryObj = {
  render: demo(ProcessingDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const dot = dotOf(await avatar(canvasElement, "Avatar 4"))
    await expect(dot).toHaveAttribute("data-processing")
    await expect(css(dot, "::before").animationName).not.toBe("none")
    await expect(css(dot, "::before").animationDuration).toBe("1s")
    await expect(box(dot).width).toBe(12)
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const picture = await avatar(canvasElement, "Avatar 5")
    await expect(present(picture.parentElement).children).toHaveLength(1)
    await expect(within(canvasElement).getByRole("button", { name: "Toggle indicator" })).toBeVisible()
  }
}

export const Toggling: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const picture = await avatar(canvasElement, "Avatar 5")
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle indicator" }))
    await waitFor(() => expect(present(picture.parentElement).children).toHaveLength(2))
    await expect(box(dotOf(picture)).width).toBe(12)
  }
}

export const MaxValue: StoryObj = {
  render: demo(MaxValueDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(dotOf(await avatar(canvasElement, "Fifty"))).toHaveTextContent(/^50$/)
    await expect(dotOf(await avatar(canvasElement, "Hundred"))).toHaveTextContent("99+")
    await expect(dotOf(await avatar(canvasElement, "Thousand"))).toHaveTextContent("999+")
  }
}

export const ShowZero: StoryObj = {
  render: demo(ShowZeroDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const shows = dotOf(await avatar(canvasElement, "Shows zero"))
    await expect(shows).toHaveTextContent("0")
    await expect(shows).not.toHaveAttribute("data-with-label")
    const hides = await avatar(canvasElement, "Hides zero")
    await expect(present(hides.parentElement).children).toHaveLength(1)
  }
}

export const AutoContrast: StoryObj = {
  render: demo(AutoContrastDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const plain = dotOf(await avatar(canvasElement, "Lime"))
    await expect(css(plain).backgroundColor).toBe("rgb(169, 227, 75)")
    await expect(css(plain).color).toBe("rgb(255, 255, 255)")
    await expect(css(dotOf(await avatar(canvasElement, "Lime with contrast"))).color).toBe("oklch(0 0 0)")
    await expect(css(dotOf(await avatar(canvasElement, "Cyan with contrast"))).color).toBe("oklch(1 0 0)")
  }
}

export const Positions: StoryObj = {
  render: demo(PositionsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const place = async (name: string) => {
      const dot = present((await canvas.findByText(name)).parentElement)
      return { dot: box(dot), area: box(dot.nextElementSibling), style: css(dot) }
    }
    const topStart = await place("top-start")
    await expect(Math.round(topStart.dot.left + topStart.dot.width / 2)).toBe(Math.round(topStart.area.left + 4))
    await expect(Math.round(topStart.dot.top + topStart.dot.height / 2)).toBe(Math.round(topStart.area.top + 2))
    await expect(topStart.style.borderTopLeftRadius).toBe("2px")
    await expect(topStart.style.zIndex).toBe("5")
    const center = await place("middle-center")
    await expect(Math.round(center.dot.left + center.dot.width / 2)).toBe(
      Math.round(center.area.left + center.area.width / 2)
    )
    await expect(Math.round(center.dot.top + center.dot.height / 2)).toBe(
      Math.round(center.area.top + center.area.height / 2)
    )
    const bottomEnd = await place("bottom-end")
    await expect(Math.round(bottomEnd.dot.right - bottomEnd.dot.width / 2)).toBe(Math.round(bottomEnd.area.right - 4))
    await expect(Math.round(bottomEnd.dot.bottom - bottomEnd.dot.height / 2)).toBe(
      Math.round(bottomEnd.area.bottom - 2)
    )
    await expect(css(present((await canvas.findByText("top-center")).parentElement?.parentElement)).display).toBe(
      "block"
    )
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(OffsetDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const dot = dotOf(await avatar(canvasElement, "Avatar 3"))
    await expect(css(dot).borderTopColor).toBe("rgb(36, 36, 36)")
    await expect(css(dot).backgroundColor).toBe("rgb(224, 49, 49)")
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const picture = await avatar(canvasElement, "Empty label")
    const dot = dotOf(picture)
    await expect(dot).not.toHaveAttribute("data-with-label")
    await expect(box(dot).width).toBe(10)
    await expect(Math.round(box(dot).top + 5)).toBe(Math.round(box(picture).top + 6))
    await expect(Math.round(box(dot).right - 5)).toBe(Math.round(box(picture).right - 3))
    const alone = await within(canvasElement).findByText("Alone")
    await expect(present(alone.parentElement).children).toHaveLength(1)
    const zero = await avatar(canvasElement, "Text zero")
    await expect(present(zero.parentElement).children).toHaveLength(1)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("img", { name: "Avatar 1" })).toBeVisible()
  }
}
