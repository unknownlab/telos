//@unknownhero wtf this comments ? Who need this shit ? just rmove comments everywhere

import { Effect } from "effect";
import { AgentSemantics, callTool } from "@telos/agent";
import { CliSemantics, runCli } from "@telos/cli";
import {
  Archetype,
  CapabilityRef,
  Extension,
  Locus,
  Purpose,
  Rule,
  buildModel,
  capabilityKey,
  describeCapability,
  invoke,
  jsonEqual,
  violation,
  type InvocationError,
  type InvocationOutcome,
  type LocusDefinition,
  type SemanticModel,
} from "@telos/kernel";
import { WebSemantics, formModel } from "@telos/web";
import { Arithmetic, arithmetic } from "./arithmetic";
import { calculatorAgent, calculatorCli, calculatorWeb } from "./interfaces";

//@unknownhero upper case is shit in any code, eliminate it. String is shit. Global variables is shit. Its must be structs/state machines. You can join some of this shit but dont make all purpose structs. Symbol > string. All must be branded types, not just primitives. Must use functional domain driven design, with vertical slice separation. Use lib https://github.com/typeonce-dev/effect-machine but dont make state machine as turing complete, its state machine.
const APP_EXTENSION_ID = "calculator.app";
const APP_PURPOSE =
  "Proves that one arithmetic implementation serves a command line, a web page and agent tools.";
//@unknownhero wtf is extensions ? its compositions, not extensions.
const INTERFACE_EXTENSIONS = [
  CliSemantics.id,
  WebSemantics.id,
  AgentSemantics.id,
];
//@unknownhero wtf is this ?? why ???
const NO_ARITHMETIC = "The app contains no arithmetic Locus.";

//@unknownhero not OR constructions, only branded types,its must be as normal type, not 10000 variants.
type Normalized =
  | { readonly ok: true; readonly output: unknown }
  | {
      readonly ok: false;
      readonly tag: string; //@unknownhero dont use tag and _tag, wrap it and never use it,its must be hidden from final interface
      readonly message: string; //@unknownhero to general name, its ok ?
      readonly paths: ReadonlyArray<string>;
    };

//@unknownhero  wtf is that ? to general name
interface ParityInput {
  readonly name: string;
  readonly text: Readonly<Record<string, string>>;
}

//@unknownhero real data must be returned by functions/effects. Not global scope. Use functional princaples. Split pure from side effects.
const PARITY_INPUTS: ReadonlyArray<ParityInput> = [
  { name: "add", text: { a: "2", b: "3" } },
  { name: "divide", text: { a: "1", b: "0" } },
  { name: "add", text: { a: "x", b: "1" } },
  { name: "multiply", text: { a: "1e308", b: "10" } },
];

//@unknownhero never use a,b,i,n and other shit names. use like smart. What a name of function?? make it part of state machine or struct, not this mess.
const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

//@unknownhero what is this ? why its not part of some state machine ?
const byId = (a: LocusDefinition, b: LocusDefinition): number =>
  byCodeUnit(a.id, b.id);

//@unknownhero dont like extensions and why its not in kernel ?
const hasExtension = (definition: LocusDefinition, id: string): boolean =>
  definition.kind.extensions.some((extension) => extension.id === id);
//@unknownhero bad
const namesOf = (definition: LocusDefinition): ReadonlyArray<string> =>
  Object.keys(definition.capabilities).sort(byCodeUnit);
//@unknownhero bad
const arithmeticOf = (
  contains: ReadonlyArray<LocusDefinition>,
): LocusDefinition | undefined =>
  contains.find((definition) => hasExtension(definition, Arithmetic.id));
//@unknownhero bad
const interfaceOf = (
  contains: ReadonlyArray<LocusDefinition>,
  extensionId: string,
): LocusDefinition | undefined =>
  contains.find((definition) => hasExtension(definition, extensionId));

//@unknownhero wtf is that ?
const normalize = (outcome: InvocationOutcome): Normalized =>
  outcome.ok
    ? { ok: true, output: outcome.output }
    : {
        ok: false,
        tag: outcome.error.tag,
        message: outcome.error.message,
        paths: outcome.error.issues
          .map((issue) => issue.path.join("."))
          .sort(byCodeUnit),
      };
//@unknownhero use effect shemas, not this direct validations
const jsonInput = (
  text: Readonly<Record<string, string>>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(text).map(([key, value]) => [
      key,
      Number.isFinite(Number(value)) ? Number(value) : value,
    ]),
  );

//@unknownhero effect have cli framework, use it
const argvOf = (input: ParityInput): ReadonlyArray<string> => [
  input.name,
  ...Object.entries(input.text).flatMap(([key, value]) => ["--" + key, value]),
];

//@unknownhero try to use pattern matching of effect ts, not this style
const cliOutcome = (
  model: SemanticModel,
  cliId: string,
  input: ParityInput,
): Effect.Effect<Normalized> =>
  Effect.gen(function* () {
    const result = yield* runCli(model, cliId, argvOf(input));
    if (result.exitCode === 0) {
      return { ok: true, output: JSON.parse(result.stdout) as unknown };
    }
    const error = JSON.parse(result.stderr) as InvocationError;
    return normalize({ ok: false, error });
  });

const webOutcome = (
  model: SemanticModel,
  webId: string,
  input: ParityInput,
): Effect.Effect<Normalized | null> =>
  Effect.gen(function* () {
    const webModel = yield* formModel(model, webId).pipe(
      Effect.catchTag("LocusNotFound", () => Effect.succeed(null)),
    );
    if (webModel === null) return null;
    const form = webModel.forms.find(
      (candidate) => candidate.name === input.name,
    );
    if (form === undefined) return null;
    return normalize(yield* form.submit(input.text));
  });

