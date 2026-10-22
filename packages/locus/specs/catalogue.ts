// START_MODULE_CONTRACT
//   PURPOSE: Hold the 44 executable specifications LOC-001 to LOC-044 as plain, JSON-serialisable records, transcribed from the Catalogue (version 1) table.
//   SCOPE: The catalogue records and the builders that keep them short. Out: running them (runner.ts), the model types (model.ts) and the examples and goldens (examples.ts, goldens.ts).
//   DEPENDS: M-LOCUS-VALIDATION, M-LOCUS-DECODE
//   LINKS: M-LOCUS-SPECS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   catalogue - the 44 executable specification records in id order
// END_MODULE_MAP

import type { DiagnosticCode, FabricJson, LocusJson } from "../src/index";
import type { ExpectedDiagnostic, Specification } from "./model";

// START_CONTRACT: locus
//   PURPOSE: Build one Locus JSON value with a default Charter so that each record states only the parts it tests.
//   INPUTS: { id: string - the Locus identity; extra: Partial<LocusJson> - fields that replace the defaults }
//   OUTPUTS: { LocusJson - plain JSON with the id and a default Charter }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: locus
const locus = (id: string, extra: Partial<LocusJson> = {}): LocusJson => ({
  id,
  charter: {
    purpose: `Purpose of ${id}.`,
    responsibilities: [`Work of ${id}`],
  },
  ...extra,
});

// START_CONTRACT: fabric
//   PURPOSE: Build one Fabric JSON value from an identity and its Loci.
//   INPUTS: { id: string - the Fabric identity; loci: ReadonlyArray<LocusJson> - the Loci in the order given }
//   OUTPUTS: { FabricJson - plain JSON with id and loci }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: fabric
const fabric = (id: string, loci: ReadonlyArray<LocusJson>): FabricJson => ({
  id,
  loci,
});

// START_CONTRACT: diag
//   PURPOSE: State one expected diagnostic in the locus scope, with optional detail or members.
//   INPUTS: { code: DiagnosticCode; subject: string; path: string; more: { detail?, members? } - optional fields }
//   OUTPUTS: { ExpectedDiagnostic - code, scope "locus", subject, path and the optional fields }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: diag
const diag = (
  code: DiagnosticCode,
  subject: string,
  path: string,
  more: { detail?: string; members?: string[] } = {},
): ExpectedDiagnostic => ({ code, scope: "locus", subject, path, ...more });

// Shared fixtures. Each is plain JSON and must not change: the golden Revision ids depend on them.

const checkout: LocusJson = {
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: {
    purpose: "Turn a basket into an order.",
    responsibilities: ["Collect payment details"],
  },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
};

const checkoutPaid: LocusJson = {
  ...checkout,
  charter: {
    ...checkout.charter,
    purpose: "Turn a basket into a paid order.",
  },
};

const checkoutRenamed: LocusJson = {
  ...checkout,
  charter: {
    ...checkout.charter,
    purpose: "Create orders.",
  },
};

const payment: LocusJson = {
  id: "shop:payment",
  owner: "shop:storefront",
  charter: {
    purpose: "Authorise payments.",
    responsibilities: ["Call the payment provider", "Record the outcome"],
    successConditions: ["Every payment has an outcome"],
  },
  relations: [
    { kind: "verifies", target: "shop:checkout" },
    { kind: "depends-on", target: "shop:ledger" },
  ],
};

const mixed: FabricJson = fabric("cat:mixed", [
  locus("Bad"),
  locus("shop:b", {
    charter: { purpose: " ", responsibilities: ["Work of b", "Also b"] },
  }),
  locus("shop:c", { owner: "shop:ghost" }),
  locus("shop:d", {
    relations: [
      { kind: "depends-on", target: "shop:ghost" },
      { kind: "depends-on", target: "shop:b" },
    ],
  }),
]);

