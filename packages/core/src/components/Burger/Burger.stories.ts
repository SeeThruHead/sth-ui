import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import type { BurgerSize } from "./Burger.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as OpenedDemo from "./demos/opened.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as LineSizeDemo from "./demos/line-size.ts"

const meta: Meta = { title: "Navigation/Burger" }

export default meta

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

const sizes: ReadonlyArray<BurgerSize> = ["xs", "sm", "md", "lg", "xl"]

const lines = (button: HTMLElement) => {
  const middle = present(button.firstElementChild)

  return { middle, top: present(middle.firstElementChild), bottom: present(middle.lastElementChild) }
}

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const burger = await within(canvasElement).findByRole("button", { name: "Toggle navigation" })
    const { middle, top, bottom } = lines(burger)
    await expect(burger).toHaveAttribute("aria-expanded", "false")
    await expect(box(burger).width).toBe(34)
    await expect(box(middle).width).toBe(24)
    await expect(box(middle).height).toBe(2)
    await expect(css(middle).backgroundColor).toBe("rgb(0, 0, 0)")
    await expect(box(top).top).toBe(box(middle).top - 8)
    await expect(box(bottom).top).toBe(box(middle).top + 8)
  }
}

export const Opened: StoryObj = {
  render: demo(OpenedDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const burger = await within(canvasElement).findByRole("button", { name: "Close navigation" })
    const { middle, top, bottom } = lines(burger)
    await expect(burger).toHaveAttribute("aria-expanded", "true")
    await expect(middle).toHaveAttribute("data-opened")
    await expect(css(middle).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await waitFor(() => expect(css(top).transform).toBe("matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 8)"))
    await expect(css(bottom).transform).toBe("matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, -8)")
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, value, set }) => {
    const opened = value("opened", "no") === "yes"

    return ui.Burger(h, { opened, onClick: set("opened", opened ? "no" : "yes"), label: "Toggle navigation" })
  }),
  play: async ({ canvasElement }) => {
    const burger = await within(canvasElement).findByRole("button", { name: "Toggle navigation" })
    await userEvent.click(burger)
    await waitFor(() => expect(burger).toHaveAttribute("aria-expanded", "true"))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(burger).toHaveAttribute("aria-expanded", "false"))
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("button", { name: "Size xs" })
    const widthOf = (name: string) => box(lines(canvas.getByRole("button", { name })).middle).width
    await expect(sizes.map((size) => widthOf(`Size ${size}`))).toEqual([12, 18, 24, 34, 42])
    await expect(widthOf("30 pixels")).toBe(30)
    await expect(widthOf("2rem")).toBe(32)
  }
}

export const LineSize: StoryObj = {
  render: demo(LineSizeDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const thin = lines(await canvas.findByRole("button", { name: "Thin lines" }))
    const thick = lines(canvas.getByRole("button", { name: "Thick blue lines" }))
    const red = lines(canvas.getByRole("button", { name: "Red" }))
    await expect(box(thin.middle).height).toBe(2)
    await expect(box(thick.middle).height).toBe(6)
    await expect(css(thick.middle).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(red.middle).backgroundColor).toBe("rgb(240, 62, 62)")
    await expect(css(red.middle).transitionDuration).toBe("0s")
    await expect(css(red.middle).transitionTimingFunction).toBe("linear")
  }
}

export const Disabled: StoryObj = {
  render: story(({ h, ui, log }) => ui.Burger(h, { disabled: true, onClick: log("clicked"), label: "Unavailable" })),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Unavailable" })).toBeDisabled()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story(({ h, ui }) => ui.Burger(h, { label: "Toggle navigation" }), { centered: true }),
  play: async ({ canvasElement }) => {
    const burger = await within(canvasElement).findByRole("button", { name: "Toggle navigation" })
    await expect(css(lines(burger).middle).backgroundColor).toBe("rgb(255, 255, 255)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
