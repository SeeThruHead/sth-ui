import { describe, expect, it } from "@effect/vitest"
import { IMAGE_MIME_TYPE, MIME_TYPES } from "./mimeTypes.ts"
import {
  acceptList,
  accepts,
  dragStatus,
  fileErrors,
  invalidType,
  sortFiles,
  tooLarge,
  tooManyFiles,
  tooSmall
} from "./validate.ts"

const png = { name: "photo.PNG", type: "image/png", size: 2000 }
const pdf = { name: "doc.pdf", type: "application/pdf", size: 10 }

describe("dropzone validation, as react-dropzone and attr-accept", () => {
  it("reads accept lists and maps", () => {
    expect(acceptList(undefined)).toEqual([])
    expect(acceptList(IMAGE_MIME_TYPE)).toContain(MIME_TYPES.png)
    expect(acceptList({ "image/*": [".png", "jpg"], "not a type": [] })).toEqual(["image/*", ".png"])
  })

  it("accepts by extension, wildcard or exact type", () => {
    expect(accepts(png, [])).toBe(true)
    expect(accepts(png, [".png"])).toBe(true)
    expect(accepts({ type: "image/png" }, [".png"])).toBe(false)
    expect(accepts(png, ["image/*"])).toBe(true)
    expect(accepts(png, [" IMAGE/PNG "])).toBe(true)
    expect(accepts(pdf, ["image/*", ".png"])).toBe(false)
    expect(accepts({ type: "application/x-moz-file" }, ["image/png"])).toBe(true)
  })

  it("explains each rejection", () => {
    expect(invalidType(["image/png"]).message).toBe("File type must be image/png")
    expect(invalidType(["image/png", ".jpg"]).message).toBe("File type must be one of image/png, .jpg")
    expect(invalidType([]).message).toBe("File type must be ")
    expect(tooLarge(1).message).toBe("File is larger than 1 byte")
    expect(tooSmall(100).message).toBe("File is smaller than 100 bytes")
    expect(fileErrors(pdf, { accept: ["image/png"], minSize: 100 }).map((error) => error.code)).toEqual([
      "file-invalid-type",
      "file-too-small"
    ])
    expect(fileErrors(png, { maxSize: 1000 }).map((error) => error.code)).toEqual(["file-too-large"])
    expect(fileErrors({ type: "image/png" }, { maxSize: 1 })).toEqual([])
    expect(fileErrors(png, { validator: () => ({ code: "custom", message: "No" }) })).toEqual([
      { code: "custom", message: "No" }
    ])
    expect(fileErrors(png, { validator: () => [{ code: "a", message: "A" }] })).toEqual([{ code: "a", message: "A" }])
    expect(fileErrors(png, { validator: () => null })).toEqual([])
  })

  it("sorts dropped files and rejects all of them when there are too many", () => {
    expect(sortFiles([png, pdf], { accept: IMAGE_MIME_TYPE })).toEqual({
      accepted: [png],
      rejected: [{ file: pdf, errors: [invalidType(IMAGE_MIME_TYPE)] }]
    })
    expect(sortFiles([png, png], { multiple: false })).toEqual({
      accepted: [],
      rejected: [
        { file: png, errors: [tooManyFiles] },
        { file: png, errors: [tooManyFiles] }
      ]
    })
    expect(sortFiles([png, png, png], { maxFiles: 2 }).accepted).toEqual([])
    expect(sortFiles([png, png], { maxFiles: 2 }).accepted).toHaveLength(2)
  })

  it("tells accept from reject while dragging", () => {
    expect(dragStatus([], {})).toBe("idle")
    expect(dragStatus([{ type: "image/png" }], { accept: IMAGE_MIME_TYPE })).toBe("accept")
    expect(dragStatus([{ type: "application/pdf" }], { accept: IMAGE_MIME_TYPE })).toBe("reject")
    expect(dragStatus([{ type: "image/png" }, { type: "image/png" }], { multiple: false })).toBe("reject")
  })
})
