import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "hooks-logic",
  include: ["src/**/*.test.ts"],
  covered: [
    "src/useOs/os.ts",
    "src/useValidatedState/validated.ts",
    "src/useQueue/queue.ts",
    "src/useStateHistory/history.ts",
    "src/useListState/list.ts",
    "src/useSelection/selection.ts",
    "src/useMediaQuery/mediaQuery.ts",
    "src/useColorScheme/colorScheme.ts",
    "src/useOrientation/orientation.ts",
    "src/useIdle/idle.ts",
    "src/useWindowEvent/windowEvent.ts",
    "src/shared/watch.ts",
    "src/useDocumentTitle/title.ts",
    "src/useFavicon/favicon.ts",
    "src/useHash/hash.ts",
    "src/useNetwork/network.ts",
    "src/useWindowScroll/scroll.ts",
    "src/useClipboard/clipboard.ts",
    "src/useLongPress/longPress.ts",
    "src/usePagination/pagination.ts",
    "src/useHeadroom/headroom.ts",
    "src/useLocalStorage/storage.ts",
    "src/useMove/scrub.ts",
    "src/useDrag/drag.ts",
    "src/useRovingIndex/roving.ts",
    "src/useScrollIntoView/scrollMath.ts",
    "src/useCollapse/collapse.ts"
  ],
  reportsDirectory: "coverage/logic"
})
