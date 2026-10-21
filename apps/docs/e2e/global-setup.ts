// START_MODULE_CONTRACT
//   PURPOSE: Stop the browser suites before they start when the static build is missing, with the same instruction the static server gives, so that no suite runs against nothing.
//   SCOPE: The global setup of the Playwright run: the presence of dist/client/index.html, dist/client/index.json and dist/client/not-found/index.html. Out: building the site.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   default - the global setup that fails fast when the build output is missing
// END_MODULE_MAP

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REQUIRED_FILES: ReadonlyArray<string> = [
  "../dist/client/index.html",
  "../dist/client/index.json",
  "../dist/client/not-found/index.html",
];

// START_CONTRACT: default
//   PURPOSE: Check that every file the suites read from the build exists, and throw with the build instruction when one does not.
//   INPUTS: none
//   OUTPUTS: { Promise<void> - resolves when the build output is present }
//   SIDE_EFFECTS: reads file existence under apps/docs/dist/client
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: default
export default async function globalSetup(): Promise<void> {
  for (const relative of REQUIRED_FILES) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    if (!existsSync(path)) {
      throw new Error(
        `${path} is missing. Build first: bun run --cwd apps/docs build`,
      );
    }
  }
}
