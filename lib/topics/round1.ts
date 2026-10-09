import type { Topic } from "../types";

export const round1: Topic[] = [
  {
    slug: "python-experience",
    title: "Explain your Python experience",
    round: "python-sql",
    priority: "very-high",
    minutes: 12,
    technologies: ["Python", "pandas", "REST", "OOP", "typing"],
    interviewerWants:
      "A project story, not a list of libraries. They want the data, the interface, the failure you handled, and why Python was the right tool.",
    sayIn60:
      "I use Python as the language of the data path and the service boundary. In retail work that means pandas or Polars for feature tables, clear objects where a row has rules, and small typed functions at the API edge. I would walk one pipeline: source tables, validation, a feature build, a model or a RAG index, and a FastAPI contract. The part I emphasize is what broke in production and how the code made that failure obvious.",
    fiveMinute: [
      "Name one system and the business question it answered.",
      "Show the Python boundary: notebook for discovery, package for production.",
      "Mention data structures, pandas, and exceptions with a real example.",
      "Show how an API schema stopped bad features from reaching the model.",
      "Close with a test you added after an incident.",
    ],
    sections: [
      {
        heading: "What a senior answer sounds like",
        paragraphs: [
          "Interviewers already assume you can write a loop. They are listening for judgment. Pick one retail or data platform story and stay inside it. Say what the grain of the data was, which Python types carried it, and where you refused to hide a data bug inside a broad except.",
          "Separate exploration from production. Notebooks are for the question. A package with functions, types, and tests is what gets imported by the trainer and by the API. If both import the same feature function, training and serving cannot drift apart quietly.",
        ],
      },
      {
        heading: "Stack the story in four layers",
        paragraphs: [
          "Layer one is ingestion and contracts: files or warehouse extracts checked for nulls, duplicate keys, and impossible values. Layer two is transformation: groupbys, joins, and time features in pandas when the table fits, or SQL when the warehouse should do the heavy join. Layer three is the model or retrieval object. Layer four is the service: a function that accepts a typed payload and returns a typed score or answer.",
        ],
        bullets: [
          "dict and set for lookups and dedupe",
          "list only when order matters",
          "dataclass or a small class when a record has invariants",
          "pandas for columnar transforms, SQL for large joins",
        ],
      },
      {
        heading: "Technologies, and why",
        paragraphs: [
          "Python wins when the same language must do feature logic, model code, and the HTTP service. pandas is the default tabular tool because the groupby-merge-apply shape matches how analysts already think. Pydantic, or a hand-rolled validator if you want zero dependencies, is the contract. pytest is how you lock a bug in place after you see it once.",
        ],
      },
    ],
    examples: [
      {
        id: "score-contract",
        title: "A typed scoring function with a real error",
        language: "python",
        summary:
          "Runs in the browser. This is the shape of an API function: required fields, a domain check, and an error type the caller can handle.",
        code: `class ValidationError(Exception):
    pass

def score_demand(payload: dict) -> dict:
    try:
        units = payload["units_last_week"]
        promo = payload["promo"]
    except KeyError as exc:
        raise ValidationError("missing field: " + str(exc.args[0])) from exc
    if not isinstance(units, (int, float)) or isinstance(units, bool) or units < 0:
        raise ValidationError("units_last_week must be a number >= 0")
    if not isinstance(promo, bool):
        raise ValidationError("promo must be true or false")
    score = 0.6 * min(units / 50, 1) + (0.4 if promo else 0.0)
    return {"demand_score": round(score, 3), "model": "rules-v1"}

samples = [
    {"units_last_week": 40, "promo": True},
    {"promo": False},
    {"units_last_week": -1, "promo": False},
]
for sample in samples:
    try:
        print(score_demand(sample))
    except ValidationError as exc:
        print("rejected:", exc)
`,
      },
    ],
    followUps: [
      {
        q: "Why not do all of this in SQL?",
        a: "Large joins and incremental aggregates belong in the warehouse. Row-level business rules, model code, and the HTTP contract belong in Python so they can be unit tested without a database. The feature function should be the only place a definition lives.",
      },
      {
        q: "How do you keep notebooks from becoming production?",
        a: "A notebook may call the package. It may not be the package. Once a transformation is used by training or serving, it moves into a function with a test and a named input grain.",
      },
    ],
    pitfalls: [
      "Listing libraries (pandas, sklearn, LangChain) with no system around them.",
      "A bare except that turns a bad file into an empty score.",
      "Training features written in a notebook and serving features rewritten in the API.",
    ],
  },
  {
    slug: "data-structures",
    title: "Python data structures",
    round: "python-sql",
    priority: "core",
    minutes: 10,
    technologies: ["dict", "set", "deque", "Counter", "heapq"],
    interviewerWants:
      "The access pattern first, then the structure. They may ask for complexity and for the bug a list causes at a million rows.",
    sayIn60:
      "I pick the structure from the question I need to ask the data. A dict or set is for membership and lookup. A list is for order. A deque is for a sliding window or a queue. A Counter is a histogram. A heap is for top-k without a full sort. In retail pipelines the usual win is indexing rows by store and SKU once, instead of scanning a list on every lookup.",
    fiveMinute: [
      "State average complexity: list scan O(n), dict/set O(1), heap push O(log n).",
      "Show a store lookup built once and reused.",
      "Mention that dicts preserve insertion order.",
      "Call out mutability: a list as a default argument is a shared bug.",
      "Say when you leave Python structures and move to a columnar table.",
    ],
    sections: [
      {
        heading: "Choose by question, not by habit",
        paragraphs: [
          "If the next operation is 'have I seen this key', use a set. If it is 'what is the record for this key', use a dict. If it is 'give me these in arrival order' or you need slicing, use a list. Mixing those up is how a feature job becomes quadratic: a list lookup inside a loop over tickets.",
          "collections is part of the standard library and worth knowing out loud. defaultdict avoids the missing-key dance. Counter is a multiset. deque pops from the left in O(1), which a list does not. heapq gives you a priority queue.",
        ],
      },
      {
        heading: "What still matters in an interview",
        paragraphs: [
          "Tuples are the right record when the fields are fixed and the row should be hashable, so it can sit in a set. Lists cannot be dict keys. Dataclasses are easier to read once a row has names. None of this replaces pandas once you are doing columnar math on millions of rows, but the lookup indexes around a pandas job are still dicts.",
        ],
      },
    ],
    examples: [
      {
        id: "store-index",
        title: "Index tickets once, then aggregate",
        language: "python",
        summary:
          "Runs in the browser. Builds a dict of lists, a Counter of revenue, and a deque that keeps first-seen store order.",
        code: `from collections import Counter, defaultdict, deque

tickets = [
    ("S12", "milk", 2, 3.5),
    ("S12", "bread", 1, 2.0),
    ("S07", "milk", 4, 3.5),
    ("S12", "milk", 1, 3.5),
    ("S03", "soda", 6, 1.5),
]

by_store = defaultdict(list)
for store, sku, units, price in tickets:
    by_store[store].append((sku, units, price))

revenue = Counter()
for store, rows in by_store.items():
    revenue[store] = round(sum(units * price for _, units, price in rows), 2)

arrival = deque(store for store, *_ in tickets)
seen = set()
first_seen = []
while arrival:
    store = arrival.popleft()
    if store not in seen:
        seen.add(store)
        first_seen.append(store)

print("revenue", dict(revenue))
print("first seen", first_seen)
print("milk rows", [row for row in tickets if row[1] == "milk"])
`,
      },
    ],
    followUps: [
      {
        q: "When is a list fine?",
        a: "When you scan it once, when order is the point, or when n is tiny and clarity matters more than a micro-optimization. Say the threshold out loud: I index when the same key is looked up inside a loop.",
      },
      {
        q: "What is the danger of a mutable default?",
        a: "def add(item, bucket=[]): shares one list across calls. Use None and create the list inside the function.",
      },
    ],
    pitfalls: [
      "Quoting O(1) for dicts without mentioning worst-case collisions. Average O(1) is the honest phrase.",
      "Using a list to test membership on every event in a stream.",
      "Putting an unhashable list into a set and not knowing why it throws.",
    ],
  },
  {
    slug: "oop-python",
    title: "Object-oriented Python",
    round: "python-sql",
    priority: "core",
    minutes: 10,
    technologies: ["classes", "dataclasses", "inheritance", "composition"],
    interviewerWants:
      "Whether you use objects to protect invariants, or whether you inherit because a diagram looked professional.",
    sayIn60:
      "I use a class when a value has rules that should be impossible to bypass. A SKU knows its price cannot be negative, and a promo SKU changes the total in one place. I prefer composition over deep inheritance. A scorer object that holds a loaded model is a class. A one-off transformation is a function. Inheritance is for a real is-a relationship, and I always call super and keep the subclass substitutable.",
    fiveMinute: [
      "Give the invariant the class exists to protect.",
      "Show a subclass that changes one behavior.",
      "Say composition: the service has a model, it is not a model.",
      "Mention dunder methods you actually use: init, repr, eq.",
      "Contrast a function pipeline with a stateful client that holds a connection.",
    ],
    sections: [
      {
        heading: "Invariants, not diagrams",
        paragraphs: [
          "A useful class makes an illegal value hard to construct. Price checks live in the constructor, not in every caller. If three services compute a promo total, the bug is that the rule was copied. One method is the rule.",
          "Inheritance pays off when the subclass really is the parent with one behavior changed, and callers can use either without knowing. If you are inheriting to reuse two helper methods, move those helpers to a function or a collaborator object. That is composition, and it keeps hierarchies shallow.",
        ],
      },
      {
        heading: "Where classes show up in ML systems",
        paragraphs: [
          "A feature builder, a model wrapper, and a retriever are reasonable objects because they hold fitted state or a client. The training script itself should stay a function pipeline: load, fit, evaluate, save. Stateful objects at the edges, plain functions in the middle.",
        ],
      },
    ],
    examples: [
      {
        id: "promo-sku",
        title: "A price invariant and one subclass",
        language: "python",
        summary:
          "Runs in the browser. PromoSku changes line_total and still is a Sku.",
        code: `class Sku:
    def __init__(self, sku_id: str, category: str, price: float):
        if price < 0:
            raise ValueError("price must be non-negative")
        self.sku_id = sku_id
        self.category = category
        self.price = price

    def line_total(self, units: int) -> float:
        if units < 0:
            raise ValueError("units must be non-negative")
        return round(self.price * units, 2)

    def __repr__(self) -> str:
        return f"Sku({self.sku_id}, {self.price})"

class PromoSku(Sku):
    def __init__(self, sku_id: str, category: str, price: float, discount: float):
        super().__init__(sku_id, category, price)
        if not 0 <= discount < 1:
            raise ValueError("discount must be in [0, 1)")
        self.discount = discount

    def line_total(self, units: int) -> float:
        gross = super().line_total(units)
        return round(gross * (1 - self.discount), 2)

milk = PromoSku("milk", "dairy", 3.5, 0.10)
plain = Sku("bread", "bakery", 2.0)
print(milk, "promo total", milk.line_total(4))
print(plain, "plain total", plain.line_total(4))
print("promo is a Sku:", isinstance(milk, Sku))
`,
      },
    ],
    followUps: [
      {
        q: "dataclass or class?",
        a: "A dataclass is right for a record with little behavior. A class is right when construction can fail or when methods own a rule. You can freeze a dataclass if it should be hashable.",
      },
      {
        q: "What does substitutable mean?",
        a: "Liskov substitution: any caller holding a Sku can call line_total on a PromoSku and still get a sensible total. The subclass must not demand new arguments or weaken the price check.",
      },
    ],
    pitfalls: [
      "God classes that load data, train, serve, and send email.",
      "Inheritance used as copy-paste. Prefer a collaborator.",
      "Forgetting super() and skipping the parent's invariant.",
    ],
  },
  {
    slug: "pandas-retail",
    title: "pandas for retail tables",
    round: "python-sql",
    priority: "core",
    minutes: 12,
    technologies: ["pandas", "groupby", "merge", "datetime"],
    interviewerWants:
      "That you know the grain of the frame, avoid row-wise apply when a vectorized or groupby operation exists, and can say when SQL should do the join instead.",
    sayIn60:
      "I treat a DataFrame as a table with a declared grain: one row per store, SKU, and day. Joins are merges on keys I have checked for duplicates. Aggregations are groupby, not apply over rows. I parse dates explicitly and I never let an integer SKU get inferred as a number and lose a leading zero. If the join is bigger than memory, I push it to the warehouse and bring back the aggregate.",
    fiveMinute: [
      "State the grain before the first groupby.",
      "Show a merge and how you would detect a many-to-many explosion.",
      "Prefer assign and named aggregations over chained mystery columns.",
      "Mention copy-vs-view warnings: assign a new column deliberately.",
      "Give the handoff rule: SQL for large joins, pandas for feature math and the last mile.",
    ],
    sections: [
      {
        heading: "Grain, keys, and explosions",
        paragraphs: [
          "Most pandas bugs in analytics are grain bugs. A sales line and a product dimension do not have the same key. If the product table has two rows per SKU, a merge multiplies revenue. Before merging I check duplicated keys on the dimension and I compare row counts and revenue sums before and after.",
          "groupby is the daily driver: size, sum, and a named aggregation that keeps column names readable. A Python apply that loops in the interpreter is a last resort for a rule you cannot express in vectorized operations. It is also the usual reason a feature job is slow.",
        ],
      },
      {
        heading: "Time and categories",
        paragraphs: [
          "Retail features are lags, rolling windows, and calendar flags. Those require a sorted time index per store and SKU, with missing days decided on purpose: a missing day may be zero sales or a closed store, and those are different. Categorical codes used by a model must be fit on training categories and applied with an unknown bucket, or serving will invent a new code.",
        ],
      },
    ],
    examples: [
      {
        id: "pure-groupby",
        title: "The same groupby, in the standard library",
        language: "python",
        summary:
          "Runs in the browser with the Python standard library. This is the operation pandas does in a groupby sum: group on city and category, aggregate units and revenue.",
        code: `from collections import defaultdict

sales = [
    {"city": "Austin", "category": "dairy", "units": 20, "revenue": 70.0},
    {"city": "Austin", "category": "bakery", "units": 10, "revenue": 25.0},
    {"city": "Austin", "category": "dairy", "units": 30, "revenue": 105.0},
    {"city": "Chicago", "category": "dairy", "units": 8, "revenue": 28.0},
    {"city": "Chicago", "category": "beverage", "units": 40, "revenue": 60.0},
    {"city": "Denver", "category": "bakery", "units": 15, "revenue": 37.5},
]

totals = defaultdict(lambda: {"units": 0, "revenue": 0.0})
for row in sales:
    key = (row["city"], row["category"])
    totals[key]["units"] += row["units"]
    totals[key]["revenue"] += row["revenue"]

ranked = sorted(totals.items(), key=lambda item: item[1]["revenue"], reverse=True)
for (city, category), agg in ranked:
    print(f"{city:10} {category:10} units={agg['units']:3} revenue={agg['revenue']:.1f}")
`,
      },
      {
        id: "pandas-version",
        title: "The same groupby in pandas",
        language: "python",
        packages: ["pandas"],
        summary:
          "Runs in the browser. The first run downloads pandas into the Pyodide session, then this is the same grain and aggregation.",
        code: `import pandas as pd

sales = pd.DataFrame(
    [
        ("Austin", "dairy", 20, 70.0),
        ("Austin", "bakery", 10, 25.0),
        ("Austin", "dairy", 30, 105.0),
        ("Chicago", "dairy", 8, 28.0),
        ("Chicago", "beverage", 40, 60.0),
        ("Denver", "bakery", 15, 37.5),
    ],
    columns=["city", "category", "units", "revenue"],
)

summary = (
    sales.groupby(["city", "category"], as_index=False)
    .agg(units=("units", "sum"), revenue=("revenue", "sum"))
    .sort_values("revenue", ascending=False)
)
print(summary.to_string(index=False))
print("rows before", len(sales), "groups", len(summary))
`,
      },
    ],
    followUps: [
      {
        q: "pandas or Polars?",
        a: "pandas is the interview default and the widest ecosystem. Polars is the better answer when frames are large and you want lazy, parallel execution. The design point is the same: declare the grain, push big joins down, and keep feature code in one function.",
      },
      {
        q: "How do you find a merge explosion?",
        a: "Count rows and sum the metric before and after. If revenue doubled, the right table was not unique on the join key. validate='many_to_one' in merge fails fast.",
      },
    ],
    pitfalls: [
      "apply(axis=1) as a writing style.",
      "Reading SKUs as integers.",
      "A groupby that silently drops null keys. Decide whether null is a category.",
    ],
  },
  {
    slug: "exceptions-and-apis",
    title: "Exceptions and APIs",
    round: "python-sql",
    priority: "core",
    minutes: 10,
    technologies: ["exceptions", "requests", "REST", "timeouts", "retries"],
    interviewerWants:
      "Specific exceptions, failure modes of HTTP, and a retry policy that does not retry a 400.",
    sayIn60:
      "I catch the exception I can recover from and I let the rest crash with context. For an API client that means timeout, connection error, and a 429 or 503, with a bounded retry and jitter. A 400 is my bug and should not be retried. Responses are validated before they touch a feature frame. On the service I write, a validation error is a 422 with the field name, and an unexpected error is a 500 with a correlation id, not the stack, returned to the client.",
    fiveMinute: [
      "except Exception is for a boundary logger, not for business logic.",
      "Use raise ... from to keep the cause.",
      "Timeouts are mandatory on every outbound call.",
      "Retry only transient failures, with a cap and backoff.",
      "Idempotency keys matter if a retry could double-charge or double-write.",
    ],
    sections: [
      {
        heading: "Catch narrowly",
        paragraphs: [
          "A bare except hides KeyboardInterrupt and bugs. Catch ValidationError, KeyError, json.JSONDecodeError, or requests.Timeout. At the process boundary, log the unexpected exception with the input id and re-raise or return a controlled 500. Swallowing it and returning a zero score will train the next model on fake demand.",
        ],
      },
      {
        heading: "HTTP as a fallible dependency",
        paragraphs: [
          "Every call needs a connect and read timeout. Retries belong on 429 and 5xx, and on connection resets, not on 401 or 422. Backoff should include jitter so a fleet does not retry in lockstep. If the endpoint writes, a retry without an idempotency key can duplicate the write. Pass a request id so logs on both sides join.",
        ],
      },
    ],
    examples: [
      {
        id: "retry-policy",
        title: "Which status codes deserve a retry",
        language: "python",
        summary:
          "Runs in the browser. A stand-in client returns status codes so you can see the policy without a network call.",
        code: `import random

class ApiError(Exception):
    def __init__(self, status, body):
        super().__init__(f"HTTP {status}: {body}")
        self.status = status

def should_retry(status: int) -> bool:
    return status == 429 or 500 <= status <= 599

def call_with_retries(operation, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            return operation()
        except ApiError as exc:
            if not should_retry(exc.status) or attempt == attempts:
                raise
            print(f"retry {attempt} after status {exc.status}")

scripted = iter([503, 429, 200])

def flaky():
    status = next(scripted)
    if status != 200:
        raise ApiError(status, "unavailable")
    return {"forecast_ready": True}

print(call_with_retries(flaky))

try:
    call_with_retries(lambda: (_ for _ in ()).throw(ApiError(422, "bad promo flag")))
except ApiError as exc:
    print("not retried:", exc)
`,
      },
    ],
    followUps: [
      {
        q: "Where do you put the timeout?",
        a: "On the client call, every time. A library default of 'wait forever' will pin a worker. I also cap the total time across retries so three backoffs cannot add up to a minute inside a user request.",
      },
      {
        q: "What is a correlation id?",
        a: "An id generated at the edge and passed through logs, the model call, and downstream HTTP. When a store associate reports a bad answer, that id is how you find the retrieved chunks and the feature payload.",
      },
    ],
    pitfalls: [
      "Retrying 400s and amplifying a bad deploy.",
      "except Exception: return None, which becomes a silent zero later.",
      "Logging the full payload when it contains customer data.",
    ],
  },
  {
    slug: "sql-joins",
    title: "SQL joins",
    round: "python-sql",
    priority: "core",
    minutes: 12,
    technologies: ["SQL", "INNER JOIN", "LEFT JOIN", "grain", "PostgreSQL"],
    interviewerWants:
      "You can pick inner vs left on purpose, name the grain of the result, and notice a fan-out.",
    sayIn60:
      "An inner join keeps matches on both sides. A left join keeps every row of the left table and puts nulls where the right side is missing. I decide from the question: revenue by category is an inner join from sales to products, because a sale with no product is a data defect I want to see in a reconciliation, not hide. Stores with no sales this week is a left join from stores to a filtered sales set. Before I trust the number I check that the dimension is unique on the join key.",
    fiveMinute: [
      "Draw the two sets: inner, left, right, full.",
      "Filter the right side in the ON clause when you still want unmatched left rows.",
      "A WHERE on a left-joined column turns the left join back into an inner join.",
      "Many-to-many multiplies measures. Aggregate first, or dedupe the dimension.",
      "State the result grain in one sentence.",
    ],
    sections: [
      {
        heading: "The filter placement bug",
        paragraphs: [
          "If you left join sales and then write WHERE sales.sku = 'BRD', stores that sold no bread disappear, because their SKU is null and null fails the predicate. Put the SKU test in the ON clause if the question is 'every store, and its bread sales if any'. Put it in WHERE if the question is 'only bread rows'.",
          "Full outer joins are for reconciliation: keys in finance that are missing from the point of sale, and the reverse. Right joins are readable as left joins with the tables swapped, and that is how I write them.",
        ],
      },
      {
        heading: "Grain of this sample",
        paragraphs: [
          "The lab database has stores (one row per store), products (one row per SKU), and sales (one row per ticket line). Revenue summed after joining products is safe because sku is unique on products. If a promo table had many rows per SKU, you would aggregate promos first.",
        ],
      },
    ],
    examples: [
      {
        id: "revenue-by-city",
        title: "Inner join, then aggregate",
        language: "sql",
        summary:
          "Runs in the browser on the sample stores, products, and sales tables.",
        code: `SELECT st.city,
       p.category,
       SUM(s.units) AS units,
       SUM(s.revenue) AS revenue
FROM sales AS s
JOIN stores AS st ON s.store_id = st.store_id
JOIN products AS p ON s.sku = p.sku
GROUP BY st.city, p.category
ORDER BY revenue DESC`,
      },
      {
        id: "bread-coverage",
        title: "Left join that keeps stores with no bread",
        language: "sql",
        summary:
          "The SKU predicate is in ON, so a store with no bread row still appears.",
        code: `SELECT st.city,
       st.format,
       s.sale_id,
       s.revenue
FROM stores AS st
LEFT JOIN sales AS s
  ON st.store_id = s.store_id
 AND s.sku = 'BRD'
ORDER BY st.city`,
      },
    ],
    followUps: [
      {
        q: "How do you detect a fan-out?",
        a: "Sum revenue before the join and after. If the measure changed and you did not mean to filter, a key is duplicated. COUNT(*) versus COUNT(DISTINCT sale_id) tells the same story.",
      },
      {
        q: "Join or subquery?",
        a: "A join is clearer when you need columns from both sides. A semi-join (WHERE EXISTS or an inner join you do not select from) answers 'has at least one'. Aggregate in a subquery when the other table's grain is finer than the result you want.",
      },
    ],
    pitfalls: [
      "Filtering a left-joined table in WHERE and calling it a left join.",
      "Joining on a non-unique dimension and publishing doubled revenue.",
      "Using DISTINCT to hide a grain bug instead of fixing the key.",
    ],
  },
  {
    slug: "sql-windows",
    title: "SQL window functions",
    round: "python-sql",
    priority: "core",
    minutes: 12,
    technologies: ["PostgreSQL", "OVER", "PARTITION BY", "ROW_NUMBER", "LAG"],
    interviewerWants:
      "The difference between GROUP BY and OVER, plus one running-total or ranking query you can write without notes.",
    sayIn60:
      "GROUP BY collapses rows. A window function computes an aggregate while keeping the row. PARTITION BY is the group, ORDER BY is the sequence inside it, and the frame says which neighbors are visible. I use SUM OVER for a running total, ROW_NUMBER to keep the latest row per store and SKU, and LAG to compare this week with last week. The window does not filter; a later WHERE or a qualify-style subquery does.",
    fiveMinute: [
      "Say collapse versus annotate.",
      "Write PARTITION BY store_id ORDER BY sale_date.",
      "Name the default frame trap: with ORDER BY, the default frame is the rows up through the current row in PostgreSQL for aggregates, which is what you want for a running sum. RANK, DENSE_RANK, and ROW_NUMBER do not use a frame.",
      "Deduping with ROW_NUMBER = 1 is a pattern you should be able to write.",
      "LAG is the clean week-over-week difference. A self join is the slower spelling of the same idea.",
    ],
    sections: [
      {
        heading: "Three jobs windows do",
        paragraphs: [
          "Running totals and moving averages need an ordered frame. Rankings need ORDER BY inside the window and no frame. Access to another row, such as yesterday's revenue, is LAG or LEAD. All three keep the original grain, which is why they replace a lot of self joins.",
          "To keep the latest price per SKU: assign ROW_NUMBER() OVER (PARTITION BY sku ORDER BY updated_at DESC) and keep rn = 1 in an outer query. Doing it with a correlated subquery works and usually loses on a large fact table.",
        ],
      },
      {
        heading: "What the browser can run",
        paragraphs: [
          "The in-browser SQL engine runs SUM() OVER (PARTITION BY ...) and ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...). Ordered frames and LAG are written here as PostgreSQL you should be able to recite; the Python example performs that running total with the same partition-and-order logic.",
        ],
      },
    ],
    examples: [
      {
        id: "store-share",
        title: "Annotate each row with the partition total",
        language: "sql",
        summary:
          "Runs in the browser. Each sale keeps its own revenue and gains the store total. That is the window idea: aggregate without collapsing.",
        code: `SELECT store_id,
       sku,
       sale_date,
       revenue,
       SUM(revenue) OVER (PARTITION BY store_id) AS store_total
FROM sales
ORDER BY store_id, sale_date, sku`,
      },
      {
        id: "running-total-python",
        title: "Running total per store, in order",
        language: "python",
        summary:
          "Runs in the browser. Same result you want from SUM(revenue) OVER (PARTITION BY store_id ORDER BY sale_date).",
        code: `sales = [
    (12, "2026-03-01", "MLK", 70.0),
    (12, "2026-03-01", "BRD", 25.0),
    (12, "2026-03-02", "MLK", 105.0),
    (7, "2026-03-01", "MLK", 28.0),
    (7, "2026-03-02", "SOD", 60.0),
    (3, "2026-03-01", "BRD", 37.5),
    (3, "2026-03-02", "SOD", 18.0),
]
ordered = sorted(sales, key=lambda row: (row[0], row[1], row[2]))
running = {}
for store_id, sale_date, sku, revenue in ordered:
    running[store_id] = running.get(store_id, 0) + revenue
    print(store_id, sale_date, sku, revenue, "running", round(running[store_id], 1))
`,
      },
      {
        id: "rank-inside-store",
        title: "Rank sales inside each store",
        language: "sql",
        summary:
          "Runs in the browser. ROW_NUMBER keeps every sale and numbers them. In PostgreSQL you wrap this and filter rn = 1 to keep the latest row.",
        code: `SELECT store_id,
       sku,
       sale_date,
       revenue,
       ROW_NUMBER() OVER (
         PARTITION BY store_id
         ORDER BY revenue DESC
       ) AS rn
FROM sales
ORDER BY store_id, rn`,
      },
    ],
    artifacts: [
      {
        title: "PostgreSQL windows to write from memory",
        language: "sql",
        note: "Ordered frames and LAG are interview syntax. The runnable examples above cover the partition aggregate and the ranking pattern. The Python example is the running total.",
        code: `-- Running revenue per store
SELECT store_id, sale_date, revenue,
       SUM(revenue) OVER (
         PARTITION BY store_id
         ORDER BY sale_date
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_revenue
FROM sales;

-- Latest row per store and SKU
SELECT * FROM (
  SELECT s.*,
         ROW_NUMBER() OVER (
           PARTITION BY store_id, sku
           ORDER BY sale_date DESC
         ) AS rn
  FROM sales s
) t
WHERE rn = 1;

-- Day over day, after you have one row per store and day
SELECT store_id, sale_date, revenue,
       revenue - LAG(revenue) OVER (
         PARTITION BY store_id ORDER BY sale_date
       ) AS dod_change
FROM store_day;`,
      },
    ],
    followUps: [
      {
        q: "ROW_NUMBER, RANK, or DENSE_RANK?",
        a: "ROW_NUMBER is unique and is what you want for deduping. RANK skips after a tie (1, 1, 3). DENSE_RANK does not skip (1, 1, 2). Say which tie behavior the business asked for.",
      },
      {
        q: "Why is a self join worse here?",
        a: "A self join on 'same store and earlier date' builds a much larger intermediate set. The window sorts each partition once. It is also harder to get the self join wrong in a way that double counts.",
      },
    ],
    pitfalls: [
      "Putting the rn = 1 filter in the same SELECT as the window. The filter has to wrap it, or you filter before numbers are assigned.",
      "PARTITION BY too coarse, so the 'latest row' is latest in the company, not latest per SKU.",
      "A running sum that forgets to order by time and looks stable only because the table happened to be loaded in order.",
    ],
  },
  {
    slug: "sql-optimization",
    title: "How do you optimize a SQL query?",
    round: "python-sql",
    priority: "high",
    minutes: 14,
    technologies: ["PostgreSQL", "EXPLAIN", "indexes", "statistics", "sargability"],
    interviewerWants:
      "A method, not a superstition about indexes. Read the plan, name the expensive node, then change the query or the index to match the predicate.",
    sayIn60:
      "I start from the question and the row estimate, not from a hunch. EXPLAIN ANALYZE tells me the actual rows versus the estimate, the join strategy, and whether we seq-scanned a fact table. I make predicates sargable so an index can be used, I filter and aggregate before a join when the dimension would multiply rows, and I add an index that matches the WHERE and the ORDER BY. If the estimate is wildly wrong I update statistics or rewrite a function that hides the column from the planner.",
    fiveMinute: [
      "EXPLAIN ANALYZE, not just EXPLAIN. You need actual time and rows.",
      "Look for sequential scans on large tables, nested loops over big outer sets, and huge sorts spilling to disk.",
      "Sargable means the indexed column sits alone: sale_date >= ... rather than a function wrapped around sale_date.",
      "A composite index column order follows equality predicates, then the range, then the sort.",
      "Indexes speed reads and cost writes. Do not index every column.",
    ],
    sections: [
      {
        heading: "A repeatable pass",
        paragraphs: [
          "First, restate the grain and the selective filters. A query that returns a week for one region should not touch five years of every store. Push those predicates as early as the SQL allows. Second, read the plan bottom up: the leaves are the scans. A seq scan of a small dimension is fine. A seq scan of sales when you asked for one store and one day means the predicate cannot use an index, or the planner thinks the predicate matches half the table.",
          "Third, compare estimated rows to actual rows. A 100x miss means stale statistics, a correlated predicate the planner cannot see, or a type mismatch such as a text date compared with a timestamp. Fourth, only then add an index. For 'store, then a date range, ordered by date', a btree on (store_id, sale_date) matches the access. An index on sale_date alone is weaker if store_id is the selective equality.",
        ],
        bullets: [
          "Select only the columns you need. Wide rows make sorts and hashes expensive.",
          "Avoid SELECT DISTINCT as a substitute for a correct grain.",
          "Watch implicit casts. store_id::text = '12' will not use an integer index the way you expect if the cast is on the column.",
          "Partition a very large fact by date when queries are always time-bounded, and prune partitions with the same predicate.",
        ],
      },
      {
        heading: "Join shape",
        paragraphs: [
          "Hash joins like large unsorted inputs and enough work_mem. Nested loops like a small outer side and an index on the inner key. Merge joins like both sides ordered. You rarely force these with hints on a first pass. You change cardinality so the planner's choice becomes obvious: aggregate the many side first when you do not need its detail.",
          "A correlated subquery that runs per row is the pattern to rewrite into a join or a window. Anti-joins ('stores with no sales') should be NOT EXISTS, which can stop at the first match, rather than a NOT IN list that becomes painful with nulls.",
        ],
      },
    ],
    examples: [
      {
        id: "selective-filter",
        title: "Filter the fact and the dimension on purpose",
        language: "sql",
        summary:
          "Runs in the browser. One day, one region, then aggregate. In PostgreSQL this is the shape that can use (store_id, sale_date) after region resolves to a small store list.",
        code: `SELECT st.city,
       SUM(s.revenue) AS revenue,
       SUM(s.units) AS units
FROM sales AS s
JOIN stores AS st ON s.store_id = st.store_id
WHERE s.sale_date = '2026-03-02'
  AND st.region = 'South'
GROUP BY st.city`,
      },
    ],
    artifacts: [
      {
        title: "What you say while reading EXPLAIN ANALYZE",
        language: "sql",
        note: "PostgreSQL has a planner. The lab engine does not, so this stays as the interview script next to the runnable filtered query.",
        code: `EXPLAIN (ANALYZE, BUFFERS)
SELECT st.city, SUM(s.revenue) AS revenue
FROM sales AS s
JOIN stores AS st ON s.store_id = st.store_id
WHERE s.sale_date >= DATE '2026-03-01'
  AND s.sale_date < DATE '2026-03-08'
  AND st.region = 'South'
GROUP BY st.city;

-- Read top to bottom for time, bottom to top for flow.
-- Check actual rows against the estimate on the sales scan.
-- A good supporting index:
--   CREATE INDEX sales_store_date_idx ON sales (store_id, sale_date);
-- Do not write WHERE DATE(sale_date) = ... if sale_date is a timestamp.
-- That wrap blocks a plain btree. Write a half-open range instead.`,
      },
    ],
    followUps: [
      {
        q: "The index exists and the planner ignores it. Why?",
        a: "The predicate is not selective, statistics are stale, the column is wrapped in a function, or the types do not match. Sometimes a seq scan is genuinely cheaper because the table is small or you need most of the pages anyway. ANALYZE updates statistics. An index is not a guarantee.",
      },
      {
        q: "How do you optimize a window query?",
        a: "Partition keys that match the index order avoid a sort. Filter hard before the window so you do not rank the whole history. Incremental tables that store yesterday's running total are a warehouse technique when the window is over billions of rows.",
      },
    ],
    pitfalls: [
      "Adding indexes until writes slow down, without reading a plan.",
      "Wrapping indexed columns in functions.",
      "Trusting a 20ms dev database and shipping the same shape onto a 2 billion row fact.",
    ],
  },
];
