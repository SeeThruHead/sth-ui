import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AutosizeDemo from "./demos/autosize.ts"
import * as BoundariesDemo from "./demos/boundaries.ts"
import * as HorizontalDemo from "./demos/horizontal.ts"
import * as OffsetSizeDemo from "./demos/offset-size.ts"
import * as ScrollPositionDemo from "./demos/scroll-position.ts"
import * as ScrollToDemo from "./demos/scroll-to.ts"
import * as ScrollbarsDemo from "./demos/scrollbars.ts"
import * as StartScrollPositionDemo from "./demos/start-scroll-position.ts"
import * as StatesDemo from "./demos/states.ts"
import * as TypesDemo from "./demos/types.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalScrollbarPositionDemo from "./demos/vertical-scrollbar-position.ts"

const meta: Meta = { title: "Miscellaneous/ScrollArea" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const viewports = async (canvasElement: HTMLElement, count = 1) => {
  await waitFor(() => expect(canvasElement.querySelectorAll("[data-scrollarea-viewport]")).toHaveLength(count))

  return [...canvasElement.querySelectorAll<HTMLElement>("[data-scrollarea-viewport]")]
}

const rootOf = (viewport: HTMLElement | undefined) => present(present(viewport).parentElement)

const scrollbar = (viewport: HTMLElement | undefined, orientation: "vertical" | "horizontal") =>
  present(rootOf(viewport).querySelector<HTMLElement>(`[data-orientation='${orientation}']`))

const thumbOf = (bar: HTMLElement) => present(bar.querySelector<HTMLElement>("[data-scrollarea-thumb]"))

const pause = async (ms: number) => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(ms), { timeout: ms + 1000 })
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    const root = rootOf(viewport)
    await expect(box(root).height).toBe(250)
    await expect(css(viewport).overflowY).toBe("scroll")
    await expect(css(viewport).scrollbarWidth).toBe("none")
    await expect(within(canvasElement).getByText("Charizard (Pokémon)")).toBeVisible()
    const bar = scrollbar(viewport, "vertical")
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "hidden"))
    await expect(css(bar).display).toBe("none")
  }
}

export const Hovering: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    const bar = scrollbar(viewport, "vertical")
    await userEvent.hover(rootOf(viewport))
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "visible"))
    await expect(box(bar).width).toBe(12)
    await expect(Math.round(box(bar).right)).toBe(Math.round(box(rootOf(viewport)).right))
    const thumb = thumbOf(bar)
    await expect(box(thumb).width).toBeCloseTo(7.2, 1)
    await expect(css(thumb).backgroundColor).toBe("rgba(0, 0, 0, 0.4)")
    await expect(box(thumb).height).toBeGreaterThan(18)
    await expect(box(thumb).top - box(bar).top).toBeCloseTo(2.4, 1)
    await expect(scrollbar(viewport, "horizontal")).toHaveAttribute("data-state", "hidden")
    await userEvent.unhover(rootOf(viewport))
    await pause(400)
    await expect(bar).toHaveAttribute("data-state", "visible")
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "hidden"), { timeout: 2000 })
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    const bar = scrollbar(viewport, "vertical")
    await userEvent.hover(rootOf(viewport))
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "visible"))
    const thumb = thumbOf(bar)
    const range = present(viewport).scrollHeight - present(viewport).clientHeight
    present(viewport).scrollTo({ top: range })
    await waitFor(() => expect(Math.round(box(bar).bottom - box(thumb).bottom)).toBe(2))
  }
}

export const DraggingThumb: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    const bar = scrollbar(viewport, "vertical")
    await userEvent.hover(rootOf(viewport))
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "visible"))
    const thumb = thumbOf(bar)
    const x = box(thumb).left + 3
    const y = box(thumb).top + 5
    const user = userEvent.setup()
    await user.pointer({ keys: "[MouseLeft>]", target: thumb, coords: { clientX: x, clientY: y } })
    await pause(150)
    await user.pointer([
      { target: thumb, coords: { clientX: x, clientY: y + 20 } },
      { target: thumb, coords: { clientX: x, clientY: y + 2000 } },
      { keys: "[/MouseLeft]", target: thumb, coords: { clientX: x, clientY: y + 2000 } }
    ])
    const range = present(viewport).scrollHeight - present(viewport).clientHeight
    await waitFor(() => expect(Math.round(present(viewport).scrollTop)).toBe(range))
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: bar, coords: { clientX: x, clientY: box(bar).top + 4 } },
      { keys: "[/MouseLeft]", target: bar, coords: { clientX: x, clientY: box(bar).top + 4 } }
    ])
    await waitFor(() => expect(present(viewport).scrollTop).toBe(0))
    await userEvent.pointer({ keys: "[MouseRight]", target: bar, coords: { clientX: x, clientY: box(bar).bottom - 4 } })
    await expect(present(viewport).scrollTop).toBe(0)
  }
}