// The same Fabric with the Loci in reverse order, and with each Locus's
// responsibilities and relations reversed.
const mixedReordered: FabricJson = fabric("cat:mixed", [
  locus("shop:d", {
    relations: [
      { kind: "depends-on", target: "shop:b" },
      { kind: "depends-on", target: "shop:ghost" },
    ],
  }),
  locus("shop:c", { owner: "shop:ghost" }),
  locus("shop:b", {
    charter: { purpose: " ", responsibilities: ["Also b", "Work of b"] },
  }),
  locus("Bad"),
]);

const catalogueShopA: LocusJson = {
  id: "shop:catalogue",
  charter: {
    purpose: "Present products.",
    responsibilities: ["Show prices", "List products", "Show prices"],
    excluded: ["Take payments"],
  },
  metadata: { team: "web" },
};

const catalogueShopB: LocusJson = {
  id: "shop:catalogue",
  charter: {
    purpose: "Present products.",
    responsibilities: ["List products", "Show prices"],
    excluded: ["Take payments"],
    successConditions: [],
  },
  relations: [],
};

// START_CONTRACT: catalogue
//   PURPOSE: Provide the executable specification records that the Bun adapter, the build report and the playground run.
//   INPUTS: none
//   OUTPUTS: { ReadonlyArray<Specification> - 44 plain records LOC-001 to LOC-044 }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: catalogue
/**
 * The executable specification records LOC-001 to LOC-044, in id order, as plain data.
 * Each record states its own expectation; a record is never changed to match the runner.
 */
