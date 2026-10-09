"use client";

import { useState } from "react";
import type { Example } from "@/lib/types";
import { runPython, runSql, type SqlValue } from "./runners";

function ResultTable({ rows }: { rows: Record<string, SqlValue>[] }) {
  const columns = Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-line px-3 py-2 font-medium text-muted"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="odd:bg-paper/70">
              {columns.map((column) => (
                <td key={column} className="border-b border-line/80 px-3 py-2 font-mono text-[13px]">
                  {row[column] == null ? "null" : String(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExamplePanel({ example }: { example: Example }) {
  const [output, setOutput] = useState<string>("");
  const [rows, setRows] = useState<Record<string, SqlValue>[] | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);

  async function execute() {
    setRunning(true);
    setOk(null);
    setRows(null);
    setOutput(
      example.language === "python"
        ? example.packages?.length
          ? "Loading Python packages. The first time this can take a minute."
          : "Starting Python…"
        : "Running query…",
    );
    const result =
      example.language === "python"
        ? await runPython(example.code, example.packages ?? [])
        : await runSql(example.code);
    setOk(result.ok);
    setOutput(result.output || (result.ok ? "Finished with no printed output." : "Failed."));
    setRows(result.ok && result.rows && result.rows.length > 0 ? result.rows : null);
    setRunning(false);
  }

  return (
    <article id={example.id} className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-serif text-lg text-ink">{example.title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{example.summary}</p>
        </div>
        <button
          type="button"
          onClick={execute}
          disabled={running}
          className="shrink-0 rounded-full bg-pine px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {running ? "Running" : "Run"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-code px-4 py-4 text-[13px] leading-6 text-[#f3ecdf]">
        <code>{example.code.trimEnd()}</code>
      </pre>
      {ok !== null || output ? (
        <div
          className={`border-t px-4 py-3 text-sm leading-6 ${
            ok === false ? "border-copper/30 bg-copper/10 text-ink" : "border-line bg-paper text-ink"
          }`}
        >
          <p className="mb-2 font-medium">{ok === false ? "Error" : ok === true ? "Output" : "Status"}</p>
          {rows ? <ResultTable rows={rows} /> : <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[13px]">{output}</pre>}
        </div>
      ) : null}
    </article>
  );
}
