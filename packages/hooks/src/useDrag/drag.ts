import { Option, Stream } from "effect"

export type Vector = readonly [number, number]

export type DragOptions = {
  readonly axis?: "x" | "y" | "lock" | "both"
  readonly axisThreshold?: number
  readonly filterTaps?: boolean
  readonly tapThreshold?: number
  readonly threshold?: number | Vector
}

export type DragInput = {
  readonly kind: "down" | "move" | "up" | "cancel"
  readonly pointerId: number
  readonly button: number
  readonly x: number
  readonly y: number
  readonly time: number
}

export type DragEvent = {
  readonly xy: Vector
  readonly initial: Vector
  readonly movement: Vector
  readonly delta: Vector
  readonly distance: Vector
  readonly direction: Vector
  readonly velocity: Vector
  readonly elapsedTime: number
  readonly first: boolean
  readonly last: boolean
  readonly active: boolean
  readonly tap: boolean
  readonly canceled: boolean
}

export type DragState = {
  readonly active: boolean
  readonly pointerId: number
  readonly start: Vector
  readonly previous: Vector
  readonly startTime: number
  readonly previousTime: number
  readonly thresholdMet: boolean
  readonly firstFired: boolean
  readonly locked: "x" | "y" | undefined
  readonly velocity: Vector
}

export const dragState: DragState = {
  active: false,
  pointerId: -1,
  start: [0, 0],
  previous: [0, 0],
  startTime: 0,
  previousTime: 0,
  thresholdMet: false,
  firstFired: false,
  locked: undefined,
  velocity: [0, 0]
}

const velocityDecay = 100

const sign = (value: number) => Math.sign(value) + 0

const thresholdOf = (threshold: number | Vector | undefined): Vector =>
  typeof threshold === "object" ? threshold : [threshold ?? 0, threshold ?? 0]

const lockOf = (locked: DragState["locked"], vector: Vector, options: DragOptions): DragState["locked"] => {
  if (options.axis !== "lock") return locked
  if (locked !== undefined) return locked
  const limit = options.axisThreshold ?? 1
  if (Math.abs(vector[0]) <= limit && Math.abs(vector[1]) <= limit) return undefined

  return Math.abs(vector[0]) >= Math.abs(vector[1]) ? "x" : "y"
}

const constrain = (vector: Vector, axis: DragOptions["axis"]): Vector => {
  if (axis === "x") return [vector[0], 0]
  if (axis === "y") return [0, vector[1]]

  return vector
}

const axisOf = (options: DragOptions, locked: DragState["locked"]) => (options.axis === "lock" ? locked : options.axis)

const event = (state: DragState, input: DragInput, fields: Partial<DragEvent>): DragEvent => ({
  xy: [input.x, input.y],
  initial: state.start,
  movement: [0, 0],
  delta: [0, 0],
  distance: [0, 0],
  direction: [0, 0],
  velocity: [0, 0],
  elapsedTime: input.time - state.startTime,
  first: !state.firstFired,
  last: false,
  active: true,
  tap: false,
  canceled: false,
  ...fields
})

type Step = readonly [DragState, Option.Option<DragEvent>]

const down = (state: DragState, input: DragInput, options: DragOptions): Step => {
  if (input.button !== 0) return [state, Option.none()]
  if (state.active) return [state, Option.none()]
  const [tx, ty] = thresholdOf(options.threshold)
  const immediate = tx === 0 && ty === 0
  const started: DragState = {
    ...dragState,
    active: true,
    pointerId: input.pointerId,
    start: [input.x, input.y],
    previous: [input.x, input.y],
    startTime: input.time,
    previousTime: input.time,
    thresholdMet: immediate,
    firstFired: immediate
  }

  return [started, immediate ? Option.some(event(started, input, { first: true, elapsedTime: 0 })) : Option.none()]
}

const owns = (state: DragState, input: DragInput) => state.active && input.pointerId === state.pointerId

const belowThreshold = (raw: Vector, options: DragOptions) => {
  const [tx, ty] = thresholdOf(options.threshold)

  return Math.abs(raw[0]) < tx && Math.abs(raw[1]) < ty
}

