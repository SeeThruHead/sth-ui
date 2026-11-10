import { Option } from "effect"

const mimeTypes: Readonly<Record<string, string>> = {
  ico: "image/x-icon",
  png: "image/png",
  svg: "image/svg+xml",
  gif: "image/gif"
}

export const faviconType = (url: string): Option.Option<string> =>
  Option.fromNullishOr(mimeTypes[url.slice(url.lastIndexOf(".") + 1).toLowerCase()])
