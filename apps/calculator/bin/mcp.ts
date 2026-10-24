// START_MODULE_CONTRACT
//   PURPOSE: Serve the calculator agent tools over MCP on stdio through the calculator:agent Locus.
//   SCOPE: Reads the package version and hands the app to serveMcp. It never defines a tool.
//   DEPENDS: M-CALC-INTERFACES, M-PACK-AGENT-MCP
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { join } from "node:path";
import { serveMcp } from "@telos/agent/mcp";
import { app } from "../src/index";

const pkg = await Bun.file(join(import.meta.dir, "../package.json")).json();
await serveMcp(app, "calculator:agent", { version: pkg.version });
