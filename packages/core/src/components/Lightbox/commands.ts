import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const LightboxCommandMessage = defineMessageUnion({ Done: {} })

class BrowserRefused extends Schema.TaggedError<BrowserRefused, { readonly brand: unique symbol }>()(
  "BrowserRefused",
  {}
) {}

const refused = () => new BrowserRefused({})

const done = () => LightboxCommandMessage.Done()

export const EnterFullscreen = Command.define("LightboxEnterFullscreen", {
  messages: [LightboxCommandMessage.Done],
  execute: Effect.tryPromise({ try: () => document.documentElement.requestFullscreen(), catch: refused }).pipe(
    Effect.ignore,
    Effect.map(done)
  )
})

export const ExitFullscreen = Command.define("LightboxExitFullscreen", {
  messages: [LightboxCommandMessage.Done],
  execute: Effect.suspend(() =>
    Option.match(Option.fromNullishOr(document.fullscreenElement), {
      onNone: () => Effect.succeed(done()),
      onSome: () =>
        Effect.tryPromise({ try: () => document.exitFullscreen(), catch: refused }).pipe(
          Effect.ignore,
          Effect.map(done)
        )
    })
  )
})

const allowed = ["http:", "https:", "blob:", "data:"]

const parsed = (src: string) =>
  Option.liftThrowable((value: string) => new URL(value, window.location.href))(src).pipe(
    Option.filter((url) => allowed.includes(url.protocol))
  )

const fileName = (url: URL) => {
  if (url.protocol === "data:") return "download"
  const last = url.pathname.split("/").reduce((_, part) => part, "")

  return Option.getOrElse(Option.liftThrowable(decodeURIComponent)(last), () => last) || "download"
}

const clickLink = (attributes: ReadonlyArray<readonly [string, string]>) => {
  const link = document.createElement("a")
  attributes.forEach(([name, value]) => link.setAttribute(name, value))
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const openInTab = (src: string) =>
  clickLink([
    ["href", src],
    ["target", "_blank"],
    ["rel", "noopener noreferrer"]
  ])

const crossOrigin = (url: URL) => {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false

  return url.origin !== window.location.origin
}

const saveBlob = (url: URL, blob: Blob) => {
  const href = URL.createObjectURL(blob)
  clickLink([
    ["href", href],
    ["download", fileName(url)]
  ])
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

const fetched = (src: string, url: URL) =>
  Effect.tryPromise({ try: () => fetch(src), catch: refused }).pipe(
    Effect.filterOrFail((response) => response.ok, refused),
    Effect.flatMap((response) => Effect.tryPromise({ try: () => response.blob(), catch: refused })),
    Effect.map((blob) => saveBlob(url, blob)),
    Effect.catch(() => Effect.sync(() => openInTab(src)))
  )

export const Download = Command.define("LightboxDownload", {
  args: { src: Schema.String },
  messages: [LightboxCommandMessage.Done],
  execute: ({ src }) =>
    Option.match(parsed(src), {
      onNone: () => Effect.succeed(done()),
      onSome: (url) => (crossOrigin(url) ? Effect.sync(() => openInTab(src)) : fetched(src, url)).pipe(Effect.map(done))
    })
})
