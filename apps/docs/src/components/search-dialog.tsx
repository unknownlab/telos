// START_MODULE_CONTRACT
//   PURPOSE: Let the reader search every page from a button, the slash key or Ctrl/Meta+K, loading the search index only on the first open.
//   SCOPE: SearchDialog, the trigger button and the dialog with its input and results.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SearchDialog - the search trigger and the dialog over the documentation index
// END_MODULE_MAP

import { Search } from "lucide-react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SearchResults, type SearchStatus } from "@/components/search-results";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SearchHit } from "@/lib/search";
import { isSearchShortcut } from "@/lib/shortcuts";

type Searcher = (query: string) => SearchHit[];

// START_CONTRACT: SearchDialog
//   PURPOSE: Open the documentation search, run the query on each change, and open the first hit on Enter.
//   INPUTS: none
//   OUTPUTS: { JSX.Element - the trigger button, and the dialog when open }
//   SIDE_EFFECTS: listens for the search shortcut on the document; on the first open, fetches the search index chunk once; Enter navigates to the first hit
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SearchDialog
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searcher, setSearcher] = useState<Searcher | null>(null);
  const [failed, setFailed] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isSearchShortcut(event)) return;
      event.preventDefault();
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;
    // Both the loader and MiniSearch are imported here, so neither joins the page chunk.
    Promise.all([import("@/lib/search-load"), import("@/lib/search")])
      .then(([load, search]) =>
        load.loadSearchIndex().then(search.createSearch),
      )
      .then(
        (created) => setSearcher(() => created),
        () => setFailed(true),
      );
  }, [open]);

  const trimmed = query.trim();
  const hits = useMemo<SearchHit[]>(
    () => (searcher === null || trimmed === "" ? [] : searcher(trimmed)),
    [searcher, trimmed],
  );
  const status: SearchStatus = failed
    ? "error"
    : trimmed === ""
      ? "idle"
      : searcher === null
        ? "loading"
        : "ready";

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const first = hits[0];
    if (event.key === "Enter" && first !== undefined) {
      event.preventDefault();
      window.location.assign(first.id);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-slot="search-trigger"
          aria-keyshortcuts="/ Control+K Meta+K"
        >
          <Search aria-hidden="true" />
          <span>Search</span>
          <kbd className="rounded border px-1 font-mono text-xs text-muted-foreground">
            /
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Search</DialogTitle>
        <DialogDescription>
          Titles, summaries and text of every page.
        </DialogDescription>
        <Input
          type="search"
          aria-label="Search the documentation"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
        />
        <div className="max-h-[60vh] overflow-y-auto">
          <SearchResults query={query} hits={hits} status={status} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
