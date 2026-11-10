import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AllowClearDemo from "./demos/allow-clear.ts"
import * as CustomSymbolDemo from "./demos/custom-symbol.ts"
import * as FractionsDemo from "./demos/fractions.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as ReadOnlyDemo from "./demos/read-only.ts"
import * as SymbolDemo from "./demos/symbol.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/Rating" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const filledStars = (group: HTMLElement) => [...group.querySelectorAll("[data-full]")].map((full) => css(full).clipPath)

const yellow = "rgb(250, 176, 5)"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Rating" })
    const two = within(group).getByRole("radio", { name: "2" })
    await expect(two).toBeChecked()
    await expect(two).toHaveAttribute("tabindex", "0")
    await expect(within(group).getAllByRole("radio")).toHaveLength(5)
    await expect(filledStars(group)).toEqual([
      "inset(0px 0% 0px 0px)",
      "inset(0px 0% 0px 0px)",
      "inset(0px 100% 0px 0px)",
      "inset(0px 100% 0px 0px)",
      "inset(0px 100% 0px 0px)"
    ])
    const stars = group.querySelectorAll("svg")
    await expect(box(stars[0]).width).toBe(18)
    await expect(css(stars[1]).fill).toBe(yellow)
    await expect(css(stars[0]).fill).toBe("rgb(222, 226, 230)")
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Rating" })
    const four = within(group).getByRole("radio", { name: "4" })
    await userEvent.hover(four)
    await waitFor(() => expect(filledStars(group)[3]).toBe("inset(0px 0% 0px 0px)"))
    await expect(present(four.parentElement)).toHaveAttribute("data-active")
    await userEvent.click(four)
    await waitFor(() => expect(four).toBeChecked())
    await expect(four).toHaveFocus()
    await userEvent.unhover(group)
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(within(group).getByRole("radio", { name: "5" })).toBeChecked())
    await userEvent.keyboard("{ArrowRight}")
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(within(group).getByRole("radio", { name: "4" })).toBeChecked())
    await userEvent.keyboard("{Enter}")
    await expect(within(group).getByRole("radio", { name: "4" })).toBeChecked()
  }
}

export const ReadOnly: StoryObj = {
  render: demoApp(ReadOnlyDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Rating" })
    await expect(within(group).getAllByRole("radio")).toHaveLength(10)
    await expect(within(group).getByRole("radio", { name: "3.5" })).toBeChecked()
    await expect(filledStars(group)[3]).toBe("inset(0px 50% 0px 0px)")
    await userEvent.click(within(group).getByRole("radio", { name: "1" }))
    await expect(within(group).getByRole("radio", { name: "3.5" })).toBeChecked()
  }
}

export const AllowClear: StoryObj = {
  render: demoApp(AllowClearDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("3")).toBeVisible()
  }
}

export const Clearing: StoryObj = {
  render: demoApp(AllowClearDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByRole("radiogroup", { name: "Rating" })
    await userEvent.click(within(group).getByRole("radio", { name: "3" }))
    await waitFor(() => expect(canvas.getByText("Not rated")).toBeVisible())
    await expect(within(group).getByRole("radio", { name: "1" })).toHaveAttribute("tabindex", "0")
  }
}

export const Fractions: StoryObj = {
  render: demoApp(FractionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const quarters = await canvas.findByRole("radiogroup", { name: "Quarters" })
    await expect(within(quarters).getAllByRole("radio")).toHaveLength(20)
    await expect(within(quarters).getByRole("radio", { name: "3.75" })).toBeChecked()
    await expect(filledStars(quarters)[3]).toBe("inset(0px 25% 0px 0px)")
    const thirds = canvas.getByRole("radiogroup", { name: "Thirds" })
    await expect(within(thirds).getAllByRole("radio")).toHaveLength(15)
  }
}

export const ChoosingFractions: StoryObj = {
  render: demoApp(FractionsDemo),
  play: async ({ canvasElement }) => {
    const halves = await within(canvasElement).findByRole("radiogroup", { name: "Halves" })
    const half = within(halves).getByRole("radio", { name: "2.5" })
    await expect(box(half).width).toBeCloseTo(box(half.parentElement).width / 2, 0)
    await userEvent.click(half)
    await waitFor(() => expect(half).toBeChecked())
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(within(halves).getByRole("radio", { name: "2" })).toBeChecked())
    const thirds = within(canvasElement).getByRole("radiogroup", { name: "Thirds" })
    await userEvent.click(within(thirds).getAllByRole("radio")[0] ?? thirds)
    const quarters = within(canvasElement).getByRole("radiogroup", { name: "Quarters" })
    await userEvent.click(within(quarters).getByRole("radio", { name: "0.25" }))
    await waitFor(() => expect(within(quarters).getByRole("radio", { name: "0.25" })).toBeChecked())
  }
}

export const Symbol: StoryObj = {
  render: demoApp(SymbolDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Rating" })
    await expect(group.querySelectorAll("svg")).toHaveLength(10)
    await expect(box(group.querySelector("svg")).width).toBe(16)
    await userEvent.click(within(group).getByRole("radio", { name: "3" }))
    await waitFor(() => expect(within(group).getByRole("radio", { name: "3" })).toBeChecked())
  }
}

export const CustomSymbol: StoryObj = {
  render: demoApp(CustomSymbolDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Rating" })
    await expect(box(group.querySelector("svg")).width).toBe(24)
    await userEvent.click(within(group).getByRole("radio", { name: "4" }))
    await userEvent.unhover(group)
    await waitFor(() => expect(within(group).getByRole("radio", { name: "4" })).toBeChecked())
    await waitFor(() =>
      expect(filledStars(group)).toEqual([
        "inset(0px 100% 0px 0px)",
        "inset(0px 100% 0px 0px)",
        "inset(0px 100% 0px 0px)",
        "inset(0px 0% 0px 0px)",
        "inset(0px 100% 0px 0px)"
      ])
    )
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const big = await canvas.findByRole("radiogroup", { name: "Big" })
    await expect(box(big.querySelector("svg")).width).toBe(32)
    await expect(css(big.querySelectorAll("svg")[1]).fill).toBe("rgb(190, 75, 219)")
    await expect(present(canvasElement.querySelector("input[name='stars']"))).toHaveValue("4")
    const ten = canvas.getByRole("radiogroup", { name: "Out of ten" })
    await expect(within(ten).getAllByRole("radio")).toHaveLength(10)
    await expect(box(ten.querySelector("svg")).width).toBe(12)
    await userEvent.click(within(ten).getByRole("radio", { name: "9 of 10" }))
    await waitFor(() => expect(within(ten).getByRole("radio", { name: "9 of 10" })).toBeChecked())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const group = await within(canvasElement).findByRole("radiogroup", { name: "Rating" })
    await expect(css(group.querySelectorAll("svg")[0]).fill).toBe("rgb(105, 105, 105)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("radiogroup", { name: "Rating" })).toBeVisible()
  }
}
