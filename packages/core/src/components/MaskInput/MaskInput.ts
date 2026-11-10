import * as stylex from "@stylexjs/stylex"
import { Effect, MutableRef, Option, Queue, Schema, Stream, Struct } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import {
  blurMask,
  clampMaskCursor,
  focusMask,
  initializeMask,
  initialMaskState,
  inputMask,
  isMaskOptions,
  isStateComplete,
  keyDownMask,
  pasteMask
} from "../../hooks/mask.ts"
import type { MaskOptions, MaskOutcome, MaskState, Selection } from "../../hooks/mask.ts"
import { sx } from "../../styles/StylesApi.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputBaseConfig, InputBaseProps } from "../Input/InputBase.ts"
import { Message } from "./model.ts"
import type { Model } from "./model.ts"

export { init, Message, Model, OutMessage, update } from "./model.ts"
export type { Result } from "./model.ts"

const maskKeys = [
  "mask",
  "tokens",
  "modify",
  "separate",
  "slotChar",
  "alwaysShowMask",
  "showMaskOnFocus",
  "transform",
  "autoClear"
] as const

export type MaskInputProps<M> = Omit<
  InputBaseProps<M>,
  "id" | "value" | "onInput" | "onChange" | "onKeyDown" | "onBeforeInput"
> &
  MaskOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly defaultValue?: string
  }

const styles = stylex.create({ contents: { display: "contents" } })

const MaskOptionsSchema = Schema.declare(isMaskOptions)

const MountMessage = Schema.Union([Message.Changed, Message.Completed])

type MountMessage = typeof MountMessage.Type

type Wiring = {
  readonly input: HTMLInputElement
  readonly state: MutableRef.MutableRef<MaskState>
  readonly options: MaskOptions
  readonly queue: Queue.Queue<MountMessage, Cause.Done>
}

const selectionOf = (input: HTMLInputElement): Selection => ({
  start: Number(input.selectionStart),
  end: Number(input.selectionEnd)
})

const isActive = (input: HTMLInputElement): boolean => document.activeElement === input

const placeCaret = (input: HTMLInputElement, position: number): void => {
  if (!isActive(input)) return
  input.setSelectionRange(position, position)
}

const report = ({ queue, options, state }: Wiring, outcome: MaskOutcome): void => {
  if (Option.isNone(outcome.value) && Option.isNone(outcome.changed)) return
  const current = MutableRef.get(state)
  const values = Option.getOrElse(outcome.changed, () => ({ raw: current.raw, masked: current.display }))
  Queue.offerUnsafe(
    queue,
    Message.Changed({ ...values, complete: isStateComplete(current, options), notify: Option.isSome(outcome.changed) })
  )
  Option.map(outcome.completed, (completed) => Queue.offerUnsafe(queue, Message.Completed(completed)))
}

const applied = (wiring: Wiring, outcome: MaskOutcome): void => {
  MutableRef.set(wiring.state, outcome.state)
  Option.map(outcome.value, (value) => Reflect.set(wiring.input, "value", value))
  Option.map(outcome.cursor, (position) => placeCaret(wiring.input, position))
  report(wiring, outcome)
}

const clamped = (wiring: Wiring, keepBefore: boolean): void => {
  if (!isActive(wiring.input)) return
  Option.map(
    clampMaskCursor(MutableRef.get(wiring.state), wiring.options, selectionOf(wiring.input), keepBefore),
    (position) => wiring.input.setSelectionRange(position, position)
  )
}

const listen = (wiring: Wiring): (() => void) => {
  const { input, state, options } = wiring
  const onInput = () =>
    applied(wiring, inputMask(MutableRef.get(state), options, input.value, selectionOf(input).start))
  const onFocus = () => {
    applied(wiring, focusMask(MutableRef.get(state), options))
    requestAnimationFrame(() => clamped(wiring, false))
  }
  const onBlur = () => applied(wiring, blurMask(MutableRef.get(state), options, input.value))
  const onMouseDown = () => {
    requestAnimationFrame(() => clamped(wiring, true))
  }
  const onMouseUp = () => clamped(wiring, false)
  const onKeyDown = (event: KeyboardEvent) => {
    const outcome = keyDownMask(MutableRef.get(state), options, event, selectionOf(input), input.value)
    if (outcome.prevent) event.preventDefault()
    applied(wiring, outcome)
  }
  const onPaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData("text") ?? ""
    event.preventDefault()
    applied(wiring, pasteMask(MutableRef.get(state), options, text, selectionOf(input)))
  }
  input.addEventListener("input", onInput)
  input.addEventListener("focus", onFocus)
  input.addEventListener("blur", onBlur)
  input.addEventListener("mousedown", onMouseDown)
  input.addEventListener("mouseup", onMouseUp)
  input.addEventListener("keydown", onKeyDown)
  input.addEventListener("paste", onPaste)

  return () => {
    input.removeEventListener("input", onInput)
    input.removeEventListener("focus", onFocus)
    input.removeEventListener("blur", onBlur)
    input.removeEventListener("mousedown", onMouseDown)
    input.removeEventListener("mouseup", onMouseUp)
    input.removeEventListener("keydown", onKeyDown)
    input.removeEventListener("paste", onPaste)
  }
}

const MaskMount = Mount.defineStream("MaskInputMask", {
  args: { options: MaskOptionsSchema, defaultValue: Schema.String },
  messages: [Message.Changed, Message.Completed],
  execute: ({ element, options, defaultValue }) =>
    Stream.callback<MountMessage>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const input = Option.getOrThrow(Option.fromNullishOr(element.querySelector("input")))
          const wiring = { input, state: MutableRef.make(initialMaskState), options, queue }
          const release = listen(wiring)
          applied(wiring, initializeMask(initialMaskState, options, defaultValue))

          return release
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const MaskInput = (config: Parameters<ReturnType<typeof inputBase<"MaskInput">>>[0]) => {
  const base = inputBase("MaskInput")(config)

  return <M>(h: HtmlBuilder<M>, props: MaskInputProps<M>): Html => {
    const options = Struct.pick(props, maskKeys)
    const field = Struct.omit(props, [...maskKeys, "model", "toParentMessage", "defaultValue"])

    return h.keyed("div")(
      String(props.model.generation),
      [
        ...sx(h, styles.contents),
        h.OnMount(
          Mount.mapMessage(MaskMount({ options, defaultValue: props.defaultValue ?? "" }), props.toParentMessage)
        )
      ],
      [base(h, { ...field, id: props.model.id })]
    )
  }
}

export type MaskInputConfig = InputBaseConfig
