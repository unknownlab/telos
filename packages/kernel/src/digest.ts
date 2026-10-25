import { Effect } from "effect";
import { canonicalJson } from "./canonical";

export type Digest = `sha256:${string}`;

export const digestOf = (value: unknown): Effect.Effect<Digest> =>
  Effect.promise(async () => {
    const bytes = new TextEncoder().encode(canonicalJson(value));
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return `sha256:${hex}` as Digest;
  });
