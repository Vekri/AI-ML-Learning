export type RoundSlug =
  | "python-sql"
  | "ml"
  | "genai"
  | "architecture"
  | "leadership";

export type Priority = "very-high" | "high" | "core";

export type ExampleLanguage = "python" | "sql";

export type Example = {
  id: string;
  title: string;
  language: ExampleLanguage;
  summary: string;
  code: string;
  /** Pyodide packages to load before running. Empty means the standard library only. */
  packages?: string[];
};

export type Artifact = {
  title: string;
  language: string;
  note: string;
  code: string;
};

export type TopicSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Topic = {
  slug: string;
  title: string;
  round: RoundSlug;
  priority: Priority;
  minutes: number;
  technologies: string[];
  interviewerWants: string;
  sayIn60: string;
  fiveMinute: string[];
  sections: TopicSection[];
  examples: Example[];
  artifacts?: Artifact[];
  demo?: "attention" | "rag" | "metrics" | "forest";
  followUps: { q: string; a: string }[];
  pitfalls: string[];
};

export type Round = {
  slug: RoundSlug;
  number: number;
  title: string;
  short: string;
  aim: string;
  signals: string[];
};
