import { describe, expect, it } from "@effect/vitest"
import { defaultLabels, richTextEditorLabels } from "./labels.ts"

describe("rich text editor labels", () => {
  it("fills in Mantine's defaults and keeps overrides", () => {
    const labels = richTextEditorLabels({ boldControlLabel: "Gras" })
    expect(labels.boldControlLabel).toBe("Gras")
    expect(labels.italicControlLabel).toBe("Italic")
    expect(richTextEditorLabels().linkControlLabel).toBe("Link")
    expect(defaultLabels.colorControlLabel("red")).toBe("Set text color red")
    expect(defaultLabels.colorPickerColorLabel("blue")).toBe("Set text color blue")
    expect(defaultLabels.tableInsertLabel(3, 2)).toBe("Insert 3 × 2 table")
  })
})
