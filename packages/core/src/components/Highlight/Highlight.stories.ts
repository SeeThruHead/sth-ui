import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AccentInsensitiveDemo from "./demos/accent-insensitive.ts"
import * as CaseInsensitiveDemo from "./demos/case-insensitive.ts"
import * as ColorsDemo from "./demos/colors.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as PropsDemo from "./demos/props.ts"
import * as StylesDemo from "./demos/styles.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as WholeWordDemo from "./demos/whole-word.ts"

const meta: Meta = { title: "Typography/Highlight" }

export default meta

const css = (element: Element) => getComputedStyle(element)

const marksIn = (element: Element) => Array.from(element.querySelectorAll("mark")).map((mark) => mark.textContent)

const textOf = async (canvasElement: HTMLElement, text: string) =>
  within(canvasElement).findByText((_, element) => element?.tagName === "P" && element.textContent === text)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const root = await textOf(canvasElement, "Highlight This, definitely THIS and also this!")
    await expect(marksIn(root)).toEqual(["This", "THIS", "this"])
    const mark = root.querySelector("mark")
    await expect(mark).toHaveAttribute("data-highlight", "This")
    await expect(css(mark ?? root).backgroundColor).toBe("rgb(255, 236, 153)")
  }
}

export const CaseInsensitive: StoryObj = {
  render: demo(CaseInsensitiveDemo.view),
  play: async ({ canvasElement }) => {
    const [insensitive, sensitive] = await within(canvasElement).findAllByText(
      (_, element) =>
        element?.tagName === "P" && element.textContent === "Highlight This, definitely THIS and also this!"
    )
    await expect(marksIn(insensitive ?? canvasElement)).toEqual(["This", "THIS", "this"])
    await expect(marksIn(sensitive ?? canvasElement)).toEqual(["this"])
  }
}

export const AccentInsensitive: StoryObj = {
  render: demo(AccentInsensitiveDemo.view),
  play: async ({ canvasElement }) => {
    const [folded, exact] = await within(canvasElement).findAllByText(
      (_, element) => element?.tagName === "P" && element.textContent === "We visited café and cafe."
    )
    await expect(marksIn(folded ?? canvasElement)).toEqual(["café", "cafe"])
    await expect(marksIn(exact ?? canvasElement)).toEqual(["cafe"])
  }
}

export const Multiple: StoryObj = {
  render: demo(MultipleDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(marksIn(await textOf(canvasElement, "Highlight this and also that"))).toEqual(["this", "that"])
  }
}

export const Colors: StoryObj = {
  render: demo(ColorsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const root = await textOf(
      canvasElement,
      "Error: Invalid input. Warning: Check this field. Success: All tests passed."
    )
    const backgrounds = Array.from(root.querySelectorAll("mark")).map((mark) => css(mark).backgroundColor)
    await expect(marksIn(root)).toEqual(["Error", "Warning", "Success"])
    await expect(backgrounds).toEqual(["rgb(255, 201, 201)", "rgb(255, 236, 153)", "rgb(178, 242, 187)"])
  }
}

export const WholeWord: StoryObj = {
  render: demo(WholeWordDemo.view),
  play: async ({ canvasElement }) => {
    const [whole, partial] = await within(canvasElement).findAllByText(
      (_, element) => element?.tagName === "P" && element.textContent === "The theme is there"
    )
    await expect(marksIn(whole ?? canvasElement)).toEqual(["The"])
    await expect(marksIn(partial ?? canvasElement)).toEqual(["The", "the", "the"])
  }
}

export const HighlightStyles: StoryObj = {
  render: demo(StylesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const mark = await within(canvasElement).findByText("highlighted")
    await expect(mark.tagName).toBe("MARK")
    await expect(css(mark).fontWeight).toBe("700")
    await expect(css(mark).backgroundImage).toContain("linear-gradient")
    await expect(css(mark.parentElement ?? mark).textAlign).toBe("center")
  }
}

export const TextProps: StoryObj = {
  render: demo(PropsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link")
    await expect(link).toHaveTextContent("Mantine website")
    await expect(link).toHaveAttribute("href", "https://mantine.dev")
    await expect(css(link).fontWeight).toBe("500")
    await expect(css(link).color).toBe("rgb(34, 139, 230)")
    await expect(marksIn(link)).toEqual(["Mantine"])
  }
}

export const MixedColors: StoryObj = {
  render: demo((h, ui) =>
    ui.Highlight(h, {
      color: "teal",
      highlight: [{ text: "ÉRROR", color: "red" }, { text: "note" }],
      children: "Error first, then a note"
    })
  ),
  play: async ({ canvasElement }) => {
    const root = await textOf(canvasElement, "Error first, then a note")
    const backgrounds = Array.from(root.querySelectorAll("mark")).map((mark) => css(mark).backgroundColor)
    await expect(marksIn(root)).toEqual(["Error", "note"])
    await expect(backgrounds).toEqual(["rgb(255, 201, 201)", "rgb(150, 242, 215)"])
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
