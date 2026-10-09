import { rounds } from "./rounds";
import { round1 } from "./topics/round1";
import { round2 } from "./topics/round2";
import { round3 } from "./topics/round3";
import { round4 } from "./topics/round4";
import { round5 } from "./topics/round5";
import type { RoundSlug, Topic } from "./types";

export const topics: Topic[] = [
  ...round1,
  ...round2,
  ...round3,
  ...round4,
  ...round5,
];

const slugCount = new Set(topics.map((topic) => topic.slug)).size;
if (slugCount !== topics.length) {
  throw new Error("Duplicate topic slug");
}

export function getTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function topicsFor(round: RoundSlug) {
  return topics.filter((topic) => topic.round === round);
}

export function neighborTopics(slug: string) {
  const index = topics.findIndex((topic) => topic.slug === slug);
  return {
    previous: index > 0 ? topics[index - 1] : undefined,
    next: index >= 0 && index < topics.length - 1 ? topics[index + 1] : undefined,
  };
}

export function priorityTopics() {
  const rank = { "very-high": 0, high: 1, core: 2 };
  return [...topics].sort((a, b) => rank[a.priority] - rank[b.priority]);
}

export function technologies() {
  const map = new Map<string, Topic[]>();
  for (const topic of topics) {
    for (const name of topic.technologies) {
      const list = map.get(name) ?? [];
      list.push(topic);
      map.set(name, list);
    }
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function roundOf(topic: Topic) {
  return rounds.find((round) => round.slug === topic.round);
}
