import Link from "next/link";
import { topicsFor } from "@/lib/catalog";
import { rounds } from "@/lib/rounds";
import type { Priority } from "@/lib/types";

const priorityRank: Priority[] = ["very-high", "high"];
const priorityLabel: Record<Priority, string> = {
  "very-high": "Very high",
  high: "High",
  core: "Core",
};

const firstQuestions = [
  ["Very high", "Explain your Python experience", "python-experience", "Real projects, pandas, APIs, OOP"],
  ["Very high", "How does a Random Forest work?", "random-forest", "Bagging, decision trees, feature importance"],
  ["Very high", "What is overfitting?", "overfitting", "Regularization, cross-validation, generalization"],
  ["Very high", "Explain RAG architecture", "rag-architecture", "Ingestion, chunking, embeddings, retrieval, LLM"],
  ["Very high", "Why use a vector database?", "vector-databases", "Semantic similarity, indexing, retrieval"],
  ["Very high", "How does a Transformer work?", "transformers", "Attention, tokens, embeddings, encoder/decoder"],
  ["Very high", "How do you deploy an ML model?", "deploy-model", "Training, serialization, FastAPI, Docker"],
  ["High", "What is MCP?", "mcp", "Tools, resources, prompts, client/server"],
  ["High", "LangChain vs LangGraph", "langchain-langgraph", "Chains and integrations vs stateful workflows"],
  ["High", "How do you prevent hallucinations?", "hallucinations", "Grounding, retrieval quality, citations, evaluation"],
  ["High", "How do you evaluate classification models?", "classification-metrics", "Precision, recall, F1, ROC-AUC, PR-AUC"],
  ["High", "How do you optimize SQL queries?", "sql-optimization", "Indexes, execution plans, joins, filtering"],
] as const;

export default function Home() {
  const highlighted = priorityRank.flatMap((priority) =>
    topicsFor("python-sql")
      .concat(topicsFor("ml"), topicsFor("genai"), topicsFor("architecture"), topicsFor("leadership"))
      .filter((topic) => topic.priority === priority),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm uppercase tracking-[0.18em] text-copper">Senior AI/ML Engineer</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight">
        Explain what you built, why you chose it, and how it runs.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        A hands-on lab for Python, SQL, classical ML, retrieval systems, and production deployment.
        Every Python and SQL example on this site runs in the browser.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/topics/rag-architecture" className="rounded-full bg-pine px-4 py-2 text-sm text-paper">
          Start with RAG
        </Link>
        <Link href="/lab" className="rounded-full border border-line px-4 py-2 text-sm">
          Open the code lab
        </Link>
      </div>

      <section className="mt-10 max-w-3xl rounded-2xl border border-line bg-card p-5 text-sm leading-7">
        These five rounds are preparation areas. They are not a claim about any employer&apos;s exact
        interview sequence. Public job descriptions and candidate notes often mention Python, ML
        frameworks, transformers, RAG, vector search, APIs, cloud, and deployment. Treat that as a
        study signal, not a guaranteed question list.
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Roadmap</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {rounds.map((round) => {
            const topics = topicsFor(round.slug);
            return (
              <Link
                key={round.slug}
                href={`/rounds/${round.slug}`}
                className="rounded-2xl border border-line bg-card p-5 hover:border-copper"
              >
                <p className="text-sm text-copper">Round {round.number}</p>
                <h3 className="mt-1 font-serif text-2xl">{round.title}</h3>
                <p className="mt-2 leading-7 text-muted">{round.aim}</p>
                <p className="mt-3 text-sm">{topics.length} lessons</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Prepare these first</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Question</th>
                <th className="px-4 py-3 font-medium">What you must explain</th>
              </tr>
            </thead>
            <tbody>
              {firstQuestions.map(([priority, question, slug, must]) => (
                <tr key={slug} className="border-b border-line/80 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{priority}</td>
                  <td className="px-4 py-3">
                    <Link href={`/topics/${slug}`} className="font-medium hover:text-copper">
                      {question}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{must}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          {highlighted.length} high-priority lessons are linked above and inside each round, along with the
          core topics around them. Priority labels: {priorityLabel["very-high"]}, {priorityLabel.high}, and{" "}
          {priorityLabel.core}.
        </p>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-line p-5">
          <h2 className="font-serif text-2xl">Answer in layers</h2>
          <p className="mt-2 leading-7 text-muted">
            Each lesson has a 60-second answer, a five-minute outline, the design choice, and the follow-up
            that usually comes next.
          </p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <h2 className="font-serif text-2xl">Run the code</h2>
          <p className="mt-2 leading-7 text-muted">
            Standard-library Python starts quickly. pandas and scikit-learn download once into the browser
            session. SQL uses a small retail database: stores, products, and sales.
          </p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <h2 className="font-serif text-2xl">Tell your project</h2>
          <p className="mt-2 leading-7 text-muted">
            The leadership round is a practice narrative for demand forecasting and a policy assistant.
            Replace the scaffold with systems you actually operated.
          </p>
        </div>
      </section>
    </div>
  );
}
