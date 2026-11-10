import * as Animation from "@foldkit/ui/animation"
import * as FoldkitMenu from "@foldkit/ui/menu"
import { Story } from "foldkit/test"

export const menuOpened = (generation = 1) =>
  Story.Command.resolveAll(
    [FoldkitMenu.FocusItems, FoldkitMenu.Message.CompletedFocusItems()],
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation })]
  )

export const menuClosed = (generation = 2) =>
  Story.Command.resolveAll(
    [FoldkitMenu.FocusButton, FoldkitMenu.Message.CompletedFocusButton()],
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [
      FoldkitMenu.DetectMovementOrAnimationEnd,
      FoldkitMenu.Message.GotAnimationMessage({ message: Animation.Message.EndedAnimation({ generation }) })
    ]
  )
