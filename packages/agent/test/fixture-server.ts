import { root } from "./fixture";
import { serveMcp } from "../src/mcp";

await serveMcp(root, "example:agent", { version: "0.0.0" });
