// START_MODULE_CONTRACT
//   PURPOSE: Serve the fixture model over MCP stdio so that the subprocess tests can talk to a real server.
//   SCOPE: One top-level call to serveMcp with the fixture root and the example agent. Out: any protocol logic, which mcp.ts owns.
//   DEPENDS: M-PACK-AGENT-MCP, M-PACK-AGENT
//   LINKS: V-M-PACK-AGENT-MCP
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { root } from "./fixture";
import { serveMcp } from "../src/mcp";

await serveMcp(root, "example:agent", { version: "0.0.0" });
