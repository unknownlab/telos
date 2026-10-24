// START_MODULE_CONTRACT
//   PURPOSE: Prove that buildModel checks every relation, reports each relation problem with its code, finds acyclic cycles with their limit and orders the relations of a model.
//   SCOPE: Tests of the relation, cycle and query parts of model.ts. Out: per-Locus identity and composition checks (model.test.ts) and determinism (model-determinism.test.ts).
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DEFINITIONS, M-KERNEL-DIAGNOSTIC
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   uses - relation type between Loci, not acyclic
//   calls - relation type to a capability
//   flows - acyclic relation type between Loci
//   links - extension that declares the three relation types
//   Links - Locus kind composed of the links extension
//   svc - Locus app:svc with the capability run
//   runCap - declared capability used by the fixture Loci
//   build - buildModel of a root that contains the given Loci
//   withCode - the diagnostics of a model that carry one code
//   project - the relations of a model as readable strings
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { Capability } from "../src/capability";
import type { Diagnostic, DiagnosticCode } from "../src/diagnostic";
import { Extension } from "../src/extension";
import { Locus, type LocusDefinition } from "../src/locus";
import {
  buildModel,
  hasErrors,
  incoming,
  outgoing,
  type SemanticModel,
} from "../src/model";
import {
  CapabilityRef,
  RelationType,
  relationTargetKey,
} from "../src/relation";

const uses = RelationType.make("test.uses", {
  description: "d",
  target: "locus",
});
const calls = RelationType.make("test.calls", {
  description: "d",
  target: "capability",
  grantsInvocation: true,
});
const flows = RelationType.make("test.flows", {
  description: "d",
  target: "locus",
  acyclic: true,
});
const links = Extension.make("test.links", {
  description: "d",
  relationTypes: [uses, calls, flows],
});
const Links = Locus.extend(links);

const runCap = Capability.declare({
  description: "d",
  input: Schema.String,
  output: Schema.String,
  effect: "pure",
});
const svc = Links.make({ id: "app:svc", capabilities: { run: runCap } });

function build(contains: ReadonlyArray<LocusDefinition<any>>): SemanticModel {
  return buildModel(
    Locus.make({ id: "app:root", contains: [svc, ...contains] }),
  );
}

function withCode(
  model: SemanticModel,
  code: DiagnosticCode,
): ReadonlyArray<Diagnostic> {
  return model.diagnostics.filter((d) => d.code === code);
}

function project(model: SemanticModel): ReadonlyArray<string> {
  return model.relations.map(
    (r) => `${r.from}|${r.type.id}|${relationTargetKey(r.target)}|${r.index}`,
  );
}

describe("valid relations", () => {
  test("a valid locus relation and a valid capability relation give no diagnostics and are valid", () => {
    const a = Links.make({
      id: "app:a",
      relations: [uses.to("app:svc"), calls.to(svc.capability("run"))],
    });
    const model = build([a]);
    expect(model.diagnostics).toEqual([]);
    expect(model.relations.map((r) => r.valid)).toEqual([true, true]);
  });
});

describe("relation.type-unavailable", () => {
  test("reports a relation whose type the Locus kind does not declare, and the relation is invalid", () => {
    const plain = Locus.make({ id: "app:p", relations: [uses.to("app:svc")] });
    const model = build([plain]);
    expect(withCode(model, "relation.type-unavailable")).toEqual([
      {
        code: "relation.type-unavailable",
        severity: "error",
        subject: "app:p",
        path: "relations/0",
        members: [],
        message:
          "Relation type test.uses is not declared by any extension of app:p.",
      },
    ]);
    expect(model.relations.find((r) => r.from === "app:p")?.valid).toBe(false);
  });

  test("does not report a relation whose type the kind declares", () => {
    const a = Links.make({ id: "app:a", relations: [uses.to("app:svc")] });
    expect(withCode(build([a]), "relation.type-unavailable")).toEqual([]);
  });
});

