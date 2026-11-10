import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as DecimalDemo from "./demos/decimal.ts"
import * as DisabledDemo from "./demos/disabled.ts"
import * as DomainDemo from "./demos/domain.ts"
import * as HiddenMarksDemo from "./demos/hidden-marks.ts"
import * as InvertedDemo from "./demos/inverted.ts"
import * as LabelDemo from "./demos/label.ts"
import * as MarksDemo from "./demos/marks.ts"
import * as MaxRangeDemo from "./demos/max-range.ts"
import * as MinRangeDemo from "./demos/min-range.ts"
import * as PushOnOverlapDemo from "./demos/push-on-overlap.ts"
import * as RestrictToMarksDemo from "./demos/restrict-to-marks.ts"
import * as StatesDemo from "./demos/states.ts"
import * as StepDemo from "./demos/step.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Inputs/RangeSlider" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const thumbs = async (canvasElement: HTMLElement) => {
  await waitFor(() => expect(within(canvasElement).getAllByRole("slider", { hidden: true }).length).toBeGreaterThan(1))

  return within(canvasElement).getAllByRole("slider", { hidden: true })
}

const trackOf = (thumb: HTMLElement) => present(thumb.parentElement)

const center = (element: Element | null | undefined) => box(element).left + box(element).width / 2

const atFraction = (track: HTMLElement, fraction: number) => ({
  clientX: box(track).left + box(track).width * fraction,
  clientY: box(track).top + box(track).height / 2
})

const press = async (target: HTMLElement, track: HTMLElement, fraction: number) =>
  userEvent.pointer([
    { keys: "[MouseLeft>]", target, coords: atFraction(track, fraction) },
    { keys: "[/MouseLeft]", target, coords: atFraction(track, fraction) }
  ])

const settle = async () => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(150))
}

const drag = async (thumb: HTMLElement, track: HTMLElement, from: number, to: number) => {
  const user = userEvent.setup()
  await user.pointer({ keys: "[MouseLeft>]", target: thumb, coords: atFraction(track, from) })
  await settle()
  await expect(thumb).toHaveAttribute("data-dragging")
  await user.pointer([
    { target: thumb, coords: atFraction(track, (from + to) / 2) },
    { target: thumb, coords: atFraction(track, to) },
    { keys: "[/MouseLeft]", target: thumb, coords: atFraction(track, to) }
  ])
}

const values = (sliders: ReadonlyArray<HTMLElement>) => sliders.map((slider) => slider.getAttribute("aria-valuenow"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    const track = trackOf(present(from))
    const width = box(track).width
    await expect(values([present(from), present(to)])).toEqual(["20", "60"])
    await expect(from).toHaveAttribute("aria-valuemin", "0")
    await expect(from).toHaveAttribute("aria-valuemax", "100")
    await expect(from).toHaveAttribute("aria-orientation", "horizontal")
    await expect(box(from).width).toBe(16)
    await expect(css(from).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(center(from) - box(track).left).toBeCloseTo(width * 0.2, 0)
    await expect(center(to) - box(track).left).toBeCloseTo(width * 0.6, 0)
    const bar = present(track.children[1])
    await expect(box(bar).left - box(track).left).toBeCloseTo(width * 0.2 - 8, 0)
    await expect(box(bar).width).toBeCloseTo(width * 0.4 + 16, 0)
    await expect(box(bar).height).toBe(8)
    await expect(css(bar).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(within(canvasElement).getByText("50%")).toBeVisible()
    const filled = [...canvasElement.querySelectorAll("[data-filled]")]
    await expect(filled).toHaveLength(2)
    await expect(css(within(present(from)).getByText("20", { selector: "[aria-hidden]" })).opacity).toBe("0")
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    const track = trackOf(present(from))
    await drag(present(from), track, 0.2, 0.35)
    await waitFor(() => expect(from).toHaveAttribute("aria-valuenow", "35"))
    await expect(to).toHaveAttribute("aria-valuenow", "60")
    await waitFor(() => expect(from).not.toHaveAttribute("data-dragging"))
    await drag(present(to), track, 0.6, 1.4)
    await waitFor(() => expect(to).toHaveAttribute("aria-valuenow", "100"))
  }
}

export const PressingTrack: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    const track = trackOf(present(from))
    await press(track, track, 0.5)
    await waitFor(() => expect(to).toHaveAttribute("aria-valuenow", "50"))
    await waitFor(() => expect(to).toHaveFocus())
    await press(track, track, 0.1)
    await waitFor(() => expect(from).toHaveAttribute("aria-valuenow", "10"))
    await waitFor(() => expect(from).toHaveFocus())
    await userEvent.pointer({ keys: "[MouseRight]", target: track, coords: atFraction(track, 0.9) })
    await expect(to).toHaveAttribute("aria-valuenow", "50")
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    present(from).focus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowUp}")
    await waitFor(() => expect(from).toHaveAttribute("aria-valuenow", "23"))
    await expect(css(within(present(from)).getByText("23")).opacity).toBe("1")
    await expect(css(within(present(to)).getByText("60")).opacity).toBe("0")
    present(to).focus()
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}{Enter}")
    await waitFor(() => expect(to).toHaveAttribute("aria-valuenow", "58"))
  }
}

