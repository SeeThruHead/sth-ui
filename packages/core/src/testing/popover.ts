import * as Animation from "@foldkit/ui/animation"
import * as Popover from "@foldkit/ui/popover"
import { Story } from "foldkit/test"

export const popoverOpened = (generation = 1) =>
  Story.Command.resolveAll(
    [Popover.FocusPanel, Popover.Message.CompletedFocusPanel()],
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation })]
  )

export const popoverClosed = (generation = 2) =>
  Story.Command.resolveAll(
    [Popover.FocusButton, Popover.Message.CompletedFocusButton()],
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [
      Popover.DetectMovementOrAnimationEnd,
      Popover.Message.GotAnimationMessage({ message: Animation.Message.EndedAnimation({ generation }) })
    ]
  )
