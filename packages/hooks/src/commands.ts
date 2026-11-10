import { Duration, Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import * as FoldkitFile from "foldkit/file"
import { defineMessageUnion } from "foldkit/message"
import { titleOf } from "./useDocumentTitle/title.ts"
import { faviconType } from "./useFavicon/favicon.ts"
import { withHash } from "./useHash/hash.ts"
import { scrollOptions } from "./useWindowScroll/scroll.ts"
import { storageChangeEvent } from "./useLocalStorage/storage.ts"
import { scrollAt, scrollChange } from "./useScrollIntoView/scrollMath.ts"
import type { Alignment } from "./useScrollIntoView/scrollMath.ts"

export const BrowserMessage = defineMessageUnion({
  Done: {},
  Copied: {},
  CopyFailed: { error: Schema.String },
  CopyExpired: { generation: Schema.Int },
  Failed: { error: Schema.String },
  Picked: { color: Schema.String },
  FilesPicked: { files: Schema.Array(FoldkitFile.File) },
  Cancelled: {},
  ScrollFinished: {},
  ScrollCancelled: {}
})
export type BrowserMessage = typeof BrowserMessage.Type

const done = BrowserMessage.Done()

export const setDocumentTitle = Command.define("SetDocumentTitle", {
  args: { title: Schema.String },
  messages: [BrowserMessage.Done],
  execute: ({ title }) =>
    Effect.sync(() => {
      Option.map(titleOf(title), (text) => Reflect.set(document, "title", text))

      return done
    })
})

const faviconLink = () =>
  Option.getOrElse(Option.fromNullishOr(document.querySelector<HTMLLinkElement>("link[data-sth-favicon]")), () => {
    document.querySelectorAll('link[rel*="icon"]').forEach((element) => element.remove())
    const link = document.createElement("link")
    link.setAttribute("rel", "shortcut icon")
    link.setAttribute("data-sth-favicon", "")
    document.head.append(link)

    return link
  })

export const setFavicon = Command.define("SetFavicon", {
  args: { url: Schema.String },
  messages: [BrowserMessage.Done],
  execute: ({ url }) =>
    Effect.sync(() => {
      const link = faviconLink()
      Option.match(faviconType(url), {
        onNone: () => link.removeAttribute("type"),
        onSome: (type) => link.setAttribute("type", type)
      })
      link.setAttribute("href", url)

      return done
    })
})

export const setHash = Command.define("SetHash", {
  args: { hash: Schema.String },
  messages: [BrowserMessage.Done],
  execute: ({ hash }) =>
    Effect.sync(() => {
      window.location.replace(withHash(hash))

      return done
    })
})

export const scrollWindow = Command.define("ScrollWindow", {
  args: { x: Schema.optional(Schema.Finite), y: Schema.optional(Schema.Finite) },
  messages: [BrowserMessage.Done],
  execute: (position) =>
    Effect.sync(() => {
      window.scrollTo(scrollOptions(position))

      return done
    })
})

export const copyText = Command.define("CopyText", {
  args: { text: Schema.String },
  messages: [BrowserMessage.Copied, BrowserMessage.CopyFailed],
  execute: ({ text }) =>
    Effect.tryPromise({ try: () => navigator.clipboard.writeText(text), catch: String }).pipe(
      Effect.as(BrowserMessage.Copied()),
      Effect.catch((error) => Effect.succeed(BrowserMessage.CopyFailed({ error })))
    )
})

export const expireCopy = Command.define("ExpireCopy", {
  args: { generation: Schema.Int, timeout: Schema.Finite },
  messages: [BrowserMessage.CopyExpired],
  execute: ({ generation, timeout }) =>
    Effect.sleep(Duration.millis(timeout)).pipe(Effect.as(BrowserMessage.CopyExpired({ generation })))
})

const toggle = (selector: string): Promise<unknown> =>
  document.fullscreenElement === null
    ? Promise.all(
        Array.from(document.querySelectorAll(selector))
          .slice(0, 1)
          .map((element) => element.requestFullscreen())
      )
    : document.exitFullscreen()

export const toggleFullscreen = Command.define("ToggleFullscreen", {
  args: { selector: Schema.String },
  messages: [BrowserMessage.Done, BrowserMessage.Failed],
  execute: ({ selector }) =>
    Effect.tryPromise({ try: () => toggle(selector), catch: String }).pipe(
      Effect.as(done),
      Effect.catch((error) => Effect.succeed(BrowserMessage.Failed({ error })))
    )
})

const Picked = Schema.Struct({ sRGBHex: Schema.String })

const pick = (): Promise<unknown> => {
  const dropper: unknown = Reflect.construct(Reflect.get(window, "EyeDropper"), [])

  return Promise.resolve(Reflect.apply(Reflect.get(Object(dropper), "open"), dropper, []))
}

export const openEyeDropper = Command.define("OpenEyeDropper", {
  args: {},
  messages: [BrowserMessage.Picked, BrowserMessage.Failed],
  execute: () =>
    Effect.tryPromise({ try: pick, catch: String }).pipe(
      Effect.flatMap((result) => Schema.decodeUnknownEffect(Picked)(result).pipe(Effect.mapError(String))),
      Effect.map(({ sRGBHex }) => BrowserMessage.Picked({ color: sRGBHex })),
      Effect.catch((error) => Effect.succeed(BrowserMessage.Failed({ error })))
    )
})

const Kind = Schema.Literals(["localStorage", "sessionStorage"])

const announce = (kind: "localStorage" | "sessionStorage") => window.dispatchEvent(new Event(storageChangeEvent(kind)))

const encodeJson = Schema.encodeUnknownEffect(Schema.fromJsonString(Schema.Unknown))

export const writeStorage = Command.define("WriteStorage", {
  args: { kind: Kind, key: Schema.String, value: Schema.Unknown },
  messages: [BrowserMessage.Done, BrowserMessage.Failed],
  execute: ({ kind, key, value }) =>
    encodeJson(value).pipe(
      Effect.mapError(String),
      Effect.flatMap((text) => Effect.try({ try: () => window[kind].setItem(key, text), catch: String })),
      Effect.map(() => announce(kind)),
      Effect.as(done),
      Effect.catch((error) => Effect.succeed(BrowserMessage.Failed({ error })))
    )
})

export const removeStorage = Command.define("RemoveStorage", {
  args: { kind: Kind, key: Schema.String },
  messages: [BrowserMessage.Done],
  execute: ({ kind, key }) =>
    Effect.sync(() => {
      window[kind].removeItem(key)
      announce(kind)

      return done
    })
})

const isFile = (value: unknown): value is File => value instanceof File

const fileInput = (options: {
  readonly multiple: boolean
  readonly accept: string
  readonly capture: string
  readonly directory: boolean
}) => {
  const input = document.createElement("input")
  input.setAttribute("type", "file")
  input.setAttribute("accept", options.accept)
  input.toggleAttribute("multiple", options.multiple)
  input.toggleAttribute("webkitdirectory", options.directory)
  input.toggleAttribute("capture", options.capture !== "")
  input.setAttribute("data-sth-file-dialog", "")
  input.style.setProperty("display", "none")
  document.body.append(input)

  return input
}

type FileOutcome = ReturnType<typeof BrowserMessage.FilesPicked | typeof BrowserMessage.Cancelled>

export const openFileDialog = Command.define("OpenFileDialog", {
  args: { multiple: Schema.Boolean, accept: Schema.String, capture: Schema.String, directory: Schema.Boolean },
  messages: [BrowserMessage.FilesPicked, BrowserMessage.Cancelled],
  execute: (options) =>
    Effect.callback<FileOutcome>((resume) => {
      const input = fileInput(options)
      const finish = (outcome: FileOutcome) => {
        input.remove()
        resume(Effect.succeed(outcome))
      }
      input.addEventListener("change", () =>
        finish(BrowserMessage.FilesPicked({ files: Array.from<unknown>(Object(input.files)).filter(isFile) }))
      )
      input.addEventListener("cancel", () => finish(BrowserMessage.Cancelled()))
      input.click()
    })
})

export const fileDialog = (options: {
  readonly multiple?: boolean
  readonly accept?: string
  readonly capture?: string
  readonly directory?: boolean
}) => openFileDialog({ multiple: true, accept: "*", capture: "", directory: false, ...options })

const focusMark = "data-sth-focus-return"

export const rememberFocus = Command.define("RememberFocus", {
  args: { key: Schema.String },
  messages: [BrowserMessage.Done],
  execute: ({ key }) =>
    Effect.sync(() => {
      document.querySelectorAll(`[${focusMark}="${key}"]`).forEach((element) => element.removeAttribute(focusMark))
      document.activeElement?.setAttribute(focusMark, key)

      return done
    })
})

export const returnFocus = Command.define("ReturnFocus", {
  args: { key: Schema.String },
  messages: [BrowserMessage.Done],
  execute: ({ key }) =>
    Effect.sync(() => {
      document.querySelectorAll<HTMLElement>(`[${focusMark}="${key}"]`).forEach((element) => {
        element.removeAttribute(focusMark)
        element.focus()
      })

      return done
    })
})

const frame = Effect.callback<number>((resume) => {
  const id = requestAnimationFrame((time) => resume(Effect.succeed(time)))

  return Effect.sync(() => cancelAnimationFrame(id))
})

type Scroll = {
  readonly target: string
  readonly parent: string
  readonly axis: "x" | "y"
  readonly alignment: Alignment
  readonly duration: number
  readonly offset: number
  readonly cancelable: boolean
}

const viewOf = (scroll: Scroll) =>
  Option.fromNullishOr(scroll.parent === "" ? null : document.querySelector(scroll.parent))

const scrolled = (view: Option.Option<Element>) => Option.getOrElse(view, () => document.documentElement)

const positionOf = (scroll: Scroll, view: Option.Option<Element>) =>
  scroll.axis === "y" ? scrolled(view).scrollTop : scrolled(view).scrollLeft

const changeOf = (scroll: Scroll, view: Option.Option<Element>, target: Element) => {
  const box = target.getBoundingClientRect()
  const frameBox = Option.match(view, {
    onNone: () => ({ top: 0, left: 0, height: window.innerHeight, width: window.innerWidth }),
    onSome: (element) => element.getBoundingClientRect()
  })
  const y = scroll.axis === "y"

  return scrollChange(
    { start: y ? box.top - frameBox.top : box.left - frameBox.left, size: y ? box.height : box.width },
    y ? frameBox.height : frameBox.width,
    scroll.alignment,
    scroll.offset
  )
}

const scrollTo = (scroll: Scroll, view: Option.Option<Element>, distance: number) =>
  scrolled(view).scrollTo(scroll.axis === "y" ? { top: distance } : { left: distance })

const animate = Effect.fn(function* (scroll: Scroll, view: Option.Option<Element>, target: Element) {
  const start = positionOf(scroll, view)
  const change = changeOf(scroll, view, target)
  const instant = scroll.duration === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const began = yield* frame
  const step = (time: number): Effect.Effect<void> => {
    const progress = instant ? 1 : (time - began) / scroll.duration
    scrollTo(scroll, view, scrollAt(start, change, progress))

    return progress >= 1 ? Effect.void : Effect.flatMap(frame, step)
  }

  return yield* step(began)
})

const stopped = (scroll: Scroll) =>
  scroll.cancelable
    ? Effect.callback<void>((resume) => {
        const stop = () => resume(Effect.void)
        window.addEventListener("wheel", stop, { passive: true })
        window.addEventListener("touchmove", stop, { passive: true })

        return Effect.sync(() => {
          window.removeEventListener("wheel", stop)
          window.removeEventListener("touchmove", stop)
        })
      })
    : Effect.never

export const scrollIntoView = Command.define("ScrollIntoView", {
  args: {
    target: Schema.String,
    parent: Schema.String,
    axis: Schema.Literals(["x", "y"]),
    alignment: Schema.Literals(["start", "end", "center"]),
    duration: Schema.Finite,
    offset: Schema.Finite,
    cancelable: Schema.Boolean
  },
  messages: [BrowserMessage.ScrollFinished, BrowserMessage.ScrollCancelled],
  execute: (scroll) =>
    Effect.suspend(() =>
      Option.match(Option.fromNullishOr(document.querySelector(scroll.target)), {
        onNone: () => Effect.succeed(BrowserMessage.ScrollCancelled()),
        onSome: (target) =>
          Effect.raceFirst(
            animate(scroll, viewOf(scroll), target).pipe(Effect.as(BrowserMessage.ScrollFinished())),
            stopped(scroll).pipe(Effect.as(BrowserMessage.ScrollCancelled()))
          )
      })
    )
})

export const scrollIntoViewOf = (
  target: string,
  options: {
    readonly parent?: string
    readonly axis?: "x" | "y"
    readonly alignment?: Alignment
    readonly duration?: number
    readonly offset?: number
    readonly cancelable?: boolean
  }
) =>
  scrollIntoView({
    target,
    parent: "",
    axis: "y",
    alignment: "start",
    duration: 1250,
    offset: 0,
    cancelable: true,
    ...options
  })