describe("relation.target-missing", () => {
  test("reports a relation to a Locus that is not in the model, and the relation is invalid", () => {
    const a = Links.make({ id: "app:a", relations: [uses.to("app:nowhere")] });
    const model = build([a]);
    expect(withCode(model, "relation.target-missing")).toEqual([
      {
        code: "relation.target-missing",
        severity: "error",
        subject: "app:a",
        path: "relations/0",
        members: [],
        message: "Relation target app:nowhere is not in the model.",
      },
    ]);
    expect(model.relations.find((r) => r.from === "app:a")?.valid).toBe(false);
  });

  test("does not report a relation whose target is in the model", () => {
    const a = Links.make({ id: "app:a", relations: [uses.to("app:svc")] });
    expect(withCode(build([a]), "relation.target-missing")).toEqual([]);
  });
});

describe("relation.capability-missing", () => {
  test("reports a capability relation to a capability the target does not have", () => {
    const a = Links.make({
      id: "app:a",
      relations: [calls.to(CapabilityRef.make("app:svc", "nope"))],
    });
    const model = build([a]);
    expect(withCode(model, "relation.capability-missing")).toEqual([
      {
        code: "relation.capability-missing",
        severity: "error",
        subject: "app:a",
        path: "relations/0",
        members: [],
        message: "Locus app:svc has no capability nope.",
      },
    ]);
  });

  test("does not report a capability the target has", () => {
    const a = Links.make({
      id: "app:a",
      relations: [calls.to(svc.capability("run"))],
    });
    expect(withCode(build([a]), "relation.capability-missing")).toEqual([]);
  });
});

describe("relation.target-kind", () => {
  test("reports a capability target on a locus relation type, with the exact message", () => {
    const a = Links.make({
      id: "app:a",
      relations: [uses.to(svc.capability("run"))],
    });
    const model = build([a]);
    expect(withCode(model, "relation.target-kind")).toEqual([
      {
        code: "relation.target-kind",
        severity: "error",
        subject: "app:a",
        path: "relations/0",
        members: [],
        message:
          "Relation type test.uses needs a locus target, got app:svc#run.",
      },
    ]);
  });

  test("reports a locus target on a capability relation type, with the exact message", () => {
    const a = Links.make({ id: "app:a", relations: [calls.to("app:svc")] });
    const model = build([a]);
    expect(withCode(model, "relation.target-kind")).toEqual([
      {
        code: "relation.target-kind",
        severity: "error",
        subject: "app:a",
        path: "relations/0",
        members: [],
        message:
          "Relation type test.calls needs a capability target, got app:svc.",
      },
    ]);
  });

  test("does not report a capability relation to a capability", () => {
    const a = Links.make({
      id: "app:a",
      relations: [calls.to(svc.capability("run"))],
    });
    expect(withCode(build([a]), "relation.target-kind")).toEqual([]);
  });
});

describe("relation.self", () => {
  test("reports a locus relation whose target is the source Locus", () => {
    const a = Links.make({ id: "app:a", relations: [uses.to("app:a")] });
    const model = build([a]);
    expect(withCode(model, "relation.self")).toEqual([
      {
        code: "relation.self",
        severity: "error",
        subject: "app:a",
        path: "relations/0",
        members: [],
        message: "Locus app:a relates to itself with test.uses.",
      },
    ]);
    expect(model.relations.find((r) => r.from === "app:a")?.valid).toBe(false);
  });

  test("does not report a capability relation to a capability of the source Locus", () => {
    const s = Links.make({
      id: "app:s",
      capabilities: { run: runCap },
      relations: [calls.to(CapabilityRef.make("app:s", "run"))],
    });
    const model = build([s]);
    expect(withCode(model, "relation.self")).toEqual([]);
    expect(model.relations.find((r) => r.from === "app:s")?.valid).toBe(true);
  });
});

describe("relation.duplicate", () => {
  test("reports the second of two equal relations as a warning and keeps both valid", () => {
    const a = Links.make({
      id: "app:a",
      relations: [uses.to("app:svc"), uses.to("app:svc")],
    });
    const model = build([a]);
    expect(withCode(model, "relation.duplicate")).toEqual([
      {
        code: "relation.duplicate",
        severity: "warning",
        subject: "app:a",
        path: "relations/1",
        members: [],
        message: "Relation test.uses to app:svc is declared more than once.",
      },
    ]);
    const fromA = model.relations.filter((r) => r.from === "app:a");
    expect(fromA.map((r) => r.valid)).toEqual([true, true]);
  });

  test("hasErrors is false when the model has only warnings and true when an error exists", () => {
    const warnOnly = build([
      Links.make({
        id: "app:a",
        relations: [uses.to("app:svc"), uses.to("app:svc")],
      }),
    ]);
    expect(warnOnly.diagnostics.map((d) => d.severity)).toEqual(["warning"]);
    expect(hasErrors(warnOnly)).toBe(false);

    const withError = build([
      Links.make({
        id: "app:a",
        relations: [uses.to("app:svc"), uses.to("app:a")],
      }),
    ]);
    expect(hasErrors(withError)).toBe(true);
  });
});

