const READ_ONLY_MESSAGE = "SemanticModel maps are read-only.";

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

export function readonlyMap<K, V>(
  entries: Iterable<readonly [K, V]>,
): ReadonlyMap<K, V> {
  return new ReadonlyMapView(entries);
}
