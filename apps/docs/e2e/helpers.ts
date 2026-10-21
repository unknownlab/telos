// START_MODULE_CONTRACT
//   PURPOSE: Give the browser suites the built index of the site, read from disk, and a page error collector that fails a suite on any error the site logs.
//   SCOPE: The index types, readIndexFile and readIndex (dist/client/index.json), docBySource, trackPageErrors and caretToEnd. Out: the assertions of each suite.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   IndexDocument - one document of dist/client/index.json
//   IndexFile - the whole of dist/client/index.json
//   readIndexFile - reads and parses dist/client/index.json from disk
//   readIndex - the documents of dist/client/index.json, in the order the file has them
//   docBySource - the document whose repository source path is given
//   trackPageErrors - collects page errors and console errors from a page, and returns the check that fails on any of them
//   caretToEnd - focuses a text field and places the caret after its last character, so that real key presses append to it
// END_MODULE_MAP

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page } from "@playwright/test";

/** One document of dist/client/index.json. */
export interface IndexDocument {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly status: string;
  readonly maturity: string;
  readonly summary: string;
  readonly related: ReadonlyArray<string>;
  readonly url: string;
  readonly source: string;
}

/** The whole of dist/client/index.json. */
export interface IndexFile {
  readonly version: number;
  readonly generatedFrom: { readonly commit: string; readonly dirty: boolean };
  readonly documents: ReadonlyArray<IndexDocument>;
}

const INDEX_PATH = fileURLToPath(
  new URL("../dist/client/index.json", import.meta.url),
);

// START_CONTRACT: readIndexFile
//   PURPOSE: Read the built index from disk, so that the suites compare the served files with the build output itself.
//   INPUTS: none
//   OUTPUTS: { IndexFile - the parsed index file }
//   SIDE_EFFECTS: reads dist/client/index.json
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: readIndexFile
export function readIndexFile(): IndexFile {
  return JSON.parse(readFileSync(INDEX_PATH, "utf8")) as IndexFile;
}

// START_CONTRACT: readIndex
//   PURPOSE: Give the documents of the built index, which every suite iterates over.
//   INPUTS: none
//   OUTPUTS: { ReadonlyArray<IndexDocument> - the documents of dist/client/index.json }
//   SIDE_EFFECTS: reads dist/client/index.json
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: readIndex
export function readIndex(): ReadonlyArray<IndexDocument> {
  return readIndexFile().documents;
}

// START_CONTRACT: docBySource
//   PURPOSE: Find a document by its repository source path, so that the suites never hard-code a route.
//   INPUTS: { source: string - the repository-relative source path }
//   OUTPUTS: { IndexDocument - the document; throws when no document has that source }
//   SIDE_EFFECTS: reads dist/client/index.json
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: docBySource
export function docBySource(source: string): IndexDocument {
  const found = readIndex().find((doc) => doc.source === source);
  if (found === undefined) {
    throw new Error(`no document in the build has the source ${source}`);
  }
  return found;
}

// START_CONTRACT: trackPageErrors
//   PURPOSE: Record every uncaught page error and every console error of a page, so that a suite can fail when the site logs an error.
//   INPUTS: { page: Page - the page to watch }
//   OUTPUTS: { () => void - a check that fails the test listing every recorded error; it passes when none was recorded }
//   SIDE_EFFECTS: attaches pageerror and console listeners to the page
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: trackPageErrors
export function trackPageErrors(page: Page): () => void {
  const problems: string[] = [];
  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(`console error: ${message.text()}`);
    }
  });
  return () => {
    expect(problems, "the page logged errors").toEqual([]);
  };
}

// START_CONTRACT: caretToEnd
//   PURPOSE: Put the caret after the last character of a text field, because Control+End and End do not reach the end of a multi-line field on every platform.
//   INPUTS: { field: Locator - a textarea or input }
//   OUTPUTS: { Promise<void> - resolves when the field has focus and its selection is at the end }
//   SIDE_EFFECTS: focuses the field and changes its selection; no text changes
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: caretToEnd
export async function caretToEnd(field: Locator): Promise<void> {
  await field.evaluate((element) => {
    if (
      !(element instanceof HTMLTextAreaElement) &&
      !(element instanceof HTMLInputElement)
    ) {
      throw new Error("caretToEnd needs a text field");
    }
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  });
}
