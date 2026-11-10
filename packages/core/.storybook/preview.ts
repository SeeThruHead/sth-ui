import type { Preview } from "@storybook/html-vite"
import "./preview.css"

const preview: Preview = {
  parameters: {
    options: { storySort: { order: ["Introduction", "Theming", "Layout", "Buttons", "Feedback"] } },
    layout: "padded",
    viewport: {
      options: {
        wide: { name: "Desktop (1440)", styles: { width: "1440px", height: "900px" } },
        phone: { name: "Phone (390)", styles: { width: "390px", height: "844px" } }
      }
    }
  },
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: { title: "Theme", icon: "paintbrush", items: ["Mantine", "Grape", "Compact"], dynamicTitle: true }
    },
    scheme: {
      description: "Colour scheme",
      toolbar: { title: "Scheme", icon: "mirror", items: ["light", "dark", "auto"], dynamicTitle: true }
    }
  },
  initialGlobals: { theme: "Mantine", scheme: "light" }
}

export default preview
