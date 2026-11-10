import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import type { Kit } from "../../stories/harness.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as WithContentDemo from "./demos/with-content.ts"
import * as StillAndSizedDemo from "./demos/still-and-sized.ts"

const meta: Meta = { title: "Feedback/Skeleton" }

export default meta

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

const named = (label: string) => ({ attributes: { root: { "aria-label": label } } })

const lorem = [
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi dolor nihil amet tempore magnam optio, numquam nostrum inventore tempora assumenda saepe, aut repellat.",
  "Laborum fuga quam voluptas aut pariatur delectus repudiandae commodi tempora debitis dolores vero cumque magni cum, deserunt, ad tempore consectetur libero molestias."
]

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const avatar = await canvas.findByLabelText("Avatar loading")
    await expect(box(avatar).width).toBe(50)
    await expect(box(avatar).height).toBe(50)
    await expect(css(avatar).borderTopLeftRadius).toBe("1000px")
    await expect(box(canvas.getByLabelText("First line")).width).toBe(480)
    await expect(box(canvas.getByLabelText("Short line")).width).toBe(336)
    await expect(box(canvas.getByLabelText("First line")).height).toBe(8)
    const shade = present(canvas.getByLabelText("First line").lastElementChild)
    await expect(css(shade).backgroundColor).toBe("rgb(222, 226, 230)")
    await expect(css(shade).animationName).not.toBe("none")
    await expect(canvas.getByLabelText("First line")).toHaveAttribute("data-visible")
  }
}

const content = ({ h, ui }: Kit, visible: boolean) =>
  ui.Skeleton(h, {
    visible,
    ...named("Article"),
    children: lorem.map((text) => ui.Text(h, { children: [text] }))
  })

export const WithContent: StoryObj = {
  render: demo(WithContentDemo.view),
  play: async ({ canvasElement }) => {
    const article = await within(canvasElement).findByLabelText("Article")
    await expect(article).toHaveAttribute("aria-busy", "true")
    await expect(css(article).overflow).toBe("hidden")
    await expect(box(present(article.lastElementChild)).height).toBe(box(article).height)
  }
}

export const Toggling: StoryObj = {
  render: story((kit) =>
    kit.ui.Stack(kit.h, {
      maw: 480,
      children: [
        content(kit, kit.value("loading", "yes") === "yes"),
        kit.ui.Button(kit.h, {
          onClick: kit.set("loading", kit.value("loading", "yes") === "yes" ? "no" : "yes"),
          children: ["Toggle Skeleton"]
        })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const article = await canvas.findByLabelText("Article")
    await expect(article.querySelectorAll("[aria-hidden]")).toHaveLength(2)
    await userEvent.click(canvas.getByRole("button", { name: "Toggle Skeleton" }))
    await waitFor(() => expect(article).not.toHaveAttribute("data-visible"))
    await expect(article.querySelectorAll("[aria-hidden]")).toHaveLength(0)
    await expect(article).not.toHaveAttribute("aria-busy")
    await expect(within(article).getByText(/^Lorem ipsum/)).toBeVisible()
  }
}

export const StillAndSized: StoryObj = {
  render: demo(StillAndSizedDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const still = await canvas.findByLabelText("Still")
    await expect(still).not.toHaveAttribute("data-animate")
    await expect(css(present(still.lastElementChild)).animationName).toBe("none")
    await expect(box(still).width).toBe(120)
    await expect(css(still).borderTopLeftRadius).toBe("8px")
    await expect(box(canvas.getByLabelText("Square")).width).toBe(80)
    await expect(css(canvas.getByLabelText("Square")).borderTopLeftRadius).toBe("0px")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story(({ h, ui }) => ui.Skeleton(h, { height: 12, maw: 300, ...named("Line") })),
  play: async ({ canvasElement }) => {
    const line = await within(canvasElement).findByLabelText("Line")
    await expect(css(present(line.lastElementChild)).backgroundColor).toBe("rgb(66, 66, 66)")
    await expect(css(present(line.firstElementChild)).backgroundColor).toBe("rgb(36, 36, 36)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByLabelText("Avatar loading")).toBeVisible()
  }
}
