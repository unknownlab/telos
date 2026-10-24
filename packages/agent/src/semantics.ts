// START_MODULE_CONTRACT
//   PURPOSE: Declare the agent relation type and the agent extension that a Pack adds to the kernel.
//   SCOPE: AgentTool and AgentSemantics, the only place that builds the relation type and the extension. Out: the derivation of tools (tools.ts) and the rules (archetype.ts).
//   DEPENDS: M-PACK-AGENT, M-KERNEL-API
//   LINKS: M-PACK-AGENT, V-M-PACK-AGENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   AgentTool - the relation type that exposes a capability as an agent tool
//   AgentSemantics - the extension that marks a Locus as an agent tool interface
// END_MODULE_MAP

import { Schema } from "effect";
import { Extension, RelationType } from "@telos/kernel";
import { AgentInterface } from "./archetype";
import { AGENT_EXTENSION_ID, AGENT_TOOL_TYPE } from "./tools";

// START_CONTRACT: AgentTool
//   PURPOSE: The relation type "agent.tool" from an agent interface Locus to a capability; it grants invocation.
//   INPUTS: {}
//   OUTPUTS: { RelationType<"agent.tool"> - target capability, grantsInvocation true }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: AgentTool
export const AgentTool: RelationType<"agent.tool"> = RelationType.make(
  AGENT_TOOL_TYPE,
  {
    description:
      "Exposes the target capability as an agent tool named after the capability.",
    target: "capability",
    grantsInvocation: true,
  },
);

// START_CONTRACT: AgentSemantics
//   PURPOSE: The extension telos.agent with its server name property, the AgentTool relation type and the AgentInterface archetype.
//   INPUTS: {}
//   OUTPUTS: { Extension<"telos.agent", { server: string }> }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: AgentSemantics
export const AgentSemantics = Extension.make(AGENT_EXTENSION_ID, {
  description:
    "Marks a Locus as an agent tool interface. Its `server` is the MCP server name.",
  properties: { server: Schema.String },
  relationTypes: [AgentTool],
  archetypes: [AgentInterface],
});
