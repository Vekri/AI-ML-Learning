import Link from "next/link";
import { technologies } from "@/lib/catalog";

export const metadata = {
  title: "Technologies · AI/ML Lab",
  description: "Every technology used in the interview lab, linked to the lesson that explains it.",
};

export default function StackPage() {
  const items = technologies();
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-serif text-4xl tracking-tight">Technologies</h1>
      <p className="mt-3 leading-7 text-muted">
        Each name links to the lesson where it is explained with an example. The point is the reason you
        would choose it, not a logo list.
      </p>
      <ul className="mt-8 space-y-4">
        {items.map(([name, topics]) => (
          <li key={name} className="rounded-2xl border border-line bg-card px-4 py-3">
            <h2 className="font-medium">{name}</h2>
            <p className="mt-1 text-sm leading-6">
              {topics.map((topic, index) => (
                <span key={topic.slug}>
                  {index > 0 ? ", " : null}
                  <Link href={`/topics/${topic.slug}`} className="hover:text-copper">
                    {topic.title}
                  </Link>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
