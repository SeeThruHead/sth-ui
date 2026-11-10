import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as InvertedDemo from "./demos/inverted.ts"
import * as LabelDemo from "./demos/label.ts"
import * as MarksDemo from "./demos/marks.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as StepDemo from "./demos/step.ts"
import * as ThumbChildrenDemo from "./demos/thumb-children.ts"
import * as ThumbSizeDemo from "./demos/thumb-size.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VerticalDemo from "./demos/vertical.ts"
import * as ExtrasDemo from "./demos/extras.ts"

const meta: Meta = { title: "Inputs/Slider" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const trackOf = (thumb: HTMLElement) => present(thumb.parentElement)

const labelOf = (thumb: HTMLElement) => present(thumb.querySelector("[aria-hidden='true']"))

const centreX = (element: Element) => box(element).left + box(element).width / 2

const blue = "rgb(34, 139, 230)"

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const thumb = await canvas.findByRole("slider", { name: "Volume" })
    await expect(thumb).toHaveAttribute("aria-valuenow", "40")
    await expect(thumb).toHaveAttribute("aria-valuemax", "100")
    const track = trackOf(thumb)
    await expect(Math.round(centreX(thumb))).toBe(Math.round(box(track).left + box(track).width * 0.4))
    await expect(box(thumb).width).toBe(16)
    await expect(css(thumb).borderTopColor).toBe(blue)
    await expect(box(track).height).toBe(16)
    await expect(canvas.getByText("50%")).toBeVisible()
    await expect(css(labelOf(thumb)).opacity).toBe("0")
  }
}

export const UsingTheKeyboard: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Volume" })
    thumb.focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(thumb).toHaveAttribute("aria-valuenow", "41"))
    await expect(labelOf(thumb)).toHaveTextContent("41")
    await expect(css(labelOf(thumb)).opacity).toBe("1")
    await userEvent.keyboard("{End}")
    await waitFor(() => expect(thumb).toHaveAttribute("aria-valuenow", "100"))
    await userEvent.keyboard("{Home}")
    await waitFor(() => expect(thumb).toHaveAttribute("aria-valuenow", "0"))
  }
}

export const PressingTheTrack: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Volume" })
    const track = trackOf(thumb)
    const at = (fraction: number) => ({
      clientX: box(track).left + box(track).width * fraction,
      clientY: box(track).top + box(track).height / 2
    })
    const user = userEvent.setup()
    await user.pointer({ keys: "[MouseLeft>]", target: track, coords: at(0.75) })
    await waitFor(() => expect(thumb).toHaveAttribute("data-dragging"))
    await user.pointer([
      { target: track, coords: at(0.6) },
      { keys: "[/MouseLeft]", target: track, coords: at(0.6) }
    ])
    await waitFor(() => expect(thumb).toHaveAttribute("aria-valuenow", "60"))
    await waitFor(() => expect(thumb).not.toHaveAttribute("data-dragging"))
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo),
  play: async ({ canvasElement }) => {
    const thumb = await waitFor(() => present(canvasElement.querySelector<HTMLElement>("[role='slider']")))
    await expect(thumb).toHaveAttribute("aria-disabled", "true")
    await expect(present(canvasElement.querySelector("[data-filled]"))).toHaveAttribute("data-disabled")
    await expect(css(thumb).display).toBe("none")
    await expect(css(trackOf(thumb).children[1]).backgroundColor).toBe("rgb(173, 181, 189)")
  }
}

export const Label: StoryObj = {
  render: demoApp(LabelDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const none = await canvas.findByRole("slider", { name: "No label" })
    await expect(none.querySelector("[aria-hidden='true']")).toBeNull()
    const always = canvas.getByRole("slider", { name: "Label always visible" })
    await expect(css(labelOf(always)).opacity).toBe("1")
    await expect(labelOf(canvas.getByRole("slider", { name: "Formatted label" }))).toHaveTextContent("40 °C")
  }
}

