import { notFound } from "next/navigation";
import { TopicView } from "@/components/topic-view";
import { getTopic, topics } from "@/lib/catalog";

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopic(slug);
  return {
    title: topic ? `${topic.title} · AI/ML Lab` : "Lesson",
    description: topic?.sayIn60,
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();
  return <TopicView topic={topic} />;
}
