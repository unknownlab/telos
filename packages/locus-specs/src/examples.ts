// START_MODULE_CONTRACT
//   PURPOSE: Provide the starting inputs of the playground scenarios as plain JSON, copied from the contract's wire-format example.
//   SCOPE: The examples value only. Out: running the examples (the playground runs them through the public API) and the catalogue records (catalogue.ts).
//   DEPENDS: M-LOCUS-DECODE
//   LINKS: M-LOCUS-SPECS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   examples - playground starting inputs: valid, invalid, relations and history
// END_MODULE_MAP

import type { FabricJson, LocusJson } from "@telos/locus";

// START_CONTRACT: examples
//   PURPOSE: Hold the starting inputs of the playground scenarios so that the playground and the tests use the same data.
//   INPUTS: none
//   OUTPUTS: { examples - valid, invalid and relations as FabricJson, and history as two LocusJson values a and b }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: examples
/** Starting inputs for the playground scenarios. Plain JSON. */
export const examples: {
  readonly valid: FabricJson;
  readonly invalid: FabricJson;
  readonly relations: FabricJson;
  readonly history: { readonly a: LocusJson; readonly b: LocusJson };
} = {
  valid: {
    id: "shop:system",
    loci: [
      {
        id: "shop:storefront",
        charter: {
          purpose: "Sell products online.",
          responsibilities: ["Present the catalogue", "Take orders"],
        },
      },
      {
        id: "shop:checkout",
        owner: "shop:storefront",
        charter: {
          purpose: "Turn a basket into an order.",
          responsibilities: ["Collect payment details"],
        },
        relations: [{ kind: "depends-on", target: "shop:payment" }],
      },
      {
        id: "shop:payment",
        owner: "shop:storefront",
        charter: {
          purpose: "Authorise payments.",
          responsibilities: ["Call the payment provider"],
        },
      },
    ],
  },
  invalid: {
    id: "shop:system",
    loci: [
      {
        id: "shop:storefront",
        charter: {
          purpose: "Sell products online.",
          responsibilities: ["Present the catalogue", "Take orders"],
        },
      },
      {
        id: "shop:checkout",
        owner: "shop:storefront",
        charter: {
          purpose: "",
          responsibilities: [
            "Collect payment details",
            "Collect payment details",
          ],
        },
        relations: [{ kind: "depends-on", target: "shop:payment" }],
      },
      {
        id: "shop:payment",
        owner: "shop:storefront",
        charter: {
          purpose: "Authorise payments.",
          responsibilities: ["Call the payment provider"],
        },
      },
    ],
  },
  relations: {
    id: "shop:system",
    loci: [
      {
        id: "shop:storefront",
        charter: {
          purpose: "Sell products online.",
          responsibilities: ["Present the catalogue", "Take orders"],
        },
        relations: [{ kind: "depends-on", target: "shop:ghost" }],
      },
      {
        id: "shop:checkout",
        owner: "shop:storefront",
        charter: {
          purpose: "Turn a basket into an order.",
          responsibilities: ["Collect payment details"],
        },
        relations: [{ kind: "refines", target: "shop:payment" }],
      },
      {
        id: "shop:payment",
        owner: "shop:storefront",
        charter: {
          purpose: "Authorise payments.",
          responsibilities: ["Call the payment provider"],
        },
        relations: [{ kind: "refines", target: "shop:checkout" }],
      },
    ],
  },
  history: {
    a: {
      id: "shop:checkout",
      owner: "shop:storefront",
      charter: {
        purpose: "Turn a basket into an order.",
        responsibilities: ["Collect payment details"],
      },
      relations: [{ kind: "depends-on", target: "shop:payment" }],
    },
    b: {
      id: "shop:checkout",
      owner: "shop:storefront",
      charter: {
        purpose: "Turn a basket into an order.",
        responsibilities: ["Collect payment and delivery details"],
      },
      relations: [{ kind: "depends-on", target: "shop:payment" }],
    },
  },
};
