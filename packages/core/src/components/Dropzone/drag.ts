import { Cause, Effect, Option, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { Message } from "./model.ts"

const DragMessage = Schema.Union([Message.DragEntered, Message.DragLeft, Message.Dropped])
type DragMessage = typeof DragMessage.Type

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const listen = <K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void
) => {
  node.addEventListener(type, listener)

  return () => node.removeEventListener(type, listener)
}

const counted = (element: Element, name: string) => Number(element.getAttribute(name) ?? "0")

const count = (element: Element) => counted(element, "data-drag-count")

const fileTypes = (data: DataTransfer): ReadonlyArray<string> =>
  Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.type)

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files")

const contained = (element: Element, event: Event) => event.target instanceof Node && element.contains(event.target)

const handlers = (element: Element, queue: Queue.Queue<DragMessage, Cause.Done>, bubbling: boolean) => {
  const stop = (event: Event) => {
    event.preventDefault()
    if (!bubbling) event.stopPropagation()
  }

  return {
    enter: (event: DragEvent) => {
      stop(event)
      element.setAttribute("data-drag-count", String(count(element) + 1))
      if (event.dataTransfer === null) return
      if (!hasFiles(event)) return
      Queue.offerUnsafe(queue, Message.DragEntered({ types: fileTypes(event.dataTransfer) }))
    },
    over: stop,
    leave: (event: DragEvent) => {
      stop(event)
      const next = Math.max(0, count(element) - 1)
      element.setAttribute("data-drag-count", String(next))
      if (next > 0) return
      Queue.offerUnsafe(queue, Message.DragLeft())
    },
    drop: (event: DragEvent) => {
      stop(event)
      element.setAttribute("data-drag-count", "0")
      Queue.offerUnsafe(queue, Message.Dropped({ files: Array.from(event.dataTransfer?.files ?? []) }))
    },
    outside: (event: DragEvent) => {
      if (contained(element, event)) return
      event.preventDefault()
    }
  }
}

export const WatchDrop = Mount.defineStream("DropzoneDrop", {
  args: { bubbling: Schema.Boolean },
  messages: [Message.DragEntered, Message.DragLeft, Message.Dropped],
  execute: ({ element, bubbling }) =>
    Stream.callback<DragMessage>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const node = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const on = handlers(node, queue, bubbling)
          const cleanups = [
            listen(node, "dragenter", on.enter),
            listen(node, "dragover", on.over),
            listen(node, "dragleave", on.leave),
            listen(node, "drop", on.drop)
          ]
          document.addEventListener("dragover", on.outside)
          document.addEventListener("drop", on.outside)

          return () => {
            cleanups.forEach((cleanup) => cleanup())
            document.removeEventListener("dragover", on.outside)
            document.removeEventListener("drop", on.outside)
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const windowHandlers = (element: Element, queue: Queue.Queue<typeof Message.WindowDragChanged.Type, Cause.Done>) => ({
  enter: (event: DragEvent) => {
    if (!hasFiles(event)) return
    element.setAttribute("data-window-count", String(counted(element, "data-window-count") + 1))
    Queue.offerUnsafe(queue, Message.WindowDragChanged({ dragging: true }))
  },
  leave: () => {
    const next = Math.max(0, counted(element, "data-window-count") - 1)
    element.setAttribute("data-window-count", String(next))
    if (next > 0) return
    Queue.offerUnsafe(queue, Message.WindowDragChanged({ dragging: false }))
  },
  drop: () => element.setAttribute("data-window-count", "0")
})

export const WatchWindowDrag = Mount.defineStream("DropzoneWindowDrag", {
  messages: [Message.WindowDragChanged],
  execute: ({ element }) =>
    Stream.callback<typeof Message.WindowDragChanged.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const on = windowHandlers(element, queue)
          document.addEventListener("dragenter", on.enter)
          document.addEventListener("dragleave", on.leave)
          document.addEventListener("drop", on.drop)

          return () => {
            document.removeEventListener("dragenter", on.enter)
            document.removeEventListener("dragleave", on.leave)
            document.removeEventListener("drop", on.drop)
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})