export const catalogue: ReadonlyArray<Specification> = [
  // ---- Identity (INV-001, INV-002) ----
  {
    id: "LOC-001",
    title: "Well-formed identities with digits and single hyphens are accepted",
    invariants: ["INV-001"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:identities", [
        locus("a1:b2-c3"),
        locus("telos:locus-core"),
        locus("shop:checkout"),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-002",
    title: "An identity without a namespace is reported as malformed",
    invariants: ["INV-001"],
    scenarios: ["NS-001"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("checkout")]),
      expect: {
        valid: false,
        diagnostics: [diag("identity.malformed", "checkout", "id")],
      },
    },
  },
  {
    id: "LOC-003",
    title: "An identity with uppercase letters is reported as malformed",
    invariants: ["INV-001"],
    scenarios: ["NS-001"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("Shop:Checkout")]),
      expect: {
        valid: false,
        diagnostics: [diag("identity.malformed", "Shop:Checkout", "id")],
      },
    },
  },
  {
    id: "LOC-004",
    title: "An identity with a space or an empty part is reported as malformed",
    invariants: ["INV-001"],
    scenarios: ["NS-001"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("shop:check out"), locus("shop:")]),
      expect: {
        valid: false,
        diagnostics: [
          diag("identity.malformed", "shop:", "id"),
          diag("identity.malformed", "shop:check out", "id"),
        ],
      },
    },
  },
  {
    id: "LOC-005",
    title: "A malformed Fabric identity is reported at the fabric scope",
    invariants: ["INV-001"],
    scenarios: ["NS-001"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("System", [locus("shop:a")]),
      expect: {
        valid: false,
        diagnostics: [
          {
            code: "identity.malformed",
            scope: "fabric",
            subject: "System",
            path: "id",
          },
        ],
      },
    },
  },
  {
    id: "LOC-006",
    title: "Distinct identities that share a namespace are accepted",
    invariants: ["INV-002"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("shop:a"), locus("shop:b")]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-007",
    title: "The same identity twice is reported once with its count",
    invariants: ["INV-002"],
    scenarios: ["NS-002"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("shop:a"), locus("shop:a")]),
      expect: {
        valid: false,
        diagnostics: [
          diag("identity.duplicate", "shop:a", "id", { detail: "2" }),
        ],
      },
    },
  },

  // ---- Revision identity (INV-003) ----
  {
    id: "LOC-008",
    title:
      "Metadata differences such as a source path keep the same Revision id",
    invariants: ["INV-003"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "revision-compare",
      a: { ...checkout, metadata: { source: "src/checkout.ts" } },
      b: {
        ...checkout,
        metadata: { source: "lib/checkout.ts", line: "12" },
      },
      expect: { sameLocus: true, sameId: true },
    },
  },
  {
    id: "LOC-009",
    title: "Changing the owner keeps the Locus and changes the Revision id",
    invariants: ["INV-003"],
    scenarios: [],
    polarity: "negative",
    check: {
      kind: "revision-compare",
      a: checkout,
      b: { ...checkout, owner: "shop:orders" },
      expect: { sameLocus: true, sameId: false },
    },
  },

  // ---- Charter (INV-004) ----
  {
    id: "LOC-010",
    title: "A full Charter with exclusions and success conditions is accepted",
    invariants: ["INV-004"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          charter: {
            purpose: "Sell.",
            responsibilities: ["Take orders"],
            excluded: ["Ship goods"],
            successConditions: ["Orders are recorded"],
          },
        }),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-011",
    title: "A whitespace-only purpose is reported as blank",
    invariants: ["INV-004"],
    scenarios: ["NS-003"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          charter: { purpose: "   ", responsibilities: ["Work of shop:a"] },
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("charter.purpose-blank", "shop:a", "charter.purpose"),
        ],
      },
    },
  },
  {
    id: "LOC-012",
    title: "A Locus with no responsibilities is reported as empty",
    invariants: ["INV-004"],
    scenarios: ["NS-004"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          charter: { purpose: "Purpose of shop:a.", responsibilities: [] },
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag(
            "charter.responsibilities-empty",
            "shop:a",
            "charter.responsibilities",
          ),
        ],
      },
    },
  },
  {
    id: "LOC-013",
    title: "A blank responsibility and a blank exclusion are each reported",
    invariants: ["INV-004"],
    scenarios: ["NS-004"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          charter: {
            purpose: "Purpose of shop:a.",
            responsibilities: ["Do", " "],
            excluded: [""],
          },
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("charter.entry-blank", "shop:a", "charter.excluded"),
          diag("charter.entry-blank", "shop:a", "charter.responsibilities"),
        ],
      },
    },
  },
  {
    id: "LOC-014",
    title:
      "Duplicated responsibilities and success conditions are each reported",
    invariants: ["INV-004"],
    scenarios: ["NS-004"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          charter: {
            purpose: "Purpose of shop:a.",
            responsibilities: ["Do", "Do"],
            successConditions: ["Done", "Done"],
          },
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag(
            "charter.entry-duplicate",
            "shop:a",
            "charter.responsibilities",
            {
              detail: "Do",
            },
          ),
          diag(
            "charter.entry-duplicate",
            "shop:a",
            "charter.successConditions",
            {
              detail: "Done",
            },
          ),
        ],
      },
    },
  },

  // ---- Ownership (INV-005, INV-006) ----
  {
    id: "LOC-015",
    title: "An ownership tree three levels deep is accepted",
    invariants: ["INV-005"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("org:root"),
        locus("org:mid", { owner: "org:root" }),
        locus("org:leaf", { owner: "org:mid" }),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-016",
    title: "An owner that is not in the Fabric is reported as missing",
    invariants: ["INV-005"],
    scenarios: ["NS-005"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("shop:a", { owner: "shop:ghost" })]),
      expect: {
        valid: false,
        diagnostics: [
          diag("owner.missing", "shop:a", "owner", { detail: "shop:ghost" }),
        ],
      },
    },
  },
  {
    id: "LOC-017",
    title:
      "A Locus that owns itself is reported as a self-owner and nothing else",
    invariants: ["INV-005"],
    scenarios: ["NS-006"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [locus("shop:a", { owner: "shop:a" })]),
      expect: {
        valid: false,
        diagnostics: [diag("owner.self", "shop:a", "owner")],
      },
    },
  },
  {
    id: "LOC-018",
    title: "An ownership cycle of two is reported once",
    invariants: ["INV-006"],
    scenarios: ["NS-007"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", { owner: "shop:b" }),
        locus("shop:b", { owner: "shop:a" }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("owner.cycle", "shop:a", "owner", {
            members: ["shop:a", "shop:b"],
          }),
        ],
      },
    },
  },
  {
    id: "LOC-019",
    title:
      "An ownership cycle of three with a Locus leading into it is reported once, from its smallest member",
    invariants: ["INV-006"],
    scenarios: ["NS-007"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:x", { owner: "shop:c" }),
        locus("shop:c", { owner: "shop:a" }),
        locus("shop:b", { owner: "shop:c" }),
        locus("shop:a", { owner: "shop:b" }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("owner.cycle", "shop:a", "owner", {
            members: ["shop:a", "shop:b", "shop:c"],
          }),
        ],
      },
    },
  },
  {
    id: "LOC-020",
    title: "An ownership chain 200 levels deep is accepted",
    invariants: ["INV-006"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric(
        "cat:deep",
        Array.from({ length: 200 }, (_, i) =>
          locus(`deep:l${i}`, i === 0 ? {} : { owner: `deep:l${i - 1}` }),
        ),
      ),
      expect: { valid: true, diagnostics: [] },
    },
  },

  // ---- Relations (INV-007, INV-008) ----
  {
    id: "LOC-021",
    title: "One Relation of each of the four kinds is accepted",
    invariants: ["INV-007"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [
            { kind: "depends-on", target: "shop:b" },
            { kind: "refines", target: "shop:c" },
            { kind: "satisfies", target: "shop:d" },
            { kind: "verifies", target: "shop:e" },
          ],
        }),
        locus("shop:b"),
        locus("shop:c"),
        locus("shop:d"),
        locus("shop:e"),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-022",
    title: "An unknown Relation kind is a decode error at its path",
    invariants: ["INV-007"],
    scenarios: ["NS-008"],
    polarity: "negative",
    check: {
      kind: "decode",
      input: JSON.stringify({
        id: "cat:f",
        loci: [
          {
            ...locus("shop:a"),
            relations: [{ kind: "owns", target: "shop:b" }],
          },
        ],
      }),
      expect: { ok: false, paths: ["loci[0].relations[0].kind"] },
    },
  },
  {
    id: "LOC-023",
    title: "A Relation to a missing target is reported",
    invariants: ["INV-007"],
    scenarios: ["NS-009"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [{ kind: "depends-on", target: "shop:ghost" }],
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("relation.target-missing", "shop:a", "relations", {
            detail: "depends-on shop:ghost",
          }),
        ],
      },
    },
  },
  {
    id: "LOC-024",
    title: "A Relation to the Locus itself is reported",
    invariants: ["INV-007"],
    scenarios: ["NS-009"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [{ kind: "depends-on", target: "shop:a" }],
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("relation.self", "shop:a", "relations", {
            detail: "depends-on shop:a",
          }),
        ],
      },
    },
  },
  {
    id: "LOC-025",
    title: "The same Relation kind and target twice is reported as a duplicate",
    invariants: ["INV-007"],
    scenarios: ["NS-009"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [
            { kind: "depends-on", target: "shop:b" },
            { kind: "depends-on", target: "shop:b" },
          ],
        }),
        locus("shop:b"),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("relation.duplicate", "shop:a", "relations", {
            detail: "depends-on shop:b",
          }),
        ],
      },
    },
  },
  {
    id: "LOC-026",
    title: "The same target with two different kinds is accepted",
    invariants: ["INV-007"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [
            { kind: "depends-on", target: "shop:b" },
            { kind: "verifies", target: "shop:b" },
          ],
        }),
        locus("shop:b"),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-027",
    title: "A refines cycle of three is reported once",
    invariants: ["INV-008"],
    scenarios: ["NS-010"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [{ kind: "refines", target: "shop:b" }],
        }),
        locus("shop:b", {
          relations: [{ kind: "refines", target: "shop:c" }],
        }),
        locus("shop:c", {
          relations: [{ kind: "refines", target: "shop:a" }],
        }),
      ]),
      expect: {
        valid: false,
        diagnostics: [
          diag("relation.refines-cycle", "shop:a", "relations", {
            members: ["shop:a", "shop:b", "shop:c"],
          }),
        ],
      },
    },
  },
  {
    id: "LOC-028",
    title: "A depends-on cycle is accepted",
    invariants: ["INV-008"],
    scenarios: ["NS-011"],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [{ kind: "depends-on", target: "shop:b" }],
        }),
        locus("shop:b", {
          relations: [{ kind: "depends-on", target: "shop:c" }],
        }),
        locus("shop:c", {
          relations: [{ kind: "depends-on", target: "shop:a" }],
        }),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },
  {
    id: "LOC-029",
    title: "A refines chain without a cycle is accepted",
    invariants: ["INV-008"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:f", [
        locus("shop:a", {
          relations: [{ kind: "refines", target: "shop:b" }],
        }),
        locus("shop:b", {
          relations: [{ kind: "refines", target: "shop:c" }],
        }),
        locus("shop:c"),
      ]),
      expect: { valid: true, diagnostics: [] },
    },
  },

  // ---- Whole-Fabric reporting and stability (INV-009) ----
  {
    id: "LOC-030",
    title: "A Fabric with four kinds of violation reports all four in order",
    invariants: ["INV-009"],
    scenarios: ["NS-012"],
    polarity: "negative",
    check: {
      kind: "validate",
      fabric: mixed,
      expect: {
        valid: false,
        diagnostics: [
          diag("identity.malformed", "Bad", "id"),
          diag("charter.purpose-blank", "shop:b", "charter.purpose"),
          diag("owner.missing", "shop:c", "owner", { detail: "shop:ghost" }),
          diag("relation.target-missing", "shop:d", "relations", {
            detail: "depends-on shop:ghost",
          }),
        ],
      },
    },
  },
  {
    id: "LOC-031",
    title:
      "Reordering Loci, Relations and Charter entries gives an identical report",
    invariants: ["INV-009"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate-stable",
      variants: [mixed, mixedReordered],
      runs: 1,
      expect: "identical",
    },
  },
  {
    id: "LOC-032",
    title: "Validating the same Fabric five times gives byte-identical output",
    invariants: ["INV-009"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate-stable",
      variants: [mixed, mixed],
      runs: 5,
      expect: "identical",
    },
  },

  // ---- Revision immutability and stability (INV-010) ----
  {
    id: "LOC-033",
    title: "Attempts to modify a Revision have no effect",
    invariants: ["INV-010"],
    scenarios: ["NS-013"],
    polarity: "negative",
    check: {
      kind: "revision-immutable",
      locus: checkout,
      expect: "immutable",
    },
  },
  {
    id: "LOC-034",
    title: "A Revision recreated from its own definition has the same id",
    invariants: ["INV-010"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "revision-compare",
      a: catalogueShopA,
      b: catalogueShopB,
      expect: { sameLocus: true, sameId: true },
    },
  },

  // ---- History (INV-011) ----
  {
    id: "LOC-035",
    title:
      "Appending to an empty history and then with the correct head succeeds",
    invariants: ["INV-011"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "history",
      revisions: [checkout, checkoutPaid],
      steps: [
        { append: 0, expectedHead: null },
        { append: 1, expectedHead: 0 },
      ],
      expect: { outcomes: ["appended", "appended"], entries: [0, 1] },
    },
  },
  {
    id: "LOC-036",
    title:
      "Appending with a stale expected head is refused and leaves the entries unchanged",
    invariants: ["INV-011"],
    scenarios: ["NS-014"],
    polarity: "negative",
    check: {
      kind: "history",
      revisions: [checkout, checkoutPaid, checkoutRenamed],
      steps: [
        { append: 0, expectedHead: null },
        { append: 1, expectedHead: 0 },
        { append: 2, expectedHead: 0 },
      ],
      expect: { outcomes: ["appended", "appended", "stale"], entries: [0, 1] },
    },
  },
  {
    id: "LOC-037",
    title:
      "Appending to an empty history with a non-null expected head is refused",
    invariants: ["INV-011"],
    scenarios: ["NS-015"],
    polarity: "negative",
    check: {
      kind: "history",
      revisions: [checkout, checkoutPaid],
      steps: [{ append: 0, expectedHead: 1 }],
      expect: { outcomes: ["stale"], entries: [] },
    },
  },
  {
    id: "LOC-038",
    title: "Appending the current head is a no-op and a revert is appended",
    invariants: ["INV-011"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "history",
      revisions: [checkout, checkoutPaid],
      steps: [
        { append: 0, expectedHead: null },
        { append: 0, expectedHead: 0 },
        { append: 1, expectedHead: 0 },
        { append: 0, expectedHead: 1 },
      ],
      expect: {
        outcomes: ["appended", "no-op", "appended", "appended"],
        entries: [0, 1, 0],
      },
    },
  },

  // ---- Set order, metadata and diffs (INV-012) ----
  {
    id: "LOC-039",
    title: "Set order and metadata differences give the same Revision id",
    invariants: ["INV-012"],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "revision-compare",
      a: { ...payment, metadata: { source: "a" } },
      b: {
        ...payment,
        charter: {
          ...payment.charter,
          responsibilities: ["Record the outcome", "Call the payment provider"],
        },
        relations: [
          { kind: "depends-on", target: "shop:ledger" },
          { kind: "verifies", target: "shop:checkout" },
        ],
        metadata: { source: "b" },
      },
      expect: { sameLocus: true, sameId: true },
    },
  },
  {
    id: "LOC-040",
    title:
      "A purpose change and an added Relation give the expected change set",
    invariants: ["INV-012"],
    scenarios: [],
    polarity: "negative",
    check: {
      kind: "diff",
      from: {
        id: "shop:checkout",
        owner: "shop:storefront",
        charter: {
          purpose: "Turn a basket into an order.",
          responsibilities: ["Collect payment details"],
        },
      },
      to: checkoutPaid,
      expect: {
        ok: true,
        changes: [
          {
            part: "charter.purpose",
            kind: "changed",
            from: "Turn a basket into an order.",
            to: "Turn a basket into a paid order.",
          },
          {
            part: "relations",
            kind: "added",
            value: "depends-on shop:payment",
          },
        ],
      },
    },
  },
  {
    id: "LOC-041",
    title: "A diff across two Loci fails with LocusMismatchError",
    invariants: ["INV-012"],
    scenarios: ["NS-016"],
    polarity: "negative",
    check: {
      kind: "diff",
      from: locus("shop:a"),
      to: locus("shop:b"),
      expect: { ok: false, error: "LocusMismatchError" },
    },
  },

  // ---- Decode (no invariant; NS-017) ----
  {
    id: "LOC-042",
    title: "Text that is not JSON is one decode issue at the root path",
    invariants: [],
    scenarios: ["NS-017"],
    polarity: "negative",
    check: {
      kind: "decode",
      input: "{",
      expect: { ok: false, paths: [""] },
    },
  },
  {
    id: "LOC-043",
    title: "JSON of the wrong shape reports each issue at its path",
    invariants: [],
    scenarios: ["NS-017"],
    polarity: "negative",
    check: {
      kind: "decode",
      input: JSON.stringify({
        id: "cat:f",
        loci: [
          { id: "shop:a" },
          { id: "shop:b", charter: { purpose: 3, responsibilities: ["x"] } },
          { ...locus("shop:c"), extra: true },
        ],
      }),
      expect: {
        ok: false,
        paths: ["loci[0].charter", "loci[1].charter.purpose", "loci[2].extra"],
      },
    },
  },

  // ---- Empty Fabric (no invariant; contract table gives none) ----
  {
    id: "LOC-044",
    title: "An empty Fabric is valid",
    invariants: [],
    scenarios: [],
    polarity: "positive",
    check: {
      kind: "validate",
      fabric: fabric("cat:empty", []),
      expect: { valid: true, diagnostics: [] },
    },
  },
];
