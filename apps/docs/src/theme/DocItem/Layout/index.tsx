import React from "react"
import Layout from "@theme-original/DocItem/Layout"
import { useDoc } from "@docusaurus/plugin-content-docs/client"
import { ComponentPage } from "@site/src/components/ComponentPage"
import type { PageMatter } from "@site/src/components/ComponentPage"

const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined)

const texts = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

const isComponentPage = (frontMatter: Readonly<Record<string, unknown>>): boolean =>
  text(frontMatter["status"]) !== undefined

export default function LayoutWrapper(props: React.ComponentProps<typeof Layout>) {
  const { frontMatter, metadata } = useDoc()
  const fields: Readonly<Record<string, unknown>> = frontMatter
  if (!isComponentPage(fields)) return <Layout {...props} />
  const matter: PageMatter = {
    title: metadata.title,
    description: text(fields["description"]),
    status: text(fields["status"]),
    ticket: text(fields["ticket"]),
    files: texts(fields["files"]),
    ...(text(metadata.editUrl) === undefined ? {} : { editUrl: text(metadata.editUrl) })
  }

  return (
    <ComponentPage matter={matter}>
      <Layout {...props} />
    </ComponentPage>
  )
}
