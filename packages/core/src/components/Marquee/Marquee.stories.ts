import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as FadeEdgesDemo from "./demos/fade-edges.ts"
import * as MultipleRowsDemo from "./demos/multiple-rows.ts"
import * as PauseOnHoverDemo from "./demos/pause-on-hover.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalDemo from "./demos/vertical.ts"

const meta: Meta = { title: "DataDisplay/Marquee" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

const marquees = async (canvasElement: HTMLElement) => {
  await waitFor(() => expect(canvasElement.querySelector("[data-orientation]")).not.toBeNull())

  return [...canvasElement.querySelectorAll<HTMLElement>("[data-orientation]")]
}

const contentOf = (root: HTMLElement | undefined) => present(present(root).firstElementChild)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [root] = await marquees(canvasElement)
    const content = contentOf(root)
    const groups = [...content.children]
    await expect(groups).toHaveLength(4)
    await expect(groups.map((group) => group.getAttribute("aria-hidden"))).toEqual([null, "true", "true", "true"])
    await expect(css(content).animationDuration).toBe("100s")
    await expect(css(content).animationName).not.toBe("none")
    await expect(css(content).columnGap).toBe("20px")
    const badges = [...present(groups[0]).children]
    await expect(Math.round(box(badges[1]).left - box(badges[0]).right)).toBe(20)
    await expect(root).toHaveAttribute("data-fade-edges")
    await expect(Number.parseFloat(css(root, "::before").width)).toBeCloseTo(box(root).width * 0.05, 0)
    await expect(css(root, "::after").backgroundImage).toContain("linear-gradient")
    await waitFor(() => expect(css(content).transform).not.toBe("none"))
  }
}

const pausedWhenHovered = (element: Element) =>
  [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .filter((rule) => rule.cssText.includes("animation-play-state: paused"))
    .some(
      (rule) =>
        rule.cssText.includes(":hover") && [...element.classList].some((name) => rule.cssText.includes(`.${name}`))
    )

export const PauseOnHover: StoryObj = {
  render: demo(PauseOnHoverDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [root] = await marquees(canvasElement)
    await expect(root).toHaveAttribute("data-pause-on-hover")
    await expect(css(contentOf(root)).animationPlayState).toBe("running")
    await expect(pausedWhenHovered(contentOf(root))).toBe(true)
  }
}

export const Vertical: StoryObj = {
  render: demo(VerticalDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [root] = await marquees(canvasElement)
    await expect(box(root).height).toBe(300)
    await expect(css(root).flexDirection).toBe("column")
    await expect(css(contentOf(root)).flexDirection).toBe("column")
    await expect(Number.parseFloat(css(root, "::before").height)).toBeCloseTo(15, 0)
    await expect(css(contentOf(root)).animationName).not.toBe(css(contentOf(root)).animationDuration)
  }
}

export const MultipleRows: StoryObj = {
  render: demo(MultipleRowsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [first, second] = await marquees(canvasElement)
    await expect(css(contentOf(first)).animationDirection).toBe("normal")
    await expect(css(contentOf(second)).animationDirection).toBe("reverse")
    await expect(second).toHaveAttribute("data-reverse")
  }
}

export const FadeEdges: StoryObj = {
  render: demo(FadeEdgesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [, larger, colored, none] = await marquees(canvasElement)
    await expect(Number.parseFloat(css(larger, "::before").width)).toBeCloseTo(box(larger).width * 0.15, 0)
    await expect(css(colored, "::before").backgroundImage).toContain("rgb(231, 245, 255)")
    await expect(none).not.toHaveAttribute("data-fade-edges")
    await expect(css(none, "::before").content).toBe("none")
    await expect(within(canvasElement).getByText("No fade")).toBeVisible()
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect((await marquees(canvasElement)).length).toBeGreaterThan(0)
  }
}
