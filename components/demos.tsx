"use client";

import { useMemo, useState } from "react";

const TOKENS = ["the", "store", "needs", "milk"];
const VECTORS = [
  [0.2, 0.1],
  [0.9, 0.2],
  [0.1, 0.8],
  [0.6, 0.7],
];

function softmax(scores: number[]) {
  const peak = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - peak));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

export function AttentionDemo() {
  const [causal, setCausal] = useState(false);
  const [queryIndex, setQueryIndex] = useState(3);
  const weights = useMemo(() => {
    const query = VECTORS[queryIndex];
    const scale = Math.sqrt(VECTORS[0].length);
    const scores = VECTORS.map((key, index) => {
      const dot = query[0] * key[0] + query[1] * key[1];
      if (causal && index > queryIndex) return Number.NEGATIVE_INFINITY;
      return dot / scale;
    });
    return softmax(scores);
  }, [causal, queryIndex]);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl">Attention you can point at</h3>
        <button
          type="button"
          onClick={() => setCausal((value) => !value)}
          className="rounded-full border border-line px-3 py-1.5 text-sm"
        >
          {causal ? "Causal mask on" : "Bidirectional"}
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        Choose the token that is asking. Bar length is its attention over the sequence. With the causal mask, future tokens get no weight.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TOKENS.map((token, index) => (
          <button
            key={token}
            type="button"
            onClick={() => setQueryIndex(index)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              index === queryIndex ? "bg-copper text-paper" : "bg-paper text-ink"
            }`}
          >
            {token}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {TOKENS.map((token, index) => (
          <div key={token} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
            <span className="font-mono text-sm">{token}</span>
            <div className="h-3 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full bg-pine"
                style={{ width: `${Math.max(2, weights[index] * 100)}%` }}
              />
            </div>
            <span className="font-mono text-sm">{weights[index].toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PASSAGES = [
  { id: "returns-dairy", text: "Opened dairy can be refunded within 7 days with a receipt." },
  { id: "promo-override", text: "A manager can override a promo price only when the shelf tag is missing." },
  { id: "waste-milk", text: "Milk past the sell-by date is written off and is not donated." },
];

function tokensOf(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function cosineBow(left: string, right: string) {
  const a = new Map<string, number>();
  const b = new Map<string, number>();
  for (const token of tokensOf(left)) a.set(token, (a.get(token) ?? 0) + 1);
  for (const token of tokensOf(right)) b.set(token, (b.get(token) ?? 0) + 1);
  const keys = new Set([...a.keys(), ...b.keys()]);
  let dot = 0;
  let leftSq = 0;
  let rightSq = 0;
  for (const key of keys) {
    const x = a.get(key) ?? 0;
    const y = b.get(key) ?? 0;
    dot += x * y;
    leftSq += x * x;
    rightSq += y * y;
  }
  if (leftSq === 0 || rightSq === 0) return 0;
  return dot / Math.sqrt(leftSq * rightSq);
}

export function RagDemo() {
  const [question, setQuestion] = useState("Can I refund opened milk?");
  const ranked = PASSAGES.map((passage) => ({
    ...passage,
    score: cosineBow(question, passage.text),
  })).sort((a, b) => b.score - a.score);
  const grounded = ranked[0].score >= 0.2;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="font-serif text-2xl">Retrieval before an answer</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        This uses word overlap as a stand-in for embeddings. A weak top score refuses instead of guessing.
      </p>
      <label className="mt-4 block text-sm font-medium" htmlFor="rag-question">
        Question
      </label>
      <input
        id="rag-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <div className="mt-4 space-y-2">
        {ranked.map((passage) => (
          <div key={passage.id} className="rounded-xl bg-paper px-3 py-2 text-sm">
            <div className="flex justify-between gap-3 font-mono">
              <span>{passage.id}</span>
              <span>{passage.score.toFixed(2)}</span>
            </div>
            <p className="mt-1 leading-6">{passage.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6">
        {grounded
          ? `Answer from ${ranked[0].id}: ${ranked[0].text}`
          : "Refusal: no passage is close enough to ground an answer."}
      </p>
    </div>
  );
}

export function MetricsDemo() {
  const [tp, setTp] = useState(30);
  const [fp, setFp] = useState(10);
  const [fn, setFn] = useState(20);
  const [tn, setTn] = useState(140);
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (tp + tn) / (tp + tn + fp + fn);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="font-serif text-2xl">Confusion counts</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Move the rare positive class. Accuracy stays flattering. Precision, recall, and F1 tell you the cost.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          ["True positive", tp, setTp],
          ["False positive", fp, setFp],
          ["False negative", fn, setFn],
          ["True negative", tn, setTn],
        ].map(([label, value, setter]) => (
          <label key={String(label)} className="text-sm">
            <span className="flex justify-between">
              {label as string}
              <span className="font-mono">{value as number}</span>
            </span>
            <input
              type="range"
              min={0}
              max={200}
              value={value as number}
              onChange={(event) => (setter as (next: number) => void)(Number(event.target.value))}
              className="mt-2 w-full accent-pine"
            />
          </label>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          ["Accuracy", accuracy],
          ["Precision", precision],
          ["Recall", recall],
          ["F1", f1],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl bg-paper px-3 py-2">
            <dt className="text-muted">{label as string}</dt>
            <dd className="font-mono text-lg">{(value as number).toFixed(2)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const STUMPS = [
  { feature: "promo", vote: "yes" },
  { feature: "last week", vote: "yes" },
  { feature: "temp", vote: "no" },
  { feature: "weekend", vote: "yes" },
  { feature: "promo", vote: "yes" },
];

export function ForestDemo() {
  const yes = STUMPS.filter((stump) => stump.vote === "yes").length;
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="font-serif text-2xl">Five trees, one vote</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Each stump saw a bootstrap sample and one feature. The forest predicts the majority. Agreement is the point of averaging.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {STUMPS.map((stump, index) => (
          <div key={index} className="rounded-xl bg-paper px-3 py-3 text-sm">
            <p className="text-muted">Tree {index + 1}</p>
            <p className="mt-1 font-medium">{stump.feature}</p>
            <p className="font-mono">{stump.vote}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm">
        Yes votes {yes} of {STUMPS.length}. Forest label: <span className="font-medium">{yes > STUMPS.length / 2 ? "yes" : "no"}</span>.
      </p>
    </div>
  );
}

export function TopicDemo({ kind }: { kind: "attention" | "rag" | "metrics" | "forest" }) {
  if (kind === "attention") return <AttentionDemo />;
  if (kind === "rag") return <RagDemo />;
  if (kind === "metrics") return <MetricsDemo />;
  return <ForestDemo />;
}
