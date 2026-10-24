// START_MODULE_CONTRACT
//   PURPOSE: Prove that buildModel gives the same ids, relations and diagnostics for the same Loci whatever order their contains lists have, and the same output on every call.
//   SCOPE: Tests of the determinism of model.ts. Out: the content of each check (model.test.ts and model-relations.test.ts).
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DEFINITIONS, M-KERNEL-DIAGNOSTIC
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   uses - relation type between Loci, not acyclic
//   flows - acyclic relation type between Loci
//   links - extension that declares the relation types uses and flows
//   Links - Locus kind composed of the links extension
//   makeLoci - the Loci of the fixture, a fresh set on every call
//   projection - the JSON form of the ids, relations and diagnostics of a model
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Extension } from "../src/extension";
import { Locus, type LocusDefinition } from "../src/locus";
import { buildModel, type SemanticModel } from "../src/model";
import { RelationType } from "../src/relation";

const uses = RelationType.make("test.uses", {
  description: "d",
  target: "locus",
});
const flows = RelationType.make("test.flows", {
  description: "d",
  target: "locus",
  acyclic: true,
});
const links = Extension.make("test.links", {
  description: "d",
  relationTypes: [uses, flows],
});
const Links = Locus.extend(links);

function makeLoci(): Array<LocusDefinition<any>> {
  return [
    Links.make({ id: "Bad Id" }),
    Links.make({ id: "app:a", relations: [uses.to("app:missing")] }),
    Links.make({
      id: "app:c1",
      relations: [flows.to("app:c2")],
    }),
    Links.make({
      id: "app:c2",
      relations: [flows.to("app:c1")],
    }),
    Links.make({
      id: "app:d",
      relations: [uses.to("app:a"), uses.to("app:a")],
    }),
  ];
}

function projection(model: SemanticModel): string {
  return JSON.stringify({
    ids: model.ids,
    relations: model.relations.map((r) => ({
      from: r.from,
      type: r.type.id,
      target: r.target,
      index: r.index,
      valid: r.valid,
    })),
    diagnostics: model.diagnostics,
  });
}

describe("buildModel determinism", () => {
  test("the same Loci listed in opposite contains orders give identical ids, relations and diagnostics", () => {
    const forward = buildModel(
      Locus.make({ id: "app:root", contains: makeLoci() }),
    );
    const backward = buildModel(
      Locus.make({ id: "app:root", contains: makeLoci().reverse() }),
    );
    expect(projection(backward)).toBe(projection(forward));
    expect(forward.diagnostics.map((d) => d.code)).toContain("relation.cycle");
    expect(forward.diagnostics.map((d) => d.code)).toContain(
      "relation.target-missing",
    );
    expect(forward.diagnostics.map((d) => d.code)).toContain(
      "identity.malformed",
    );
    expect(forward.diagnostics.map((d) => d.code)).toContain(
      "relation.duplicate",
    );
  });

  test("buildModel twice on the same root gives identical output", () => {
    const root = Locus.make({ id: "app:root", contains: makeLoci() });
    expect(projection(buildModel(root))).toBe(projection(buildModel(root)));
  });
});
