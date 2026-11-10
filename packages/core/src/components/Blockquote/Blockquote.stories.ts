import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as PlainDemo from "./demos/plain.ts"
import * as TextWrapDemo from "./demos/text-wrap.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Typography/Blockquote" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const cite = await within(canvasElement).findByText("– Forrest Gump")
    const quote = present(cite.parentElement)
    await expect(quote.tagName).toBe("BLOCKQUOTE")
    await expect(cite.tagName).toBe("CITE")
    await expect(css(quote).padding).toBe("32px 38px")
    await expect(css(quote).backgroundColor).toBe("color(srgb 0.133333 0.545098 0.901961 / 0.07)")
    await expect(css(quote).borderLeftWidth).toBe("3px")
    await expect(css(quote).borderLeftColor).toBe("rgb(34, 139, 230)")
    await expect(css(quote).borderTopRightRadius).toBe("8px")
    await expect(css(quote).borderTopLeftRadius).toBe("0px")
    const icon = present(quote.firstElementChild)
    await expect(box(icon).width).toBe(38)
    await expect(css(icon).color).toBe("rgb(34, 139, 230)")
    await expect(css(icon).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(box(icon).top - box(quote).top).toBe(-19)
    await expect(box(icon).left - box(quote).left).toBe(-16)
    await expect(css(cite).fontSize).toBe("13.6px")
    await expect(css(cite).opacity).toBe("0.6")
    await expect(css(cite).marginTop).toBe("16px")
  }
}

export const TextWrap: StoryObj = {
  render: demo(TextWrapDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByText("– Forrest Gump")
    const quotes = [...canvasElement.querySelectorAll("blockquote")]
    await expect(quotes.map((quote) => css(quote).textWrapStyle)).toEqual(["auto", "balance"])
    await expect(box(present(quotes[0]).firstElementChild).width).toBe(48)
    await expect(css(quotes[0]).borderTopRightRadius).toBe("8px")
  }
}

export const Plain: StoryObj = {
  render: demo(PlainDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const quote = present(
      (await within(canvasElement).findByText("A quote with no icon and no cite.")).closest("blockquote")
    )
    await expect(quote.children).toHaveLength(0)
    await expect(css(quote).borderLeftColor).toBe("rgb(190, 75, 219)")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const quote = present((await within(canvasElement).findByText("– Forrest Gump")).parentElement)
    await expect(css(quote).backgroundColor).toContain("/ 0.06")
    await expect(css(quote.firstElementChild).backgroundColor).toBe("rgb(36, 36, 36)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
