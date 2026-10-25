import { Effect } from "effect";
import {
  Archetype,
  Rule,
  outgoing,
  violation,
  type RuleContext,
} from "@telos/kernel";
import {
  AGENT_EXTENSION_ID,
  AGENT_TOOL_TYPE,
  TOOL_NAME_PATTERN,
  callTool,
  deriveTools,
  exposedRelations,
} from "./tools";
import { INTROSPECTION_TOOL_NAMES } from "./introspection-tools";

export const AgentInterface: Archetype = Archetype.make({
  id: "telos.agent.interface",
  description:
    "Checks that an agent interface Locus exposes uniquely named tools with object inputs that reject invalid input.",
  appliesTo: [AGENT_EXTENSION_ID],
  rules: [
    Rule.make({
      id: "agent.tools-exist",
      description: "The interface exposes at least one tool.",
      method: "static",
      check: (ctx: RuleContext) =>
        exposedRelations(ctx.model, ctx.locus.id).length > 0
          ? Effect.void
          : violation(`Agent Locus ${ctx.locus.id} exposes no tool.`),
    }),
    Rule.make({
      id: "agent.tool-names",
      description:
        "Every tool name is valid, unique and not reserved for introspection.",
      method: "static",
      check: (ctx: RuleContext) => {
        const seen = new Set<string>();
        const raw = outgoing(ctx.model, ctx.locus.id).filter(
          (r) =>
            r.valid &&
            r.type.id === AGENT_TOOL_TYPE &&
            r.target.capability !== null,
        );
        for (const relation of raw) {
          const name = relation.target.capability ?? "";
          if (!TOOL_NAME_PATTERN.test(name))
            return violation(`Tool name ${name} is not valid.`);
          if (INTROSPECTION_TOOL_NAMES.includes(name))
            return violation(
              `Tool name ${name} is reserved for introspection.`,
            );
          if (seen.has(name))
            return violation(`Tool ${name} is exposed more than once.`);
          seen.add(name);
        }
        return Effect.void;
      },
    }),
    Rule.make({
      id: "agent.input-object",
      description: "Every tool takes an object input.",
      method: "static",
      check: (ctx: RuleContext) =>
        Effect.gen(function* () {
          const tools = yield* deriveTools(ctx.model, ctx.locus.id);
          for (const tool of tools) {
            const schema = tool.definition.inputSchema as { type?: unknown };
            if (schema.type !== "object")
              return yield* violation(
                `Tool ${tool.definition.name} does not take an object input.`,
              );
          }
        }),
    }),
    Rule.make({
      id: "agent.invalid-input-error",
      description:
        "Every tool with a required field answers missing input with InvalidInput.",
      method: "execution",
      check: (ctx: RuleContext) =>
        Effect.gen(function* () {
          const tools = yield* deriveTools(ctx.model, ctx.locus.id);
          for (const tool of tools) {
            const required = (
              tool.definition.inputSchema as { required?: unknown }
            ).required;
            if (!Array.isArray(required) || required.length === 0) continue;
            const result = yield* callTool(
              ctx.model,
              ctx.locus.id,
              tool.definition.name,
              {},
            );
            const error = result.structured["error"] as
              { readonly tag?: unknown } | undefined;
            if (!result.isError || error?.tag !== "InvalidInput")
              return yield* violation(
                `Tool ${tool.definition.name} does not answer missing input with InvalidInput.`,
              );
          }
        }),
    }),
  ],
});
