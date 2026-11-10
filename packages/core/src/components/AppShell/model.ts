import { Option, Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import { defineTaggedUnion } from "foldkit/schema"

export const Section = Schema.Literals(["navbar", "aside", "header", "footer"])
export type Section = typeof Section.Type

export const sections: ReadonlyArray<Section> = ["navbar", "aside", "header", "footer"]

export const SectionOptions = Schema.Struct({
  min: Schema.optional(Schema.Finite),
  max: Schema.optional(Schema.Finite),
  collapseThreshold: Schema.optional(Schema.Finite),
  label: Schema.optional(Schema.String)
})
export type SectionOptions = typeof SectionOptions.Type

const perSection = <S extends Schema.Top>(schema: S) =>
  Schema.Struct({ navbar: schema, aside: schema, header: schema, footer: schema })

export const Sizes = perSection(Schema.Option(Schema.Finite))
export type Sizes = typeof Sizes.Type

const Drag = defineTaggedUnion({
  Idle: {},
  Resizing: {
    section: Section,
    startSize: Schema.Finite,
    startX: Schema.Finite,
    startY: Schema.Finite,
    size: Schema.Finite,
    viewport: Schema.Finite,
    moved: Schema.Boolean
  }
})

export const Model = Schema.Struct({
  id: Schema.String,
  dir: Schema.Literals(["ltr", "rtl"]),
  options: perSection(Schema.Option(SectionOptions)),
  sizes: Sizes,
  measured: Sizes,
  viewport: Schema.Struct({ width: Schema.Finite, height: Schema.Finite }),
  collapsed: perSection(Schema.Boolean),
  drag: Drag
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  MeasuredSection: { section: Section, size: Schema.Finite, width: Schema.Finite, height: Schema.Finite },
  PressedHandle: {
    section: Section,
    x: Schema.Finite,
    y: Schema.Finite,
    startSize: Schema.Finite,
    viewport: Schema.Finite
  },
  MovedPointer: { x: Schema.Finite, y: Schema.Finite },
  ReleasedPointer: {},
  CancelledResize: {},
  PressedKey: {
    section: Section,
    key: Schema.String,
    shift: Schema.Boolean,
    currentSize: Schema.Finite,
    viewport: Schema.Finite
  },
  DoubleClickedHandle: { section: Section }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Resized: { sizes: Sizes },
  ResizeEnded: { sizes: Sizes },
  CollapseChanged: { section: Section, collapsed: Schema.Boolean }
})
export type OutMessage = typeof OutMessage.Type

export type InitConfig = {
  readonly id: string
  readonly dir?: "ltr" | "rtl"
  readonly navbar?: SectionOptions
  readonly aside?: SectionOptions
  readonly header?: SectionOptions
  readonly footer?: SectionOptions
  readonly initialSizes?: { readonly [Name in Section]?: number }
}

const each = <A>(value: (section: Section) => A) => ({
  navbar: value("navbar"),
  aside: value("aside"),
  header: value("header"),
  footer: value("footer")
})

export const init = (config: InitConfig): Model => ({
  id: config.id,
  dir: config.dir ?? "ltr",
  options: each((section) => Option.fromNullishOr(config[section])),
  sizes: each((section) => Option.fromNullishOr(config.initialSizes?.[section])),
  measured: each(() => Option.none()),
  viewport: { width: 0, height: 0 },
  collapsed: each(() => false),
  drag: Drag.Idle()
})

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const axes = {
  navbar: { vertical: false, sign: 1 },
  aside: { vertical: false, sign: -1 },
  header: { vertical: true, sign: 1 },
  footer: { vertical: true, sign: -1 }
} as const

export const isVertical = (section: Section): boolean => axes[section].vertical

export const resizeDelta = (section: Section, deltaX: number, deltaY: number, dir: Model["dir"]): number => {
  const axis = axes[section]
  if (axis.vertical) return deltaY * axis.sign

  return deltaX * axis.sign * (dir === "rtl" ? -1 : 1)
}

const optionsOf = (model: Model, section: Section): SectionOptions =>
  Option.getOrElse(model.options[section], () => ({}))

export const clampSize = (size: number, options: SectionOptions, viewport: number): number => {
  const upper = Math.min(options.max ?? Number.POSITIVE_INFINITY, viewport)
  const lower = Math.min(options.min ?? 0, upper)

  return Math.max(lower, Math.min(size, upper))
}

const collapsedAt = (options: SectionOptions, size: number): boolean =>
  options.collapseThreshold !== undefined && size < options.collapseThreshold

export const sizeOf = (model: Model, section: Section): Option.Option<number> => {
  if (model.drag._tag === "Resizing" && model.drag.section === section && model.drag.moved) {
    return Option.some(model.drag.size)
  }

  return model.sizes[section]
}

export const currentSizeOf = (model: Model, section: Section): Option.Option<number> =>
  Option.orElse(sizeOf(model, section), () => model.measured[section])

export const viewportOf = (model: Model, section: Section): number =>
  isVertical(section) ? model.viewport.height : model.viewport.width

export const maxOf = (model: Model, section: Section): number => {
  const viewport = viewportOf(model, section)

  return Math.min(optionsOf(model, section).max ?? viewport, viewport)
}

const withSize = (sizes: Sizes, section: Section, size: Option.Option<number>): Sizes => ({ ...sizes, [section]: size })

const reported = (model: Model, section: Section, collapsed: boolean): Result => {
  if (model.collapsed[section] === collapsed) return { model, outMessages: [] }

  return {
    model: { ...model, collapsed: { ...model.collapsed, [section]: collapsed } },
    outMessages: [OutMessage.CollapseChanged({ section, collapsed })]
  }
}

const seeded = (model: Model, section: Section, size: number): Model => ({
  ...model,
  collapsed: { ...model.collapsed, [section]: collapsedAt(optionsOf(model, section), size) }
})

const pressed = (model: Model, message: Extract<Message, { _tag: "PressedHandle" }>): Result => ({
  model: {
    ...seeded(model, message.section, message.startSize),
    drag: Drag.Resizing({
      section: message.section,
      startSize: message.startSize,
      startX: message.x,
      startY: message.y,
      size: message.startSize,
      viewport: message.viewport,
      moved: false
    })
  },
  outMessages: []
})

const moved = (model: Model, x: number, y: number): Result => {
  if (model.drag._tag === "Idle") return { model, outMessages: [] }
  const drag = model.drag
  const options = optionsOf(model, drag.section)
  const raw = drag.startSize + resizeDelta(drag.section, x - drag.startX, y - drag.startY, model.dir)
  const size = clampSize(raw, options, drag.viewport)
  const next = { ...model, drag: { ...drag, size, moved: true } }
  const collapse = reported(next, drag.section, collapsedAt(options, raw))

  return {
    model: collapse.model,
    outMessages: [
      OutMessage.Resized({ sizes: withSize(model.sizes, drag.section, Option.some(size)) }),
      ...collapse.outMessages
    ]
  }
}

const released = (model: Model): Result => {
  if (model.drag._tag === "Idle") return { model, outMessages: [] }
  const drag = model.drag
  const idle = { ...model, drag: Drag.Idle() }
  if (!drag.moved) return { model: idle, outMessages: [] }
  const sizes = withSize(model.sizes, drag.section, Option.some(drag.size))

  return { model: { ...idle, sizes }, outMessages: [OutMessage.ResizeEnded({ sizes })] }
}

const cancelled = (model: Model): Result => {
  if (model.drag._tag === "Idle") return { model, outMessages: [] }
  const drag = model.drag

  return reported(
    { ...model, drag: Drag.Idle() },
    drag.section,
    collapsedAt(optionsOf(model, drag.section), drag.startSize)
  )
}

const keySteps: { readonly [key: string]: readonly [number, number] } = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1]
}

