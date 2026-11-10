import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Data display/BackgroundImage" }

export default meta

const css = (element: Element) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const text = await within(canvasElement).findByText(/BackgroundImage component can be used/)
    const root = present(text.parentElement?.parentElement)
    await expect(css(root).backgroundImage).toBe(
      'url("https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-6.png")'
    )
    await expect(css(root).backgroundSize).toBe("cover")
    await expect(css(root).backgroundPosition).toBe("50% 50%")
    await expect(css(root).borderTopLeftRadius).toBe("8px")
    await expect(root.getBoundingClientRect().width).toBe(300)
    await expect(css(text).color).toBe("rgb(255, 255, 255)")
  }
}

export const AsLink: StoryObj = {
  render: demo((h, ui) =>
    ui.Stack(h, {
      children: [
        ui.BackgroundImage(h, {
          src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
          component: "a",
          attributes: { root: { href: "#gallery" } },
          children: ["Open the gallery"]
        }),
        ui.BackgroundImage(h, {
          src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
          h: 40,
          attributes: { root: { "data-testid": "empty" } }
        })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "Open the gallery" })
    await expect(css(link).textDecorationLine).toBe("none")
    await expect(css(link).borderTopLeftRadius).toBe("0px")
    await expect(css(link).display).toBe("block")
    const empty = within(canvasElement).getByTestId("empty")
    await expect(empty.childNodes).toHaveLength(0)
    await expect(empty.getBoundingClientRect().height).toBe(40)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
