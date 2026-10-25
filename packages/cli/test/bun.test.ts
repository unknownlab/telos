import { describe, expect, test } from "bun:test";
import { runMain } from "../src/bun";
import { model } from "./fixture";

function captureStreams() {
  const recorded = { stdout: "", stderr: "" };
  const originalOut = process.stdout.write;
  const originalErr = process.stderr.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    recorded.stdout +=
      typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    recorded.stderr +=
      typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
    return true;
  }) as typeof process.stderr.write;
  return {
    recorded,
    restore: () => {
      process.stdout.write = originalOut;
      process.stderr.write = originalErr;
    },
  };
}

describe("runMain", () => {
  test("writes the output line to stdout and exits 0", async () => {
    const capture = captureStreams();
    try {
      await runMain(model, "example:cli", { argv: ["double", "--n", "2"] });
      expect(capture.recorded.stdout).toBe('{"value":4}\n');
      expect(process.exitCode).toBe(0);
    } finally {
      capture.restore();
      process.exitCode = 0;
    }
  });

  test("writes the error line to stderr and exits 2 for invalid input", async () => {
    const capture = captureStreams();
    try {
      await runMain(model, "example:cli", { argv: ["double", "--n", "x"] });
      expect(capture.recorded.stdout).toBe("");
      expect(capture.recorded.stderr).toContain('"InvalidInput"');
      expect(process.exitCode).toBe(2);
    } finally {
      capture.restore();
      process.exitCode = 0;
    }
  });
});
