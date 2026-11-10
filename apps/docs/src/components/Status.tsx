import React from "react"
import styles from "./Site.module.css"

const labels: Readonly<Record<string, string>> = {
  planned: "Planned",
  building: "Building",
  built: "Built, waiting for review",
  "signed off": "Signed off"
}

export const Status = ({ status, ticket }: { readonly status: string; readonly ticket: string }) => (
  <p className={styles.status} data-status={status}>
    <strong>{labels[status] ?? status}</strong>
    <span> · ticket {ticket}</span>
  </p>
)