export const MinRange: StoryObj = {
  render: demoApp(MinRangeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await thumbs(canvasElement)
    await expect(within(canvasElement).getByText("Value: [30, 60] - Range: 30")).toBeVisible()
  }
}

export const Pushing: StoryObj = {
  render: demoApp(MinRangeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    await drag(present(from), trackOf(present(from)), 0.3, 0.55)
    await waitFor(() => expect(within(canvasElement).getByText("Value: [55, 75] - Range: 20")).toBeVisible())
    await expect(to).toHaveAttribute("aria-valuenow", "75")
  }
}

export const MaxRange: StoryObj = {
  render: demoApp(MaxRangeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await thumbs(canvasElement)
    await expect(within(canvasElement).getByText("Value: [20, 80] - Range: 60")).toBeVisible()
  }
}

export const Narrowing: StoryObj = {
  render: demoApp(MaxRangeDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    present(from).focus()
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(within(canvasElement).getByText("Value: [19, 69] - Range: 50")).toBeVisible())
  }
}

export const PushOnOverlap: StoryObj = {
  render: demoApp(PushOnOverlapDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const sliders = await thumbs(canvasElement)
    await expect(values(sliders)).toEqual(["25", "65"])
  }
}

export const Holding: StoryObj = {
  render: demoApp(PushOnOverlapDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    await drag(present(from), trackOf(present(from)), 0.25, 0.44)
    await waitFor(() => expect(from).toHaveAttribute("aria-valuenow", "44"))
    await drag(present(from), trackOf(present(from)), 0.44, 0.9)
    await expect(from).toHaveAttribute("aria-valuenow", "44")
    await expect(to).toHaveAttribute("aria-valuenow", "65")
  }
}

export const Domain: StoryObj = {
  render: demoApp(DomainDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    const track = trackOf(present(from))
    await expect(center(from) - box(track).left).toBeCloseTo(box(track).width * 0.25, 0)
    await expect(within(canvasElement).getByText("min")).toBeVisible()
    await expect(within(canvasElement).getByText("max")).toBeVisible()
  }
}

export const DomainLimits: StoryObj = {
  render: demoApp(DomainDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    await drag(present(from), trackOf(present(from)), 0.25, 0)
    await waitFor(() => expect(from).toHaveAttribute("aria-valuenow", "10"))
  }
}

export const Decimal: StoryObj = {
  render: demoApp(DecimalDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    present(from).focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(from).toHaveAttribute("aria-valuenow", "0.2005"))
  }
}

export const Step: StoryObj = {
  render: demoApp(StepDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const sliders = await thumbs(canvasElement)
    await expect(values(sliders)).toEqual(["0", "10", "50", "75"])
  }
}

export const Marks: StoryObj = {
  render: demoApp(MarksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await thumbs(canvasElement)
    await expect(within(canvasElement).getByText("80%")).toBeVisible()
    await expect(canvasElement.querySelectorAll("[data-filled]")).toHaveLength(3)
  }
}

export const RestrictToMarks: StoryObj = {
  render: demoApp(RestrictToMarksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const sliders = await thumbs(canvasElement)
    await expect(values(sliders)).toEqual(["5", "15"])
  }
}

export const Snapping: StoryObj = {
  render: demoApp(RestrictToMarksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from, to] = await thumbs(canvasElement)
    present(to).focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(to).toHaveAttribute("aria-valuenow", "25"))
    await drag(present(to), trackOf(present(to)), 0.25, 0.6)
    await waitFor(() => expect(to).toHaveAttribute("aria-valuenow", "70"))
    await expect(from).toHaveAttribute("aria-valuenow", "5")
  }
}

export const HiddenMarks: StoryObj = {
  render: demoApp(HiddenMarksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await thumbs(canvasElement)
    await expect(within(canvasElement).getByText("50%")).toBeVisible()
    await expect(canvasElement.querySelectorAll("[data-filled]")).toHaveLength(1)
  }
}

export const SnappingHidden: StoryObj = {
  render: demoApp(HiddenMarksDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    present(from).focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(within(canvasElement).getByText(/Current value: \[40, 75\]/)).toBeVisible())
  }
}

