// START_MODULE_CONTRACT
//   PURPOSE: Be the browser-safe main entry of the agent Pack and re-export exactly the names of the Pack contract.
//   SCOPE: Re-exports only. It never exports mcp.ts or client.ts, which are Bun-only and live in their own entries, and it imports no process, Bun, node or effect/ai module.
//   DEPENDS: M-PACK-AGENT
//   LINKS: M-PACK-AGENT, V-M-PACK-AGENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   AGENT_TOOL_TYPE - the relation type id that exposes a capability as a tool
//   AgentTool - the agent relation type
//   AgentSemantics - the telos.agent extension
//   AgentInterface - the archetype that checks an agent interface Locus
//   TOOL_NAME_PATTERN - the pattern of a valid tool name
//   deriveTools - the tools of an agent Locus
//   callTool - calls a tool of an agent Locus through the kernel
//   toToolResult - turns an invocation outcome into a tool result
//   toolInputSchema - turns a JSON Schema document into an MCP object input schema
//   introspectionTools - the six introspection tools of a Telos service
//   INTROSPECTION_TOOL_NAMES - the names of the introspection tools
//   ToolDefinition - the MCP definition of a tool
//   ToolAnnotations - the MCP annotations of a tool
//   ToolResult - the result of a tool call
//   DerivedTool - a tool derived from one exposed capability
//   IntrospectionTool - one introspection tool
// END_MODULE_MAP

export {
  AGENT_TOOL_TYPE,
  TOOL_NAME_PATTERN,
  callTool,
  deriveTools,
  toToolResult,
  toolInputSchema,
} from "./tools";
export type {
  DerivedTool,
  ToolAnnotations,
  ToolDefinition,
  ToolResult,
} from "./tools";
export { AgentSemantics, AgentTool } from "./semantics";
export { AgentInterface } from "./archetype";
export {
  INTROSPECTION_TOOL_NAMES,
  introspectionTools,
} from "./introspection-tools";
export type { IntrospectionTool } from "./introspection-tools";
