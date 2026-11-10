import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { fontSize } from "@sth-ui/core/theme/tokens.stylex.ts"
import {
  arrayChunks,
  chunkSegment,
  displayValue,
  entriesOf,
  expandablePaths,
  formatValue,
  isExpandable,
  safeStringify,
  serializePath,
  typeLabel,
  valueType
} from "./jsonValue.ts"
import type { ArrayChunk, SortKeys } from "./jsonValue.ts"
import { jsonViewerVars } from "./jsonViewer.stylex.ts"
import { focusMove, numberLines } from "./keyboard.ts"
import { allTarget, Message } from "./model.ts"
import type { Model } from "./model.ts"
import { styles, typeTones, valueTones } from "./styles.ts"

export type JsonViewerPart =
  | "root"
  | "node"
  | "toggle"
  | "key"
  | "value"
  | "bracket"
  | "type"
  | "size"
  | "ellipsis"
  | "copyButton"
  | "content"
  | "row"
  | "scrollarea"
  | "lineNumbers"
  | "wrapper"
  | "copyAllButton"
  | "controls"
  | "control"

export type JsonViewerHighlightType = "added" | "removed"

export type JsonViewerSize = "xs" | "sm" | "md" | "lg" | "xl"

export type JsonViewerOptions = {
  readonly rootName?: string | false
  readonly maxDisplayLength?: number
  readonly withTypes?: boolean
  readonly withSize?: boolean
  readonly withCopy?: boolean
  readonly withCopyButton?: boolean
  readonly withQuotes?: boolean
  readonly withKeyQuotes?: boolean
  readonly collapseStringsAfterLength?: number | false
  readonly sortKeys?: SortKeys
  readonly groupArraysAfterLength?: number | false
  readonly radius?: StyleValue
  readonly fontSize?: JsonViewerSize | (string & {}) | number
  readonly indentWidth?: number
  readonly withBorder?: boolean
  readonly copyLabel?: string
  readonly copiedLabel?: string
  readonly expandAllLabel?: string
  readonly collapseAllLabel?: string
  readonly withControls?: boolean
  readonly allExpanded?: boolean
  readonly withLineNumbers?: boolean
  readonly withChevrons?: boolean
  readonly selectable?: boolean
}

export type JsonViewerProps<M> = JsonViewerOptions &
  StylesApiProps<JsonViewerPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: unknown
    readonly highlightItems?: Readonly<Record<string, JsonViewerHighlightType>>
  }

export type JsonViewerConfig = ComponentConfig<JsonViewerOptions, JsonViewerPart>

type Settings<M> = Required<Omit<JsonViewerOptions, "radius" | "fontSize" | "indentWidth" | "rootName">> & {
  readonly h: HtmlBuilder<M>
  readonly getStyles: GetStyles<M, JsonViewerPart>
  readonly send: (message: Message) => M
  readonly model: Model
  readonly highlightItems: Readonly<Record<string, JsonViewerHighlightType>>
}

const wrapAfterLength = 20

const sizes: Readonly<Record<JsonViewerSize, string>> = {
  xs: fontSize.xs,
  sm: fontSize.sm,
  md: fontSize.md,
  lg: fontSize.lg,
  xl: fontSize.xl
}

const isSize = (value: string): value is JsonViewerSize => Object.hasOwn(sizes, value)

const fontSizeValue = (value: NonNullable<JsonViewerOptions["fontSize"]>): string => {
  if (typeof value === "number") return `${value}px`

  return isSize(value) ? sizes[value] : value
}

const chevronPath =
  "M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"

const copiedPath =
  "M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"

const copyPaths = [
  "M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z",
  "M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
]

const icon = <M>(h: HtmlBuilder<M>, paths: ReadonlyArray<string>) =>
  h.svg(
    [
      h.Attribute("viewBox", "0 0 16 16"),
      h.Attribute("width", "14"),
      h.Attribute("height", "14"),
      h.Attribute("fill", "currentColor"),
      h.AriaHidden(true)
    ],
    paths.map((d) => h.path([h.Attribute("d", d)], []))
  )

