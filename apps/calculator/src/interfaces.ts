import { AgentSemantics, AgentTool } from "@telos/agent";
import { CliCommand, CliSemantics } from "@telos/cli";
import { CapabilityRef, Locus, type LocusDefinition } from "@telos/kernel";
import { WebForm, WebSemantics } from "@telos/web";
import { arithmetic } from "./arithmetic";

const ALL_OPERATIONS = ["add", "subtract", "multiply", "divide"] as const;

const cliFor = (
  target: LocusDefinition,
  names: ReadonlyArray<string>,
): LocusDefinition =>
  Locus.extend(CliSemantics).make({
    //@unknownhero NOT allways use global locus. Locus must be used once on high level, like AppLocus = Locus.create, and then if we need nested locus its must be AppLocus.newLocus() and then compose/extend, so we always have ctx of all app.
    id: "calculator:cli",
    description: "The calculator command line.",
    properties: { program: "calculator" },
    relations: names.map((name) =>
      //@unknownhero do we need it ?
      CliCommand.to(CapabilityRef.make(target.id, name)),
    ),
  });

const webFor = (
  target: LocusDefinition,
  names: ReadonlyArray<string>,
): LocusDefinition =>
  Locus.extend(WebSemantics).make({
    id: "calculator:web",
    description: "The calculator web page.",
    properties: { title: "Calculator" },
    relations: names.map((name) =>
      WebForm.to(CapabilityRef.make(target.id, name)),
    ),
  });

const agentFor = (
  target: LocusDefinition,
  names: ReadonlyArray<string>,
): LocusDefinition =>
  Locus.extend(AgentSemantics).make({
    id: "calculator:agent",
    description: "The calculator agent tools.",
    properties: { server: "telos-calculator" },
    relations: names.map((name) =>
      AgentTool.to(CapabilityRef.make(target.id, name)),
    ),
  });

export const calculatorCli = cliFor(arithmetic, ALL_OPERATIONS);

export const calculatorWeb = webFor(arithmetic, ALL_OPERATIONS);

export const calculatorAgent = agentFor(arithmetic, ALL_OPERATIONS);

export function interfaceLoci(
  target: LocusDefinition,
  names: ReadonlyArray<string> = ALL_OPERATIONS,
): ReadonlyArray<LocusDefinition> {
  return [
    cliFor(target, names),
    webFor(target, names),
    agentFor(target, names),
  ];
}