export const HoveringLabel: StoryObj = {
  render: demoApp(LabelDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Formatted label" })
    thumb.focus()
    await waitFor(() => expect(css(labelOf(thumb)).opacity).toBe("1"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(labelOf(thumb)).toHaveTextContent("39 °C"))
    within(canvasElement).getByRole("slider", { name: "No label" }).focus()
    await userEvent.keyboard("{ArrowLeft}")
    within(canvasElement).getByRole("slider", { name: "Label always visible" }).focus()
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() =>
      expect(within(canvasElement).getByRole("slider", { name: "Label always visible" })).toHaveAttribute(
        "aria-valuenow",
        "39"
      )
    )
  }
}

export const Step: StoryObj = {
  render: demoApp(StepDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const decimal = await canvas.findByRole("slider", { name: "Decimal step" })
    await expect(decimal).toHaveAttribute("aria-valuemin", "-10")
    const track = trackOf(decimal)
    await expect(Math.round(centreX(decimal))).toBe(Math.round(box(track).left + box(track).width / 2))
    await expect(labelOf(canvas.getByRole("slider", { name: "Step matched with marks" }))).toHaveTextContent("md")
  }
}

export const Stepping: StoryObj = {
  render: demoApp(StepDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const decimal = await canvas.findByRole("slider", { name: "Decimal step" })
    decimal.focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(labelOf(decimal)).toHaveTextContent("0.1"))
    const marked = canvas.getByRole("slider", { name: "Step matched with marks" })
    marked.focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(labelOf(marked)).toHaveTextContent("lg"))
  }
}

export const Marks: StoryObj = {
  render: demoApp(MarksDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("slider", { name: "Plain marks" })
    const filled = trackOf(plain).querySelectorAll("[data-filled]")
    await expect(filled).toHaveLength(2)
    await expect(css(filled[0]).borderTopColor).toBe(blue)
    await expect(canvas.getByText("80%")).toBeVisible()
    const mark80 = canvas.getByText("80%")
    const labelled = trackOf(canvas.getByRole("slider", { name: "Labelled marks" }))
    await expect(Math.round(centreX(mark80))).toBe(Math.round(box(labelled).left + box(labelled).width * 0.8))
  }
}

export const MovingMarks: StoryObj = {
  render: demoApp(MarksDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const plain = await canvas.findByRole("slider", { name: "Plain marks" })
    plain.focus()
    await userEvent.keyboard("{End}")
    await waitFor(() => expect(trackOf(plain).querySelectorAll("[data-filled]")).toHaveLength(3))
    const labelled = canvas.getByRole("slider", { name: "Labelled marks" })
    labelled.focus()
    await userEvent.keyboard("{Home}")
    await waitFor(() => expect(labelled).toHaveAttribute("aria-valuenow", "0"))
  }
}

export const ThumbSize: StoryObj = {
  render: demoApp(ThumbSizeDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Big thumb" })
    await expect(box(thumb).width).toBe(14)
  }
}

export const ThumbChildren: StoryObj = {
  render: demoApp(ThumbChildrenDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Love" })
    await expect(box(thumb).width).toBe(26)
    await expect(css(thumb).borderTopWidth).toBe("2px")
    await expect(box(thumb.querySelector("svg")).width).toBe(16)
    await expect(css(thumb).borderTopColor).toBe("rgb(250, 82, 82)")
  }
}

export const Vertical: StoryObj = {
  render: demoApp(VerticalDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Vertical" })
    await expect(thumb).toHaveAttribute("aria-orientation", "vertical")
    const track = trackOf(thumb)
    await expect(box(track).height).toBe(184)
    const centreY = box(thumb).top + box(thumb).height / 2
    await expect(Math.round(centreY)).toBe(Math.round(box(track).bottom - box(track).height * 0.45))
  }
}

export const MovingVertical: StoryObj = {
  render: demoApp(VerticalDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Vertical" })
    thumb.focus()
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(thumb).toHaveAttribute("aria-valuenow", "46"))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Volume" })
    await expect(css(thumb).backgroundColor).toBe("rgb(25, 113, 194)")
    await expect(css(thumb).borderTopColor).toBe("rgb(255, 255, 255)")
  }
}

