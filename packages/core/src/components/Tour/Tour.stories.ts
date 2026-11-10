import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as BeaconStatesDemo from "./demos/beacon-states.ts"
import * as BeaconDemo from "./demos/beacon.ts"
import * as CenteredDemo from "./demos/centered.ts"
import * as CenteredInlineDemo from "./demos/centered-inline.ts"
import * as CustomContentDemo from "./demos/custom-content.ts"
import * as ControlledDemo from "./demos/controlled.ts"
import * as LabelsDemo from "./demos/labels.ts"
import * as OverlayDemo from "./demos/overlay.ts"
import * as PositionDemo from "./demos/position.ts"
import * as ScrollingDemo from "./demos/scrolling.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Overlays/Tour" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const dialog = () => screen.findByRole("dialog")

const pause = async (ms: number) => {
  const start = performance.now()
  await waitFor(() => expect(performance.now() - start).toBeGreaterThan(ms), { timeout: ms + 1000 })
}

const spotlight = () => present(document.querySelector("[data-tour-spotlight]"))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Start tour" })).toBeVisible()
    await expect(screen.queryByRole("dialog")).toBeNull()
  }
}

export const Touring: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Start tour" }))
    const tooltip = await dialog()
    await expect(tooltip).toHaveAccessibleName("Step 1")
    await expect(tooltip).toHaveAccessibleDescription("This is the first step of the tour.")
    await expect(within(tooltip).getByText("1 of 3")).toHaveAttribute("aria-live", "polite")
    const target = canvas.getByRole("button", { name: "First target" })
    await waitFor(() => expect(Math.round(box(tooltip).top - box(target).bottom)).toBe(12))
    await expect(Number(spotlight().getAttribute("x"))).toBeCloseTo(box(target).left - 8, 0)
    await expect(Number(spotlight().getAttribute("width"))).toBeCloseTo(box(target).width + 16, 0)
    await expect(spotlight()).toHaveAttribute("rx", "4")
    await waitFor(() => expect(box(tooltip).width).toBe(360))
    await expect(css(tooltip).paddingTop).toBe("16px")
    await expect(within(tooltip).queryByRole("button", { name: "Back" })).toBeNull()
    await userEvent.click(within(tooltip).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 2"))
    const second = screen.getByRole("dialog")
    await waitFor(() => expect(within(second).getByText("2 of 3")).toBeVisible())
    await userEvent.click(within(second).getByRole("button", { name: "Back" }))
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 1"))
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Skip" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  }
}

export const Finishing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Start tour" }))
    await dialog()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 2"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 3"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 2"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 3"))
    const last = screen.getByRole("dialog")
    const close = within(last).getAllByRole("button", { name: "Close" })
    await expect(close).toHaveLength(2)
    await userEvent.click(present(close[1]))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Start tour" }))
    await dialog()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  }
}

const pressRight = async (element: HTMLElement) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
  await pause(100)
}

export const IgnoringArrowsWhileTyping: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Start tour" }))
    await dialog()
    const editable = document.createElement("div")
    editable.setAttribute("contenteditable", "true")
    canvasElement.append(editable)
    await pressRight(editable)
    await pressRight(within(canvasElement).getByRole("textbox", { name: "Second target" }))
    await pressRight(within(canvasElement).getByRole("button", { name: "First target" }))
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }))
    await expect(screen.getByRole("dialog")).toHaveAccessibleName("Step 1")
    editable.remove()
  }
}

export const Beacon: StoryObj = {
  render: demoApp(BeaconDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Show beacons" })).toBeVisible()
  }
}

export const OpeningBeacons: StoryObj = {
  render: demoApp(BeaconDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Show beacons" }))
    const beacon = await screen.findByRole("button", { name: "Start tour: Beacon 2" })
    const target = canvas.getByRole("textbox", { name: "Second target" })
    await waitFor(() => expect(Math.round(box(beacon).right)).toBe(Math.round(box(target).right - 4)))
    await expect(Math.round(box(beacon).bottom)).toBe(Math.round(box(target).top + 4))
    await expect(box(beacon).width).toBe(12)
    await expect(css(beacon).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(screen.getAllByRole("button", { name: /^Start tour:/ })).toHaveLength(3)
    await userEvent.click(beacon)
    const tooltip = await dialog()
    await expect(tooltip).toHaveAccessibleName("Beacon 2")
    await expect(screen.queryByRole("button", { name: /^Start tour:/ })).toBeNull()
    await expect(document.querySelector("[data-tour-spotlight]")).not.toBeNull()
    await userEvent.click(within(tooltip).getAllByRole("button", { name: "Close" })[0] ?? tooltip)
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^Start tour:/ })).toHaveLength(3))
    await userEvent.click(canvas.getByRole("button", { name: "Hide beacons" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Start tour:/ })).toBeNull())
  }
}

