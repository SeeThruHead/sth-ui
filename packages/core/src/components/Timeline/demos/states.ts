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

const items = <M>(h: HtmlBuilder<M>, ui: Ui): ReadonlyArray<TimelineItem> => [
  {
    title: "New branch",
    bullet: GitBranchIcon(h, { size: 12 }),
    children: [dimmed(h, ui, ["You've created new branch ", link(h, ui, "fix-notifications"), " from master"])]
  },
  {
    title: "Commits",
    bullet: GitCommitIcon(h, { size: 12 }),
    children: [dimmed(h, ui, ["You've pushed 23 commits to ", link(h, ui, "fix-notifications"), " branch"])]
  },
  {
    title: "Pull request",
    bullet: GitPullRequestIcon(h, { size: 12 }),
    children: [
      dimmed(h, ui, ["You've submitted a pull request ", link(h, ui, "Fix incorrect notification message (#187)")])
    ]
  },
  {
    title: "Code review",
    bullet: ChatCircleDotsIcon(h, { size: 12 }),
    children: [dimmed(h, ui, [link(h, ui, "Robert Gluesticker"), " left a code review on your pull request"])]
  }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Timeline(h, {
        align: "right",
        active: 1,
        reverseActive: true,
        color: "yellow",
        autoContrast: true,
        radius: "sm",
        maw: 360,
        items: items(h, ui)
      }),
      ui.Timeline(h, {
        maw: 360,
        items: [
          {
            title: "Set by hand",
            active: true,
            lineActive: true,
            color: "grape",
            radius: 0,
            lineVariant: "dotted",
            children: []
          },
          { title: "Last", children: [] },
          {}
        ]
      })
    ]
  })