export const Inverted: StoryObj = {
  render: demoApp(InvertedDemo),
  play: async ({ canvasElement }) => {
    const thumb = await within(canvasElement).findByRole("slider", { name: "Inverted" })
    const track = trackOf(thumb)
    const root = present(track.parentElement)
    const bar = present(track.children[1])
    await expect(track).toHaveAttribute("data-inverted")
    await expect(bar).toHaveAttribute("data-inverted")
    await expect(root).toHaveAttribute("data-orientation", "horizontal")
    const rail = present(track.firstElementChild).getBoundingClientRect()
    const overhang = track.getBoundingClientRect().left - rail.left
    await expect(bar.getBoundingClientRect().left - track.getBoundingClientRect().left).toBeCloseTo(
      track.getBoundingClientRect().width * 0.8 - overhang,
      0
    )
    await expect(Math.round(bar.getBoundingClientRect().right)).toBe(
      Math.round(present(track.firstElementChild).getBoundingClientRect().right)
    )
    const marks = [...root.querySelectorAll("[data-filled]")]
    await expect(marks).toHaveLength(1)
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const numeric = await canvas.findByRole("slider", { name: "Numeric size" })
    await expect(box(trackOf(numeric)).height).toBe(12)
    await expect(css(numeric).borderTopLeftRadius).toBe("2px")
    await expect(numeric).toHaveAttribute("aria-valuetext", "40 percent")
    await expect(present(canvasElement.querySelector("input[name='level']"))).toHaveValue("40")
    numeric.focus()
    await waitFor(() => expect(css(labelOf(numeric)).opacity).toBe("1"))
    const [, unnamed] = canvas.getAllByRole("slider")
    await expect(box(trackOf(present(unnamed))).width).toBe(8)
    const invertedBar = present(trackOf(present(unnamed)).children[1])
    await expect(invertedBar).toHaveAttribute("data-inverted")
    await expect(box(invertedBar).top).toBeLessThan(box(trackOf(present(unnamed))).top)
  }
}

export const Extras: StoryObj = {
  render: demoApp(ExtrasDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const scaled = await canvas.findByRole("slider", { name: "Scaled" })
    await expect(scaled).toHaveAttribute("aria-valuetext", "1.0 KB")
    await expect(canvas.getByText("1.0 KB")).toBeVisible()
    const start = canvas.getByRole("slider", { name: "Start point" })
    const track = present(start.closest("[data-orientation]")?.querySelector<HTMLElement>("[style*='calc']"))
    await expect(track.style.left).toBe("50%")
    const marks = Array.from(present(start.closest("[data-orientation]")).querySelectorAll("[data-filled]"))
    await expect(marks).toHaveLength(1)
    const vertical = canvas.getByRole("slider", { name: "Vertical start" })
    const verticalBar = present(vertical.closest("[data-orientation]")?.querySelector<HTMLElement>("[style*='calc']"))
    await expect(verticalBar.style.bottom).toBe("20%")
    const inverted = canvas.getByRole("slider", { name: "Inverted" })
    await expect(present(inverted.closest("[data-orientation]")).querySelectorAll("[data-filled]")).toHaveLength(1)
  }
}

export const RestrictingToMarks: StoryObj = {
  render: demoApp(ExtrasDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    const restricted = await canvas.findByRole("slider", { name: "Restricted" })
    restricted.focus()
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(restricted).toHaveAttribute("aria-valuenow", "35"))
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(restricted).toHaveAttribute("aria-valuenow", "25"))
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(restricted).toHaveAttribute("aria-valuenow", "15"))
    const domain = canvas.getByRole("slider", { name: "Domain" })
    domain.focus()
    await user.keyboard("{End}")
    await waitFor(() => expect(canvas.getByText("Value: 80, change end: 80")).toBeVisible())
    await user.keyboard("{Home}")
    await waitFor(() => expect(canvas.getByText("Value: 20, change end: 20")).toBeVisible())
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
