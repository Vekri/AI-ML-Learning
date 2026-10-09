import { retailStatements } from "@/lib/retail-sql";

export type SqlValue = string | number | boolean | null;

export type RunResult =
  | { ok: true; output: string; rows?: Record<string, SqlValue>[] }
  | { ok: false; output: string };

type PyodideRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (names: string | string[]) => Promise<unknown>;
  setStdout: (options: { batched: (line: string) => void }) => void;
  setStderr: (options: { batched: (line: string) => void }) => void;
};

type AlasqlRunner = (sql: string) => unknown;

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideRuntime>;
    alasql?: AlasqlRunner;
  }
}

const PYODIDE_VERSION = "0.27.7";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideRuntime> | null = null;
const loadedPackages = new Set<string>();

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not download the Python runtime."));
    document.head.appendChild(script);
  });
}

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${INDEX_URL}pyodide.js`);
      if (!window.loadPyodide) {
        throw new Error("Python runtime did not start.");
      }
      return window.loadPyodide({ indexURL: INDEX_URL });
    })().catch((error: unknown) => {
      pyodidePromise = null;
      throw error;
    });
  }
  return pyodidePromise;
}

export async function runPython(code: string, packages: string[] = []): Promise<RunResult> {
  try {
    const pyodide = await getPyodide();
    const missing = packages.filter((name) => !loadedPackages.has(name));
    if (missing.length > 0) {
      await pyodide.loadPackage(missing);
      missing.forEach((name) => loadedPackages.add(name));
    }
    const lines: string[] = [];
    pyodide.setStdout({
      batched: (line) => {
        lines.push(line);
      },
    });
    pyodide.setStderr({
      batched: (line) => {
        lines.push(line);
      },
    });
    await pyodide.runPythonAsync(code);
    return { ok: true, output: lines.join("\n").trimEnd() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: message };
  }
}

async function getAlasql() {
  if (window.alasql) return window.alasql;
  await loadScript("https://cdn.jsdelivr.net/npm/alasql@4.20.0/dist/alasql.min.js");
  if (!window.alasql) {
    throw new Error("SQL engine did not start.");
  }
  return window.alasql;
}

export async function runSql(code: string): Promise<RunResult> {
  try {
    const alasql = await getAlasql();
    for (const statement of retailStatements) {
      alasql(statement);
    }
    const result = alasql(code);
    if (!Array.isArray(result)) {
      return { ok: true, output: result == null ? "Done." : String(result) };
    }
    const rows = result as Record<string, SqlValue>[];
    if (rows.length === 0) {
      return { ok: true, output: "Query returned no rows.", rows };
    }
    return { ok: true, output: `${rows.length} row${rows.length === 1 ? "" : "s"}`, rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: message.split("\n")[0] };
  }
}
