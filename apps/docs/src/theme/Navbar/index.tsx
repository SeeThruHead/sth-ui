import React from "react"
import Navbar from "@theme-original/Navbar"
import Link from "@docusaurus/Link"
import { useLocation } from "@docusaurus/router"
import styles from "./styles.module.css"

type Section = { readonly label: string; readonly to: string; readonly prefixes: ReadonlyArray<string> }

const sections: ReadonlyArray<Section> = [
  { label: "Get started", to: "/", prefixes: ["/icons"] },
  { label: "Theming & Styles", to: "/theming/theme", prefixes: ["/theming", "/styling"] },
  { label: "Components", to: "/layout/app-shell", prefixes: [] }
]

const sectionOf = (path: string): string => {
  if (path === "/") return "Get started"
  const found = sections.find((section) => section.prefixes.some((prefix) => path.startsWith(prefix)))

  return found?.label ?? "Components"
}

export default function NavbarWrapper(props: React.ComponentProps<typeof Navbar>) {
  const active = sectionOf(useLocation().pathname)

  return (
    <div className={styles.header}>
      <Navbar {...props} />
      <nav className={styles.sections} aria-label="Sections">
        {sections.map((section) => (
          <Link
            key={section.label}
            to={section.to}
            className={styles.section}
            data-active={section.label === active ? "" : undefined}
            aria-current={section.label === active ? "page" : undefined}
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
