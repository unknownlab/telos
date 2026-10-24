// START_MODULE_CONTRACT
//   PURPOSE: Provide a Map view that reads like a Map but can never be changed, so the maps of the semantic model are read-only at runtime and not only in their type.
//   SCOPE: readonlyMap. Out: the semantic model itself (model.ts); never exported from index.ts.
//   DEPENDS: none
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   readonlyMap - copies entries into a frozen read-only Map view whose set, delete and clear throw
// END_MODULE_MAP

const READ_ONLY_MESSAGE = "SemanticModel maps are read-only.";

// A frozen view over a private Map. Nothing outside this class can reach the inner Map.
class ReadonlyMapView<K, V> implements ReadonlyMap<K, V> {
  readonly #inner: Map<K, V>;

  constructor(entries: Iterable<readonly [K, V]>) {
    this.#inner = new Map(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this.#inner.size;
  }

  get(key: K): V | undefined {
    return this.#inner.get(key);
  }

  has(key: K): boolean {
    return this.#inner.has(key);
  }

  forEach(
    callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#inner.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  keys() {
    return this.#inner.keys();
  }

  values() {
    return this.#inner.values();
  }

  entries() {
    return this.#inner.entries();
  }

  [Symbol.iterator]() {
    return this.#inner.entries();
  }

  get [Symbol.toStringTag](): string {
    return "ReadonlyMap";
  }

  set(): never {
    throw new TypeError(READ_ONLY_MESSAGE);
  }

  delete(): never {
    throw new TypeError(READ_ONLY_MESSAGE);
  }

  clear(): never {
    throw new TypeError(READ_ONLY_MESSAGE);
  }
}

Object.freeze(ReadonlyMapView.prototype);

// START_CONTRACT: readonlyMap
//   PURPOSE: Copy entries into a frozen Map view that supports every ReadonlyMap read and throws on set, delete and clear.
//   INPUTS: { entries: Iterable<readonly [K, V]> - the entries in the order they are kept }
//   OUTPUTS: { ReadonlyMap<K, V> - a frozen view, not a Map instance; set, delete and clear throw TypeError("SemanticModel maps are read-only.") }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-MODEL
// END_CONTRACT: readonlyMap
/** A read-only copy of the entries. Mutating methods throw instead of changing it. */
export function readonlyMap<K, V>(
  entries: Iterable<readonly [K, V]>,
): ReadonlyMap<K, V> {
  return new ReadonlyMapView(entries);
}
