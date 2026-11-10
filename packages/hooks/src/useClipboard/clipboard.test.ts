import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { faviconType } from "../useFavicon/favicon.ts"
import { titleOf } from "../useDocumentTitle/title.ts"
import { withHash } from "../useHash/hash.ts"
import { connectionOf, networkOf } from "../useNetwork/network.ts"
import { scrollOptions } from "../useWindowScroll/scroll.ts"
import { clipboard, copied, copyFailed, expired, resetClipboard } from "./clipboard.ts"

describe("small hooks, as Mantine's", () => {
  it("copies, expires only the latest copy, fails and resets", () => {
    const first = copied(clipboard)
    const second = copied(first)
    expect(second).toEqual({ copied: true, error: Option.none(), generation: 2 })
    expect(expired(second, 1).copied).toBe(true)
    expect(expired(second, 2).copied).toBe(false)
    expect(copyFailed(second, "denied")).toEqual({ copied: false, error: Option.some("denied"), generation: 3 })
    expect(resetClipboard(copyFailed(second, "denied"))).toEqual({ ...clipboard, generation: 4 })
  })

  it("sets a title only when it has text", () => {
    expect(titleOf("  Inbox (3) ")).toEqual(Option.some("Inbox (3)"))
    expect(titleOf("   ")).toEqual(Option.none())
  })

  it("types favicons by extension", () => {
    expect(faviconType("/favicon.SVG")).toEqual(Option.some("image/svg+xml"))
    expect(faviconType("https://example.com/icon.png")).toEqual(Option.some("image/png"))
    expect(faviconType("icon.webp")).toEqual(Option.none())
    expect(faviconType("")).toEqual(Option.none())
  })

  it("adds a hash when missing", () => {
    expect(withHash("top")).toBe("#top")
    expect(withHash("#top")).toBe("#top")
  })

  it("reads the network connection's known fields", () => {
    expect(
      connectionOf({ downlink: 10, effectiveType: "4g", rtt: 50, saveData: false, type: "wifi", other: 1 })
    ).toEqual({
      downlink: 10,
      effectiveType: "4g",
      rtt: 50,
      saveData: false,
      type: "wifi"
    })
    expect(connectionOf(undefined)).toEqual({})
    expect(connectionOf({ effectiveType: "6g" })).toEqual({})
    expect(networkOf(false, { downlinkMax: 1 })).toEqual({ online: false, downlinkMax: 1 })
  })

  it("scrolls smoothly to the given axes", () => {
    expect(scrollOptions({ y: 10 })).toEqual({ behavior: "smooth", top: 10 })
    expect(scrollOptions({ x: 5 })).toEqual({ behavior: "smooth", left: 5 })
  })
})
