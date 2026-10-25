import { join } from "node:path";
import { runMain } from "@telos/cli/bun";
import { calculatorModel } from "../src/index";

const pkg = await Bun.file(join(import.meta.dir, "../package.json")).json();
await runMain(calculatorModel, "calculator:cli", { version: pkg.version });
