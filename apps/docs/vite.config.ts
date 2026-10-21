// START_MODULE_CONTRACT
//   PURPOSE: Build the documentation site as static HTML, with one prerendered page for every content document and every app page.
//   SCOPE: The Vite configuration: Tailwind, the TanStack Start plugin with its prerender list read from content.json, the React plugin and the @/ path alias.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   default - the Vite configuration of the docs app
// END_MODULE_MAP

import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { ContentFile } from "./src/lib/content-types";
import { prerenderPaths } from "./src/lib/prerender";

function readContent(): ContentFile {
  const url = new URL("./src/generated/content.json", import.meta.url);
  try {
    return JSON.parse(readFileSync(url, "utf8")) as ContentFile;
  } catch (cause) {
    throw new Error(
      "apps/docs/src/generated/content.json is missing or unreadable; run `bun run content` first",
      { cause },
    );
  }
}

// START_CONTRACT: default
//   PURPOSE: Configure the build so that every content route and app page is prerendered, and a route that is listed but missing fails the build.
//   INPUTS: none (reads src/generated/content.json at configuration time)
//   OUTPUTS: { UserConfig - the Vite configuration }
//   SIDE_EFFECTS: reads src/generated/content.json
//   LINKS: M-DOCS-SITE
// END_CONTRACT: default
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // crawlLinks stays false: nav links to routes that later WPs add must not fail this build.
      // autoStaticPathsDiscovery stays false: the route tree would add the trailing-slash index
      // paths (/principles/ and so on), and only the pages listed below are prerendered.
      prerender: {
        enabled: true,
        crawlLinks: false,
        failOnError: true,
        autoStaticPathsDiscovery: false,
      },
      pages: prerenderPaths(readContent()).map((path) => ({ path })),
    }),
    viteReact(),
  ],
});