export const Wheeling: StoryObj = {
  render: demoApp(ScrollToDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    const bar = scrollbar(viewport, "vertical")
    await userEvent.hover(rootOf(viewport))
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "visible"))
    const first = new WheelEvent("wheel", { deltaY: 60, bubbles: true, cancelable: true })
    bar.dispatchEvent(first)
    await expect(first.defaultPrevented).toBe(true)
    await waitFor(() => expect(present(viewport).scrollTop).toBe(60))
    const out = new WheelEvent("wheel", { deltaY: -500, bubbles: true, cancelable: true })
    bar.dispatchEvent(out)
    await expect(out.defaultPrevented).toBe(false)
    bar.dispatchEvent(new Event("wheel", { bubbles: true, cancelable: true }))
    await expect(present(viewport).scrollTop).toBe(60)
  }
}

export const Types: StoryObj = {
  render: demoApp(TypesDemo),
  play: async ({ canvasElement }) => {
    const [auto, always, scroll, never] = await viewports(canvasElement, 4)
    await waitFor(() => expect(scrollbar(auto, "vertical")).toHaveAttribute("data-state", "visible"))
    await expect(scrollbar(always, "vertical")).toHaveAttribute("data-state", "visible")
    await expect(scrollbar(always, "horizontal")).toHaveAttribute("data-state", "visible")
    await expect(scrollbar(always, "horizontal").querySelector("[data-scrollarea-thumb]")).toBeNull()
    await expect(scrollbar(scroll, "vertical")).toHaveAttribute("data-state", "hidden")
    await expect(scrollbar(never, "vertical")).toHaveAttribute("data-hidden")
    await expect(css(scrollbar(never, "vertical")).display).toBe("none")
    await expect(rootOf(always).children).toHaveLength(4)
    const corner = present(rootOf(always).children[3])
    await expect(box(corner).width).toBe(12)
    await expect(css(corner).opacity).toBe("0")
    await expect(Math.round(box(scrollbar(always, "vertical")).bottom)).toBe(Math.round(box(corner).top))
  }
}

export const HoveringScrollbar: StoryObj = {
  render: demoApp(TypesDemo),
  play: async ({ canvasElement }) => {
    const [, always] = await viewports(canvasElement, 4)
    const corner = present(rootOf(always).children[3])
    await expect(corner).not.toHaveAttribute("data-hovered")
    await userEvent.hover(scrollbar(always, "vertical"))
    await waitFor(() => expect(corner).toHaveAttribute("data-hovered"))
    await userEvent.unhover(scrollbar(always, "vertical"))
    await waitFor(() => expect(corner).not.toHaveAttribute("data-hovered"))
  }
}

export const ScrollType: StoryObj = {
  render: demoApp(TypesDemo),
  play: async ({ canvasElement }) => {
    const [, , scroll] = await viewports(canvasElement, 4)
    const bar = scrollbar(scroll, "vertical")
    present(scroll).scrollTo({ top: 40 })
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "visible"))
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "hidden"), { timeout: 2000 })
  }
}

export const OffsetSize: StoryObj = {
  render: demoApp(OffsetSizeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    await expect(css(viewport).paddingRight).toBe("20px")
    await expect(css(viewport).paddingBottom).toBe("0px")
    await waitFor(() => expect(box(scrollbar(viewport, "vertical")).width).toBe(6))
  }
}

export const Horizontal: StoryObj = {
  render: demoApp(HorizontalDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    await expect(box(rootOf(viewport)).width).toBe(300)
    await userEvent.hover(rootOf(viewport))
    const bar = scrollbar(viewport, "horizontal")
    await waitFor(() => expect(bar).toHaveAttribute("data-state", "visible"))
    await expect(box(bar).height).toBe(12)
    await expect(box(thumbOf(bar)).width).toBeGreaterThan(100)
    present(viewport).scrollTo({ left: 1000 })
    await waitFor(() => expect(Math.round(box(bar).right - box(thumbOf(bar)).right)).toBe(2))
  }
}

