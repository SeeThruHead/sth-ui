import { Data, Duration, Effect, Stream } from "effect"

export type PressAction = Data.TaggedEnum<{
  Down: { readonly x: number; readonly y: number }
  Elapsed: { readonly press: number }
  End: {}
  Move: { readonly x: number; readonly y: number }
}>
export const PressAction = Data.taggedEnum<PressAction>()

export type PressOutput = "started" | "longPressed" | "finished" | "cancelled"

export type PressState = {
  readonly press: number
  readonly pressed: boolean
  readonly active: boolean
  readonly x: number
  readonly y: number
}

export const pressState: PressState = { press: 0, pressed: false, active: false, x: 0, y: 0 }

export type LongPressOptions = {
  readonly threshold?: number
  readonly events?: ReadonlyArray<"mouse" | "touch">
  readonly cancelOnMove?: boolean | number
}

const moveLimit = (cancelOnMove: boolean | number | undefined) => {
  if (cancelOnMove === true) return 10
  if (cancelOnMove === false) return Number.POSITIVE_INFINITY

  return cancelOnMove ?? Number.POSITIVE_INFINITY
}

type Step = readonly [PressState, ReadonlyArray<PressOutput>]

const step = (state: PressState, outputs: ReadonlyArray<PressOutput>): Step => [state, outputs]

const end = (state: PressState): Step => {
  const released = { ...state, pressed: false, active: false }
  if (state.active) return step(released, ["finished"])
  if (state.pressed) return step(released, ["cancelled"])

  return step(released, [])
}

const fires = (state: PressState, press: number) => {
  if (press !== state.press) return false
  if (!state.pressed) return false

  return !state.active
}

const movedTooFar = (state: PressState, x: number, y: number, cancelOnMove?: boolean | number) => {
  if (!state.pressed) return false

  return Math.hypot(x - state.x, y - state.y) > moveLimit(cancelOnMove)
}

export const pressStep = (state: PressState, action: PressAction, cancelOnMove?: boolean | number): Step =>
  PressAction.$match(action, {
    Down: ({ x, y }) => step({ press: state.press + 1, pressed: true, active: false, x, y }, ["started"]),
    Elapsed: ({ press }) => (fires(state, press) ? step({ ...state, active: true }, ["longPressed"]) : step(state, [])),
    End: () => end(state),
    Move: ({ x, y }) => (movedTooFar(state, x, y, cancelOnMove) ? end(state) : step(state, []))
  })

const field = (value: unknown, name: string): unknown => Reflect.get(Object(value), name)

export const pointOf = (event: unknown) => {
  const source = field(event, "touches") === undefined ? event : field(field(event, "touches"), "0")

  return { x: Number(field(source, "clientX")), y: Number(field(source, "clientY")) }
}

const names = {
  mouse: { down: ["mousedown"], end: ["mouseup", "mouseleave"], move: ["mousemove"] },
  touch: { down: ["touchstart"], end: ["touchend", "touchcancel"], move: ["touchmove"] }
}

const listen = (target: EventTarget, events: ReadonlyArray<string>, toAction: (event: Event) => PressAction) =>
  events.map((name) => Stream.fromEventListener<Event>(target, name).pipe(Stream.map(toAction)))

export const longPressOn = (target: EventTarget, options: LongPressOptions = {}): Stream.Stream<PressOutput> => {
  const kinds = (options.events ?? ["mouse", "touch"]).map((kind) => names[kind])
  const actions = Stream.mergeAll(
    kinds.flatMap((kind) => [
      ...listen(target, kind.down, (event) => PressAction.Down(pointOf(event))),
      ...listen(target, kind.end, () => PressAction.End()),
      ...listen(target, kind.move, (event) => PressAction.Move(pointOf(event)))
    ]),
    { concurrency: "unbounded" }
  )
  const threshold = Duration.millis(options.threshold ?? 400)
  const withTimer = (action: PressAction, press: number): Stream.Stream<PressAction> =>
    action._tag === "Down"
      ? Stream.concat(
          Stream.succeed(action),
          Stream.fromEffect(Effect.sleep(threshold).pipe(Effect.as(PressAction.Elapsed({ press }))))
        )
      : Stream.succeed(action)

  return actions.pipe(
    Stream.mapAccum(
      () => 0,
      (presses: number, action: PressAction): readonly [number, ReadonlyArray<readonly [PressAction, number]>] => {
        const next = action._tag === "Down" ? presses + 1 : presses

        return [next, [[action, next]]]
      }
    ),
    Stream.flatMap(([action, press]: readonly [PressAction, number]) => withTimer(action, press), {
      concurrency: "unbounded"
    }),
    Stream.mapAccum(
      () => pressState,
      (state: PressState, action: PressAction) => pressStep(state, action, options.cancelOnMove)
    )
  )
}
