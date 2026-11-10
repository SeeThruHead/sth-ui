import React from "react"
import TOC from "@theme-original/TOC"
import styles from "./styles.module.css"

export default function TOCWrapper(props: React.ComponentProps<typeof TOC>) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Table of contents</div>
      <TOC {...props} />
    </div>
  )
}