export const Controlled: StoryObj = {
  render: demoApp(ControlledDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Go to step 2" })).toBeVisible()
  }
}

export const JumpingToAStep: StoryObj = {
  render: demoApp(ControlledDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Go to step 2" }))
    await expect(await dialog()).toHaveAccessibleName("Step 2")
    await waitFor(() => expect(canvas.getByText("Events: changed 1, opened 1")).toBeInTheDocument())
  }
}

export const Overlay: StoryObj = {
  render: demoApp(OverlayDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Start tour" })).toBeVisible()
  }
}

export const ClickingThroughTheSpotlight: StoryObj = {
  render: demoApp(OverlayDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Start tour" }))
    await dialog()
    const overlay = present(document.querySelector("svg[role='presentation']"))
    await expect(overlay).toHaveAttribute("data-with-overlay-interaction")
    await expect(css(overlay).pointerEvents).toBe("none")
    await expect(spotlight()).toHaveAttribute("rx", "12")
    const target = canvas.getByRole("button", { name: "First target" })
    await waitFor(() => expect(Number(spotlight().getAttribute("x"))).toBeCloseTo(box(target).left - 16, 0))
    await expect(present(document.querySelector("[data-tour-hit]")).getAttribute("d")).toContain("A12 12")
    await expect(css(present(overlay.querySelector("rect[mask]"))).fill).toBe("rgba(0, 0, 60, 0.6)")
    await userEvent.click(present(document.querySelector("[data-tour-hit]")), { pointerEventsCheck: 0 })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  }
}

export const Centered: StoryObj = {
  render: demoApp(CenteredDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Start tour" })).toBeVisible()
  }
}

export const CenteringWithoutTarget: StoryObj = {
  render: demoApp(CenteredDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Start tour" }))
    const tooltip = await dialog()
    await expect(tooltip).toHaveAttribute("data-centered")
    await expect(document.querySelector("[data-tour-spotlight]")).toBeNull()
    await waitFor(() =>
      expect(Math.round(box(tooltip).left + box(tooltip).width / 2)).toBe(Math.round(window.innerWidth / 2))
    )
    await waitFor(() => expect(tooltip.contains(document.activeElement)).toBe(true))
  }
}

export const Position: StoryObj = {
  render: demoApp(PositionDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Start tour" })).toBeVisible()
  }
}

export const Positioning: StoryObj = {
  render: demoApp(PositionDemo),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByRole("button", { name: "Start tour" })
    await userEvent.click(target)
    await waitFor(() => expect(box(screen.getByRole("dialog")).top).toBeGreaterThan(box(target).bottom))
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Top"))
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement"))
    await expect(screen.getByRole("dialog").getAttribute("data-placement")).toMatch(/top|bottom/)
  }
}

