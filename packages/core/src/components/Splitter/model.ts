import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import { defineTaggedUnion } from "foldkit/schema"
import {
  collapse as collapsePane,
  expand as expandPane,
  isPixelMode,
  keyboard,
  PaneSize,
  Panel,
  reset as resetHandle,
  resizeFrom,
  toggleCollapse as togglePane,
  working
} from "../../hooks/splitter.ts"
import type { Change, Frame, KeyMove, RedistributeFn, Splitting } from "../../hooks/splitter.ts"

export const Orientation = Schema.Literals(["horizontal", "vertical"])
export type Orientation = typeof Orientation.Type

const Drag = defineTaggedUnion({
  Idle: {},
  Dragging: {
    handle: Schema.Finite,
    start: Schema.Finite,
    working: Schema.Array(Schema.Finite),
    raw: Schema.Array(PaneSize)
  }
})

export const Model = Schema.Struct({
  id: Schema.String,
  orientation: Orientation,
  dir: Schema.Literals(["ltr", "rtl"]),
  panels: Schema.Array(Panel),
  sizes: Schema.Array(PaneSize),
  preCollapse: Schema.Array(PaneSize),
  step: PaneSize,
  shiftStep: PaneSize,
  redistribute: Schema.Literals(["adjacent", "nearest", "equal"]),
  resetOnDoubleClick: Schema.Boolean,
  width: Schema.Finite,
  height: Schema.Finite,
  rootFont: Schema.Finite,
  drag: Drag
})
export type Model = typeof Model.Type

const Move = Schema.Literals(["decrease", "increase", "home", "end", "toggle"])

export const Container = Schema.Struct({ width: Schema.Finite, height: Schema.Finite, rootFont: Schema.Finite })
export type Container = typeof Container.Type

export const Message = defineMessageUnion({
  MeasuredContainer: { container: Container },
  PressedHandle: { handle: Schema.Finite, x: Schema.Finite, y: Schema.Finite, container: Container },
  MovedPointer: { x: Schema.Finite, y: Schema.Finite },
  ReleasedPointer: { x: Schema.Finite, y: Schema.Finite },
  ReleasedHandle: {},
  PressedKey: { handle: Schema.Finite, move: Move, shift: Schema.Boolean, container: Container },
  DoubleClickedHandle: { handle: Schema.Finite }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ChangedSizes: { sizes: Schema.Array(PaneSize) },
  StartedResize: { handle: Schema.Finite },
  EndedResize: { handle: Schema.Finite, sizes: Schema.Array(PaneSize) },
  ChangedCollapse: { panel: Schema.Finite, collapsed: Schema.Boolean }
})
export type OutMessage = typeof OutMessage.Type

export type InitConfig = {
  readonly id: string
  readonly panels: ReadonlyArray<Panel>
  readonly sizes?: ReadonlyArray<PaneSize>
  readonly orientation?: Orientation
  readonly dir?: "ltr" | "rtl"
  readonly step?: PaneSize
  readonly shiftStep?: PaneSize
  readonly redistribute?: "nearest" | "equal"
  readonly resetOnDoubleClick?: boolean
}

export const init = (config: InitConfig): Model => {
  const sizes = config.sizes ?? config.panels.map((panel) => panel.defaultSize)

  return {
    id: config.id,
    orientation: config.orientation ?? "horizontal",
    dir: config.dir ?? "ltr",
    panels: config.panels,
    sizes,
    preCollapse: sizes,
    step: config.step ?? 1,
    shiftStep: config.shiftStep ?? 10,
    redistribute: config.redistribute ?? "adjacent",
    resetOnDoubleClick: config.resetOnDoubleClick ?? true,
    width: 0,
    height: 0,
    rootFont: 16,
    drag: Drag.Idle()
  }
}

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

export type UpdateOptions = { readonly redistribute?: RedistributeFn }

const horizontal = (model: Model): boolean => model.orientation === "horizontal"

export const frameOf = (model: Model): Frame => ({
  pixel: isPixelMode(model.panels, model.sizes, [model.step, model.shiftStep]),
  container: horizontal(model) ? model.width : model.height,
  rootFont: model.rootFont
})

const splittingOf = (model: Model, options: UpdateOptions): Splitting => ({
  panels: model.panels,
  sizes: model.sizes,
  preCollapse: model.preCollapse,
  redistribute: options.redistribute ?? (model.redistribute === "adjacent" ? undefined : model.redistribute)
})