const KeyboardMount = Mount.defineStream("JsonViewerKeyboard", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const onKey = (event: Event) => focusMove(element, event)
          element.addEventListener("keydown", onKey)

          return () => element.removeEventListener("keydown", onKey)
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const LineNumbersMount = Mount.defineStream("JsonViewerLineNumbers", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => numberLines(element)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const copyButton = <M>(settings: Settings<M>, value: unknown, target: string) => {
  const { h, getStyles, send } = settings
  const copied = Option.contains(settings.model.copied, target)
  const label = copied ? settings.copiedLabel : settings.copyLabel

  return h.button(
    [
      ...getStyles("copyButton", unstyledButtonStyles.root, styles.copyButton),
      h.Type("button"),
      h.Tabindex(-1),
      h.DataAttribute("jv-copy", ""),
      h.AriaLabel(label),
      h.Title(label),
      h.OnClick(send(Message.Copied({ target, text: safeStringify(value), timeout: 1000 })))
    ],
    [icon(h, copied ? [copiedPath] : copyPaths)]
  )
}

const nodeKey = <M>(settings: Settings<M>, key: string | undefined) =>
  key === undefined
    ? []
    : [
        settings.h.span(
          [...settings.getStyles("key", styles.key), settings.h.DataAttribute("key", "")],
          [settings.withKeyQuotes ? JSON.stringify(key) : key, ": "]
        )
      ]

const chevron = <M>(settings: Settings<M>, expanded: boolean) =>
  settings.h.span(
    [
      ...settings.getStyles("toggle", styles.toggle, expanded && styles.toggleExpanded),
      ...(expanded ? [settings.h.DataAttribute("expanded", "")] : [])
    ],
    [
      settings.h.svg(
        [
          settings.h.Attribute("viewBox", "0 0 16 16"),
          settings.h.Attribute("width", "12"),
          settings.h.Attribute("height", "12"),
          settings.h.Attribute("fill", "currentColor")
        ],
        [settings.h.path([settings.h.Attribute("d", chevronPath)], [])]
      )
    ]
  )

type RowOptions<M> = {
  readonly level: number
  readonly root: boolean
  readonly expanded: Option.Option<boolean>
  readonly collapsible: boolean
  readonly activate: Option.Option<M>
  readonly toggle: Option.Option<M>
  readonly selectable: boolean
  readonly highlight?: stylex.StyleXStyles | null
}

const rowKeys = <M>(h: HtmlBuilder<M>, options: RowOptions<M>) =>
  h.OnKeyDownSelfPreventDefault((key) => {
    if (key === "Enter" || key === " ") return options.activate
    const open = Option.getOrElse(options.expanded, () => true)
    if (key === "ArrowRight" && !open) return options.toggle
    if (key === "ArrowLeft" && open && options.collapsible) return options.toggle

    return Option.none()
  })

const row = <M>(settings: Settings<M>, options: RowOptions<M>, children: ReadonlyArray<Html | string>) => {
  const { h, getStyles } = settings

  return h.div(
    [
      ...getStyles(
        "row",
        styles.row,
        stylex.defaultMarker(),
        !options.root && styles.hoverable,
        options.highlight ?? null
      ),
      h.Role("treeitem"),
      ...Option.match(options.expanded, { onNone: () => [], onSome: (open) => [h.AriaExpanded(open)] }),
      ...(options.selectable ? [h.AriaSelected(false)] : []),
      h.Attribute("aria-level", String(options.level)),
      h.DataAttribute("hoverable", ""),
      h.DataAttribute("jv-node", ""),
      h.DataAttribute("jv-row", ""),
      ...(options.collapsible ? [h.DataAttribute("jv-collapsible", "")] : []),
      ...(options.root ? [h.DataAttribute("root", "")] : []),
      h.Tabindex(options.root ? 0 : -1),
      ...Option.match(options.activate, { onNone: () => [], onSome: (message) => [h.OnClick(message)] }),
      rowKeys(h, options)
    ],
    children
  )
}

const closingRow = <M>(settings: Settings<M>, bracket: string) =>
  settings.h.div(
    [...settings.getStyles("row", styles.row), settings.h.DataAttribute("jv-row", ""), settings.h.AriaHidden(true)],
    [settings.h.span(settings.getStyles("bracket", styles.bracket), [bracket])]
  )

type Place = {
  readonly path: ReadonlyArray<string>
  readonly key: string | undefined
  readonly level: number
  readonly ancestors: ReadonlyArray<object>
  readonly root: boolean
}

const highlight = <M>(settings: Settings<M>, path: ReadonlyArray<string>) => {
  const type = settings.highlightItems[serializePath(path)]

  return type === undefined ? [] : [settings.h.DataAttribute("highlight", type)]
}

const highlightStyle = <M>(settings: Settings<M>, path: ReadonlyArray<string>) => {
  const type = settings.highlightItems[serializePath(path)]
  if (type === undefined) return null

  return type === "added" ? styles.added : styles.removed
}

const longString = (value: unknown, after: number | false) => {
  if (typeof value !== "string" || after === false) return false

  return value.length > after
}

const primitive = <M>(settings: Settings<M>, value: unknown, place: Place, circular: boolean): Html => {
  const { h, getStyles, send } = settings
  const pathText = serializePath(place.path)
  const type = circular ? "circular" : valueType(value)
  const collapsible = longString(value, settings.collapseStringsAfterLength)
  const showAll = settings.model.strings.includes(pathText)
  const formatted = circular
    ? { display: "[Circular]", collapsed: false }
    : formatValue(value, settings.withQuotes, collapsible && !showAll ? settings.collapseStringsAfterLength : false)
  const select = settings.selectable ? Option.some(send(Message.Selected({ path: place.path }))) : Option.none()
  const wraps = type === "string" && formatted.display.length > wrapAfterLength

  return h.div(
    [
      ...getStyles("node", styles.node),
      h.DataAttribute("type", type),
      h.DataAttribute("jv-node-wrapper", ""),
      ...highlight(settings, place.path)
    ],
    [
      row(
        settings,
        {
          level: place.level,
          root: place.root,
          expanded: Option.none(),
          collapsible: false,
          activate: select,
          toggle: Option.none(),
          selectable: settings.selectable,
          highlight: highlightStyle(settings, place.path)
        },
        [
          ...nodeKey(settings, place.key),
          h.span(
            [
              ...getStyles("value", styles.value, valueTones[type], wraps && styles.wrap),
              h.DataAttribute("value-type", type),
              ...(wraps ? [h.DataAttribute("wrap", "")] : [])
            ],
            [formatted.display]
          ),
          ...(collapsible
            ? [
                h.button(
                  [
                    ...getStyles("ellipsis", unstyledButtonStyles.root, styles.ellipsis, styles.clickable),
                    h.Type("button"),
                    h.AriaExpanded(showAll),
                    h.DataAttribute("clickable", ""),
                    h.OnClick(send(Message.ToggledString({ path: pathText })))
                  ],
                  [showAll ? "show less" : "show more"]
                )
              ]
            : []),
          ...(settings.withTypes
            ? [
                h.span(
                  [...getStyles("type", styles.type, typeTones[type]), h.DataAttribute("value-type", type)],
                  [circular ? "circular" : typeLabel(value)]
                )
              ]
            : []),
          ...(settings.withCopy ? [copyButton(settings, value, pathText)] : [])
        ]
      )
    ]
  )
}

const chunkNode = <M>(
  settings: Settings<M>,
  chunk: ArrayChunk,
  entries: ReadonlyArray<readonly [string, unknown]>,
  place: Place
): Html => {
  const { h, getStyles, send } = settings
  const label = chunkSegment(chunk)
  const pathText = serializePath([...place.path, label])
  const expanded = settings.allExpanded || settings.model.expanded.includes(pathText)
  const toggle = settings.allExpanded ? Option.none() : Option.some(send(Message.Toggled({ path: pathText })))

  return h.div(
    [...getStyles("node", styles.node), h.DataAttribute("type", "array"), h.DataAttribute("jv-node-wrapper", "")],
    [
      row(
        settings,
        {
          level: place.level,
          root: false,
          expanded: Option.some(expanded),
          collapsible: Option.isSome(toggle),
          activate: toggle,
          toggle,
          selectable: false
        },
        [
          ...(Option.isSome(toggle) && settings.withChevrons ? [chevron(settings, expanded)] : []),
          h.span([...getStyles("key", styles.key), h.DataAttribute("key", "")], [label]),
          h.span(getStyles("bracket", styles.bracket), ["["]),
          ...(expanded
            ? []
            : [
                h.span(getStyles("ellipsis", styles.ellipsis), ["..."]),
                h.span(getStyles("bracket", styles.bracket), ["]"])
              ]),
          ...(settings.withSize ? [h.span(getStyles("size", styles.size), [`${entries.length} items`])] : [])
        ]
      ),
      ...(expanded
        ? [
            h.div(
              [...getStyles("node", styles.group), h.Role("group")],
              entries.map(([key, child]) =>
                node(settings, child, {
                  path: [...place.path, key],
                  key: undefined,
                  level: place.level + 1,
                  ancestors: place.ancestors,
                  root: false
                })
              )
            ),
            closingRow(settings, "]")
          ]
        : [])
    ]
  )
}

const collapsible = <M>(settings: Settings<M>, value: object, place: Place): Html => {
  const { h, getStyles, send } = settings
  const pathText = serializePath(place.path)
  const isArray = Array.isArray(value)
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"]
  const entries = entriesOf(value, isArray ? false : settings.sortKeys)
  const total = entries.length
  const empty = total === 0
  const expanded = !empty && (place.root || settings.allExpanded || settings.model.expanded.includes(pathText))
  const canCollapse = !empty && !place.root && !settings.allExpanded
  const chunks = isArray ? arrayChunks(total, settings.groupArraysAfterLength) : null
  const truncated = chunks === null && total > settings.maxDisplayLength
  const shown = truncated ? entries.slice(0, settings.maxDisplayLength) : entries
  const toggle = canCollapse ? Option.some(send(Message.Toggled({ path: pathText }))) : Option.none()
  const inside = { ancestors: [...place.ancestors, value], level: place.level + 1 }
  const children =
    chunks === null
      ? shown.map(([key, child]) =>
          node(settings, child, { ...inside, path: [...place.path, key], key: isArray ? undefined : key, root: false })
        )
      : chunks.map((chunk) =>
          chunkNode(settings, chunk, entries.slice(chunk.start, chunk.end + 1), {
            ...inside,
            path: place.path,
            key: undefined,
            root: false
          })
        )
  const kind = isArray ? "array" : "object"

  return h.div(
    [
      ...getStyles("node", styles.node),
      h.DataAttribute("type", kind),
      h.DataAttribute("jv-node-wrapper", ""),
      ...highlight(settings, place.path)
    ],
    [
      row(
        settings,
        {
          level: place.level,
          root: place.root,
          expanded: empty ? Option.none() : Option.some(expanded),
          collapsible: canCollapse,
          activate: toggle,
          toggle,
          selectable: false,
          highlight: highlightStyle(settings, place.path)
        },
        [
          ...(canCollapse && settings.withChevrons ? [chevron(settings, expanded)] : []),
          ...nodeKey(settings, place.key),
          ...(empty
            ? [h.span(getStyles("bracket", styles.bracket), [`${open}${close}`])]
            : [
                h.span(getStyles("bracket", styles.bracket), [open]),
                ...(expanded
                  ? []
                  : [
                      h.span(getStyles("ellipsis", styles.ellipsis), ["..."]),
                      h.span(getStyles("bracket", styles.bracket), [close])
                    ])
              ]),
          ...(settings.withTypes
            ? [
                h.span(
                  [...getStyles("type", styles.type, typeTones[kind]), h.DataAttribute("value-type", kind)],
                  [kind]
                )
              ]
            : []),
          ...(settings.withSize
            ? [h.span(getStyles("size", styles.size), [isArray ? `${total} items` : `${total} keys`])]
            : []),
          ...(settings.withCopy ? [copyButton(settings, value, pathText)] : [])
        ]
      ),
      ...(expanded
        ? [
            h.div(
              [...getStyles("node", styles.group), h.Role("group")],
              [
                ...children,
                ...(truncated
                  ? [
                      h.div(
                        [...getStyles("row", styles.row), h.DataAttribute("jv-row", "")],
                        [
                          h.span(getStyles("size", styles.size), [
                            `... ${total - settings.maxDisplayLength} more ${isArray ? "items" : "keys"}`
                          ])
                        ]
                      )
                    ]
                  : [])
              ]
            ),
            closingRow(settings, close)
          ]
        : [])
    ]
  )
}

const node = <M>(settings: Settings<M>, raw: unknown, place: Place): Html => {
  const value = displayValue(raw)
  if (!isExpandable(value)) return primitive(settings, value, place, false)
  if (place.ancestors.includes(value)) return primitive(settings, value, place, true)

  return collapsible(settings, value, place)
}

const copyAllPaths = [
  "M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z",
  "M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"
]

export const JsonViewer =
  (config: { readonly JsonViewer?: JsonViewerConfig }) =>
  <M>(h: HtmlBuilder<M>, input: JsonViewerProps<M>): Html => {
    const props = withDefaults(config.JsonViewer, input)
    const getStyles = stylesApi<M, JsonViewerPart>(h, props, config.JsonViewer, "root")
    const send = props.toParentMessage
    const settings: Settings<M> = {
      h,
      getStyles,
      send,
      model: props.model,
      highlightItems: props.highlightItems ?? {},
      maxDisplayLength: props.maxDisplayLength ?? 100,
      withTypes: props.withTypes === true,
      withSize: props.withSize === true,
      withCopy: props.withCopy === true,
      withCopyButton: props.withCopyButton === true,
      withQuotes: props.withQuotes !== false,
      withKeyQuotes: props.withKeyQuotes === true,
      collapseStringsAfterLength: props.collapseStringsAfterLength ?? false,
      sortKeys: props.sortKeys ?? false,
      groupArraysAfterLength: props.groupArraysAfterLength ?? false,
      withBorder: props.withBorder === true,
      copyLabel: props.copyLabel ?? "Copy",
      copiedLabel: props.copiedLabel ?? "Copied",
      expandAllLabel: props.expandAllLabel ?? "Expand all",
      collapseAllLabel: props.collapseAllLabel ?? "Collapse all",
      withControls: props.withControls === true,
      allExpanded: props.allExpanded === true,
      withLineNumbers: props.withLineNumbers === true,
      withChevrons: props.withChevrons === true,
      selectable: props.selectable === true
    }
    const rootName = props.rootName ?? false
    const allCopied = Option.contains(props.model.copied, allTarget)
    const control = (label: string, message: Message) =>
      h.button(
        [
          ...getStyles("control", unstyledButtonStyles.root, styles.control),
          h.Type("button"),
          h.OnClick(send(message))
        ],
        [label]
      )

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          settings.withBorder && styles.bordered,
          setDefinedVars(
            [jsonViewerVars.radius, mapDefined(props.radius, radiusValue)],
            [jsonViewerVars.fontSize, mapDefined(props.fontSize, fontSizeValue)],
            [jsonViewerVars.indent, mapDefined(props.indentWidth, (width) => `${width / 16}rem`)]
          )
        ),
        ...(settings.withBorder ? [h.DataAttribute("with-border", "")] : []),
        h.DataAttribute("jv-root", ""),
        h.OnMount(Mount.mapMessage(KeyboardMount(), Function.absurd<M>))
      ],
      [
        ...(settings.withCopyButton
          ? [
              h.button(
                [
                  ...getStyles("copyAllButton", unstyledButtonStyles.root, styles.copyAllButton),
                  h.Type("button"),
                  h.AriaLabel(allCopied ? settings.copiedLabel : `${settings.copyLabel} JSON`),
                  h.Title(allCopied ? settings.copiedLabel : settings.copyLabel),
                  h.OnClick(
                    send(Message.Copied({ target: allTarget, text: safeStringify(props.value), timeout: 2000 }))
                  )
                ],
                [
                  h.svg(
                    [
                      h.Attribute("viewBox", "0 0 24 24"),
                      h.Attribute("stroke-width", "2"),
                      h.Attribute("stroke", "currentColor"),
                      h.Attribute("fill", "none"),
                      h.Attribute("stroke-linecap", "round"),
                      h.Attribute("stroke-linejoin", "round"),
                      h.Attribute("width", "16"),
                      h.Attribute("height", "16"),
                      h.AriaHidden(true)
                    ],
                    (allCopied ? ["M5 12l5 5l10 -10"] : copyAllPaths).map((d) => h.path([h.Attribute("d", d)], []))
                  )
                ]
              )
            ]
          : []),
        ...(settings.withControls && !settings.allExpanded
          ? [
              h.div(getStyles("controls", styles.controls, settings.withCopyButton && styles.controlsBesideCopy), [
                control(
                  settings.expandAllLabel,
                  Message.ExpandedAll({
                    paths: expandablePaths(props.value, { groupArraysAfterLength: settings.groupArraysAfterLength })
                  })
                ),
                control(settings.collapseAllLabel, Message.CollapsedAll())
              ])
            ]
          : []),
        h.div(getStyles("scrollarea", styles.scrollarea), [
          h.div(
            [
              ...getStyles("wrapper", styles.wrapper),
              ...(settings.withLineNumbers ? [h.OnMount(Mount.mapMessage(LineNumbersMount(), Function.absurd<M>))] : [])
            ],
            [
              ...(settings.withLineNumbers
                ? [
                    h.div(
                      [
                        ...getStyles("lineNumbers", styles.lineNumbers),
                        h.AriaHidden(true),
                        h.DataAttribute("jv-line-numbers", "")
                      ],
                      []
                    )
                  ]
                : []),
              h.div(
                [
                  ...getStyles("content", styles.content),
                  h.Role("tree"),
                  h.AriaLabel(rootName === false ? "JSON" : rootName),
                  h.DataAttribute("jv-content", "")
                ],
                [
                  node(settings, props.value, {
                    path: [],
                    key: rootName === false ? undefined : rootName,
                    level: 1,
                    ancestors: [],
                    root: true
                  })
                ]
              )
            ]
          )
        ])
      ]
    )
  }
