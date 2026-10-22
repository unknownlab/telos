import { describe, expect, test } from "bun:test";
import pkg from "../package.json";
import root from "../../../package.json";

const approvedDependencies = {
  "@tanstack/react-router": "1.170.44",
  "@tanstack/react-start": "1.169.2",
  "@telos/locus": "workspace:*",
  "class-variance-authority": "0.7.1",
  clsx: "2.1.1",
  effect: "4.0.4",
  "lucide-react": "1.57.0",
  mermaid: "12.2.0",
  minisearch: "7.2.0",
  "radix-ui": "1.8.1",
  react: "19.3.1",
  "react-dom": "19.3.1",
  "tailwind-merge": "3.7.0",
};

const approvedDevDependencies = {
  "@axe-core/playwright": "4.13.0",
  "@playwright/test": "1.64.1",
  "@tailwindcss/vite": "4.3.3",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  "@vitejs/plugin-react": "6.1.2",
  tailwindcss: "4.3.3",
  "tw-animate-css": "1.4.0",
  vite: "8.3.4",
};

describe("@telos/docs manifest", () => {
  test("runtime dependencies are exactly the owner-approved pins", () => {
    expect(pkg.dependencies).toEqual(approvedDependencies);
  });

  test("dev dependencies are exactly the owner-approved pins", () => {
    expect(pkg.devDependencies).toEqual(approvedDevDependencies);
  });

  test("every external version is exact", () => {
    const versions = [
      ...Object.values(pkg.dependencies),
      ...Object.values(pkg.devDependencies),
    ].filter((v) => v !== "workspace:*");
    for (const v of versions) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("no workspace manifest trusts dependency install scripts", () => {
    expect("trustedDependencies" in pkg).toBe(false);
    expect("trustedDependencies" in root).toBe(false);
  });
});