export const Scrollbars: StoryObj = {
  render: demoApp(ScrollbarsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    await expect(css(viewport).overflowX).toBe("hidden")
    await expect(rootOf(viewport).querySelector("[data-orientation='horizontal']")).toBeNull()
  }
}

export const VerticalScrollbarPosition: StoryObj = {
  render: demoApp(VerticalScrollbarPositionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [left, right] = await viewports(canvasElement, 2)
    await waitFor(() => expect(scrollbar(left, "vertical")).toHaveAttribute("data-state", "visible"))
    await expect(Math.round(box(scrollbar(left, "vertical")).left)).toBe(Math.round(box(rootOf(left)).left))
    await expect(css(left).paddingLeft).toBe("12px")
    await expect(Math.round(box(scrollbar(right, "vertical")).right)).toBe(Math.round(box(rootOf(right)).right))
    await expect(css(right).paddingRight).toBe("12px")
  }
}

export const ScrollPosition: StoryObj = {
  render: demoApp(ScrollPositionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    await expect(within(canvasElement).getByText("{ x: 0, y: 0 }")).toBeVisible()
    present(viewport).scrollTo({ left: 30, top: 50 })
    await waitFor(() => expect(within(canvasElement).getByText("{ x: 30, y: 50 }")).toBeVisible())
  }
}

export const Boundaries: StoryObj = {
  render: demoApp(BoundariesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [viewport] = await viewports(canvasElement)
    await expect(canvas.getByText("Bottom: 0")).toBeVisible()
    present(viewport).scrollTo({ top: 100000, left: 100000 })
    await waitFor(() => expect(canvas.getByText("Bottom: 1")).toBeVisible())
    await expect(canvas.getByText("Right: 1")).toBeVisible()
    present(viewport).scrollTo({ top: 0, left: 0 })
    await waitFor(() => expect(canvas.getByText("Top: 1")).toBeVisible())
    await expect(canvas.getByText("Left: 1")).toBeVisible()
  }
}

export const ScrollTo: StoryObj = {
  render: demoApp(ScrollToDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await viewports(canvasElement)
    await expect(within(canvasElement).getByRole("button", { name: "Scroll to bottom" })).toBeVisible()
  }
}

export const ScrollingTo: StoryObj = {
  render: demoApp(ScrollToDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [viewport] = await viewports(canvasElement)
    const range = present(viewport).scrollHeight - present(viewport).clientHeight
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to bottom" }))
    await waitFor(() => expect(Math.round(present(viewport).scrollTop)).toBe(range), { timeout: 3000 })
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to center" }))
    await waitFor(
      () => expect(Math.round(present(viewport).scrollTop)).toBe(Math.round(present(viewport).scrollHeight / 2)),
      { timeout: 3000 }
    )
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to top" }))
    await waitFor(() => expect(present(viewport).scrollTop).toBe(0), { timeout: 3000 })
  }
}

export const StartScrollPosition: StoryObj = {
  render: demoApp(StartScrollPositionDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    const range = present(viewport).scrollHeight - present(viewport).clientHeight
    await waitFor(() => expect(Math.round(present(viewport).scrollTop)).toBe(Math.min(250, range)))
    await expect(present(viewport).scrollTop).toBeGreaterThan(0)
  }
}

export const Autosize: StoryObj = {
  render: demoApp(AutosizeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [viewport] = await viewports(canvasElement)
    await waitFor(() => expect(box(rootOf(viewport)).height).toBeGreaterThan(100))
    await expect(box(rootOf(viewport)).height).toBeLessThanOrEqual(300)
    await expect(rootOf(viewport)).toHaveAttribute("data-autosize", "true")
    await expect(within(canvasElement).getByText("Overflowing: false")).toBeVisible()
  }
}

