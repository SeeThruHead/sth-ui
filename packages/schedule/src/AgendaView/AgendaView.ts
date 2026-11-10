import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { setDefinedVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { accentStyle } from "@sth-ui/core/theme/accent.ts"
import { customAccent } from "@sth-ui/core/theme/customAccent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { isAllDayEvent, isMultidayEvent } from "../dayLayout.ts"
import type { ScheduleEvent as EventData } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import { scheduleLabels } from "../labels.ts"
import type { ScheduleLabels } from "../labels.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import { agendaGroups } from "./agenda.ts"
import { agendaViewVars } from "./AgendaView.stylex.ts"

export type AgendaViewPart =
  | "agendaView"
  | "agendaViewHeader"
  | "agendaViewHeaderLabel"
  | "agendaViewBody"
  | "agendaViewDateGroup"
  | "agendaViewDateHeader"
  | "agendaViewEvent"
  | "agendaViewEventBody"
  | "agendaViewEventColor"
  | "agendaViewEventTitle"
  | "agendaViewEventTime"
  | "agendaViewNoEvents"

export type AgendaViewOptions = {
  readonly locale?: string
  readonly radius?: StyleValue
  readonly mode?: "default" | "static" | undefined
  readonly dateHeaderFormat?: DateLabelFormat
  readonly headerFormat?: DateLabelFormat
  readonly recurrenceExpansionLimit?: number | undefined
}

export type AgendaViewProps<M> = AgendaViewOptions &
  StylesApiProps<AgendaViewPart> & {
    readonly rangeStart: DateString
    readonly rangeEnd: DateString
    readonly events?: ReadonlyArray<EventData> | undefined
    readonly labels?: Partial<ScheduleLabels> | undefined
    readonly renderEvent?: RenderEvent<M>
    readonly onEventClick?: ((event: EventData) => M) | undefined
  }

export type AgendaViewConfig = ComponentConfig<AgendaViewOptions, AgendaViewPart>

const border = `light-dark(${palette.gray3}, ${palette.dark4})`
const shade = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    [agendaViewVars.radius]: radius.default,
    borderRadius: agendaViewVars.radius
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: space.sm,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: border
  },
  headerLabel: {
    userSelect: "none",
    fontWeight: 600,
    fontSize: fontSize.sm,
    textTransform: "capitalize",
    margin: 0
  },
  body: { flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 },
  group: {
    borderBottomWidth: { default: "1px", ":last-child": 0 },
    borderBottomStyle: "solid",
    borderBottomColor: border
  },
  dateHeader: {
    padding: `${space.xs} ${space.sm}`,
    fontWeight: 600,
    fontSize: fontSize.sm,
    textTransform: "capitalize",
    backgroundColor: shade,
    margin: 0
  },
  event: {
    display: "block",
    width: "100%",
    textAlign: "start",
    cursor: "pointer",
    padding: 0,
    borderWidth: 0,
    borderBottomWidth: { default: "1px", ":last-child": 0 },
    borderBottomStyle: "solid",
    borderBottomColor: border,
    backgroundColor: { default: "transparent", ":hover": shade },
    color: "inherit",
    fontFamily: "inherit"
  },
  still: { cursor: "default" },
  eventBody: { display: "flex", gap: space.sm, padding: `${space.xs} ${space.sm}` },
  color: { width: "4px", borderRadius: "2px", flexShrink: 0, backgroundColor: accent.filled },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  time: { marginTop: "2px", fontSize: fontSize.xs, color: colors.dimmed },
  noEvents: { padding: `${space.xl} ${space.sm}`, color: colors.dimmed, textAlign: "center", margin: 0 }
})

export const AgendaView =
  (config: { readonly AgendaView?: AgendaViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AgendaViewProps<M>): Html => {
    const props = withDefaults(config.AgendaView, input)
    const getStyles = stylesApi<M, AgendaViewPart>(h, props, config.AgendaView, "agendaView")
    const labels = scheduleLabels(props.labels)
    const locale = props.locale ?? "en"
    const isStatic = props.mode === "static"
    const headerFormat = props.headerFormat ?? "MMMM D, YYYY"
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${props.rangeStart} 00:00:00`,
      rangeEnd: `${props.rangeEnd} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const groups = agendaGroups(expanded, props.rangeStart, props.rangeEnd)

    const eventNode = (date: DateString) => (event: EventData) => {
      const allDay = isMultidayEvent(event) || isAllDayEvent(event, date)
      const attributes = [
        ...getStyles(
          "agendaViewEvent",
          ...accentStyle(event.color, customAccent),
          styles.event,
          isStatic && styles.still,
          shared.focusRing
        ),
        h.Type("button"),
        h.DataAttribute("event-id", String(event.id)),
        h.Tabindex(isStatic ? -1 : 0),
        ...(props.onEventClick === undefined || isStatic ? [] : [h.OnClick(props.onEventClick(event))])
      ]
      const children = [
        h.div(getStyles("agendaViewEventBody", styles.eventBody), [
          h.div(getStyles("agendaViewEventColor", styles.color), []),
          h.div(
            [],
            [
              h.div(getStyles("agendaViewEventTitle", styles.title), [event.title]),
              h.div(getStyles("agendaViewEventTime", styles.time), [
                allDay
                  ? labels.allDay
                  : `${formatDateTime(event.start, "HH:mm")} – ${formatDateTime(event.end, "HH:mm")}`
              ])
            ]
          )
        ])
      ]

      return props.renderEvent === undefined
        ? h.keyed("button")(`${date}-${event.id}`, attributes, children)
        : props.renderEvent(event, { attributes, children })
    }

    const groupNode = (group: (typeof groups)[number]) =>
      h.keyed("div")(group.date, getStyles("agendaViewDateGroup", styles.group), [
        h.p(getStyles("agendaViewDateHeader", styles.dateHeader), [
          formatDateTime(`${group.date} 00:00:00`, props.dateHeaderFormat ?? "dddd, MMMM D", locale)
        ]),
        ...group.events.map(eventNode(group.date))
      ])

    return h.div(
      getStyles(
        "agendaView",
        styles.root,
        setDefinedVars([agendaViewVars.radius, props.radius === undefined ? undefined : radiusValue(props.radius)])
      ),
      [
        h.div(getStyles("agendaViewHeader", styles.header), [
          h.p(getStyles("agendaViewHeaderLabel", styles.headerLabel), [
            `${formatDateTime(`${props.rangeStart} 00:00:00`, headerFormat, locale)} – ${formatDateTime(`${props.rangeEnd} 00:00:00`, headerFormat, locale)}`
          ])
        ]),
        h.div(
          getStyles("agendaViewBody", styles.body),
          groups.length > 0
            ? groups.map(groupNode)
            : [h.p(getStyles("agendaViewNoEvents", styles.noEvents), [labels.noEvents])]
        )
      ]
    )
  }
