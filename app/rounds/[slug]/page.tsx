import Link from "next/link";
import { notFound } from "next/navigation";
import { topicsFor } from "@/lib/catalog";
import { getRound, rounds } from "@/lib/rounds";

const priorityLabel = {
  "very-high": "Very high",
  high: "High",
  core: "Core",
};

export function generateStaticParams() {
  return rounds.map((round) => ({ slug: round.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const round = getRound(slug);
  return { title: round ? `${round.title} · AI/ML Lab` : "Round" };
}

export default async function RoundPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const round = getRound(slug);
  if (!round) notFound();
  const topics = topicsFor(round.slug);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm text-copper">Round {round.number}</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">{round.title}</h1>
      <p className="mt-4 leading-7">{round.aim}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted">
        {round.signals.map((signal) => (
          <li key={signal}>{signal}</li>
        ))}
      </ul>
      <ol className="mt-8 space-y-3">
        {topics.map((topic, index) => (
          <li key={topic.slug}>
            <Link
              href={`/topics/${topic.slug}`}
              className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card px-4 py-3 hover:border-copper"
            >
              <span>
                <span className="text-sm text-muted">{index + 1}</span>
                <span className="mt-1 block font-medium">{topic.title}</span>
              </span>
              <span className="shrink-0 text-xs uppercase tracking-wide text-copper">
                {priorityLabel[topic.priority]}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
