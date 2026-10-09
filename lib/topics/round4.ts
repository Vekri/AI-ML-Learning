import type { Topic } from "../types";

export const round4: Topic[] = [
  {
    slug: "deploy-model",
    title: "How do you deploy an ML model?",
    round: "architecture",
    priority: "very-high",
    minutes: 14,
    technologies: ["training", "serialization", "FastAPI", "Docker", "CI"],
    interviewerWants:
      "The artifact, the feature contract, the service, and how you roll back.",
    sayIn60:
      "Training produces a versioned artifact and a feature contract, not a notebook. I fit on training data only, evaluate on a later time slice, and serialize the model plus the preprocessing that the model expects. A FastAPI service loads that artifact at startup, validates the request, and returns a prediction with the model version. Docker packages the same Python the tests used. CI refuses the image if the holdout metric drops or the contract tests fail. I deploy the image beside the previous one and shift traffic only after a smoke test. Rollback is the previous image, which is still startable.",
    fiveMinute: [
      "Split train, validation, and a final time-based test you touch once.",
      "Save preprocessing with the model so serving cannot rebuild features differently.",
      "The API validates types and ranges before it scores.",
      "The image is immutable. Config and model version are explicit.",
      "A metric gate and a latency smoke test sit on the deploy path.",
      "Say the rollback you have actually practiced.",
    ],
    sections: [
      {
        heading: "What gets shipped",
        paragraphs: [
          "The unit of release is an immutable bundle: model weights, the feature list in order, category mappings, and a schema for the request. If preprocessing lives only in a notebook, the service will quietly score a different vector. I import the same Python function in training and in the API.",
          "Serialization can be a format the library owns, or a simple parameter file when the model is linear and I want the artifact to be readable. Either way I record a hash, a training data version, and the metric on the holdout set.",
        ],
      },
      {
        heading: "The service boundary",
        paragraphs: [
          "FastAPI is a thin adapter. Pydantic, or an equivalent validator, rejects bad payloads with a 422 before any model code runs. The process loads the model once at startup. The route does not refit and does not read a CSV. Timeouts, a request id, and the model version go into the log. Batch scoring is a separate job if the nightly file is large. The online path stays one row or a small batch.",
        ],
      },
    ],
    examples: [
      {
        id: "fit-save-load",
        title: "Fit, serialize, load, predict",
        language: "python",
        summary:
          "Runs in the browser. A linear model is stored as JSON, which is the same idea as saving a heavier model file: the service loads parameters, it does not refit.",
        code: `import json

# last_week scaled by 50, promo -> next-week units
ROWS = [
    (0.8, 1, 52),
    (0.24, 0, 12),
    (0.6, 1, 44),
    (0.16, 0, 9),
    (0.44, 1, 36),
    (0.3, 0, 15),
    (0.7, 1, 48),
    (0.36, 0, 17),
]

def fit(rows, steps=2500, lr=0.05):
    bias, weight_last, weight_promo = 0.0, 0.0, 0.0
    for _ in range(steps):
        for last, promo, units in rows:
            pred = bias + weight_last * last + weight_promo * promo
            err = pred - units
            bias -= lr * err
            weight_last -= lr * err * last
            weight_promo -= lr * err * promo
    return {
        "version": "demand-linear-7",
        "features": ["units_last_week_scaled", "promo"],
        "bias": round(bias, 4),
        "weights": [round(weight_last, 4), round(weight_promo, 4)],
    }

def predict(model, last_scaled, promo):
    score = model["bias"] + model["weights"][0] * last_scaled + model["weights"][1] * promo
    return round(score, 2)

artifact = json.dumps(fit(ROWS))
loaded = json.loads(artifact)
print("artifact", artifact)
print("predict", predict(loaded, 0.6, 1), "version", loaded["version"])
`,
      },
    ],
    artifacts: [
      {
        title: "The route around that artifact",
        language: "python",
        note: "FastAPI stays in the service image. The runnable example above is the function this route calls.",
        code: `from fastapi import FastAPI
from pydantic import BaseModel, Field

class DemandRequest(BaseModel):
    units_last_week: float = Field(ge=0)
    promo: bool

app = FastAPI()
MODEL = load_model("demand-linear-7.json")  # once, at startup

@app.post("/predict")
def predict(body: DemandRequest):
    scaled = min(body.units_last_week / 50, 2)
    units = score(MODEL, scaled, int(body.promo))
    return {"units": units, "model_version": MODEL["version"]}`,
      },
      {
        title: "Image that runs the same file",
        language: "dockerfile",
        note: "The image does not train. It copies a tested artifact and starts the API as a non-root user.",
        code: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py demand-linear-7.json ./
USER nobody
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]`,
      },
    ],
    followUps: [
      {
        q: "How do you avoid train-serve skew?",
        a: "One function builds the feature vector. Training and the API both call it. A contract test sends a known row and compares the vector hash and the score to a stored fixture.",
      },
      {
        q: "Blue-green or a shadow?",
        a: "I shadow a new model on live traffic when the cost of a wrong score is high, compare it offline to the champion, then shift a small percentage. Rollback is routing back to the previous image.",
      },
    ],
    pitfalls: [
      "Pickling a notebook global and calling it a release.",
      "Fitting preprocessing on the full dataset, including the test week.",
      "No model version in the response, so you cannot tell what scored a complaint.",
    ],
  },
  {
    slug: "fastapi-service",
    title: "FastAPI services",
    round: "architecture",
    priority: "core",
    minutes: 10,
    technologies: ["FastAPI", "Pydantic", "uvicorn", "OpenAPI"],
    interviewerWants:
      "Validation, status codes, and a startup path that fails if the model cannot load.",
    sayIn60:
      "I use FastAPI because the request and response models are Python types, OpenAPI comes from those types, and validation errors are consistent. Dependencies are for a database session or an auth check, not for hiding business logic. The model loads in the lifespan hook. If the file is missing, the process exits and the orchestrator restarts or rolls back. Routes stay small: validate, call a pure function, return a typed response. I add a health route that checks the model is loaded, separate from a readiness route that checks downstream dependencies.",
    fiveMinute: [
      "Pydantic models are the contract.",
      "422 for bad input, 404 for a missing entity, 503 if a dependency is down.",
      "Load heavy objects at startup, not per request.",
      "Health versus readiness.",
      "Do not put secrets in default query parameters or logs.",
    ],
    sections: [
      {
        heading: "Why this framework",
        paragraphs: [
          "The win is the contract. A DemandRequest that refuses a negative unit count documents the API and enforces it. I still keep scoring logic outside the route so a batch job can call the same function without HTTP. Middleware is for request ids and timing, measured around the route, not inside the model.",
        ],
      },
    ],
    examples: [
      {
        id: "validate-then-score",
        title: "Reject a bad payload before scoring",
        language: "python",
        summary:
          "Runs in the browser. The same rules a Pydantic model would enforce, written as a function you can test without starting a server.",
        code: `class APIError(Exception):
    def __init__(self, status, detail):
        self.status = status
        self.detail = detail

def predict_units(payload, model_version="demand-linear-7"):
    if "units_last_week" not in payload or "promo" not in payload:
        raise APIError(422, "units_last_week and promo are required")
    units = payload["units_last_week"]
    promo = payload["promo"]
    if isinstance(units, bool) or not isinstance(units, (int, float)) or units < 0:
        raise APIError(422, "units_last_week must be >= 0")
    if not isinstance(promo, bool):
        raise APIError(422, "promo must be a boolean")
    scaled = min(units / 50, 2)
    score = 8 + 40 * scaled + (12 if promo else 0)
    return {"units": round(score, 1), "model_version": model_version}

samples = [
    {"units_last_week": 30, "promo": True},
    {"units_last_week": -4, "promo": False},
    {"promo": True},
]
for sample in samples:
    try:
        print(sample, "->", predict_units(sample))
    except APIError as exc:
        print(sample, "->", exc.status, exc.detail)
`,
      },
    ],
    followUps: [
      {
        q: "Why not Flask?",
        a: "Flask is fine. I pick FastAPI when I want typed models and OpenAPI without extra libraries. The design, validation at the edge and pure scoring behind it, does not depend on the framework name.",
      },
    ],
    pitfalls: [
      "A global that loads the model on the first request and times out the load balancer.",
      "Returning a stack trace to the caller.",
      "Business rules only in the route, untested, duplicated in a batch job.",
    ],
  },
  {
    slug: "postgresql-prod",
    title: "PostgreSQL in the system",
    round: "architecture",
    priority: "core",
    minutes: 10,
    technologies: ["PostgreSQL", "transactions", "indexes", "pgvector"],
    interviewerWants:
      "Tables with a grain, transactions around writes that must agree, and indexes that match the query.",
    sayIn60:
      "PostgreSQL is the system of record for predictions I must audit, for feature snapshots, and often for chunk metadata. Each table has a primary key and a grain I can say in one sentence. Writes that have to succeed or fail together sit in one transaction. I index the predicates the API actually uses, and I read EXPLAIN ANALYZE when a route gets slow. For RAG, pgvector can store embeddings beside the document row so a metadata filter and a nearest-neighbor search share one query. Connection pooling sits in front so the API does not open a session per request without a bound.",
    fiveMinute: [
      "Grain, primary key, and the query that justifies each index.",
      "Transactions for multi-table writes.",
      "Pool connections. Set a statement timeout on the API path.",
      "Migrations are versioned. The app does not CREATE TABLE at startup in production.",
      "Parameters in queries. No string-built SQL.",
    ],
    sections: [
      {
        heading: "What I store",
        paragraphs: [
          "A prediction log: request id, model version, feature hash, score, created time. A document table and a chunk table for RAG. I do not store every raw event here if the warehouse already owns that history. Postgres holds what the service must read and update transactionally.",
        ],
      },
    ],
    examples: [
      {
        id: "prediction-log-shape",
        title: "Aggregate an audit log by model version",
        language: "sql",
        summary:
          "Runs in the browser on the sample sales table, using the same GROUP BY shape as a prediction audit. The production table is shown beside this as a reference.",
        code: `SELECT store_id AS model_version,
       COUNT(*) AS scored_rows,
       ROUND(AVG(revenue), 1) AS avg_value
FROM sales
GROUP BY store_id
ORDER BY scored_rows DESC`,
      },
    ],
    artifacts: [
      {
        title: "Prediction log you would actually migrate",
        language: "sql",
        note: "Reference DDL. The runnable query above practices the aggregation on the sample sales table.",
        code: `CREATE TABLE prediction_log (
  request_id UUID PRIMARY KEY,
  model_version TEXT NOT NULL,
  store_id INT NOT NULL,
  score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX prediction_log_model_time_idx
  ON prediction_log (model_version, created_at);`,
      },
    ],
    followUps: [
      {
        q: "When do you leave Postgres?",
        a: "When a workload needs a different storage engine: a large analytical scan belongs in the warehouse, a very high-QPS vector workload may belong in a dedicated index. I move that slice, not every table.",
      },
    ],
    pitfalls: [
      "A table with no primary key and a service that updates 'the latest' row by accident.",
      "Building SQL by concatenating user text.",
      "An unbounded connection count from the API replicas.",
    ],
  },
  {
    slug: "docker",
    title: "Docker",
    round: "architecture",
    priority: "core",
    minutes: 8,
    technologies: ["Docker", "images", "layers", "non-root"],
    interviewerWants:
      "An immutable image, a small attack surface, and config passed in at runtime.",
    sayIn60:
      "The image contains the interpreter, the dependencies, and the application code. It does not contain secrets and it does not train the model during the build. I pin dependency versions, run as a non-root user, and pass the model path and database URL in at runtime. Layers are ordered so a code change does not reinstall every package. The same image is what CI tested and what production runs. If it only works on my machine, it is not done.",
    fiveMinute: [
      "Pin the base image and the requirements.",
      "Install dependencies before copying application code.",
      "USER nobody or a dedicated uid.",
      "Secrets come from the environment or a secret store at runtime.",
      "One process per container. Logs go to stdout.",
    ],
    sections: [
      {
        heading: "What the image is for",
        paragraphs: [
          "Docker removes the gap between the laptop and the server. The Dockerfile is the build recipe. I read it as a list of layers: a change invalidates that layer and the ones after it. That is why requirements are copied and installed before the rest of the source. A .dockerignore keeps notebooks, local data, and .env files out of the build context.",
        ],
      },
    ],
    examples: [
      {
        id: "config-at-runtime",
        title: "Read config at runtime, refuse a missing setting",
        language: "python",
        summary:
          "Runs in the browser. The container starts only when the settings it needs are present. The image itself stays free of secrets.",
        code: `import os

# Stand-in for the process environment a container receives.
ENV = {"MODEL_PATH": "demand-linear-7.json", "LOG_LEVEL": "info"}

def load_settings(env):
    required = ["MODEL_PATH"]
    missing = [key for key in required if not env.get(key)]
    if missing:
        raise RuntimeError("missing settings: " + ", ".join(missing))
    return {"model_path": env["MODEL_PATH"], "log_level": env.get("LOG_LEVEL", "info")}

print("ready", load_settings(ENV))
try:
    print(load_settings({}))
except RuntimeError as exc:
    print("exit:", exc)
`,
      },
    ],
    artifacts: [
      {
        title: "Dockerfile",
        language: "dockerfile",
        note: "Build recipe. The Python example is the runtime check this image should fail fast on.",
        code: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \\
    && useradd --create-home appuser
COPY app.py .
USER appuser
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]`,
      },
    ],
    followUps: [
      {
        q: "Image or virtual environment?",
        a: "A virtual environment isolates packages on one machine. An image isolates the operating system userland as well, and it is what the cluster runs. I still use a virtual environment locally. CI builds the image.",
      },
    ],
    pitfalls: [
      "COPY . . before pip install, so every edit reinstalls packages.",
      "Baking a .env with a password into the image.",
      "Running as root because a file permission was annoying once.",
    ],
  },
  {
    slug: "cloud-cicd",
    title: "Cloud deployment and CI/CD",
    round: "architecture",
    priority: "core",
    minutes: 10,
    technologies: ["CI", "CD", "containers", "infrastructure"],
    interviewerWants:
      "A pipeline that tests, builds an image, and promotes it with a gate. Cloud is where it runs, not a brand list.",
    sayIn60:
      "CI runs tests and a model gate on every change. A green main branch builds an image, tags it with the git SHA, and pushes it to a registry. CD deploys that tag to a staging environment, runs a smoke test, then promotes the same tag to production. I do not rebuild for production. Configuration differs by environment. The model metric, the API contract test, and a basic load smoke are the gates. The cloud account supplies compute, a managed database, a secret store, and logs. I name the service boundaries, not every checkbox in a console.",
    fiveMinute: [
      "One artifact, many environments.",
      "Tests before the image. Smoke test after deploy.",
      "Git SHA as the tag. Latest is not a version.",
      "Secrets from a store, injected at runtime.",
      "A manual approval only where the risk justifies waiting.",
    ],
    sections: [
      {
        heading: "Promote the bits you tested",
        paragraphs: [
          "Rebuilding an image during production deploy can pull a different dependency even when the Dockerfile looks identical. I promote the digest CI built. Staging uses a smaller database and synthetic or masked data. The smoke test hits /health and one prediction fixture whose score is known.",
        ],
      },
    ],
    examples: [
      {
        id: "promote-gate",
        title: "Promote only if the metric and the smoke test pass",
        language: "python",
        summary:
          "Runs in the browser. This is the decision CI should make before CD shifts traffic.",
        code: `def gate(candidate_mae, champion_mae, smoke_ok, latency_p95_ms):
    reasons = []
    if candidate_mae > champion_mae * 1.02:
        reasons.append("mae regressed")
    if not smoke_ok:
        reasons.append("smoke failed")
    if latency_p95_ms > 200:
        reasons.append("p95 latency")
    return reasons

cases = [
    (7.4, 8.0, True, 80),
    (9.1, 8.0, True, 80),
    (7.4, 8.0, False, 80),
    (7.4, 8.0, True, 450),
]
for mae, champion, smoke, latency in cases:
    reasons = gate(mae, champion, smoke, latency)
    if reasons:
        print(f"block {mae}: {', '.join(reasons)}")
    else:
        print(f"promote {mae}")
`,
      },
    ],
    artifacts: [
      {
        title: "GitHub Actions shape",
        language: "yaml",
        note: "The job order. The Python gate above is the kind of step hidden inside 'model gate'.",
        code: `name: deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: pytest
      - run: python scripts/model_gate.py
  image:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t registry.example/demand:\${{ github.sha }} .
      - run: docker push registry.example/demand:\${{ github.sha }}`,
      },
    ],
    followUps: [
      {
        q: "Which cloud?",
        a: "I talk about the pieces: a container service, a managed Postgres, object storage for artifacts, a secret manager, and centralized logs. I name the vendor I used and I do not pretend the design only works there.",
      },
    ],
    pitfalls: [
      "Deploying whatever is on a laptop with a latest tag.",
      "A pipeline that tests the API and never loads the model artifact.",
      "Different dependency pins in dev and in the image.",
    ],
  },
  {
    slug: "monitoring-scale",
    title: "Monitoring and scalability",
    round: "architecture",
    priority: "core",
    minutes: 10,
    technologies: ["latency", "drift", "autoscaling", "SLOs"],
    interviewerWants:
      "SLOs for the service, and data monitors for the model, plus what you do when either moves.",
    sayIn60:
      "I watch the service and the model separately. The service has latency, error rate, and saturation: p95 under the SLO, 5xx rate, CPU, and database pool wait. The model has input drift, output drift, and, when labels arrive, a metric such as MAE against the business baseline. An alert names the next action. Scaling out API replicas helps CPU-bound scoring. It does not help a database that has become the bottleneck, and it does not repair a feature that started arriving null. I load-test the real request shape before I promise a QPS number.",
    fiveMinute: [
      "SLI, SLO, and an alert that a human can act on.",
      "p95 and p99, not only the average.",
      "Feature null rate and distribution shift.",
      "Scale the bottleneck you measured.",
      "A nightly job can absorb volume the online path should not.",
    ],
    sections: [
      {
        heading: "Two dashboards",
        paragraphs: [
          "The API dashboard answers 'are users receiving scores in time'. The model dashboard answers 'are those scores still about the world we trained on'. Mixing them produces an alert that says something is wrong and not where to look. I include model version as a dimension so a bad release is visible next to the deploy time.",
        ],
      },
    ],
    examples: [
      {
        id: "latency-and-drift",
        title: "p95 latency and a simple mean shift",
        language: "python",
        summary:
          "Runs in the browser. Percentile from a list of timings, and a feature mean compared with the training mean.",
        code: `def percentile(values, pct):
    ordered = sorted(values)
    index = round((pct / 100) * (len(ordered) - 1))
    return ordered[index]

latencies = [20, 22, 25, 28, 30, 31, 40, 42, 180, 30]
train_mean = 24.0
live_units = [22, 25, 23, 80, 77, 90, 24, 26]
live_mean = sum(live_units) / len(live_units)
p95 = percentile(latencies, 95)
print("p95_ms", p95, "slo", 120, "breach" if p95 > 120 else "ok")
shift = abs(live_mean - train_mean) / train_mean
print("live mean", round(live_mean, 1), "relative shift", round(shift, 2))
if shift > 0.5:
    print("alert: feature mean moved. Check the upstream feed before retraining.")
`,
      },
    ],
    followUps: [
      {
        q: "How many replicas?",
        a: "Enough to hold the SLO at peak with one replica down, after a load test. Autoscaling on CPU is a start. I also cap it so a bug cannot open unlimited database connections.",
      },
    ],
    pitfalls: [
      "Alerting on averages and missing a slow tail.",
      "Retraining because latency moved. That is a capacity problem.",
      "No model version on the chart, so a bad deploy looks like drift.",
    ],
  },
  {
    slug: "security",
    title: "Security",
    round: "architecture",
    priority: "core",
    minutes: 10,
    technologies: ["secrets", "least privilege", "parameterized SQL", "redaction"],
    interviewerWants:
      "Secrets, authorization, and untrusted model output treated as data.",
    sayIn60:
      "Secrets stay in a secret manager and reach the process as runtime configuration, not as a file in git. The API authenticates the caller and authorizes the store or tenant on every query, including vector search. SQL is parameterized. Tool arguments are validated against a schema. Logs pass through redaction before they are stored. The model is untrusted: its text is not executed, and its tool calls cannot widen their own permissions. Dependencies are pinned and scanned in CI.",
    fiveMinute: [
      "No secrets in the image, the notebook, or the prompt log.",
      "Authorize on the server for every retrieval and every tool.",
      "Parameterize queries. Do not concatenate model text into SQL.",
      "Redact tokens, card numbers, and emails in logs.",
      "Least privilege on the database role the API uses.",
    ],
    sections: [
      {
        heading: "The model does not get a new trust boundary",
        paragraphs: [
          "A prompt can ask the model to ignore instructions. That is why authorization is not a paragraph in the system prompt. The database role cannot read another tenant, so a confused model still cannot fetch those rows. Tools are allowlisted. A tool that writes requires a confirmation step outside the model.",
        ],
      },
    ],
    examples: [
      {
        id: "redact-and-parameters",
        title: "Redact a secret and keep SQL parameterized",
        language: "python",
        summary:
          "Runs in the browser. Logging removes a bearer token. The query keeps the value in a parameter list instead of gluing it into the string.",
        code: `import re

def redact(text):
    text = re.sub(r"Bearer\\s+\\S+", "Bearer [redacted]", text)
    text = re.sub(r"\\b\\d{16}\\b", "[card]", text)
    return text

raw_log = "caller used Bearer sk-live-abc123 to score store 12"
print(redact(raw_log))

def prediction_query(model_version):
    sql = "SELECT request_id, score FROM prediction_log WHERE model_version = %s"
    params = (model_version,)
    return sql, params

sql, params = prediction_query("demand-linear-7")
print(sql)
print("params", params)
`,
      },
    ],
    followUps: [
      {
        q: "How do you handle a pasted API key in a chat box?",
        a: "Redact it on the way in, do not send it to the model, and do not write it to logs. Tell the user the message was removed. Rotate the key if it reached a system you do not control.",
      },
    ],
    pitfalls: [
      "A database password in a committed notebook.",
      "A tool that accepts arbitrary SQL from the model.",
      "Tenant filters applied only in the prompt.",
    ],
  },
  {
    slug: "production-troubleshooting",
    title: "Production troubleshooting",
    round: "architecture",
    priority: "core",
    minutes: 10,
    technologies: ["incidents", "logs", "rollbacks", "train-serve skew"],
    interviewerWants:
      "A sequence: what broke, how you contained it, what the evidence was, what you changed.",
    sayIn60:
      "I start with the user symptom and the time it started, then I compare that time to deploys and upstream jobs. Service errors and latency point at capacity, dependencies, or a bad release. A metric drop with healthy latency points at features or labels. I contain first: roll back the image or stop a bad feature job. Then I keep one request id and follow it through the log, the feature vector, and the model version. The write-up names the missing test that would have caught it.",
    fiveMinute: [
      "Timeline: symptom, deploy, data job.",
      "Contain: rollback, feature flag, or stop the writer.",
      "One request id end to end.",
      "Separate null features, skew, and a true concept change.",
      "Add the test before you call it closed.",
    ],
    sections: [
      {
        heading: "A retail incident pattern",
        paragraphs: [
          "A common failure is a score that collapsed after a quiet data change: a column renamed, a timezone shift, or a promo flag that started arriving as the string 'Y'. The API is up, so the latency dashboard stays green. The prediction mean moves. The feature null rate or a contract test is what should have paged. Rollback of the model does nothing if the input changed. You fix or pin the feature job.",
        ],
      },
    ],
    examples: [
      {
        id: "classify-symptom",
        title: "Classify the symptom before you retrain",
        language: "python",
        summary:
          "Runs in the browser. Three signals, three different next steps. Retraining is not the first response.",
        code: `def diagnose(error_rate, p95_ms, null_rate, mae_ratio):
    if error_rate > 0.05 or p95_ms > 300:
        return "service: roll back or scale the saturated dependency"
    if null_rate > 0.1:
        return "features: stop the bad job, do not retrain on nulls"
    if mae_ratio > 1.2:
        return "quality: compare feature stats, then decide on a retrain"
    return "within bounds"

cases = [
    (0.20, 40, 0.0, 1.0),
    (0.0, 40, 0.4, 1.5),
    (0.0, 50, 0.0, 1.4),
    (0.0, 80, 0.0, 1.0),
]
for case in cases:
    print(case, "->", diagnose(*case))
`,
      },
    ],
    followUps: [
      {
        q: "What do you write after the incident?",
        a: "The timeline, the customer impact, the containment, the cause, and the test or alert that was missing. I leave out blame and I name the owner of the follow-up.",
      },
    ],
    pitfalls: [
      "Retraining on the broken feature stream.",
      "Debugging in production by printing full payloads with secrets.",
      "Declaring it fixed without a regression test.",
    ],
  },
];
