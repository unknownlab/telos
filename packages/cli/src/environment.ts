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

export interface Captured {
  readonly stdout: Array<string>;
  readonly stderr: Array<string>;
}

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