const moved = (state: DragState, input: DragInput, options: DragOptions): Step => {
  if (!owns(state, input)) return [state, Option.none()]
  const raw: Vector = [input.x - state.start[0], input.y - state.start[1]]
  if (!state.thresholdMet && belowThreshold(raw, options)) {
    return [{ ...state, previous: [input.x, input.y], previousTime: input.time }, Option.none()]
  }
  const locked = lockOf(state.locked, raw, options)
  const axis = axisOf(options, locked)
  const movement = constrain(raw, axis)
  const delta = constrain([input.x - state.previous[0], input.y - state.previous[1]], axis)
  const elapsed = input.time - state.previousTime
  const velocity: Vector = elapsed > 0 ? [Math.abs(delta[0]) / elapsed, Math.abs(delta[1]) / elapsed] : state.velocity
  const next: DragState = {
    ...state,
    thresholdMet: true,
    firstFired: true,
    locked,
    velocity,
    previous: [input.x, input.y],
    previousTime: input.time
  }

  return [
    next,
    Option.some(
      event(state, input, {
        movement,
        delta,
        distance: [Math.abs(movement[0]), Math.abs(movement[1])],
        direction: [sign(delta[0]), sign(delta[1])],
        velocity
      })
    )
  ]
}

const tapped = (distance: Vector, options: DragOptions) =>
  options.filterTaps === true && Math.max(distance[0], distance[1]) < (options.tapThreshold ?? 3)

const released = (state: DragState, input: DragInput, options: DragOptions): Step => {
  if (!owns(state, input)) return [state, Option.none()]
  const axis = axisOf(options, state.locked)
  const movement = constrain([input.x - state.start[0], input.y - state.start[1]], axis)
  const distance: Vector = [Math.abs(movement[0]), Math.abs(movement[1])]
  if (!state.thresholdMet) {
    return [
      dragState,
      options.filterTaps === true
        ? Option.some(
            event(state, input, {
              movement,
              delta: movement,
              distance,
              direction: [sign(movement[0]), sign(movement[1])],
              first: true,
              last: true,
              active: false,
              tap: tapped(distance, options)
            })
          )
        : Option.none()
    ]
  }
  const delta = constrain([input.x - state.previous[0], input.y - state.previous[1]], axis)

  return [
    dragState,
    Option.some(
      event(state, input, {
        movement,
        delta,
        distance,
        direction: [sign(delta[0]), sign(delta[1])],
        velocity: input.time - state.previousTime > velocityDecay ? [0, 0] : state.velocity,
        last: true,
        active: false,
        tap: tapped(distance, options)
      })
    )
  ]
}

const canceled = (state: DragState, input: DragInput, options: DragOptions): Step => {
  if (!owns(state, input)) return [state, Option.none()]
  const movement = constrain([input.x - state.start[0], input.y - state.start[1]], axisOf(options, state.locked))

  return [
    dragState,
    Option.some(
      event(state, input, {
        movement,
        distance: [Math.abs(movement[0]), Math.abs(movement[1])],
        last: true,
        active: false,
        canceled: true
      })
    )
  ]
}

export const dragStep = (state: DragState, input: DragInput, options: DragOptions): Step => {
  if (input.kind === "down") return down(state, input, options)
  if (input.kind === "move") return moved(state, input, options)
  if (input.kind === "up") return released(state, input, options)

  return canceled(state, input, options)
}

const field = (value: unknown, name: string): number => Number(Reflect.get(Object(value), name))

export const dragInputOf = (kind: DragInput["kind"], pointer: unknown): DragInput => ({
  kind,
  pointerId: field(pointer, "pointerId"),
  button: field(pointer, "button"),
  x: field(pointer, "clientX"),
  y: field(pointer, "clientY"),
  time: field(pointer, "timeStamp")
})

const inputs = (target: EventTarget, kinds: ReadonlyArray<readonly [string, DragInput["kind"]]>) =>
  kinds.map(([name, kind]) =>
    Stream.fromEventListener<Event>(target, name).pipe(Stream.map((pointer) => dragInputOf(kind, pointer)))
  )

export const dragOn = (element: EventTarget, page: EventTarget, options: DragOptions): Stream.Stream<DragEvent> =>
  Stream.mergeAll(
    [
      ...inputs(element, [["pointerdown", "down"]]),
      ...inputs(page, [
        ["pointermove", "move"],
        ["pointerup", "up"],
        ["pointercancel", "cancel"]
      ])
    ],
    { concurrency: "unbounded" }
  ).pipe(
    Stream.mapAccum(
      () => dragState,
      (state: DragState, input: DragInput): readonly [DragState, ReadonlyArray<DragEvent>] => {
        const [next, emitted] = dragStep(state, input, options)

        return [next, Option.toArray(emitted)]
      }
    )
  )
