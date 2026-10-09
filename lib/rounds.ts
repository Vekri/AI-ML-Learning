import type { Round } from "./types";

export const rounds: Round[] = [
  {
    slug: "python-sql",
    number: 1,
    title: "Python, SQL, and programming",
    short: "Python & SQL",
    aim: "Show that you can model data, write clear Python, and get the right rows out of a warehouse without a query that melts the cluster.",
    signals: [
      "Data structures chosen for the access pattern",
      "OOP used where state and invariants matter",
      "pandas for tabular work, not as a reflex",
      "Joins, window functions, and an execution plan",
    ],
  },
  {
    slug: "ml",
    number: 2,
    title: "Machine learning and statistics",
    short: "ML & statistics",
    aim: "Explain the model, the failure mode, and the metric in business language. A senior answer names the baseline and the cost of a wrong prediction.",
    signals: [
      "Bias, variance, and what you regularize",
      "Metrics matched to class balance and cost",
      "Feature design you can defend",
      "Trees, boosting, and when a linear model wins",
    ],
  },
  {
    slug: "genai",
    number: 3,
    title: "GenAI, RAG, and agents",
    short: "GenAI & RAG",
    aim: "Walk the path from document to grounded answer, and say where the system is allowed to refuse.",
    signals: [
      "Chunking, embeddings, and retrieval quality",
      "Why a vector index exists",
      "Transformers at the attention-mechanism level",
      "LangGraph, tools, MCP, evals, and guardrails",
    ],
  },
  {
    slug: "architecture",
    number: 4,
    title: "Architecture and deployment",
    short: "Deploy",
    aim: "Treat the model as a versioned service: schema, image, rollout, metrics, and a rollback you have actually used.",
    signals: [
      "FastAPI plus a validated feature contract",
      "PostgreSQL, Docker, and CI/CD",
      "Latency, drift, and cost monitoring",
      "Security and a production incident story",
    ],
  },
  {
    slug: "leadership",
    number: 5,
    title: "Project deep dive and leadership",
    short: "Leadership",
    aim: "Tell one system end to end: the constraint, the design, the trade-off, the incident, and the decision you made as a lead.",
    signals: [
      "Architecture you can draw from memory",
      "Trade-offs with a rejected alternative",
      "Impact stated as a measured change",
      "How you review, mentor, and stop a bad launch",
    ],
  },
];

export function getRound(slug: string) {
  return rounds.find((round) => round.slug === slug);
}
