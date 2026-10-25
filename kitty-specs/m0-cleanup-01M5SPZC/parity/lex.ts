export interface SourceComment {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly block: boolean;
}

export interface LexResult {
  readonly comments: ReadonlyArray<SourceComment>;
  readonly tokens: ReadonlyArray<string>;
}

export type CommentClass = "owner-note" | "directive" | "other";

const OWNER_NOTE = /^\/\/@unknownhero/;
const DIRECTIVE = /^\/\/\s*@ts-expect-error\b/;
const SUSPECT_ANYWHERE = /@unknownhero/;
const SUSPECT_START =
  /^(?:\/\/\/?|\/\*+)\s*(?:@ts-|eslint|oxlint|biome-ignore|prettier-ignore|<reference|istanbul|c8 ignore|[@#]__PURE__|[#@]\s*sourceMappingURL)/;

export const classify = (comment: SourceComment): CommentClass => {
  if (!comment.block && OWNER_NOTE.test(comment.text)) return "owner-note";
  if (!comment.block && DIRECTIVE.test(comment.text)) return "directive";
  return "other";
};

export const isSuspect = (comment: SourceComment): boolean =>
  classify(comment) === "other" &&
  (SUSPECT_ANYWHERE.test(comment.text) || SUSPECT_START.test(comment.text));

const KEYWORDS_BEFORE_EXPRESSION = new Set([
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "throw",
  "case",
  "do",
  "else",
  "yield",
  "await",
  "extends",
]);

const isIdentStart = (c: string): boolean => /[A-Za-z_$\u0080-￿]/.test(c);
const isIdentPart = (c: string): boolean => /[\w$\u0080-￿]/.test(c);

export function lex(src: string): LexResult {
  const comments: SourceComment[] = [];
  const tokens: string[] = [];
  const braces: Array<"brace" | "template"> = [];
  let i = 0;
  let regexAllowed = true;

  const fail = (what: string): never => {
    const line = src.slice(0, i).split("\n").length;
    throw new Error(`lex: ${what} at line ${line}`);
  };

  const scanTemplateChunk = (): void => {
    const start = i;
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "`") {
        i += 1;
        tokens.push(src.slice(start, i));
        regexAllowed = false;
        return;
      }
      if (c === "$" && src[i + 1] === "{") {
        i += 2;
        tokens.push(src.slice(start, i));
        braces.push("template");
        regexAllowed = true;
        return;
      }
      i += 1;
    }
    fail("unterminated template literal");
  };

  while (i < src.length) {
    const c = src[i] as string;
    const next = src[i + 1];

    if (/\s/.test(c)) {
      i += 1;
      continue;
    }

    if (c === "/" && next === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      comments.push({ start: i, end: stop, text: src.slice(i, stop), block: false });
      i = stop;
      continue;
    }

    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) fail("unterminated block comment");
      comments.push({ start: i, end: end + 2, text: src.slice(i, end + 2), block: true });
      i = end + 2;
      continue;
    }

    if (c === "'" || c === '"') {
      const start = i;
      i += 1;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") i += 1;
        else if (src[i] === "\n") fail("newline in string literal");
        i += 1;
      }
      if (i >= src.length) fail("unterminated string literal");
      i += 1;
      tokens.push(src.slice(start, i));
      regexAllowed = false;
      continue;
    }

    if (c === "`") {
      i += 1;
      const before = tokens.length;
      scanTemplateChunk();
      tokens[before] = `\`${tokens[before]}`;
      continue;
    }

    if (c === "/" && regexAllowed) {
      const start = i;
      i += 1;
      let inClass = false;
      while (i < src.length) {
        const r = src[i];
        if (r === "\\") {
          i += 2;
          continue;
        }
        if (r === "\n") fail("newline in regular expression");
        if (r === "[") inClass = true;
        else if (r === "]") inClass = false;
        else if (r === "/" && !inClass) break;
        i += 1;
      }
      i += 1;
      while (i < src.length && isIdentPart(src[i] as string)) i += 1;
      tokens.push(src.slice(start, i));
      regexAllowed = false;
      continue;
    }

    if (isIdentStart(c)) {
      const start = i;
      while (i < src.length && isIdentPart(src[i] as string)) i += 1;
      const word = src.slice(start, i);
      tokens.push(word);
      regexAllowed = KEYWORDS_BEFORE_EXPRESSION.has(word);
      continue;
    }

    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(next ?? ""))) {
      const start = i;
      while (i < src.length && /[\w.]/.test(src[i] as string)) i += 1;
      tokens.push(src.slice(start, i));
      regexAllowed = false;
      continue;
    }

    if (c === "{") {
      braces.push("brace");
      tokens.push(c);
      regexAllowed = true;
      i += 1;
      continue;
    }

    if (c === "}") {
      const top = braces.pop();
      i += 1;
      if (top === "template") {
        const before = tokens.length;
        scanTemplateChunk();
        tokens[before] = `}${tokens[before]}`;
        continue;
      }
      tokens.push(c);
      regexAllowed = true;
      continue;
    }

    tokens.push(c);
    regexAllowed = c !== ")" && c !== "]";
    i += 1;
  }

  if (braces.length > 0) fail("unbalanced braces");
  return { comments, tokens };
}