//@unknownhero i think we need to remove archetype system, just focus on only locus
export const CalculatorInterfaces = Archetype.make({
  id: "calculator.interfaces",
  description:
    "Checks that the calculator's interfaces are complete, share one implementation and agree with each other.",
  appliesTo: [APP_EXTENSION_ID], //@unknownhero  i dont like it, its must be composition, not extension like this, its not functional implementation. Think as functional one
  //@unknownhero first one, its must be not plain array with plain rules. Dont use ctx if its context, use full names, we not compression programmers.
  rules: [
    Rule.make({
      id: "interfaces.complete", //@unknownhero symbol ?
      description: "Every interface exposes every arithmetic capability.",
      method: "static",
      check: (ctx) =>
        Effect.gen(function* () {
          //@unknownhero too much deeps, its not readable and clear
          const arithmeticLocus = arithmeticOf(ctx.locus.contains);
          if (arithmeticLocus === undefined) {
            return yield* violation(NO_ARITHMETIC);
          }
          const interfaces = ctx.locus.contains
            .filter((definition) =>
              INTERFACE_EXTENSIONS.some((id) => hasExtension(definition, id)),
            )
            .sort(byId);
          for (const definition of interfaces) {
            for (const name of namesOf(arithmeticLocus)) {
              const description = yield* describeCapability(
                ctx.model,
                arithmeticLocus.id,
                name,
              );
              const exposed = description.exposedBy.some(
                (entry) => entry.locus === definition.id,
              );
              if (!exposed) {
                yield* violation(
                  `Interface ${definition.id} does not expose ${capabilityKey(arithmeticLocus.id, name)}.`,
                );
              }
            }
          }
        }),
    }),
    Rule.make({
      id: "interfaces.single-implementation",
      description: "Only the arithmetic Locus implements capabilities.",
      method: "static",
      check: (ctx) => {
        const arithmeticLocus = arithmeticOf(ctx.locus.contains);
        if (arithmeticLocus === undefined) return violation(NO_ARITHMETIC);
        const offender = [...ctx.model.loci.values()]
          .map((entry) => entry.definition)
          .sort(byId)
          .find(
            (definition) =>
              definition.id !== arithmeticLocus.id &&
              namesOf(definition).length > 0,
          );
        return offender === undefined
          ? Effect.void
          : violation(
              `Locus ${offender.id} declares a capability, but only ${arithmeticLocus.id} may implement capabilities.`,
            );
      },
    }),
    Rule.make({
      id: "interfaces.parity",
      description:
        "Every interface gives the same outcome as the kernel for the parity inputs.",
      method: "execution",
      check: (ctx) =>
        Effect.gen(function* () {
          const arithmeticLocus = arithmeticOf(ctx.locus.contains);
          if (arithmeticLocus === undefined) {
            return yield* violation(NO_ARITHMETIC);
          }
          const cli = interfaceOf(ctx.locus.contains, CliSemantics.id);
          const web = interfaceOf(ctx.locus.contains, WebSemantics.id);
          const agent = interfaceOf(ctx.locus.contains, AgentSemantics.id);
          if (cli === undefined || web === undefined || agent === undefined) {
            return yield* violation(
              "The app contains no command, web or agent interface.",
            );
          }
          for (const input of PARITY_INPUTS) {
            const json = jsonInput(input.text);
            const kernel = normalize(
              yield* invoke(
                ctx.model,
                CapabilityRef.make(arithmeticLocus.id, input.name),
                json,
                { via: arithmeticLocus.id },
              ),
            );
            const fromCli = yield* cliOutcome(ctx.model, cli.id, input);
            const fromWeb = yield* webOutcome(ctx.model, web.id, input);
            const tool = yield* callTool(ctx.model, agent.id, input.name, json);
            const fromAgent = normalize(tool.structured as InvocationOutcome);
            const byInterface: ReadonlyArray<
              readonly [string, Normalized | null]
            > = [
              [cli.id, fromCli],
              [web.id, fromWeb],
              [agent.id, fromAgent],
            ];
            const differing = byInterface
              .filter(([, outcome]) => !jsonEqual(outcome, kernel))
              .map(([id]) => id)
              .sort(byCodeUnit);
            if (differing.length > 0) {
              yield* violation(
                `Interfaces disagree on ${input.name} ${JSON.stringify(input.text)}: ${differing.join(", ")}.`,
              );
            }
          }
        }),
    }),
  ],
});

export const CalculatorApp = Extension.make(APP_EXTENSION_ID, {
  //@unknownhero no more extensions
  description:
    "Marks the calculator application that groups the arithmetic Locus and its interfaces.",
  archetypes: [CalculatorInterfaces],
});

export function makeApp(
  contains: ReadonlyArray<LocusDefinition>,
): LocusDefinition {
  return Locus.extend(Purpose, CalculatorApp).make({
    //@unknownheroits anonymus extend, very bad
    id: "calculator:app",
    description: "The calculator application.",
    properties: { purpose: APP_PURPOSE },
    contains,
  });
}

export const app = makeApp([
  //@unknownhero its constructor, we can use it as direct usage
  arithmetic,
  calculatorCli,
  calculatorWeb,
  calculatorAgent,
]);

//@unknownhero what is this ? if its semantic builders, so locus must contain semantic, not calculated outside
export const calculatorModel = buildModel(app);
