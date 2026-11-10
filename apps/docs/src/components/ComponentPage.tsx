import React from "react"
import Link from "@docusaurus/Link"
import { useLocation } from "@docusaurus/router"
import { Props } from "./Props"
import { Status } from "./Status"
import { StylesApi } from "./StylesApi"
import styles from "./Site.module.css"

const repository = "https://github.com/SeeThruHead/sth-ui"

export type PageMatter = {
  readonly title: string
  readonly description?: string
  readonly status?: string
  readonly ticket?: string
  readonly files: ReadonlyArray<string>
  readonly editUrl?: string
}

type Tab = "docs" | "props" | "styles-api"

const tabs: ReadonlyArray<{ readonly id: Tab; readonly label: string; readonly icon: string }> = [
  { id: "docs", label: "Documentation", icon: "M6 3h9l5 5v13H6zM14 3v6h6M9 13h8M9 17h8" },
  { id: "props", label: "Props", icon: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" },
  { id: "styles-api", label: "Styles API", icon: "M4 6h16M4 12h16M4 18h16M9 4v4M15 10v4M7 16v4" }
]

const tabOf = (search: string): Tab => {
  const chosen = new URLSearchParams(search).get("tab")

  return tabs.find((tab) => tab.id === chosen)?.id ?? "docs"
}

const Icon = ({ path }: { readonly path: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Meta = ({ label, children }: { readonly label: string; readonly children: React.ReactNode }) => (
  <>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </>
)

const Header = ({ matter }: { readonly matter: PageMatter }) => (
  <header className={styles.pageHeader}>
    <h1 className={styles.pageTitle}>{matter.title}</h1>
    {matter.description === undefined ? null : <p className={styles.pageDescription}>{matter.description}</p>}
    <dl className={styles.pageMeta}>
      {matter.files.length === 0 ? null : (
        <Meta label="Source">
          <a href={`${repository}/blob/main/packages/core/src/${matter.files[0]}`}>View source code</a>
        </Meta>
      )}
      {matter.editUrl === undefined ? null : (
        <Meta label="Docs">
          <a href={matter.editUrl}>Edit this page</a>
        </Meta>
      )}
      <Meta label="Package">@sth-ui/core</Meta>
      {matter.status === undefined || matter.ticket === undefined ? null : (
        <Meta label="Status">
          <Status status={matter.status} ticket={matter.ticket} />
        </Meta>
      )}
    </dl>
  </header>
)

const TabBar = ({ active }: { readonly active: Tab }) => (
  <nav className={styles.pageTabs} aria-label="Page sections">
    {tabs.map((tab) => (
      <Link
        key={tab.id}
        to={tab.id === "docs" ? "?" : `?tab=${tab.id}`}
        className={styles.pageTab}
        data-active={tab.id === active ? "" : undefined}
        aria-current={tab.id === active ? "page" : undefined}
      >
        <Icon path={tab.icon} />
        {tab.label}
      </Link>
    ))}
  </nav>
)

const Panel = ({ tab, files }: { readonly tab: Tab; readonly files: ReadonlyArray<string> }) => (
  <div className={styles.pagePanel}>
    {tab === "props"
      ? files.map((file) => <Props key={file} file={file} />)
      : files.map((file) => <StylesApi key={file} file={file} />)}
  </div>
)

export const ComponentPage = ({
  matter,
  children
}: {
  readonly matter: PageMatter
  readonly children: React.ReactNode
}) => {
  const tab = tabOf(useLocation().search)
  const built = matter.files.length > 0

  return (
    <>
      <Header matter={matter} />
      {built ? <TabBar active={tab} /> : null}
      {tab === "docs" || !built ? children : <Panel tab={tab} files={matter.files} />}
    </>
  )
}
