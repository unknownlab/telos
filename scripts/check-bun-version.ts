import pkg from "../package.json";

export function isSupported(actual: string, required: string): boolean {
  return Bun.semver.order(actual, required.replace(/^>=/, "")) >= 0;
}

if (import.meta.main) {
  const required: unknown = pkg.engines?.bun;
  if (typeof required !== "string" || !required.startsWith(">=")) {
    console.error('package.json engines.bun must be ">=<version>"');
    process.exit(1);
  }

  if (!isSupported(Bun.version, required)) {
    console.error(
      `Bun ${required} required, found ${Bun.version}. Run: bun upgrade --canary`,
    );
    process.exit(1);
  }
}
