import type { Html, HtmlBuilder } from "foldkit/html"
import { BellIcon } from "@sth-ui/icons/icons/BellIcon.ts"
import { CalendarIcon } from "@sth-ui/icons/icons/CalendarIcon.ts"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { GaugeIcon } from "@sth-ui/icons/icons/GaugeIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import { HouseIcon } from "@sth-ui/icons/icons/HouseIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import { TrashIcon } from "@sth-ui/icons/icons/TrashIcon.ts"
import { UserIcon } from "@sth-ui/icons/icons/UserIcon.ts"
import type { Icon } from "@sth-ui/icons/Icon.ts"
import type { Ui } from "../../Ui.ts"

const gallery: ReadonlyArray<readonly [string, Icon]> = [
  ["House", HouseIcon],
  ["Gauge", GaugeIcon],
  ["Image", ImageIcon],
  ["Chat", ChatCircleIcon],
  ["Settings", GearSixIcon],
  ["Search", MagnifyingGlassIcon],
  ["Calendar", CalendarIcon],
  ["Notifications", BellIcon],
  ["User", UserIcon],
  ["Favourite", HeartIcon],
  ["Star", StarIcon],
  ["Delete", TrashIcon]
]

const tile = <M>(h: HtmlBuilder<M>, ui: Ui, label: string, view: ReturnType<Icon>) =>
  ui.Stack(h, {
    gap: 6,
    align: "center",
    w: 88,
    children: [view, ui.Text(h, { size: "xs", c: "dimmed", children: [label] })]
  })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    maw: 640,
    gap: "md",
    children: gallery.map(([label, icon]) => tile(h, ui, label, icon(h, { size: 28, label })))
  })
