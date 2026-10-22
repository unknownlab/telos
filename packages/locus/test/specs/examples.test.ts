import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
  createRevision,
  decodeFabric,
  decodeLocus,
  diffRevisions,
  type ValidationReport,
  validateFabric,
} from "../../src/index";
import { examples } from "../../specs/examples";
import type { ExpectedDiagnostic } from "../../specs/model";

// Removes the message from each diagnostic. Specifications state codes, not wording.
const withoutMessages = (report: ValidationReport) => ({
  valid: report.valid,
  diagnostics: report.diagnostics.map((d) => {
    const { message: _message, ...rest } = d;
    return rest;
  }),
});

const validate = (json: unknown) =>
  Effect.runPromise(
    decodeFabric(json).pipe(Effect.map((fabric) => validateFabric(fabric))),
  ).then(withoutMessages);

const revisionOf = (json: unknown) =>
  Effect.runPromise(decodeLocus(json).pipe(Effect.flatMap(createRevision)));

describe("playground examples", () => {
  test("every example decodes", async () => {
    await Effect.runPromise(decodeFabric(examples.valid));
    await Effect.runPromise(decodeFabric(examples.invalid));
    await Effect.runPromise(decodeFabric(examples.relations));
  });

  test("valid is accepted with no diagnostics", async () => {
    expect(await validate(examples.valid)).toEqual({
      valid: true,
      diagnostics: [],
    });
  });

  test("invalid reports a duplicated responsibility and a blank purpose", async () => {
    const report = await validate(examples.invalid);
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual([
      {
        code: "charter.entry-duplicate",
        scope: "locus",
        subject: "shop:checkout",
        path: "charter.responsibilities",
        detail: "Collect payment details",
      },
      {
        code: "charter.purpose-blank",
        scope: "locus",
        subject: "shop:checkout",
        path: "charter.purpose",
      },
    ] satisfies ReadonlyArray<ExpectedDiagnostic>);
  });

  test("relations reports a refines cycle and a missing target", async () => {
    const report = await validate(examples.relations);
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual([
      {
        code: "relation.refines-cycle",
        scope: "locus",
        subject: "shop:checkout",
        path: "relations",
        members: ["shop:checkout", "shop:payment"],
      },
      {
        code: "relation.target-missing",
        scope: "locus",
        subject: "shop:storefront",
        path: "relations",
        detail: "depends-on shop:ghost",
      },
    ] satisfies ReadonlyArray<ExpectedDiagnostic>);
  });

  test("history has two Revisions of one Locus with different ids", async () => {
    const a = await revisionOf(examples.history.a);
    const b = await revisionOf(examples.history.b);
    expect(a.locus).toBe(b.locus);
    expect(a.id).not.toBe(b.id);
  });

  test("history changes only the responsibilities", async () => {
    const a = await revisionOf(examples.history.a);
    const b = await revisionOf(examples.history.b);
    const changeSet = await Effect.runPromise(diffRevisions(a, b));
    expect(changeSet.changes).toEqual([
      {
        part: "charter.responsibilities",
        kind: "removed",
        value: "Collect payment details",
      },
      {
        part: "charter.responsibilities",
        kind: "added",
        value: "Collect payment and delivery details",
      },
    ]);
  });
});
