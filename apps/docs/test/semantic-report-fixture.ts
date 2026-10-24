// START_MODULE_CONTRACT
//   PURPOSE: Build one semantic report from the real kernel and the real calculator model, so that the docs tests read the same shape that bun run telos report writes.
//   SCOPE: semanticReportFixture only. It verifies calculator:arithmetic and leaves every other Locus not run. It never writes a file and never reads the repository.
//   DEPENDS: M-KERNEL-API, M-KERNEL-DESCRIBE, M-KERNEL-VERIFY, M-CALC-ARITHMETIC, M-DOCS-SEMANTIC-REPORT
//   LINKS: V-M-DOCS-SEMANTIC-REPORT, V-M-DOCS-INSPECTOR
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   AT - the fixed instant of the fixture verification run
//   semanticReportFixture - a complete report built by the kernel for the calculator model
// END_MODULE_MAP

import { calculatorModel } from "@telos/calculator";
import { describeModel, describeVerifications, verify } from "@telos/kernel";
import { Effect } from "effect";
import type { SemanticReport } from "../src/lib/build-data";

const AT = new Date("2026-10-22T10:00:00.000Z");

// START_CONTRACT: semanticReportFixture
//   PURPOSE: Give a complete SemanticReport built by the real kernel for the calculator model, with one closure finding and ok false.
//   INPUTS: none
//   OUTPUTS: { Promise<SemanticReport> - a fresh report on each call }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: semanticReportFixture
export async function semanticReportFixture(): Promise<SemanticReport> {
  const model = await Effect.runPromise(describeModel(calculatorModel));
  const verification = await Effect.runPromise(
    verify(calculatorModel, {
      runner: "bun test",
      loci: ["calculator:arithmetic"],
      now: () => AT,
    }),
  );
  const verifications = Object.fromEntries(
    model.loci.map((locus) => [
      locus.id,
      describeVerifications(calculatorModel, locus.id, verification),
    ]),
  );
  return {
    version: 1,
    provenance: {
      runner: "bun test",
      generatedAt: AT.toISOString(),
      commit: "0123456789abcdef0123456789abcdef01234567",
    },
    model,
    verification,
    verifications,
    closure: {
      limits: ["Ownership is decided per file, never below file level."],
      scope: { include: ["apps/calculator/src/**/*.ts"], exclude: [] },
      fileCount: 3,
      findings: [
        {
          code: "closure.unowned",
          severity: "error",
          file: "apps/calculator/src/stray.ts",
          loci: [],
          detail: "apps/calculator/src/stray.ts",
          message: "apps/calculator/src/stray.ts has no owner.",
          knowledge: "derived",
        },
      ],
    },
    ok: false,
  };
}
