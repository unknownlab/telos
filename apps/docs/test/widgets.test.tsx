// START_MODULE_CONTRACT
//   PURPOSE: Prove the theme toggle, the search dialog and results, and the Mermaid renderer render the required markup, and that Mermaid is configured strictly and imported lazily.
//   SCOPE: ThemeToggle, SearchDialog (closed), SearchResults in each status, MermaidRenderer (renders nothing), MERMAID_CONFIG, and a source scan of src/ for the Mermaid and innerHTML rules.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SRC_DIR - the src directory of the docs app
//   sourceFiles - every TypeScript source file under src, as repository-relative path and text
//   buttonTag - the opening tag of the button whose data-theme-choice is the given choice
//   searchAnchors - the inner markup of each search result link
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { MermaidRenderer } from "@/components/mermaid-renderer";
import { SearchDialog } from "@/components/search-dialog";
import { SearchResults } from "@/components/search-results";
import { ThemeToggle } from "@/components/theme-toggle";
import { MERMAID_CONFIG, MERMAID_SELECTOR } from "@/lib/diagrams";

const SRC_DIR = resolve(import.meta.dir, "../src");

function sourceFiles(): Array<{
  readonly path: string;
  readonly text: string;
}> {
  return readdirSync(SRC_DIR, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => ({
      path: relative(SRC_DIR, join(SRC_DIR, name)),
      text: readFileSync(join(SRC_DIR, name), "utf8"),
    }));
}

function buttonTag(html: string, choice: string): string {
  const tag = [...html.matchAll(/<button\b[^>]*>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(`data-theme-choice="${choice}"`));
  if (tag === undefined) throw new Error(`no theme button for ${choice}`);
  return tag;
}

function searchAnchors(html: string): string[] {
  return [
    ...html.matchAll(/<a\b[^>]*data-search-result[^>]*>([\s\S]*?)<\/a>/g),
  ].map((match) => match[1] ?? "");
}

describe("MERMAID_CONFIG", () => {
  test("renders strictly and never on load", () => {
    expect(MERMAID_CONFIG.securityLevel).toBe("strict");
    expect(MERMAID_CONFIG.startOnLoad).toBe(false);
  });

  test("selects only the code blocks that the content pipeline writes for mermaid", () => {
    expect(MERMAID_SELECTOR).toBe("pre > code.language-mermaid");
  });
});

describe("Mermaid is strict and lazy (source scan)", () => {
  test("securityLevel is set only in the diagrams configuration", () => {
    const owners = sourceFiles()
      .filter((file) => file.text.includes("securityLevel"))
      .map((file) => file.path);
    expect(owners).toEqual(["lib/diagrams.ts"]);
  });

  test("the renderer never names the loose or sandbox levels", () => {
    const renderer = sourceFiles().find(
      (file) => file.path === "components/mermaid-renderer.tsx",
    );
    if (renderer === undefined) throw new Error("the renderer must exist");
    expect(renderer.text).not.toContain("loose");
    expect(renderer.text).not.toContain("sandbox");
  });

  test("mermaid is imported only dynamically, and only by the renderer", () => {
    const files = sourceFiles();
    const staticImports = files.filter((file) =>
      /from\s+["']mermaid["']/.test(file.text),
    );
    expect(staticImports.map((file) => file.path)).toEqual([]);
    const dynamicImports = files
      .filter((file) => file.text.includes('import("mermaid")'))
      .map((file) => file.path);
    expect(dynamicImports).toEqual(["components/mermaid-renderer.tsx"]);
  });

  test("no component uses innerHTML or dangerouslySetInnerHTML for search or theme", () => {
    for (const file of sourceFiles()) {
      if (!/search|theme/.test(file.path)) continue;
      expect(file.text).not.toContain("dangerouslySetInnerHTML");
      expect(file.text).not.toContain("innerHTML");
    }
  });
});

describe("MermaidRenderer", () => {
  test("renders nothing in the page itself", () => {
    expect(renderToStaticMarkup(<MermaidRenderer />)).toBe("");
  });
});

describe("ThemeToggle", () => {
  const html = renderToStaticMarkup(<ThemeToggle />);

  test("is a labelled group", () => {
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Theme"');
  });

  test("has one button per choice with its label", () => {
    expect(buttonTag(html, "light")).toContain('aria-label="Light theme"');
    expect(buttonTag(html, "dark")).toContain('aria-label="Dark theme"');
    expect(buttonTag(html, "system")).toContain('aria-label="System theme"');
  });

  test("marks only the system choice as pressed before the stored choice is read", () => {
    expect(buttonTag(html, "system")).toContain('aria-pressed="true"');
    expect(buttonTag(html, "light")).toContain('aria-pressed="false"');
    expect(buttonTag(html, "dark")).toContain('aria-pressed="false"');
  });
});

describe("SearchDialog", () => {
  const html = renderToStaticMarkup(<SearchDialog />);

  test("renders the trigger with its shortcuts", () => {
    const trigger = [...html.matchAll(/<button\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => tag.includes('data-slot="search-trigger"'));
    expect(trigger).toBeDefined();
    expect(trigger).toContain('aria-keyshortcuts="/ Control+K Meta+K"');
  });

  test("does not render the dialog content while closed", () => {
    expect(html).not.toContain("Titles, summaries and text of every page.");
    expect(html).not.toContain("Search the documentation");
  });
});

describe("SearchResults", () => {
  test("renders one link per hit, with the hit id as href and the route as a data attribute", () => {
    const html = renderToStaticMarkup(
      <SearchResults
        query="x"
        status="ready"
        hits={[
          { id: "/a#x", route: "/a", docTitle: "A", heading: "X" },
          { id: "/b", route: "/b", docTitle: "B", heading: "" },
        ]}
      />,
    );
    expect(html).toContain('data-slot="search-results"');
    expect(html).toContain('href="/a#x"');
    expect(html).toContain('data-search-result="/a"');
    expect(html).toContain('href="/b"');
    expect(html).toContain('data-search-result="/b"');
  });

  test("shows a heading only when it is not empty", () => {
    const html = renderToStaticMarkup(
      <SearchResults
        query="x"
        status="ready"
        hits={[
          { id: "/a#x", route: "/a", docTitle: "A", heading: "Section X" },
          { id: "/b", route: "/b", docTitle: "B", heading: "" },
        ]}
      />,
    );
    const [first, second] = searchAnchors(html);
    expect(first).toContain("Section X");
    expect(second).not.toContain("text-muted-foreground");
    expect(second).toContain("B");
  });

  test("reports no results with the query", () => {
    const html = renderToStaticMarkup(
      <SearchResults query="zzz" status="ready" hits={[]} />,
    );
    expect(html).toContain("No results for “zzz”.");
  });

  test("reports loading", () => {
    const html = renderToStaticMarkup(
      <SearchResults query="x" status="loading" hits={[]} />,
    );
    expect(html).toContain("Loading the index…");
  });

  test("reports an error", () => {
    const html = renderToStaticMarkup(
      <SearchResults query="x" status="error" hits={[]} />,
    );
    expect(html).toContain("Search is unavailable.");
  });
});
