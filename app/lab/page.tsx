import { topics } from "@/lib/catalog";
import { LabRunner } from "@/components/lab-runner";

export const metadata = {
  title: "Code lab · AI/ML Lab",
  description: "Run every Python and SQL interview example in the browser.",
};

export default function LabPage() {
  const examples = topics.flatMap((topic) =>
    topic.examples.map((example) => ({
      ...example,
      topicTitle: topic.title,
      topicSlug: topic.slug,
    })),
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-serif text-4xl tracking-tight">Code lab</h1>
      <p className="mt-3 leading-7 text-muted">
        {examples.length} runnable examples. Python uses Pyodide. SQL rebuilds the sample retail tables
        before each query. pandas and scikit-learn load the first time you run an example that needs them.
      </p>
      <LabRunner examples={examples} />
    </div>
  );
}