const pointerOf = (model: Model, x: number, y: number): number => (horizontal(model) ? x : y)

const unmeasured = (model: Model): boolean => frameOf(model).container === 0

const waiting = (model: Model): boolean => frameOf(model).pixel && unmeasured(model)

const changed = (model: Model, change: Change): Result => ({
  model: { ...model, sizes: change.sizes, preCollapse: change.preCollapse },
  outMessages: [
    ...(change.sizes === model.sizes ? [] : [OutMessage.ChangedSizes({ sizes: change.sizes })]),
    ...change.collapses.map((collapsed) => OutMessage.ChangedCollapse(collapsed))
  ]
})

const applied = (model: Model, change: Change): Result =>
  waiting(model) ? { model, outMessages: [] } : changed(model, change)

const measured = (model: Model, container: Container): Model => ({ ...model, ...container })

const pressed = (model: Model, handle: number, x: number, y: number): Result => ({
  model: {
    ...model,
    drag: Drag.Dragging({
      handle,
      start: pointerOf(model, x, y),
      working: working(model.sizes, frameOf(model)),
      raw: model.sizes
    })
  },
  outMessages: [OutMessage.StartedResize({ handle })]
})

const keyed = (model: Model, handle: number, move: KeyMove, shift: boolean, options: UpdateOptions): Result =>
  applied(
    model,
    keyboard(splittingOf(model, options), frameOf(model), handle, move, shift ? model.shiftStep : model.step)
  )

const dragged = (model: Model, x: number, y: number, options: UpdateOptions): Result => {
  if (model.drag._tag === "Idle") return { model, outMessages: [] }
  if (unmeasured(model)) return { model, outMessages: [] }
  const frame = frameOf(model)
  const direction = model.dir === "rtl" && horizontal(model) ? -1 : 1
  const moved = direction * (pointerOf(model, x, y) - model.drag.start)
  const delta = frame.pixel ? moved : (moved / frame.container) * 100

  return applied(model, resizeFrom(splittingOf(model, options), model.drag, frame, model.drag.handle, delta))
}

const ended = (model: Model): Result => {
  if (model.drag._tag === "Idle") return { model, outMessages: [] }

  return {
    model: { ...model, drag: Drag.Idle() },
    outMessages: [OutMessage.EndedResize({ handle: model.drag.handle, sizes: model.sizes })]
  }
}

const released = (model: Model, x: number, y: number, options: UpdateOptions): Result => {
  if (model.drag._tag === "Idle") return { model, outMessages: [] }
  const handle = model.drag.handle
  const result = dragged(model, x, y, options)

  return {
    model: { ...result.model, drag: Drag.Idle() },
    outMessages: [...result.outMessages, OutMessage.EndedResize({ handle, sizes: result.model.sizes })]
  }
}

export const updateWith =
  (options: UpdateOptions) =>
  (model: Model, message: Message): Result =>
    Message.match(message, {
      MeasuredContainer: ({ container }) => ({ model: measured(model, container), outMessages: [] }),
      PressedHandle: ({ handle, x, y, container }) => pressed(measured(model, container), handle, x, y),
      MovedPointer: ({ x, y }) => dragged(model, x, y, options),
      ReleasedPointer: ({ x, y }) => released(model, x, y, options),
      ReleasedHandle: () => ended(model),
      PressedKey: ({ handle, move, shift, container }) =>
        keyed(measured(model, container), handle, move, shift, options),
      DoubleClickedHandle: ({ handle }) =>
        model.resetOnDoubleClick
          ? applied(model, resetHandle(splittingOf(model, options), frameOf(model), handle))
          : { model, outMessages: [] }
    })

export const update = updateWith({})

export const setSizes = (model: Model, sizes: ReadonlyArray<PaneSize>): Model => ({ ...model, sizes })

export const collapse = (model: Model, panel: number): Result =>
  applied(model, collapsePane(splittingOf(model, {}), frameOf(model), panel))

export const expand = (model: Model, panel: number): Result =>
  applied(model, expandPane(splittingOf(model, {}), frameOf(model), panel))

export const toggleCollapse = (model: Model, panel: number): Result =>
  applied(model, togglePane(splittingOf(model, {}), frameOf(model), panel))

export const reset = (model: Model, handle: number): Result =>
  applied(model, resetHandle(splittingOf(model, {}), frameOf(model), handle))

export const isDragging = (model: Model): boolean => model.drag._tag === "Dragging"
