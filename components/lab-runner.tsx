"use client";

import { useState } from "react";
import Link from "next/link";
import type { Example } from "@/lib/types";
import { ExamplePanel } from "./example-panel";
import { runPython, runSql } from "./runners";

type LabExample = Example & { topicTitle: string; topicSlug: string };

export function LabRunner({ examples }: { examples: LabExample[] }) {
  const [report, setReport] = useState<string>("");
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    const failures: string[] = [];
    for (const example of examples) {
      setReport(`Running ${example.id}…`);
      const result =
        example.language === "python"
          ? await runPython(example.code, example.packages ?? [])
          : await runSql(example.code);
      if (!result.ok) failures.push(`${example.id}: ${result.output}`);
    }
    setRunning(false);
    setReport(
      failures.length === 0
        ? `All ${examples.length} examples finished.`
        : `${failures.length} failed.\n${failures.join("\n")}`,
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={runAll}
        disabled={running}
        className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
      >
        {running ? "Running all examples" : "Run all examples"}
      </button>
      {report ? <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{report}</pre> : null}
      <div className="mt-8 space-y-8">
        {examples.map((example) => (
          <div key={`${example.topicSlug}-${example.id}`}>
            <p className="mb-2 text-sm text-muted">
              <Link href={`/topics/${example.topicSlug}`} className="hover:text-copper">
                {example.topicTitle}
              </Link>
            </p>
            <ExamplePanel example={example} />
          </div>
        ))}
      </div>
    </div>
  );
}
