// START_MODULE_CONTRACT
//   PURPOSE: Run the calculator command line from the terminal through the calculator:cli Locus.
//   SCOPE: Reads the package version and hands the model to runMain. It never defines an operation or a command.
//   DEPENDS: M-CALC-INTERFACES, M-PACK-CLI
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { join } from "node:path";
import { runMain } from "@telos/cli/bun";
import { calculatorModel } from "../src/index";

const pkg = await Bun.file(join(import.meta.dir, "../package.json")).json();
await runMain(calculatorModel, "calculator:cli", { version: pkg.version });