export const Inverted: StoryObj = {
  render: demoApp(InvertedDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    const track = trackOf(present(from))
    await expect(track).toHaveAttribute("data-inverted")
    await expect(css(track.children[0]).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(track.children[1]).backgroundColor).toBe("rgb(233, 236, 239)")
  }
}

export const Label: StoryObj = {
  render: demoApp(LabelDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [none, , formatted, , always] = await thumbs(canvasElement)
    await expect(present(none).querySelector("[aria-hidden]")).toBeNull()
    await expect(within(present(formatted)).getByText("20 °C")).toBeInTheDocument()
    await expect(css(within(present(always)).getByText("20")).opacity).toBe("1")
  }
}

export const Disabled: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    await expect(from).toHaveAttribute("aria-disabled", "true")
    await expect(css(from).display).toBe("none")
    const track = trackOf(present(from))
    await expect(css(track).cursor).toBe("not-allowed")
    await expect(css(track.children[1]).backgroundColor).toBe("rgb(173, 181, 189)")
  }
}

export const Locked: StoryObj = {
  render: demoApp(DisabledDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    const track = trackOf(present(from))
    await press(track, track, 0.05)
    present(from).focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(from).toHaveAttribute("aria-valuenow", "20")
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const lowest = await canvas.findByRole("slider", { name: "Lowest" })
    await expect(lowest).toHaveAttribute("aria-orientation", "vertical")
    await expect(canvas.getByRole("slider", { name: "Highest" })).toHaveAttribute("aria-valuenow", "70")
    const track = trackOf(lowest)
    await expect(box(track).height).toBeGreaterThan(150)
    await expect(box(lowest).bottom - box(track).top).toBeCloseTo(box(track).height * 0.8 + 8, 0)
    await expect(css(within(lowest).getByText("20")).opacity).toBe("1")
    const inverse = canvasElement.querySelector<HTMLElement>("[aria-label='Inverse']")
    const inverseTrack = trackOf(present(inverse))
    await expect(within(inverseTrack).getByText("Ten")).toBeVisible()
    await expect(inverseTrack.querySelectorAll("[data-filled]")).toHaveLength(2)
    await expect(css(inverseTrack.children[0]).backgroundColor).toBe("rgb(173, 181, 189)")
    await expect(css(inverseTrack.querySelector("[data-filled]")).borderTopColor).toBe("rgb(222, 226, 230)")
    const [price] = canvas.getAllByRole("slider", { name: "Price" })
    await expect(price).toHaveAttribute("aria-valuetext", "100 dollars")
    await expect(within(present(price)).getByText("A")).toBeVisible()
    await expect(box(price).width).toBe(20)
    await expect(css(price).borderTopColor).toBe("rgb(190, 75, 219)")
    await expect(within(present(price)).getByText("100")).toBeInTheDocument()
    await expect(present(canvasElement.querySelector("input[name='price_from']"))).toHaveValue("10")
    await expect(present(canvasElement.querySelector("input[name='price_to']"))).toHaveValue("40")
  }
}

export const LabelOnFocus: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [price] = await canvas.findAllByRole("slider", { name: "Price" })
    await userEvent.hover(present(price))
    await expect(css(within(present(price)).getByText("100")).opacity).toBe("0")
    present(price).focus()
    await waitFor(() => expect(css(within(present(price)).getByText("100")).opacity).toBe("1"))
  }
}

export const ChangeEnd: StoryObj = {
  render: demoApp(StatesDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [ends] = await canvas.findAllByRole("slider", { name: "Ends" })
    await expect(canvas.getByText("Ended at nothing yet")).toBeVisible()
    await expect(within(present(ends)).getByText("•")).toBeVisible()
    await drag(present(ends), trackOf(present(ends)), 0.3, 0.1)
    await waitFor(() => expect(canvas.getByText("Ended at 10, 50")).toBeVisible())
    const lowest = canvas.getByRole("slider", { name: "Lowest" })
    const track = trackOf(lowest)
    await userEvent.pointer([
      {
        keys: "[MouseLeft>]",
        target: lowest,
        coords: { clientX: center(track), clientY: box(track).top + box(track).height * 0.6 }
      },
      {
        keys: "[/MouseLeft]",
        target: lowest,
        coords: { clientX: center(track), clientY: box(track).top + box(track).height * 0.6 }
      }
    ])
    await waitFor(() => expect(lowest).toHaveAttribute("aria-valuenow", "40"))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const [from] = await thumbs(canvasElement)
    await expect(css(trackOf(present(from)).children[0]).backgroundColor).toBe("rgb(66, 66, 66)")
    await expect(css(from).borderTopColor).toBe("rgb(255, 255, 255)")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
