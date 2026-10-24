// START_MODULE_CONTRACT
//   PURPOSE: Talk to an MCP stdio server from a deterministic agent client that uses no model, no network and no credentials.
//   SCOPE: McpStdioClient with spawn, initialize, listTools, callTool and close over newline-delimited JSON-RPC. Out: the server side (mcp.ts) and any LLM use.
//   DEPENDS: none
//   LINKS: M-PACK-AGENT-MCP, V-M-PACK-AGENT-MCP
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ListedTool - one tool as the server lists it
//   CallResult - the result of a tools/call request
//   McpStdioClient - a client that spawns an MCP stdio server and makes requests to it
// END_MODULE_MAP

export interface ListedTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: unknown;
  readonly annotations?: unknown;
  readonly _meta?: unknown;
}

export interface CallResult {
  readonly isError: boolean;
  readonly text: string;
  readonly structuredContent: unknown;
}

interface PendingRequest {
  readonly resolve: (message: any) => void;
  readonly reject: (error: Error) => void;
}

const PROTOCOL_VERSION = "2025-06-18";

// START_CONTRACT: McpStdioClient
//   PURPOSE: A deterministic MCP client over a child process stdin and stdout, with one timer per request.
//   INPUTS: { spawn: command, cwd and timeoutMs of the child process }
//   OUTPUTS: { McpStdioClient - initialized client whose server field holds the initialize result }
//   SIDE_EFFECTS: starts a child process and reads its stdout until it closes
//   LINKS: M-PACK-AGENT-MCP
// END_CONTRACT: McpStdioClient
export class McpStdioClient {
  private readonly proc: Bun.Subprocess<"pipe", "pipe", "pipe">;
  private readonly timeoutMs: number;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly decoder = new TextDecoder();
  private nextId = 1;
  private buffer = "";
  private serverInfo: { serverName: string; protocolVersion: string } = {
    serverName: "",
    protocolVersion: "",
  };

  private constructor(
    proc: Bun.Subprocess<"pipe", "pipe", "pipe">,
    timeoutMs: number,
  ) {
    this.proc = proc;
    this.timeoutMs = timeoutMs;
    void this.readLoop();
  }

  // START_CONTRACT: spawn
  //   PURPOSE: Start the server command and perform the initialize handshake.
  //   INPUTS: { command: ReadonlyArray<string> - the program and arguments; options: { cwd, timeoutMs default 10000 } }
  //   OUTPUTS: { Promise<McpStdioClient> - the initialized client, or a rejection of the failed request }
  //   SIDE_EFFECTS: starts a child process; kills it when initialize fails
  //   LINKS: M-PACK-AGENT-MCP
  // END_CONTRACT: spawn
  static async spawn(
    command: ReadonlyArray<string>,
    options: { readonly cwd?: string; readonly timeoutMs?: number } = {},
  ): Promise<McpStdioClient> {
    const proc = Bun.spawn([...command], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
    });
    const client = new McpStdioClient(proc, options.timeoutMs ?? 10000);
    try {
      client.serverInfo = await client.initialize();
    } catch (error) {
      proc.kill();
      throw error;
    }
    return client;
  }

  /** The serverName and protocolVersion of the initialize that spawn performed. */
  get server(): {
    readonly serverName: string;
    readonly protocolVersion: string;
  } {
    return this.serverInfo;
  }

  async initialize(): Promise<{
    readonly serverName: string;
    readonly protocolVersion: string;
  }> {
    const result = await this.request("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "telos-deterministic-client", version: "0.0.0" },
    });
    this.send({ jsonrpc: "2.0", method: "notifications/initialized" });
    return {
      serverName: String(result?.serverInfo?.name ?? ""),
      protocolVersion: String(result?.protocolVersion ?? ""),
    };
  }

  async listTools(): Promise<ReadonlyArray<ListedTool>> {
    const result = await this.request("tools/list", {});
    const tools = (result?.tools ?? []) as ListedTool[];
    return [...tools].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
  }

  async callTool(name: string, args: unknown): Promise<CallResult> {
    const result = await this.request("tools/call", { name, arguments: args });
    const content = (result?.content ?? []) as ReadonlyArray<{
      text?: unknown;
    }>;
    return {
      isError: result?.isError === true,
      text: String(content[0]?.text ?? ""),
      structuredContent: result?.structuredContent,
    };
  }

  async close(): Promise<number> {
    this.proc.stdin.end();
    return await this.proc.exited;
  }

  private send(message: unknown): void {
    this.proc.stdin.write(JSON.stringify(message) + "\n");
    this.proc.stdin.flush();
  }

  private request(method: string, params: unknown): Promise<any> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request ${method} timed out.`));
      }, this.timeoutMs);
      this.pending.set(id, {
        resolve: (message: any) => {
          clearTimeout(timer);
          if (message.error !== undefined) {
            reject(
              new Error(
                `MCP error ${message.error.code}: ${message.error.message}`,
              ),
            );
          } else {
            resolve(message.result);
          }
        },
        reject: (error: Error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  private async readLoop(): Promise<void> {
    const reader = this.proc.stdout.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        this.buffer += this.decoder.decode(value, { stream: true });
        let newline = this.buffer.indexOf("\n");
        while (newline >= 0) {
          const line = this.buffer.slice(0, newline);
          this.buffer = this.buffer.slice(newline + 1);
          newline = this.buffer.indexOf("\n");
          if (!line.trim()) continue;
          let message: { id?: unknown };
          try {
            message = JSON.parse(line) as { id?: unknown };
          } catch {
            continue;
          }
          if (typeof message.id !== "number") continue;
          const waiting = this.pending.get(message.id);
          if (waiting === undefined) continue;
          this.pending.delete(message.id);
          waiting.resolve(message);
        }
      }
    } finally {
      for (const [, waiting] of this.pending) {
        waiting.reject(new Error("MCP server closed its output."));
      }
      this.pending.clear();
    }
  }
}
