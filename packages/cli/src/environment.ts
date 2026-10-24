// START_MODULE_CONTRACT
//   PURPOSE: Provide the in-memory Effect environment that effect/cli runs in, so a command line runs without a real process.
//   SCOPE: The Captured record and memoryEnvironment. Out: running the program (run.ts) and any real process, file or terminal access.
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Captured - the stdout and stderr chunks written during one run
//   memoryEnvironment - the layer that gives effect/cli the argv and captures its output in memory
// END_MODULE_MAP

import {
  Effect,
  FileSystem,
  Layer,
  Path,
  Sink,
  Stdio,
  Stream,
  Terminal,
} from "effect";
import { ChildProcessSpawner } from "effect/process";

// START_CONTRACT: Captured
//   PURPOSE: Hold the text written to stdout and stderr during one run.
//   INPUTS: { stdout: Array<string> - the stdout chunks; stderr: Array<string> - the stderr chunks }
//   OUTPUTS: { Captured - the record whose arrays grow as output is written }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: Captured
export interface Captured {
  readonly stdout: Array<string>;
  readonly stderr: Array<string>;
}

// START_CONTRACT: memoryEnvironment
//   PURPOSE: Build the Effect layer that supplies argv and captures every write of one run.
//   INPUTS: { argv: ReadonlyArray<string> - the arguments; captured: Captured - the arrays that receive the output }
//   OUTPUTS: { Layer - the file system, path, stdio, terminal and child process spawner layers }
//   SIDE_EFFECTS: none; the output is pushed into captured only when the program writes
//   LINKS: M-PACK-CLI
// END_CONTRACT: memoryEnvironment
export function memoryEnvironment(
  argv: ReadonlyArray<string>,
  captured: Captured,
): Layer.Layer<
  | FileSystem.FileSystem
  | Path.Path
  | Stdio.Stdio
  | Terminal.Terminal
  | ChildProcessSpawner.ChildProcessSpawner
> {
  const dec = new TextDecoder();
  const w = (buf: string[]) => (c: string | Uint8Array) =>
    Effect.sync(() => {
      buf.push(typeof c === "string" ? c : dec.decode(c));
    });
  return Layer.mergeAll(
    FileSystem.layerNoop({}),
    Path.layer,
    Layer.succeed(
      Stdio.Stdio,
      Stdio.make({
        args: Effect.succeed([...argv]),
        stdout: () => Sink.forEach(w(captured.stdout)),
        stderr: () => Sink.forEach(w(captured.stderr)),
        stdin: Stream.empty,
      }),
    ),
    Layer.succeed(
      Terminal.Terminal,
      Terminal.make({
        columns: Effect.succeed(80),
        rows: Effect.succeed(24),
        readInput: Effect.die("unused"),
        readLine: Effect.die("unused"),
        display: (s) => w(captured.stdout)(s),
      }),
    ),
    Layer.succeed(
      ChildProcessSpawner.ChildProcessSpawner,
      ChildProcessSpawner.make(() => Effect.die("unused")),
    ),
  );
}