export const keyTarget = (
  model: Model,
  section: Section,
  key: string,
  shift: boolean,
  current: number,
  viewport: number
): Option.Option<number> => {
  const options = optionsOf(model, section)
  if (key === "Home") return Option.some(options.min ?? 0)
  if (key === "End") return Option.some(options.max ?? viewport)

  return Option.fromNullishOr(keySteps[key]).pipe(
    Option.map(([x, y]) => resizeDelta(section, x, y, model.dir)),
    Option.filter((direction) => direction !== 0),
    Option.map((direction) => current + direction * (shift ? 50 : 10))
  )
}

const keyed = (model: Model, message: Extract<Message, { _tag: "PressedKey" }>): Result =>
  Option.match(keyTarget(model, message.section, message.key, message.shift, message.currentSize, message.viewport), {
    onNone: () => ({ model, outMessages: [] }),
    onSome: (target) => {
      const options = optionsOf(model, message.section)
      const collapse = reported(
        seeded(model, message.section, message.currentSize),
        message.section,
        collapsedAt(options, target)
      )
      const sizes = withSize(model.sizes, message.section, Option.some(clampSize(target, options, message.viewport)))

      return {
        model: { ...collapse.model, sizes },
        outMessages: [...collapse.outMessages, OutMessage.ResizeEnded({ sizes })]
      }
    }
  })

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    MeasuredSection: ({ section, size, width, height }) => ({
      model: { ...model, measured: withSize(model.measured, section, Option.some(size)), viewport: { width, height } },
      outMessages: []
    }),
    PressedHandle: (pressedMessage) => pressed(model, pressedMessage),
    MovedPointer: ({ x, y }) => moved(model, x, y),
    ReleasedPointer: () => released(model),
    CancelledResize: () => cancelled(model),
    PressedKey: (keyMessage) => keyed(model, keyMessage),
    DoubleClickedHandle: ({ section }) => ({
      model: { ...model, sizes: withSize(model.sizes, section, Option.none()) },
      outMessages: []
    })
  })

export const setSize = (model: Model, section: Section, size: number): Model => ({
  ...model,
  sizes: withSize(model.sizes, section, Option.some(size))
})

export const resetSize = (model: Model, section: Section): Model => ({
  ...model,
  sizes: withSize(model.sizes, section, Option.none())
})

export const resetAll = (model: Model): Model => ({ ...model, sizes: each(() => Option.none()) })

export const activeSection = (model: Model): Option.Option<Section> =>
  model.drag._tag === "Resizing" ? Option.some(model.drag.section) : Option.none()