describe("relation.cycle", () => {
  test("reports a cycle of an acyclic relation type once, with the exact message", () => {
    const a = Links.make({ id: "app:a", relations: [flows.to("app:b")] });
    const b = Links.make({ id: "app:b", relations: [flows.to("app:a")] });
    const model = build([a, b]);
    expect(withCode(model, "relation.cycle")).toEqual([
      {
        code: "relation.cycle",
        severity: "error",
        subject: "app:a",
        path: "relations",
        members: ["app:a", "app:b"],
        message: "test.flows cycle: app:a -> app:b -> app:a.",
      },
    ]);
  });

  test("the same edges with a relation type that is not acyclic give no cycle", () => {
    const a = Links.make({ id: "app:a", relations: [uses.to("app:b")] });
    const b = Links.make({ id: "app:b", relations: [uses.to("app:a")] });
    expect(withCode(build([a, b]), "relation.cycle")).toEqual([]);
  });

  test("a graph with exactly one cycle is not at the cycle limit", () => {
    const a = Links.make({ id: "app:a", relations: [flows.to("app:b")] });
    const b = Links.make({ id: "app:b", relations: [flows.to("app:c")] });
    const c = Links.make({ id: "app:c", relations: [flows.to("app:a")] });
    expect(withCode(build([a, b, c]), "relation.cycle-limit")).toEqual([]);
  });

  test("a complete graph on six Loci reports exactly 100 cycles and one limit warning", () => {
    const names = ["app:n1", "app:n2", "app:n3", "app:n4", "app:n5", "app:n6"];
    const loci = names.map((id) =>
      Links.make({
        id,
        relations: names
          .filter((other) => other !== id)
          .map((other) => flows.to(other)),
      }),
    );
    const model = build(loci);
    expect(withCode(model, "relation.cycle")).toHaveLength(100);
    expect(withCode(model, "relation.cycle-limit")).toEqual([
      {
        code: "relation.cycle-limit",
        severity: "warning",
        subject: "app:root",
        path: "relations",
        members: ["test.flows"],
        message:
          "More than 100 cycles exist for test.flows; only the first 100 are reported.",
      },
    ]);
  });
});

describe("model.relations order", () => {
  test("relations are sorted by from, type id, target key and index, whatever their declared order", () => {
    const z = Links.make({
      id: "app:z",
      relations: [uses.to("app:svc"), calls.to(svc.capability("run"))],
    });
    const a = Links.make({ id: "app:a", relations: [uses.to("app:svc")] });
    const model = build([z, a]);
    expect(project(model)).toEqual([
      "app:a|test.uses|app:svc|0",
      "app:z|test.calls|app:svc#run|1",
      "app:z|test.uses|app:svc|0",
    ]);
  });
});

describe("incoming and outgoing", () => {
  test("incoming gives the valid relations to a target and outgoing gives all relations of a source", () => {
    const z = Links.make({
      id: "app:z",
      relations: [uses.to("app:svc"), calls.to(svc.capability("run"))],
    });
    const a = Links.make({ id: "app:a", relations: [uses.to("app:svc")] });
    const p = Locus.make({ id: "app:p", relations: [uses.to("app:svc")] });
    const model = build([z, a, p]);
    expect(
      incoming(model, "app:svc").map((r) => `${r.from}|${r.type.id}`),
    ).toEqual(["app:a|test.uses", "app:z|test.calls", "app:z|test.uses"]);
    expect(outgoing(model, "app:z").map((r) => r.type.id)).toEqual([
      "test.calls",
      "test.uses",
    ]);
  });
});