export const Labels: StoryObj = {
  render: demoApp(LabelsDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Iniciar recorrido" }))
    const tooltip = await dialog()
    await waitFor(() => expect(within(tooltip).getByText("1 de 2")).toBeVisible())
    await expect(within(tooltip).getByRole("button", { name: "Siguiente" })).toBeVisible()
    await expect(within(tooltip).getByRole("button", { name: "Omitir" })).toBeVisible()
    await expect(within(tooltip).getByRole("button", { name: "Cerrar" })).toBeVisible()
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Start tour" }))
    const tooltip = await dialog()
    await expect(document.querySelector("svg[role='presentation']")).toBeNull()
    await expect(within(tooltip).queryAllByRole("button", { name: "Close" })).toHaveLength(0)
    await waitFor(() => expect(box(tooltip).width).toBe(240))
    await expect(css(present(tooltip.closest("[id='states-tour']"))).zIndex).toBe("400")
    await expect(css(within(tooltip).getByRole("button", { name: "Next" })).backgroundColor).toBe("rgb(190, 75, 219)")
    await userEvent.keyboard("{ArrowRight}")
    await userEvent.keyboard("{Escape}")
    await pause(150)
    await expect(screen.getByRole("dialog")).toHaveAccessibleName("No overlay")
    await userEvent.click(within(tooltip).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("2 of 3"))
    const second = screen.getByRole("dialog")
    await expect(spotlight()).toHaveAttribute("rx", "0")
    await expect(second).toHaveAttribute("aria-describedby", "states-tour-body")
    await userEvent.click(within(second).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Scrolled into view"))
    const third = screen.getByRole("dialog")
    await expect(third).not.toHaveAttribute("aria-describedby")
    const hidden = canvas.getByRole("button", { name: "Hidden target" })
    const scroller = present(hidden.parentElement)
    await pause(150)
    await expect(scroller.scrollTop).toBe(0)
    await waitFor(() => expect(third.contains(document.activeElement)).toBe(true))
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Start tour" }))
    const tooltip = await dialog()
    await expect(css(tooltip).backgroundColor).toBe("rgb(36, 36, 36)")
    await expect(css(tooltip).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const BeaconEdgeCases: StoryObj = {
  render: demoApp(BeaconStatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle beacons" }))
    const beacons = await screen.findAllByRole("button", { name: "Start tour" })
    await expect(beacons).toHaveLength(1)
    await userEvent.click(present(beacons[0]))
    const tooltip = await dialog()
    await expect(tooltip).toHaveAccessibleName("1 of 3")
  }
}

export const ScrollingIntoView: StoryObj = {
  render: demoApp(ScrollingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const hidden = await canvas.findByRole("button", { name: "Hidden target" })
    await expect(present(hidden.parentElement).scrollTop).toBe(0)
    await userEvent.click(canvas.getByRole("button", { name: "Start tour" }))
    await dialog()
    await waitFor(() => expect(present(hidden.parentElement).scrollTop).toBeGreaterThan(0))
    await expect(css(screen.getByRole("dialog")).paddingTop).toBe("0px")
  }
}

export const SlidingBetweenSteps: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Start tour" }))
    const tooltip = await dialog()
    await waitFor(() => expect(tooltip).toHaveAttribute("data-placed"))
    await userEvent.click(within(tooltip).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(tooltip.style.transition).toContain("top 300ms cubic-bezier(0.16, 1, 0.3, 1)"))
    await expect(await dialog()).toBe(tooltip)
    await waitFor(() => expect(tooltip.style.transition).toBe(""), { timeout: 1500 })
  }
}

export const CenteredInline: StoryObj = {
  render: demoApp(CenteredInlineDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = await canvas.findByRole("button", { name: "Start tour" })
    await userEvent.click(start)
    const tooltip = await canvas.findByRole("dialog")
    await expect(tooltip).toHaveAttribute("data-centered")
    await expect(document.querySelector("[data-tour-spotlight]")).toBeNull()
    await waitFor(() => expect(tooltip).toHaveFocus())
    await userEvent.click(within(tooltip).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(tooltip).not.toHaveAttribute("data-centered"))
    await waitFor(() =>
      expect(Math.round(tooltip.getBoundingClientRect().top)).toBe(
        Math.round(start.getBoundingClientRect().bottom + 12)
      )
    )
    await userEvent.click(present(within(tooltip).getAllByRole("button", { name: "Close" }).at(-1)))
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull())
    await expect(start).toHaveFocus()
  }
}

export const CustomContent: StoryObj = {
  render: demoApp(CustomContentDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Start tour" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Settings" })).toBeVisible()
  }
}

export const SteppingCustomContent: StoryObj = {
  render: demoApp(CustomContentDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Start tour" }))
    const tooltip = await dialog()
    await expect(tooltip).toHaveAccessibleName("Start here")
    const icon = present(tooltip.querySelector("[data-step-icon]"))
    await expect(icon).toHaveAttribute("data-step-icon", "1")
    const title = within(tooltip).getByRole("heading", { name: "Start here" })
    await expect(icon.getBoundingClientRect().top).toBeLessThan(
      within(tooltip)
        .getByText(/icon above/)
        .getBoundingClientRect().top
    )
    await expect(Math.round(title.getBoundingClientRect().left)).toBeGreaterThan(
      Math.round(icon.getBoundingClientRect().right)
    )
    await userEvent.click(within(tooltip).getByRole("button", { name: "Next" }))
    await waitFor(() => expect(tooltip).toHaveAccessibleName("Settings"))
    await expect(present(tooltip.querySelector("[data-step-icon]"))).toHaveAttribute("data-step-icon", "2")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Start tour" })).toBeVisible()
  }
}
