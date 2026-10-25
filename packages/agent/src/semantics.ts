import { Schema } from "effect";
import { Extension, RelationType } from "@telos/kernel";
import { AgentInterface } from "./archetype";
import { AGENT_EXTENSION_ID, AGENT_TOOL_TYPE } from "./tools";

export const AgentTool: RelationType<"agent.tool"> = RelationType.make(
  AGENT_TOOL_TYPE,
  {
    description:
      "Exposes the target capability as an agent tool named after the capability.",
    target: "capability",
    grantsInvocation: true,
  },
);

export const AgentSemantics = Extension.make(AGENT_EXTENSION_ID, {
  description:
    "Marks a Locus as an agent tool interface. Its `server` is the MCP server name.",
  properties: { server: Schema.String },
  relationTypes: [AgentTool],
  archetypes: [AgentInterface],
});
