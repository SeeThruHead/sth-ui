import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AlternateDemo from "./demos/alternate.ts"
import * as BulletDemo from "./demos/bullet.ts"
import * as LineAndBulletDemo from "./demos/line-and-bullet.ts"
import * as OppositeDemo from "./demos/opposite.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "DataDisplay/Timeline" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const line = (element: Element | null | undefined) => getComputedStyle(present(element), "::before")

const itemOf = async (canvasElement: HTMLElement, title: string) =>
  present((await within(canvasElement).findAllByText(title))[0]?.parentElement?.parentElement)

const bulletOf = (item: HTMLElement) => present(item.querySelector(":scope > [data-with-child]"))

const blue = "rgb(34, 139, 230)"

const gray = "rgb(222, 226, 230)"

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const first = await itemOf(canvasElement, "New branch")
    const root = present(first.parentElement)
    const second = await itemOf(canvasElement, "Commits")
    const last = await itemOf(canvasElement, "Code review")
    await expect(css(root).paddingLeft).toBe("13px")
    await expect(box(first).left - box(root).left).toBe(13)
    await expect(css(first).paddingLeft).toBe("13px")
    const bullet = bulletOf(first)
    await expect(box(bullet).width).toBe(24)
    await expect(box(bullet).left).toBe(box(root).left)
    await expect(css(bullet).backgroundColor).toBe(blue)
    await expect(css(bulletOf(await itemOf(canvasElement, "Pull request"))).backgroundColor).toBe(gray)
    await expect(css(second).marginTop).toBe("32px")
    await expect(line(first).left).toBe("-2px")
    await expect(line(first).bottom).toBe("-32px")
    await expect(line(first).borderLeftColor).toBe(blue)
    await expect(line(second).borderLeftColor).toBe(gray)
    await expect(line(await itemOf(canvasElement, "Pull request")).borderLeftStyle).toBe("dashed")
    await expect(line(last).display).toBe("none")
    await expect(box(within(first).getByText("New branch")).left - box(root).left).toBe(39)
  }
}

export const LineAndBullet: StoryObj = {
  render: demo(LineAndBulletDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const first = await itemOf(canvasElement, "New branch")
    const bullet = present(first.children[0])
    await expect(box(bullet).width).toBe(25)
    await expect(css(bullet).borderTopWidth).toBe("4px")
    await expect(css(bullet).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(css(bullet).borderTopColor).toBe(blue)
    await expect(css(bullet).borderTopLeftRadius).toBe("32px")
  }
}

export const Opposite: StoryObj = {
  render: demo(OppositeDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const first = await itemOf(canvasElement, "New branch")
    const root = present(first.parentElement)
    await expect(root).toHaveAttribute("data-opposite")
    await expect(css(root).paddingLeft).toBe("0px")
    await expect(css(first).display).toBe("grid")
    const when = within(first).getByText("2 hours ago")
    await expect(css(when.parentElement).textAlign).toBe("end")
    await expect(box(when).right).toBeLessThan(box(bulletOf(first)).left)
    await expect(box(within(first).getByText("New branch")).left).toBeGreaterThan(box(bulletOf(first)).right)
    await expect(line(first).left).toBe(`${box(first).width / 2 - 1}px`)
  }
}

export const Alternate: StoryObj = {
  render: demo(AlternateDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const second = await itemOf(canvasElement, "Commits")
    await expect(second).toHaveAttribute("data-alternate")
    await expect(box(within(second).getByText("Commits")).right).toBeLessThan(box(bulletOf(second)).left)
    await expect(box(within(second).getByText("52 minutes ago")).left).toBeGreaterThan(box(bulletOf(second)).right)
    await expect(css(bulletOf(await itemOf(canvasElement, "Pull request"))).backgroundColor).toBe(blue)
  }
}

export const Bullet: StoryObj = {
  render: demo(BulletDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("img", { name: "Vitaly Rtishchev" })).toBeInTheDocument()
    await expect(within(canvasElement).getByText("RG")).toBeVisible()
    const plain = await itemOf(canvasElement, "Default bullet")
    await expect(css(plain.children[0]).backgroundColor).toBe("rgb(255, 255, 255)")
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const first = await itemOf(canvasElement, "New branch")
    const root = present(first.parentElement)
    await expect(root).toHaveAttribute("data-align", "right")
    await expect(css(root).paddingRight).toBe("12px")
    await expect(css(first).textAlign).toBe("end")
    await expect(line(first).right).toBe("-4px")
    await expect(first).not.toHaveAttribute("data-active")
    const third = await itemOf(canvasElement, "Pull request")
    await expect(third).toHaveAttribute("data-active")
    await expect(css(bulletOf(third)).color).not.toBe("rgb(255, 255, 255)")
    await expect(css(bulletOf(third)).borderTopLeftRadius).toBe("4px")
    const manual = await itemOf(canvasElement, "Set by hand")
    await expect(css(manual.children[0]).borderTopColor).toBe("rgb(190, 75, 219)")
    await expect(css(manual.children[0]).borderTopLeftRadius).toBe("0px")
    await expect(line(manual).borderLeftStyle).toBe("dotted")
    await expect(line(manual).borderLeftColor).toBe("rgb(190, 75, 219)")
    await expect(present(manual.parentElement).children).toHaveLength(3)
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const second = await itemOf(canvasElement, "Commits")
    await expect(line(second).borderLeftColor).toBe("rgb(66, 66, 66)")
    await expect(css(bulletOf(await itemOf(canvasElement, "Pull request"))).backgroundColor).toBe("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
