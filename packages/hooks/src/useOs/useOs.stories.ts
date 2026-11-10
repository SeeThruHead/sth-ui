import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import { osOf } from "./os.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useOs" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const expected = osOf(navigator.userAgent, "ontouchend" in document)
    await expect(expected).not.toBe("undetermined")
    await expect(await within(canvasElement).findByText(/^Your os is (Linux|macOS|Windows)$/)).toBeVisible()
  }
}
