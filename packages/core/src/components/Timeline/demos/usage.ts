import type { Html, HtmlBuilder } from "foldkit/html"
import { ChatCircleDotsIcon } from "@sth-ui/icons/icons/ChatCircleDotsIcon.ts"
import { GitBranchIcon } from "@sth-ui/icons/icons/GitBranchIcon.ts"
import { GitCommitIcon } from "@sth-ui/icons/icons/GitCommitIcon.ts"
import { GitPullRequestIcon } from "@sth-ui/icons/icons/GitPullRequestIcon.ts"
import type { TimelineItem } from "../Timeline.ts"
import type { Ui } from "../../../Ui.ts"

const link = <M>(h: HtmlBuilder<M>, ui: Ui, text: string) =>
  ui.Text(h, { component: "span", inherit: true, children: [text] })

const dimmed = <M>(h: HtmlBuilder<M>, ui: Ui, children: ReadonlyArray<string | Html>) =>
  ui.Text(h, { c: "dimmed", size: "sm", children })

const when = <M>(h: HtmlBuilder<M>, ui: Ui, text: string) => ui.Text(h, { size: "xs", mt: 4, children: [text] })

const items = <M>(h: HtmlBuilder<M>, ui: Ui): ReadonlyArray<TimelineItem> => [
  {
    title: "New branch",
    bullet: GitBranchIcon(h, { size: 13 }),
    children: [
      dimmed(h, ui, ["You've created new branch ", link(h, ui, "fix-notifications"), " from master"]),
      when(h, ui, "2 hours ago")
    ]
  },
  {
    title: "Commits",
    bullet: GitCommitIcon(h, { size: 13 }),
    children: [
      dimmed(h, ui, ["You've pushed 23 commits to ", link(h, ui, "fix-notifications"), " branch"]),
      when(h, ui, "52 minutes ago")
    ]
  },
  {
    title: "Pull request",
    bullet: GitPullRequestIcon(h, { size: 13 }),
    lineVariant: "dashed",
    children: [
      dimmed(h, ui, ["You've submitted a pull request ", link(h, ui, "Fix incorrect notification message (#187)")]),
      when(h, ui, "34 minutes ago")
    ]
  },
  {
    title: "Code review",
    bullet: ChatCircleDotsIcon(h, { size: 13 }),
    children: [
      dimmed(h, ui, [link(h, ui, "Robert Gluesticker"), " left a code review on your pull request"]),
      when(h, ui, "12 minutes ago")
    ]
  }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Timeline(h, { active: 1, bulletSize: 24, lineWidth: 2, maw: 360, items: items(h, ui) })
