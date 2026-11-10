import { describe, expect, it } from "@effect/vitest"
import { osOf } from "./os.ts"

describe("osOf, as Mantine's useOs", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", false, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", true, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", false, "macos"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", false, "windows"],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8)", false, "android"],
    ["Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)", false, "chromeos"],
    ["Mozilla/5.0 (X11; Linux x86_64)", false, "linux"],
    ["curl/8.0", false, "undetermined"]
  ] as const)("reads %s (touch %s) as %s", (userAgent, touch, os) => {
    expect(osOf(userAgent, touch)).toBe(os)
  })
})
