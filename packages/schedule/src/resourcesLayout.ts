import { Option } from "effect"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { dayViewEvents, overlapClusters } from "./dayLayout.ts"
import type { DayPositionedEvent, DayViewEvents, EventOverlapMode } from "./dayLayout.ts"
import type { ScheduleEvent, ScheduleResource, ScheduleResourceGroup } from "./events.ts"

export type GroupPosition = "first" | "middle" | "last" | "only"

export type ResourceRow = {
  readonly resource: ScheduleResource
  readonly group: Option.Option<{
    readonly group: ScheduleResourceGroup
    readonly position: GroupPosition
    readonly count: number
  }>
}

const positionOf = (index: number, count: number): GroupPosition => {
  if (count === 1) return "only"
  if (index === 0) return "first"

  return index === count - 1 ? "last" : "middle"
}

export const resourceRows = (
  resources: ReadonlyArray<ScheduleResource>,
  groups: ReadonlyArray<ScheduleResourceGroup> = []
): ReadonlyArray<ResourceRow> => {
  const grouped = groups.reduce<
    ReadonlyArray<{ readonly group: ScheduleResourceGroup; readonly members: ReadonlyArray<ScheduleResource> }>
  >((done, group) => {
    const used = done.flatMap((entry) => entry.members.map((member) => member.id))
    const members = group.resourceIds
      .filter((id, index) => group.resourceIds.indexOf(id) === index && !used.includes(id))
      .flatMap((id) => resources.filter((resource) => resource.id === id))

    return members.length > 0 ? [...done, { group, members }] : done
  }, [])
  const used = grouped.flatMap((entry) => entry.members.map((member) => member.id))

  return [
    ...grouped.flatMap(({ group, members }) =>
      members.map((resource, index) => ({
        resource,
        group: Option.some({ group, position: positionOf(index, members.length), count: members.length })
      }))
    ),
    ...resources
      .filter((resource) => !used.includes(resource.id))
      .map((resource) => ({ resource, group: Option.none() }))
  ]
}

export type ResourceDay = ResourceRow & { readonly events: DayViewEvents }

export const resourcesDayEvents = (input: {
  readonly rows: ReadonlyArray<ResourceRow>
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly date: DateString
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly eventOverlapMode?: EventOverlapMode
}): ReadonlyArray<ResourceDay> =>
  input.rows.map((row) => ({
    ...row,
    events: dayViewEvents({ ...input, events: input.events.filter((event) => event.resourceId === row.resource.id) })
  }))

export type Overflow = {
  readonly start: number
  readonly end: number
  readonly hidden: number
  readonly events: ReadonlyArray<DayPositionedEvent>
}

export const overflows = (events: ReadonlyArray<DayPositionedEvent>, max: number): ReadonlyArray<Overflow> =>
  overlapClusters(events)
    .filter((cluster) => cluster.some((event) => event.position.column >= max))
    .map((cluster) => ({
      start: Math.min(...cluster.map((event) => event.position.top)),
      end: Math.max(...cluster.map((event) => event.position.top + event.position.height)),
      hidden: cluster.filter((event) => event.position.column >= max).length,
      events: cluster
    }))
