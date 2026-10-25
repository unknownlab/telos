// START_MODULE_CONTRACT
//   PURPOSE: Define the three interface Loci of the calculator (command line, web page and agent tools), each exposing the arithmetic capabilities through its own relation type.
//   SCOPE: The three interface Locus definitions and the interfaceLoci builder used by the calculator and by tests. It declares no capabilities and never implements an operation.
//   DEPENDS: M-CALC-ARITHMETIC, M-PACK-CLI, M-PACK-WEB, M-PACK-AGENT, M-KERNEL-API
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   calculatorCli - the calculator:cli Locus that exposes the four arithmetic capabilities as commands
//   calculatorWeb - the calculator:web Locus that exposes the four arithmetic capabilities as forms
//   calculatorAgent - the calculator:agent Locus that exposes the four arithmetic capabilities as tools
//   interfaceLoci - builds the three interface Loci for any arithmetic-like target
// END_MODULE_MAP

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

// START_CONTRACT: calculatorCli
//   PURPOSE: The command-line interface Locus of the calculator, exposing add, subtract, multiply and divide in that order.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - calculator:cli of kind Locus.extend(CliSemantics) with program "calculator" }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-INTERFACES
// END_CONTRACT: calculatorCli
export const calculatorCli = cliFor(arithmetic, ALL_OPERATIONS);

// START_CONTRACT: calculatorWeb
//   PURPOSE: The web interface Locus of the calculator, exposing add, subtract, multiply and divide in that order.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - calculator:web of kind Locus.extend(WebSemantics) with title "Calculator" }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-INTERFACES
// END_CONTRACT: calculatorWeb
export const calculatorWeb = webFor(arithmetic, ALL_OPERATIONS);

// START_CONTRACT: calculatorAgent
//   PURPOSE: The agent interface Locus of the calculator, exposing add, subtract, multiply and divide in that order.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - calculator:agent of kind Locus.extend(AgentSemantics) with server "telos-calculator" }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-INTERFACES
// END_CONTRACT: calculatorAgent
export const calculatorAgent = agentFor(arithmetic, ALL_OPERATIONS);

// START_CONTRACT: interfaceLoci
//   PURPOSE: Build the command-line, web and agent interface Loci for an arithmetic-like target, exposing the given capability names.
//   INPUTS: { target: LocusDefinition - the Locus that owns the capabilities; names: ReadonlyArray<string> - the capability names to expose, default all four }
//   OUTPUTS: { ReadonlyArray<LocusDefinition> - [calculator:cli, calculator:web, calculator:agent], each with one relation per name in order }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-INTERFACES
// END_CONTRACT: interfaceLoci
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