const CLOSERS = new Set([")", "]", "}", ">"]);

export const normalizedTokens = (src: string): ReadonlyArray<string> => {
  const { tokens } = lex(src);
  return tokens.filter((t, k) => !(t === "," && CLOSERS.has(tokens[k + 1] ?? "")));
};

const lineStart = (s: string, at: number): number => s.lastIndexOf("\n", at - 1) + 1;
const lineEnd = (s: string, at: number): number => {
  const end = s.indexOf("\n", at);
  return end === -1 ? s.length : end;
};

export function strip(src: string): string {
  const { comments } = lex(src);
  const suspects = comments.filter(isSuspect);
  if (suspects.length > 0) {
    throw new Error(
      `strip: refusing, comments look like notes or directives: ${suspects.map((c) => c.text).join(" | ")}`,
    );
  }
  let out = src;
  const removable = comments.filter((c) => classify(c) === "other");
  for (const c of [...removable].sort((a, b) => b.start - a.start)) {
    const ls = lineStart(out, c.start);
    const le = lineEnd(out, c.end);
    const before = out.slice(ls, c.start);
    const after = out.slice(c.end, le);
    if (before.trim() === "" && after.trim() === "") {
      out = out.slice(0, ls) + out.slice(le === out.length ? le : le + 1);
    } else if (after.trim() === "") {
      out = out.slice(0, ls) + before.trimEnd() + out.slice(c.end);
    } else if (before.trim() === "") {
      out = out.slice(0, c.start) + after.trimStart() + out.slice(le);
    } else {
      let left = c.start;
      let right = c.end;
      if (/\s$/.test(before)) {
        while (right < le && /[ \t]/.test(out[right] as string)) right += 1;
      }
      if (/^[)\]},;]/.test(out.slice(right, le))) {
        while (left > ls && /[ \t]/.test(out[left - 1] as string)) left -= 1;
      }
      const pad = /\s$/.test(before) || /^\s/.test(after) ? "" : " ";
      out = out.slice(0, left) + pad + out.slice(right);
    }
  }
  out = out.replace(/\n(?:[ \t]*\n){2,}/g, "\n\n");
  out = out.replace(/^(?:[ \t]*\n)+/, "");
  out = `${out.replace(/\s+$/, "")}\n`;
  return out;
}

export interface OwnerNote {
  readonly text: string;
  readonly placement: "same-line" | "line-above";
  readonly anchor: string;
}

const squash = (s: string): string => s.replace(/\s+/g, " ").trim();

export function ownerNotes(src: string): ReadonlyArray<OwnerNote> {
  const { comments } = lex(src);
  const notes: OwnerNote[] = [];
  const codeOnly = (from: number, to: number): string => {
    let text = "";
    let at = from;
    for (const c of comments) {
      if (c.end <= from || c.start >= to) continue;
      text += src.slice(at, Math.max(at, c.start));
      at = Math.max(at, c.end);
    }
    text += src.slice(at, to);
    return squash(text);
  };
  for (const c of comments) {
    if (classify(c) !== "owner-note") continue;
    const ls = lineStart(src, c.start);
    const sameLine = codeOnly(ls, c.start);
    if (sameLine !== "") {
      notes.push({ text: c.text, placement: "same-line", anchor: sameLine });
      continue;
    }
    let at = lineEnd(src, c.end) + 1;
    let anchor = "";
    while (at < src.length) {
      const le = lineEnd(src, at);
      anchor = codeOnly(at, le);
      if (anchor !== "") break;
      at = le + 1;
    }
    notes.push({ text: c.text, placement: "line-above", anchor });
  }
  return notes;
}
