// START_MODULE_CONTRACT
//   PURPOSE: Prove that the static server serves the built site files, answers unknown paths with the prerendered not-found page and status 404, refuses traversal, and allows only GET and HEAD.
//   SCOPE: resolveRequestPath over table-driven paths, createStaticServer over a fixture tree (raw HTTP for traversal), the content types, and the command line refusal when the build is missing.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   FIXTURE_FILES - the files of the fixture site, by path relative to its root
//   NOT_FOUND_BODY - the body of the fixture not-found page, which the server must return on a miss
//   SECRET_BODY - the body of the file outside the site root, which no request may return
//   makeFixture - creates a temporary directory with a site root and a secret file beside it
//   rawGet - sends one request with an exact, unnormalised request path over node:http
//   startFixture - starts createStaticServer on an ephemeral port for a fixture root
//   portOf - the bound port of a running server, which must be reported
// END_MODULE_MAP

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  createStaticServer,
  resolveRequestPath,
} from "../scripts/serve-static";

const FIXTURE_FILES: Readonly<Record<string, string>> = {
  "index.html": "<!doctype html><title>home</title><p>home body</p>",
  "a/index.html": "<!doctype html><title>a</title><p>a body</p>",
  "llms.txt": "# Telos by UnknownLab\n",
  "index.json": '{"version":1,"documents":[]}',
  "not-found/index.html":
    '<!doctype html><main data-page="not-found">Page not found</main>',
};

const NOT_FOUND_BODY = FIXTURE_FILES["not-found/index.html"] ?? "";
const SECRET_BODY = "outside the site root";

// START_CONTRACT: makeFixture
//   PURPOSE: Create a temporary site root with the fixture files, and a secret file one level above it.
//   INPUTS: none
//   OUTPUTS: { { root: string - the site root, secret: string - the file outside the root } }
//   SIDE_EFFECTS: creates a temporary directory
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: makeFixture
function makeFixture(): { root: string; secret: string } {
  const base = mkdtempSync(join(tmpdir(), "serve-static-"));
  const root = join(base, "site");
  for (const [path, body] of Object.entries(FIXTURE_FILES)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  const secret = join(base, "secret.txt");
  writeFileSync(secret, SECRET_BODY);
  return { root, secret };
}

// START_CONTRACT: rawGet
//   PURPOSE: Send one request whose path is not normalised by the URL parser, so that traversal can be tested against the server itself.
//   INPUTS: { port: number - the server port, path: string - the exact request target, method: string - the HTTP method }
//   OUTPUTS: { Promise<{ status: number, contentType: string, body: string }> - the response}
//   SIDE_EFFECTS: opens one connection to 127.0.0.1
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: rawGet
function rawGet(
  port: number,
  path: string,
  method = "GET",
): Promise<{ status: number; contentType: string; body: string }> {
  return new Promise((resolveResponse, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolveResponse({
          status: res.statusCode ?? 0,
          contentType: String(res.headers["content-type"] ?? ""),
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// START_CONTRACT: portOf
//   PURPOSE: Read the port a running server is bound to, failing loudly when the runtime did not report one.
//   INPUTS: { server: ReturnType<typeof Bun.serve> - a running server }
//   OUTPUTS: { number - the bound port }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: portOf
function portOf(server: ReturnType<typeof Bun.serve>): number {
  if (server.port === undefined) throw new Error("the server reported no port");
  return server.port;
}

// START_CONTRACT: startFixture
//   PURPOSE: Start the static server on an ephemeral port over a fixture root.
//   INPUTS: { root: string - the site root }
//   OUTPUTS: { ReturnType<typeof Bun.serve> - the running server, whose port is the ephemeral port }
//   SIDE_EFFECTS: binds a loopback port until the server is stopped
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: startFixture
function startFixture(root: string) {
  return createStaticServer({ root, port: 0 });
}

describe("resolveRequestPath", () => {
  const { root } = makeFixture();

  test.each([
    ["/", join(root, "index.html")],
    ["/a", join(root, "a", "index.html")],
    ["/a/", join(root, "a", "index.html")],
    ["/llms.txt", join(root, "llms.txt")],
    ["/index.json", join(root, "index.json")],
  ])("maps %s to a file under the root", (pathname, expected) => {
    expect(resolveRequestPath(root, pathname)).toBe(expected);
  });

  test.each([
    ["/../secret.txt"],
    ["/%2e%2e/secret.txt"],
    ["/a/%00"],
    ["/%E0%A4%A"],
    ["/missing"],
    ["/a/../../secret.txt"],
  ])("refuses %s with null", (pathname) => {
    expect(resolveRequestPath(root, pathname)).toBeNull();
  });
});

describe("createStaticServer", () => {
  const { root, secret } = makeFixture();
  let server: ReturnType<typeof Bun.serve>;
  let port = 0;

  beforeAll(() => {
    server = startFixture(root);
    port = portOf(server);
  });

  afterAll(() => {
    server.stop(true);
    rmSync(resolve(secret, ".."), { recursive: true, force: true });
  });

  test("serves the root and a directory as their index.html", async () => {
    const home = await rawGet(port, "/");
    expect(home.status).toBe(200);
    expect(home.body).toContain("home body");
    expect(home.contentType).toContain("text/html");

    const section = await rawGet(port, "/a");
    expect(section.status).toBe(200);
    expect(section.body).toContain("a body");
  });

  test("serves llms.txt as text/plain and index.json as application/json", async () => {
    const llms = await rawGet(port, "/llms.txt");
    expect(llms.status).toBe(200);
    expect(llms.contentType).toBe("text/plain; charset=utf-8");
    expect(llms.body).toBe("# Telos by UnknownLab\n");

    const json = await rawGet(port, "/index.json");
    expect(json.status).toBe(200);
    expect(json.contentType).toBe("application/json");
    expect(JSON.parse(json.body)).toEqual({ version: 1, documents: [] });
  });

  test("answers an unknown path with the not-found page and status 404", async () => {
    const missing = await rawGet(port, "/missing");
    expect(missing.status).toBe(404);
    expect(missing.contentType).toBe("text/html; charset=utf-8");
    expect(missing.body).toBe(NOT_FOUND_BODY);
  });

  test("refuses traversal and malformed paths with 404, never the file outside the root", async () => {
    for (const path of [
      "/../secret.txt",
      "/%2e%2e/secret.txt",
      "/a/%00",
      "/%E0%A4%A",
    ]) {
      const response = await rawGet(port, path);
      expect(response.status).toBe(404);
      expect(response.body).not.toContain(SECRET_BODY);
    }
  });

  test("allows HEAD and refuses other methods with 405", async () => {
    const head = await rawGet(port, "/", "HEAD");
    expect(head.status).toBe(200);

    const post = await fetch(`http://127.0.0.1:${port}/`, {
      method: "POST",
      body: "x",
    });
    expect(post.status).toBe(405);
  });
});

describe("serve-static command line", () => {
  test("exits 1 with the build message when the root has no index.html", () => {
    const empty = mkdtempSync(join(tmpdir(), "serve-static-empty-"));
    const script = resolve(import.meta.dir, "../scripts/serve-static.ts");
    const result = Bun.spawnSync(
      ["bun", script, "--port", "0", "--root", empty],
      { stderr: "pipe", stdout: "pipe" },
    );
    expect(result.exitCode).toBe(1);
    expect(new TextDecoder().decode(result.stderr)).toContain(
      `serve-static: ${empty}/index.html not found. Build first: bun run --cwd apps/docs build`,
    );
    rmSync(empty, { recursive: true, force: true });
  });
});
