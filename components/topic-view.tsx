import Link from "next/link";
import { neighborTopics, roundOf } from "@/lib/catalog";
import type { Topic } from "@/lib/types";
import { TopicDemo } from "./demos";
import { ExamplePanel } from "./example-panel";
import { PracticeTimer } from "./practice-timer";

const priorityLabel = {
  "very-high": "Very high",
  high: "High",
  core: "Core",
};

export function TopicView({ topic }: { topic: Topic }) {
  const round = roundOf(topic);
  const { previous, next } = neighborTopics(topic.slug);

  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm text-muted">
        <Link href={`/rounds/${topic.round}`} className="hover:text-ink">
          Round {round?.number}. {round?.title}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted">
        <span className="rounded-full bg-copper/15 px-2 py-1 text-copper">{priorityLabel[topic.priority]}</span>
        <span>{topic.minutes} min</span>
      </div>
      <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight">{topic.title}</h1>
      <ul className="mt-4 flex flex-wrap gap-2">
        {topic.technologies.map((name) => (
          <li key={name} className="rounded-full border border-line px-2.5 py-1 text-xs">
            {name}
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">What they are listening for</h2>
        <p className="mt-2 leading-7">{topic.interviewerWants}</p>
      </section>

      <section className="mt-6 rounded-2xl bg-pine p-5 text-paper">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Say this in 60 seconds</h2>
          <PracticeTimer />
        </div>
        <p className="mt-3 leading-7 text-[#f3ecdf]">{topic.sayIn60}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Five-minute outline</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-7">
          {topic.fiveMinute.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      {topic.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="font-serif text-2xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-7">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {topic.demo ? (
        <div className="mt-8">
          <TopicDemo kind={topic.demo} />
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Run the example</h2>
        <p className="mt-2 leading-7 text-muted">
          Python runs in your browser with Pyodide. SQL runs against the sample stores, products, and sales tables.
        </p>
        <div className="mt-4 space-y-6">
          {topic.examples.map((example) => (
            <ExamplePanel key={example.id} example={example} />
          ))}
        </div>
      </section>

      {topic.artifacts?.length ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Production syntax to recognize</h2>
          <div className="mt-4 space-y-4">
            {topic.artifacts.map((artifact) => (
              <article key={artifact.title} className="overflow-hidden rounded-2xl border border-line">
                <div className="px-4 py-3">
                  <h3 className="font-medium">{artifact.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{artifact.note}</p>
                </div>
                <pre className="overflow-x-auto bg-code px-4 py-4 text-[13px] leading-6 text-[#f3ecdf]">
                  <code>{artifact.code}</code>
                </pre>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Follow-ups</h2>
        <div className="mt-4 space-y-4">
          {topic.followUps.map((item) => (
            <div key={item.q} className="rounded-2xl border border-line bg-card p-4">
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-2 leading-7">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Pitfalls</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
          {topic.pitfalls.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <nav className="mt-10 flex justify-between gap-4 text-sm">
        {previous ? (
          <Link href={`/topics/${previous.slug}`} className="max-w-[45%] hover:text-copper">
            Previous: {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/topics/${next.slug}`} className="max-w-[45%] text-right hover:text-copper">
            Next: {next.title}
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
