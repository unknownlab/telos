import { expect, test } from "bun:test";
import { defineFabric, defineLocus, validateFabric } from "../src/index";

test("1,000 Loci with 3 Relations each validate in under 1 s", () => {
  const n = 1000;
  const id = (i: number) => `perf:l${i}`;
  const loci = Array.from({ length: n }, (_, i) =>
    defineLocus({
      id: id(i),
      ...(i === 0 ? {} : { owner: id(Math.floor((i - 1) / 2)) }),
      charter: { purpose: `Locus ${i}`, responsibilities: [`Do ${i}`] },
      relations: [1, 2, 3].map((k) => ({
        kind: "depends-on" as const,
        target: id((i + k) % n),
      })),
    }),
  );
  const fabric = defineFabric({ id: "perf:fabric", loci });
  const start = performance.now();
  const report = validateFabric(fabric);
  const elapsed = performance.now() - start;
  expect(report.valid).toBe(true);
  expect(elapsed).toBeLessThan(1000);
});
