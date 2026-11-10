import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as WithinInputDemo from "./demos/within-input.ts"

const meta: Meta = { title: "Combobox/Pill" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const pill = (canvasElement: HTMLElement, text: string) => present(within(canvasElement).getByText(text).parentElement)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("React")
    const react = pill(canvasElement, "React")
    await expect(box(react).height).toBe(25)
    await expect(css(react).fontSize).toBe("14px")
    await expect(css(react).paddingLeft).toBe("11.2px")
    await expect(css(react).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(css(react).borderTopLeftRadius).toBe("16000px")
    await expect(react.querySelector("button")).toBeNull()
  }
}

export const WithinInput: StoryObj = {
  render: demoApp(WithinInputDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const field = await within(canvasElement).findByLabelText("Chosen items")
    await expect(field.tagName).toBe("DIV")
    const first = pill(canvasElement, "Item 0")
    await expect(box(first).height).toBe(22)
    await expect(css(first).paddingRight).toBe("0px")
    const remove = present(first.querySelector("button"))
    await expect(remove).toHaveAttribute("aria-hidden", "true")
    await expect(remove).toHaveAttribute("tabindex", "-1")
    await expect(box(remove).width).toBe(24)
    await expect(css(remove).paddingLeft).toBe("1.2px")
    await expect(css(remove).borderTopRightRadius).toBe("16000px")
    await expect(Math.round(box(pill(canvasElement, "Item 1")).left - box(first).right)).toBe(8)
  }
}

export const Removing: StoryObj = {
  render: demoApp(WithinInputDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Item 3")
    await userEvent.click(present(pill(canvasElement, "Item 3").querySelector("button")))
    await waitFor(() => expect(within(canvasElement).queryByText("Item 3")).toBeNull())
    await expect(within(canvasElement).getAllByText(/^Item/)).toHaveLength(9)
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("xl")
    const heights = ["xs", "sm", "md", "lg", "xl"].map((size) => box(pill(canvasElement, size)).height)
    await expect(heights).toEqual([18, 22, 25, 28, 32])
    await expect(Math.round(box(pill(canvasElement, "sm")).left - box(pill(canvasElement, "xs")).right)).toBe(12)
    await expect(Math.round(box(pill(canvasElement, "Contrast")).left - box(pill(canvasElement, "Square")).right)).toBe(
      32
    )
    await expect(css(pill(canvasElement, "Square")).borderTopLeftRadius).toBe("2px")
    await expect(css(pill(canvasElement, "Contrast")).backgroundColor).toBe("rgb(255, 255, 255)")
    const disabled = pill(canvasElement, "Disabled")
    await expect(disabled).toHaveAttribute("data-disabled")
    await expect(css(disabled).cursor).toBe("not-allowed")
    await expect(disabled.querySelector("button")).toBeNull()
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("React")
    const react = pill(canvasElement, "React")
    await expect(css(react).color).toBe("rgb(201, 201, 201)")
    await expect(css(react).backgroundColor).toBe("rgb(36, 36, 36)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
