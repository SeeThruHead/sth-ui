import { Schema } from "effect"

export const Os = Schema.Literals(["undetermined", "macos", "ios", "windows", "android", "linux", "chromeos"])
export type Os = typeof Os.Type

const patterns: ReadonlyArray<readonly [Exclude<Os, "undetermined">, RegExp]> = [
  ["windows", /(Win32)|(Win64)|(Windows)|(WinCE)/i],
  ["android", /Android/i],
  ["chromeos", /CrOS/i],
  ["linux", /Linux/i]
]

const mac = /(Macintosh)|(MacIntel)|(MacPPC)|(Mac68K)/i

const ios = /(iPhone)|(iPad)|(iPod)/i

export const osOf = (userAgent: string, touch: boolean): Os => {
  if (ios.test(userAgent)) return "ios"
  if (mac.test(userAgent)) return touch ? "ios" : "macos"

  return patterns.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? "undetermined"
}