export const Growing: StoryObj = {
  render: demoApp(AutosizeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [viewport] = await viewports(canvasElement)
    const remove = canvas.getByRole("button", { name: "Remove paragraph" })
    await userEvent.click(remove)
    await userEvent.click(remove)
    await userEvent.click(remove)
    await waitFor(() => expect(box(rootOf(viewport)).height).toBe(0))
    const add = canvas.getByRole("button", { name: "Add paragraph" })
    await userEvent.click(add)
    await waitFor(() => expect(box(rootOf(viewport)).height).toBeGreaterThan(50))
    await expect(box(rootOf(viewport)).height).toBeLessThan(300)
    await userEvent.click(add)
    await userEvent.click(add)
    await userEvent.click(add)
    await waitFor(() => expect(box(rootOf(viewport)).height).toBe(300))
    await waitFor(() => expect(canvas.getByText("Overflowing: true")).toBeVisible())
    await userEvent.click(remove)
    await userEvent.click(remove)
    await userEvent.click(remove)
    await waitFor(() => expect(canvas.getByText("Overflowing: false")).toBeVisible())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(TypesDemo),
  play: async ({ canvasElement }) => {
    const [, always] = await viewports(canvasElement, 4)
    await waitFor(() => expect(scrollbar(always, "vertical")).toHaveAttribute("data-state", "visible"))
    await waitFor(() =>
      expect(css(thumbOf(scrollbar(always, "vertical"))).backgroundColor).toBe("rgba(255, 255, 255, 0.4)")
    )
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const [sideways, left, right, none, present_, contained] = await viewports(canvasElement, 6)
    await waitFor(() => expect(present(sideways).scrollLeft).toBe(40))
    await expect(css(sideways).overflowY).toBe("hidden")
    await expect(css(sideways).paddingBottom).toBe("8px")
    await expect(css(sideways).overscrollBehaviorX).toBe("contain")
    await expect(css(sideways).overscrollBehaviorY).toBe("auto")
    const bar = scrollbar(sideways, "horizontal")
    await waitFor(() => expect(box(bar).height).toBe(8))
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Scroll right" }))
    await waitFor(() =>
      expect(present(sideways).scrollLeft).toBe(present(sideways).scrollWidth - present(sideways).clientWidth)
    )
    await waitFor(() => expect(scrollbar(left, "vertical")).toHaveAttribute("data-state", "visible"))
    await expect(Math.round(box(scrollbar(left, "vertical")).left)).toBe(Math.round(box(rootOf(left)).left))
    await expect(Math.round(box(scrollbar(left, "horizontal")).left)).toBe(Math.round(box(rootOf(left)).left) + 12)
    await expect(Math.round(box(rootOf(left).children[3]).left)).toBe(Math.round(box(rootOf(left)).left))
    await expect(Math.round(box(scrollbar(right, "horizontal")).right)).toBe(Math.round(box(rootOf(right)).right) - 12)
    await expect(Math.round(box(rootOf(right).children[3]).right)).toBe(Math.round(box(rootOf(right)).right))
    await expect(css(none).overflowX).toBe("hidden")
    await expect(css(none).overflowY).toBe("hidden")
    await expect(rootOf(none).querySelector("[data-scrollarea-scrollbar]")).toBeNull()
    await expect(css(present_).paddingRight).toBe("0px")
    await expect(css(present_).overscrollBehaviorY).toBe("none")
    await expect(css(present_).overscrollBehaviorX).toBe("auto")
    await expect(css(contained).overscrollBehaviorX).toBe("contain")
    await expect(css(contained).overscrollBehaviorY).toBe("contain")
  }
}

export const DraggingSideways: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const [sideways] = await viewports(canvasElement, 6)
    const bar = scrollbar(sideways, "horizontal")
    await waitFor(() => expect(bar.querySelector("[data-scrollarea-thumb]")).not.toBeNull())
    present(sideways).scrollTo({ left: 0 })
    await waitFor(() => expect(present(sideways).scrollLeft).toBe(0))
    const thumb = thumbOf(bar)
    const y = box(thumb).top + 2
    const user = userEvent.setup()
    await user.pointer({ keys: "[MouseLeft>]", target: thumb, coords: { clientX: box(thumb).left + 4, clientY: y } })
    await pause(150)
    await user.pointer([
      { target: thumb, coords: { clientX: box(bar).right + 500, clientY: y } },
      { keys: "[/MouseLeft]", target: thumb, coords: { clientX: box(bar).right + 500, clientY: y } }
    ])
    const range = present(sideways).scrollWidth - present(sideways).clientWidth
    await waitFor(() => expect(Math.round(present(sideways).scrollLeft)).toBe(range))
    await pause(150)
    await expect(document.body.style.userSelect).toBe("")
    const wheel = new WheelEvent("wheel", { deltaX: -40, bubbles: true, cancelable: true })
    bar.dispatchEvent(wheel)
    await expect(wheel.defaultPrevented).toBe(true)
    await waitFor(() => expect(Math.round(present(sideways).scrollLeft)).toBe(range - 40))
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
