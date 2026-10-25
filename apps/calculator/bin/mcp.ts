import { join } from "node:path";
import { serveMcp } from "@telos/agent/mcp";
import { app } from "../src/index";

const pkg = await Bun.file(join(import.meta.dir, "../package.json")).json();
await serveMcp(app, "calculator:agent", { version: pkg.version });
