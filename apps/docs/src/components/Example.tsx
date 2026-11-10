import React, { useCallback, useEffect, useRef, useState } from "react"
import useBaseUrl from "@docusaurus/useBaseUrl"
import CodeBlock from "@theme/CodeBlock"
import { useColorMode } from "@docusaurus/theme-common"
import styles from "./Site.module.css"
import examples from "../examples.json"

const codes: Readonly<Record<string, string>> = examples

const collapsedLines = 14

const Code = ({ code }: { readonly code: string }) => {
  const [open, setOpen] = useState(false)
  const long = code.split("\n").length > collapsedLines
  const shut = long && !open

  return (
    <div className={styles.code} data-collapsed={shut ? "" : undefined}>
      <CodeBlock language="ts">{code}</CodeBlock>
      {long ? (
        <button type="button" className={styles.expand} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Collapse code" : "Expand code"}
        </button>
      ) : null}
    </div>
  )
}

type Choice = { readonly label: string; readonly options: ReadonlyArray<string> }

const choices: Readonly<Record<string, Choice>> = {
  theme: { label: "Theme", options: ["Mantine", "Grape", "Compact"] },
  scheme: { label: "Scheme", options: ["light", "dark"] },
  width: { label: "Width", options: ["desktop", "phone"] }
}

const Picker = ({
  name,
  value,
  choose
}: {
  readonly name: string
  readonly value: string
  readonly choose: (value: string) => void
}) => {
  const choice = choices[name]
  if (choice === undefined) return null

  return (
    <div className={styles.picker} role="radiogroup" aria-label={choice.label}>
      {choice.options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          className={option === value ? styles.pickOn : styles.pick}
          onClick={() => choose(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

const fitHeight = (frame: HTMLIFrameElement, body: HTMLElement) => {
  frame.style.height = `${Math.max(body.scrollHeight, 80)}px`
}

const observes = (view: Window | null): view is Window & typeof globalThis => view !== null && "ResizeObserver" in view

const followContent = (frame: HTMLIFrameElement): (() => void) => {
  const body = frame.contentDocument?.body
  const view = frame.contentWindow
  if (body === undefined || body === null) return () => undefined
  if (!observes(view)) return () => undefined
  const observer = new view.ResizeObserver(() => view.requestAnimationFrame(() => fitHeight(frame, body)))
  observer.observe(body)

  return () => observer.disconnect()
}

const storyFrame = process.env.NODE_ENV === "production" ? "/storybook/iframe" : "/storybook/iframe.html"

export type StoryArgs = Readonly<Record<string, string | number | boolean>>

const argText = (value: string | number | boolean): string =>
  typeof value === "boolean" ? `!${String(value)}` : String(value)

const urlArgs = (args: StoryArgs | undefined): string =>
  args === undefined
    ? ""
    : `&args=${Object.entries(args)
        .map(([name, value]) => `${name}:${encodeURIComponent(argText(value))}`)
        .join(";")}`

const sendArgs = (frame: HTMLIFrameElement | null, story: string, args: StoryArgs) =>
  frame?.contentWindow?.postMessage(
    {
      key: "storybook-channel",
      event: { type: "updateStoryArgs", args: [{ storyId: story, updatedArgs: args }], from: "manager" }
    },
    "*"
  )

export const Example = ({
  story,
  caption,
  height,
  args,
  code,
  children
}: {
  readonly story: string
  readonly caption?: string
  readonly height?: number
  readonly args?: StoryArgs
  readonly code?: string
  readonly children?: React.ReactNode
}) => {
  const [theme, setTheme] = useState("Mantine")
  const { colorMode } = useColorMode()
  const [scheme, setScheme] = useState<string>(colorMode)
  const [width, setWidth] = useState("desktop")
  const frame = useRef<HTMLIFrameElement>(null)
  const base = useBaseUrl(storyFrame)
  const [firstArgs] = useState(args)
  const source = `${base}?id=${story}&viewMode=story&embed=true&globals=theme:${theme};scheme:${scheme}${urlArgs(firstArgs)}`

  const stop = useRef<() => void>(() => undefined)
  const loaded = useCallback(() => {
    stop.current()
    if (frame.current === null || height !== undefined) return
    stop.current = followContent(frame.current)
  }, [height])

  useEffect(() => () => stop.current(), [])
  useEffect(() => setScheme(colorMode), [colorMode])
  useEffect(() => {
    if (args !== undefined) sendArgs(frame.current, story, args)
  }, [args, story])

  return (
    <figure className={styles.example}>
      <div className={styles.bar}>
        <figcaption>{caption ?? "Live example"}</figcaption>
        <div className={styles.pickers}>
          <Picker name="theme" value={theme} choose={setTheme} />
          <Picker name="scheme" value={scheme} choose={setScheme} />
          <Picker name="width" value={width} choose={setWidth} />
        </div>
      </div>
      <div className={children === undefined ? undefined : styles.configurator}>
        <div className={width === "phone" ? styles.phoneStage : styles.stage}>
          <iframe
            ref={frame}
            key={source}
            title={caption ?? story}
            className={width === "phone" ? styles.phone : styles.frame}
            src={source}
            style={height === undefined ? undefined : { height: `${height}px` }}
            onLoad={loaded}
          />
        </div>
        {children}
      </div>
      {code !== undefined ? <Code code={code} /> : codes[story] === undefined ? null : <Code code={codes[story]} />}
      <a className={styles.open} href={`${useBaseUrl("/storybook/")}?path=/story/${story}`}>
        Open in Storybook
      </a>
    </figure>
  )
}
