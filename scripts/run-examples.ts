import { spawnSync } from "node:child_process";
import alasql from "alasql";
import { topics } from "../lib/catalog";
import { retailStatements } from "../lib/retail-sql";

const python = spawnSync("python", ["--version"], { encoding: "utf8" });
const pythonCmd = python.status === 0 ? "python" : "py";

function runPython(code: string) {
  const result = spawnSync(pythonCmd, ["-c", code], { encoding: "utf8" });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

let failed = 0;

for (const topic of topics) {
  for (const example of topic.examples) {
    if (example.language === "sql") {
      try {
        for (const statement of retailStatements) alasql(statement);
        const rows = alasql(example.code);
        const count = Array.isArray(rows) ? rows.length : 0;
        if (!Array.isArray(rows)) {
          console.log(`FAIL ${topic.slug}/${example.id}: not a row set`);
          failed += 1;
        } else if (count === 0) {
          console.log(`FAIL ${topic.slug}/${example.id}: zero rows`);
          failed += 1;
        } else {
          console.log(`ok   sql  ${example.id} (${count} rows)`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
        console.log(`FAIL ${topic.slug}/${example.id}: ${message}`);
        failed += 1;
      }
      continue;
    }

    if (example.packages?.length) {
      const probe = spawnSync(pythonCmd, ["-c", `import ${example.packages.map((name) => (name === "scikit-learn" ? "sklearn" : name)).join(", ")}`], { encoding: "utf8" });
      if (probe.status !== 0) {
        console.log(`skip py   ${example.id} needs ${example.packages.join(", ")}`);
        continue;
      }
    }

    const result = runPython(example.code);
    if (!result.ok) {
      console.log(`FAIL ${topic.slug}/${example.id}`);
      console.log(result.output);
      failed += 1;
    } else {
      console.log(`ok   py   ${example.id}`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed`);
  process.exit(1);
}
console.log("\nAll checked examples passed.");
