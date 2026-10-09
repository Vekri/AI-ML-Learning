import type { Topic } from "../types";

export const round5: Topic[] = [
  {
    slug: "project-deep-dive",
    title: "Explain your architecture",
    round: "leadership",
    priority: "very-high",
    minutes: 18,
    technologies: ["retail analytics", "XGBoost", "FastAPI", "PostgreSQL", "RAG"],
    interviewerWants:
      "One system you can draw: problem, data, model, service, and what you would change. Use your real project. The reference below is a practice narrative.",
    sayIn60:
      "I pick one system and stay inside it. A practice shape that matches retail and GenAI work is a store-SKU demand score plus an associate assistant over current policy. The warehouse builds the weekly feature table. A gradient-boosted model trains on a time split and ships as a versioned artifact. FastAPI scores live requests. Policy answers go through RAG with a refusal when retrieval misses, because a fluent guess on a refund rule is worse than a handoff. I can name the grain of the feature table, why boosting beat the seasonal-naive baseline, how the image was promoted, and the incident where a feature job broke while the API stayed green.",
    fiveMinute: [
      "Business question and who used the output.",
      "Grain of the training table and the time split.",
      "Baseline, model, and the metric in business units.",
      "Online path and batch path, if both exist.",
      "The GenAI boundary: what is retrieved, what is refused.",
      "One production failure and the test you added.",
      "Replace every number with a result you personally measured.",
    ],
    sections: [
      {
        heading: "Use this as a scaffold, then swap in your work",
        paragraphs: [
          "Interviewers can tell a borrowed architecture from one you operated. Practice the reference system until the sequence is smooth, then retell it with your tables, your metric, and your incident. If you did not run RAG in production, say so and go deep on the demand service. Do not invent a metric.",
          "The reference business question is: how many units of this SKU should this store expect next week, and can an associate answer a policy question from the current manual without guessing.",
        ],
      },
      {
        heading: "Reference architecture",
        paragraphs: [
          "Data sits in a warehouse. The feature job emits one row per store, SKU, and week: lags, a rolling mean, promo flags, price, and calendar fields. Labels are next-week units. Training uses weeks before a cutoff. The following weeks are validation. A final later slice is touched once.",
          "The model is a gradient booster, compared with a baseline that repeats last week and a linear model. The artifact and the feature function ship together. FastAPI loads them. PostgreSQL stores the prediction log. A separate RAG index holds policy chunks in pgvector, filtered by region and document version. The assistant cites a chunk or refuses. Docker images are promoted by git SHA after a metric gate and a smoke test.",
        ],
        bullets: [
          "Batch features in SQL. Row rules and the model in Python.",
          "One feature function imported by training and by the API.",
          "Demand model and policy assistant are separate services that share an auth model.",
          "Rollback is the previous image, not a hotfix on the server.",
        ],
      },
      {
        heading: "What you defend when they interrupt",
        paragraphs: [
          "Why not a single deep network: tabular weekly data, mixed types, a need to explain which signals moved, and a baseline that was already strong. Why RAG and not a fine-tune for policy: the manual changes, and answers must cite the current version. Why Postgres for vectors: the corpus fit, and the access rules already lived there. If any of those constraints were different in your real system, say the constraint you actually had.",
        ],
      },
    ],
    examples: [
      {
        id: "mini-pipeline",
        title: "Score demand, then ground a policy question",
        language: "python",
        summary:
          "Runs in the browser. Two products in one story: a demand score with an explicit baseline, and a policy answer that refuses without a passage.",
        code: `def baseline(last_week):
    return last_week

def model_units(last_week, promo):
    # Stand-in for a booster that beat the baseline on a time split.
    return round(last_week * (1.15 if promo else 0.95), 1)

def demand(last_week, promo):
    base = baseline(last_week)
    pred = model_units(last_week, promo)
    return {"baseline": base, "model": pred, "lift_units": round(pred - base, 1)}

POLICIES = [
    ("returns-dairy", "opened dairy refunded within 7 days with a receipt"),
]

def policy_answer(question):
    q = question.lower()
    hits = [item for item in POLICIES if "dairy" in q or "refund" in q]
    if "dairy" not in q and "refund" not in q:
        hits = []
    if not hits:
        return {"refused": True, "text": "No grounded passage."}
    doc_id, text = hits[0]
    return {"refused": False, "cite": doc_id, "text": text}

print("demand", demand(40, True))
print("policy", policy_answer("Can I refund opened dairy?"))
print("policy", policy_answer("Will it rain on Saturday?"))
`,
      },
    ],
    followUps: [
      {
        q: "What would you change if you built it again?",
        a: "Answer with one real regret: an earlier contract test on the feature job, a labeled retrieval set before prompt tuning, or a shadow deploy. Do not list a rewrite of every layer.",
      },
      {
        q: "How did you know it worked?",
        a: "A metric against a baseline on a later time period, and a business measure you can explain, such as waste or stockouts, with the caveat that the model was not the only thing that changed.",
      },
    ],
    pitfalls: [
      "A tour of every logo you have touched.",
      "Numbers you cannot define when asked how they were computed.",
      "No baseline, so the model has nothing to beat.",
    ],
  },
  {
    slug: "design-tradeoffs",
    title: "Design decisions and trade-offs",
    round: "leadership",
    priority: "core",
    minutes: 10,
    technologies: ["baselines", "build vs buy", "complexity"],
    interviewerWants:
      "A decision, the alternative you rejected, and the constraint that made it.",
    sayIn60:
      "I state the constraint before the tool. For a weekly tabular forecast I would rather ship a regularized booster with a time-based backtest than a larger model I cannot explain or retrain on schedule. For policy text I would rather retrieve and cite than fine-tune, because the document changes. I rejected a dedicated vector database while the corpus fit in Postgres with the access rules. I would revisit that when recall or QPS says the index is the bottleneck. A trade-off needs a review date, not a permanent slogan.",
    fiveMinute: [
      "Constraint, options, choice, what you gave up.",
      "Name the rejected design in one sentence.",
      "Say what evidence would change your mind.",
      "Cost, latency, and operability count as much as accuracy.",
    ],
    sections: [
      {
        heading: "A shape that holds up under questions",
        paragraphs: [
          "Option A, option B, the constraint, the choice, the cost. For example: a nightly batch score is simpler and stale by a day; an online model is fresh and must keep the feature path fast. I chose nightly for stores that order in the morning, and online only for the exception path. The rejected option was scoring every SKU on each page view, which the database could not support at the time.",
        ],
      },
    ],
    examples: [
      {
        id: "choose-with-constraint",
        title: "Pick the design the constraint allows",
        language: "python",
        summary:
          "Runs in the browser. A small decision table. The interesting part is the reason string, which is what you say out loud.",
        code: `OPTIONS = [
    {"name": "seasonal naive", "mae": 11.0, "ops": "easy", "cites": False},
    {"name": "booster batch", "mae": 7.5, "ops": "moderate", "cites": False},
    {"name": "online deep model", "mae": 7.3, "ops": "hard", "cites": False},
]

def choose(options, max_ops):
    allowed = {"easy": 1, "moderate": 2, "hard": 3}
    pool = [opt for opt in options if allowed[opt["ops"]] <= allowed[max_ops]]
    best = min(pool, key=lambda opt: opt["mae"])
    return best

picked = choose(OPTIONS, "moderate")
print("choice", picked["name"], "mae", picked["mae"])
print("rejected online deep model: 0.2 MAE was not worth the online feature path")
print("revisit if the batch score is stale for the order cutoff")
`,
      },
    ],
    followUps: [
      {
        q: "When do you choose the more complex system?",
        a: "When the simple one misses a constraint that matters: a latency SLO, a regulatory need to explain a denial, or a measured gap the business is willing to pay to close.",
      },
    ],
    pitfalls: [
      "Listing tools with no rejected alternative.",
      "Choosing a model family before naming the baseline error.",
      "A trade-off you cannot revisit because nobody wrote down the assumption.",
    ],
  },
  {
    slug: "production-challenges",
    title: "Production challenges",
    round: "leadership",
    priority: "core",
    minutes: 10,
    technologies: ["data quality", "skew", "stale indexes", "incidents"],
    interviewerWants:
      "A specific failure, the blast radius, and the permanent fix.",
    sayIn60:
      "The failures that hurt are quiet data changes. A promo flag arrives as text, the model still returns 200s, and the forecast drifts. I contain it by pinning the last good feature snapshot or failing the scorer when the contract breaks. The permanent fix is a check on types, null rate, and range before scoring, plus an alert on prediction mean by model version. For RAG, the matching failure is a re-indexed manual where old chunks were not deleted, so the assistant cites a retired policy. The fix is to upsert by document id and delete missing chunks in the same job.",
    fiveMinute: [
      "Symptom, detection, containment, cause, prevention.",
      "Prefer a contract failure over a confident wrong score.",
      "Index jobs need deletes, not only inserts.",
      "Quantify who was affected if you know. Do not invent a percentage.",
    ],
    sections: [
      {
        heading: "Stories worth preparing",
        paragraphs: [
          "Prepare two. One is a feature or label incident on a classical model. One is a retrieval incident: stale chunk, missing filter, or a prompt change that increased refusals or decreased them. For each, know the clock time you noticed, the rollback or the flag, and the test that remains in CI. If you have not had a production incident, walk through a defect you caught in staging and say that it never reached users.",
        ],
      },
    ],
    examples: [
      {
        id: "contract-break",
        title: "Fail a score when the promo flag changes type",
        language: "python",
        summary:
          "Runs in the browser. A string 'Y' is not a boolean. The service rejects the row instead of silently scoring it as false.",
        code: `def score_row(promo):
    if not isinstance(promo, bool):
        raise TypeError("promo must be bool, got " + type(promo).__name__)
    return 48.0 if promo else 16.0

for value in (True, "Y", False):
    try:
        print(repr(value), "->", score_row(value))
    except TypeError as exc:
        print(repr(value), "-> reject:", exc)
`,
      },
    ],
    followUps: [
      {
        q: "How do you detect a stale vector index?",
        a: "Stamp each chunk with a document version and an indexed_at time. A query that can still return a retired version is a bug. A job metric that compares source document counts to distinct document ids in the index catches a missed delete.",
      },
    ],
    pitfalls: [
      "A hero story with no permanent control.",
      "Blaming the model for a broken feed.",
      "Leaving retired chunks in the index because upsert felt like enough.",
    ],
  },
  {
    slug: "business-impact",
    title: "Business impact",
    round: "leadership",
    priority: "core",
    minutes: 8,
    technologies: ["baseline", "experiment", "cost of error"],
    interviewerWants:
      "Impact tied to a baseline and a decision, with uncertainty you do not paper over.",
    sayIn60:
      "I translate the model into the decision it changed. A demand model matters if it beats the planner's current rule on a later period and the error is the kind the business feels, such as missed sales or waste. I report the baseline metric and the model metric in the same units. If we also changed the ordering process, I say the model was only part of the result. For an assistant, impact might be handle time or a lower rate of wrong policy answers, measured on reviewed transcripts, not on how impressive a demo felt.",
    fiveMinute: [
      "Who acted on the output.",
      "Baseline and model, same metric, same time range.",
      "Cost of a false positive versus a false negative if it is a classifier.",
      "What you will not claim: revenue you did not measure.",
    ],
    sections: [
      {
        heading: "Units a buyer recognizes",
        paragraphs: [
          "MAE in units per store-SKU-week can be turned into a statement about cases ordered, if you know how orders use the forecast. Do that conversion with the planner, and label the assumptions. An uplift model needs a comparison that was not also exposed to the new process, or you describe it as a before-and-after with confounders.",
        ],
      },
    ],
    examples: [
      {
        id: "lift-against-baseline",
        title: "Report lift only against the baseline",
        language: "python",
        summary:
          "Runs in the browser. Absolute error for a repeat-last-week rule and for a model. The sentence at the end is the kind you are allowed to say.",
        code: `weeks = [
    # actual, baseline, model
    (50, 40, 47),
    (12, 14, 13),
    (30, 42, 33),
    (20, 18, 21),
    (44, 30, 40),
]

def mae(pairs):
    rows = list(pairs)
    return sum(abs(a - b) for a, b in rows) / len(rows)

base = mae((actual, base) for actual, base, _ in weeks)
model = mae((actual, pred) for actual, _, pred in weeks)
print("baseline mae", round(base, 2))
print("model mae", round(model, 2))
print(
    f"On these weeks the model cut absolute error by {base - model:.1f} units "
    "versus repeating last week."
)
`,
      },
    ],
    followUps: [
      {
        q: "What if the business metric did not move?",
        a: "Say so. A better offline MAE that did not change orders is a finding about the process, not a failure to mention. The next step is to see whether anyone used the score.",
      },
    ],
    pitfalls: [
      "A percentage with no denominator.",
      "Taking credit for a seasonal peak.",
      "Quoting accuracy when the costly class is the rare one.",
    ],
  },
  {
    slug: "technical-leadership",
    title: "Technical leadership",
    round: "leadership",
    priority: "core",
    minutes: 10,
    technologies: ["design review", "mentoring", "standards", "incidents"],
    interviewerWants:
      "How you raise the quality of other people's systems, not only your own commits.",
    sayIn60:
      "I lead by making the next review easier. That means a written design before a large build, a feature contract tests can enforce, and a metric definition the team agrees on before anyone trains. In review I ask what the baseline is, how the split respects time, and how we roll back. I mentor by pairing on one production path end to end, not by rewriting someone's module overnight. I will stop a launch when the eval set is missing or the on-call owner is unclear. Shipping faster than we can explain is not senior behavior.",
    fiveMinute: [
      "A design review you ran and what changed because of it.",
      "A standard you wrote: feature contracts, RAG evals, or deploy gates.",
      "How you mentor: pairing, review comments that teach, follow-through.",
      "A launch you delayed and the risk you were refusing.",
      "How incidents are owned and written up.",
    ],
    sections: [
      {
        heading: "What to prepare as stories",
        paragraphs: [
          "Bring three scenes from your own career. One design review where you changed the approach. One person you helped become independent on a service. One time you said not yet, with the condition that would make it yes. Keep each scene under two minutes. Offer to go deeper on whichever they pick.",
          "If they ask how you work with data scientists, engineers, and analysts, describe the artifact that crosses the boundary: a feature definition, a labeled retrieval set, or a service contract. Shared artifacts beat status meetings.",
        ],
      },
    ],
    examples: [
      {
        id: "launch-review",
        title: "A launch review that can say not yet",
        language: "python",
        summary:
          "Runs in the browser. Four checks a lead can insist on. The interesting output is the list of gaps, which is what you send back to the team.",
        code: `def review(design):
    gaps = []
    if not design["baseline"]:
        gaps.append("name the baseline and its metric")
    if design["split"] != "time":
        gaps.append("use a time-based split for this forecast")
    if not design["rollback"]:
        gaps.append("document the previous image and how to route back")
    if not design["owner"]:
        gaps.append("name the on-call owner")
    return gaps

proposal = {
    "baseline": False,
    "split": "random",
    "rollback": True,
    "owner": "",
}
gaps = review(proposal)
if gaps:
    print("not yet")
    for gap in gaps:
        print(" -", gap)
else:
    print("launch")
`,
      },
    ],
    followUps: [
      {
        q: "How do you disagree with a stakeholder who wants the model this week?",
        a: "I say what can ship this week, such as the baseline dashboard or a shadow score, and what cannot, such as an untested policy assistant. I offer a date tied to the missing eval, not a vague promise to try.",
      },
      {
        q: "How do you review a junior engineer's RAG change?",
        a: "I ask them to show the retrieval eval before the prompt diff. I look for filters, deletes of old chunks, and a refusal test. I comment on those, and I leave style nits to the formatter.",
      },
    ],
    pitfalls: [
      "Leadership as a list of meetings.",
      "Taking over the keyboard and calling it mentoring.",
      "Approving a launch because the demo went well in the room.",
    ],
  },
];
