import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { story } from "./harness.ts"

const meta: Meta = { title: "Introduction" }

export default meta

const lines = [
  "sth-ui is Mantine's components on Foldkit and Effect, styled with StyleX.",
  "Use the Theme and Scheme menus in the toolbar to see every story under another theme, in light, dark or following the device.",
  "Each story runs its checks in a real browser: open the Interactions tab to see them pass."
]

export const Welcome: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Box(h, {
      maw: 640,
      children: [
        ui.Box(h, { component: "header", fz: "h2", fw: 700, mb: "md", children: ["sth-ui"] }),
        ...lines.map((line) => ui.Box(h, { component: "p", mb: "sm", lh: "md", children: [line] }))
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("banner")).toHaveTextContent("sth-ui")
    await expect(canvas.getByText(/Theme and Scheme menus/)).toBeVisible()
  }
}
