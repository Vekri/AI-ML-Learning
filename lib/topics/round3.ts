import type { Topic } from "../types";

export const round3: Topic[] = [
  {
    slug: "rag-architecture",
    title: "Explain RAG architecture",
    round: "genai",
    priority: "very-high",
    minutes: 16,
    technologies: ["RAG", "chunking", "embeddings", "retrieval", "LLM"],
    interviewerWants:
      "The path from a source document to a grounded answer, and the place you refuse when retrieval is weak.",
    sayIn60:
      "Retrieval-augmented generation keeps facts in your documents and uses the model to phrase an answer from what was retrieved. Ingestion parses and chunks source text, an embedding model turns each chunk into a vector, and a vector index stores those vectors with the text and metadata. At question time I embed the question, retrieve the nearest chunks, and pass only those chunks into the prompt. The model is instructed to answer from that context and to say it does not know when the passages are irrelevant. I evaluate retrieval and the final answer separately.",
    fiveMinute: [
      "Name the corpus and who is allowed to see it.",
      "Walk ingestion: parse, clean, chunk, embed, upsert with metadata.",
      "Walk query time: embed, filter by metadata, top-k, optional rerank, prompt.",
      "Show a refusal when the best score is below a threshold.",
      "Say how you measure retrieval hit rate apart from answer quality.",
    ],
    sections: [
      {
        heading: "Why RAG exists",
        paragraphs: [
          "A language model stores patterns from training, not your current return policy. Fine-tuning can change style and can teach stable facts, but it is the wrong tool for a document that changes on Thursday. RAG leaves the document as the source of truth and asks the model to read a small, retrieved slice of it.",
          "The architecture is two systems. The offline path builds an index. The online path retrieves and generates. If you only describe the prompt, you have skipped the part that usually fails: bad chunks, stale vectors, or a question that matched the wrong store's policy.",
        ],
      },
      {
        heading: "Each stage, and the choice",
        paragraphs: [
          "Parsing has to keep headings, tables, and page numbers. A PDF that becomes one flat string loses the fact that a sentence belonged to the dairy policy. Chunking then cuts that text into passages an embedding can represent. I overlap chunks so a rule split across a boundary still appears whole in at least one passage. Embeddings place similar meanings near each other. The index searches that space quickly. Metadata filters, such as region or document version, run before or during the search so cosine similarity cannot retrieve a superseded policy.",
          "Generation is last. The prompt contains the question, the passages, and an instruction to cite the passage id. A reranker, often a small cross-encoder, can reorder the top 20 vector hits down to the 4 you show the model. I add it when vector search returns the right document in the top 20 but not in the top 4.",
        ],
        bullets: [
          "Ingestion is idempotent. Re-embedding a changed document replaces the old chunks by document id.",
          "The prompt does not contain the whole manual. It contains the retrieved passages.",
          "Citations point at chunk ids you stored, not at line numbers the model invents.",
        ],
      },
    ],
    demo: "rag",
    examples: [
      {
        id: "tiny-rag",
        title: "Retrieve, then answer only from passages",
        language: "python",
        summary:
          "Runs in the browser. Bag-of-words cosine stands in for an embedding model so you can see the architecture without a network call. A weak score refuses.",
        code: `import math
from collections import Counter

DOCS = [
    ("returns-dairy", "Opened dairy can be refunded within 7 days with a receipt."),
    ("promo-override", "A manager can override a promo price only when the shelf tag is missing."),
    ("waste-milk", "Milk past the sell-by date is written off and is not donated."),
]

def tokens(text):
    cleaned = []
    for raw in text.split():
        word = raw.strip(".,?").lower()
        if word:
            cleaned.append(word)
    return cleaned

def bow(text):
    return Counter(tokens(text))

def cosine(left, right):
    keys = set(left) | set(right)
    dot = sum(left[k] * right[k] for k in keys)
    left_n = math.sqrt(sum(v * v for v in left.values()))
    right_n = math.sqrt(sum(v * v for v in right.values()))
    if left_n == 0 or right_n == 0:
        return 0.0
    return dot / (left_n * right_n)

def retrieve(question, k=2):
    query = bow(question)
    scored = []
    for doc_id, text in DOCS:
        scored.append((cosine(query, bow(text)), doc_id, text))
    scored.sort(reverse=True)
    return scored[:k]

def answer(question, min_score=0.25):
    hits = retrieve(question)
    print("question:", question)
    for score, doc_id, text in hits:
        print(f"  {score:.2f} {doc_id}: {text}")
    if hits[0][0] < min_score:
        print("  answer: I do not have a grounded passage for that.")
        return
    kept = [hit for hit in hits if hit[0] >= min_score]
    cited = " ".join(f"[{hit[1]}] {hit[2]}" for hit in kept)
    print("  answer:", cited)

answer("Can I refund opened milk with a receipt?")
print("---")
answer("What is the weather in Paris tomorrow?")
`,
      },
    ],
    followUps: [
      {
        q: "RAG or fine-tuning?",
        a: "Fine-tune when you need a stable behavior or format and the knowledge is slow-moving. Use RAG when the answer must track documents you can update without a training run. Many production assistants do both: a fine-tune for tone and tool use, RAG for policy text.",
      },
      {
        q: "Where do you cache?",
        a: "Cache embeddings for unchanged chunks, and cache retrieval for repeated questions if the index version is part of the cache key. Do not cache a generated answer across a policy update.",
      },
    ],
    pitfalls: [
      "Stuffing the entire manual into the prompt and calling it RAG.",
      "Judging the system only by whether the prose sounds confident.",
      "No document id, version, or access filter on the chunk.",
    ],
  },
  {
    slug: "vector-databases",
    title: "Why use a vector database?",
    round: "genai",
    priority: "very-high",
    minutes: 12,
    technologies: ["pgvector", "HNSW", "cosine similarity", "metadata filters"],
    interviewerWants:
      "Semantic similarity, why brute force stops scaling, and what the index approximates.",
    sayIn60:
      "A vector database stores embeddings and finds nearest neighbors without scanning every row on each question. Similarity is usually cosine or dot product, which measures direction in embedding space, so a question can match a passage that shares meaning and not just keywords. An index such as HNSW searches a graph of vectors and returns an approximate top-k much faster than a full scan. I still keep the text and metadata beside the vector, and I filter by tenant, region, or document version so the nearest vector is also an allowed vector. PostgreSQL with pgvector is enough until the corpus or the QPS says otherwise.",
    fiveMinute: [
      "Define a vector as the embedding of a chunk, not the chunk itself.",
      "Cosine similarity ignores magnitude. Dot product does not, so normalize if you use it as cosine.",
      "Exact search is fine for tens of thousands of chunks. Approximate search is for millions.",
      "HNSW is a layered graph. Recall is the fraction of true neighbors you actually returned.",
      "Filters belong in the same query. A post-filter can throw away the only legal hits.",
    ],
    sections: [
      {
        heading: "What you are buying",
        paragraphs: [
          "You can compute cosine similarity in a loop. The example on this page does. That is the right way to learn the metric and the wrong service once you have a million chunks and a latency budget. A vector index keeps a structure that visits a small fraction of the vectors and still returns neighbors that are close to the true nearest set.",
          "The database also has to do ordinary database work: upserts by chunk id, deletes when a document is retired, and filters on metadata. A file of numpy arrays does none of that safely under concurrent writers.",
        ],
      },
      {
        heading: "pgvector versus a dedicated engine",
        paragraphs: [
          "If the product data already lives in PostgreSQL and the chunk count is moderate, pgvector keeps vectors next to the access rules and the transactional updates. Dedicated engines such as Qdrant, Weaviate, or a managed vector service pay off when you need higher QPS, specialized filtering, or a team that does not want to tune Postgres indexes. I say that trade-off out loud. I do not claim one product is universally correct.",
          "Approximate indexes have a recall knob. Pushing recall to 1.0 approaches brute-force cost. I measure recall against an exact scan on a sample of real questions before I trust the index in production.",
        ],
      },
    ],
    examples: [
      {
        id: "cosine-and-shortlist",
        title: "Exact cosine, then why an index shortlists",
        language: "python",
        summary:
          "Runs in the browser. Scores every chunk exactly, then shows a token shortlist that avoids comparing the question to unrelated chunks. That shortlist is the idea an index implements at a much larger scale.",
        code: `import math

CHUNKS = {
    "c1": [0.82, 0.10, 0.41],
    "c2": [0.10, 0.90, 0.05],
    "c3": [0.79, 0.14, 0.38],
    "c4": [0.05, 0.20, 0.93],
}
TOKENS = {
    "c1": {"refund", "dairy", "receipt"},
    "c2": {"promo", "manager", "tag"},
    "c3": {"milk", "refund", "opened"},
    "c4": {"waste", "sell-by", "donate"},
}

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb)

question = [0.80, 0.12, 0.40]
query_tokens = {"refund", "milk"}
exact = sorted(
    ((cosine(question, vector), chunk_id) for chunk_id, vector in CHUNKS.items()),
    reverse=True,
)
print("exact scan", [(cid, round(score, 3)) for score, cid in exact])

shortlist = [cid for cid, words in TOKENS.items() if words & query_tokens]
approx = sorted(
    ((cosine(question, CHUNKS[cid]), cid) for cid in shortlist),
    reverse=True,
)
print("shortlist", shortlist)
print("scored only shortlist", [(cid, round(score, 3)) for score, cid in approx])
print("comparisons", len(CHUNKS), "->", len(shortlist))
`,
      },
    ],
    artifacts: [
      {
        title: "pgvector shape you should be able to describe",
        language: "sql",
        note: "Illustrative PostgreSQL. The lab engine stores the sample retail tables, not embeddings. Say this schema in the interview, then describe the filter and the index.",
        code: `CREATE TABLE policy_chunks (
  chunk_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version INT NOT NULL,
  region TEXT NOT NULL,
  body TEXT NOT NULL,
  embedding vector(1536)
);

CREATE INDEX policy_chunks_embedding_idx
  ON policy_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Filter and search together. region is not an afterthought.
SELECT chunk_id, body
FROM policy_chunks
WHERE region = 'south' AND version = 4
ORDER BY embedding <=> :query_embedding
LIMIT 8;`,
      },
    ],
    followUps: [
      {
        q: "Cosine, dot product, or Euclidean?",
        a: "If vectors are normalized, cosine and dot product rank results the same way. Euclidean distance is another geometry. I match the metric to the one the embedding model was trained with, and I build the index for that metric.",
      },
      {
        q: "What is recall@k?",
        a: "Take the true nearest k from an exact scan. recall@k is how many of them appear in the index's k results. I report it on real questions, not on random vectors only.",
      },
    ],
    pitfalls: [
      "An index with no recall measurement.",
      "Filtering after the top-k, then wondering why a region has no answers.",
      "Storing the vector and losing the source text and document version.",
    ],
  },
  {
    slug: "transformers",
    title: "How does a Transformer work?",
    round: "genai",
    priority: "very-high",
    minutes: 16,
    technologies: ["attention", "tokens", "embeddings", "encoder", "decoder"],
    interviewerWants:
      "Tokens, embeddings, and attention, plus when you need an encoder, a decoder, or both.",
    sayIn60:
      "A transformer turns text into tokens, looks up a learned vector for each token, and adds a position signal so order is not lost. Self-attention then lets every token build a new vector from the others: queries, keys, and values are linear projections, scores are scaled dot products, and softmax turns scores into weights. Multiple heads do this in different subspaces and are concatenated. A stack of attention and feed-forward blocks, with residual connections and layer norm, is the model. An encoder reads a whole sequence. A decoder generates the next token and masks future positions so it cannot peek. BERT-style models are encoders. GPT-style models are decoders. The original translation model used both.",
    fiveMinute: [
      "Tokenization is not words. Subwords are the usual unit.",
      "Embeddings are learned lookup tables, plus a position encoding.",
      "Write the attention formula: softmax(QK^T / sqrt(d)) V.",
      "Explain the scale: dot products grow with dimension and saturate softmax.",
      "Masking is what makes decoding causal.",
      "Name residual connections so a deep stack can still pass the input forward.",
    ],
    sections: [
      {
        heading: "From characters to a sequence of vectors",
        paragraphs: [
          "The model never sees a sentence as a string. A tokenizer splits it into ids. Each id indexes a row in an embedding matrix. That row is trained. Position is added because attention by itself is a set operation: without position, 'milk before bread' and 'bread before milk' can look the same. The original paper used fixed sinusoidal positions. Many later models learn the position vectors.",
        ],
      },
      {
        heading: "One attention head",
        paragraphs: [
          "For each token the model computes a query, a key, and a value. The query of token i is compared with the key of every token. Those scores are divided by the square root of the key dimension so they do not become extreme, then softmax turns them into weights that sum to 1. The output is the weighted sum of values. The token has mixed information from the positions it attended to. Several heads run in parallel so one head can track syntax while another tracks a name. Their outputs are concatenated and projected.",
          "An encoder attention block can look at the entire sequence. A decoder block that is predicting the next word applies a causal mask: scores for future tokens are set to negative infinity before softmax, so their weight is zero. Encoder-decoder attention lets a decoder query attend to encoder keys, which is how the original translation transformer read the source sentence while writing the target.",
        ],
      },
      {
        heading: "What people add when they say LLM",
        paragraphs: [
          "A large language model in the current product sense is usually a deep decoder trained to predict the next token, then instruction-tuned to follow a question. The interview answer still starts at attention. Sampling, temperature, and tool calling sit on top of that next-token distribution. They are not a different architecture.",
        ],
      },
    ],
    demo: "attention",
    examples: [
      {
        id: "scaled-dot-product",
        title: "Scaled dot-product attention for four tokens",
        language: "python",
        summary:
          "Runs in the browser. Queries, keys, and values are tiny learned-looking vectors. Each row of weights sums to 1. The last block applies a causal mask.",
        code: `import math

TOKENS = ["the", "store", "needs", "milk"]
# rows are already the Q=K=V vectors for a one-head sketch
VECTORS = [
    [0.2, 0.1],
    [0.9, 0.2],
    [0.1, 0.8],
    [0.6, 0.7],
]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def softmax(scores):
    peak = max(scores)
    exps = [math.exp(score - peak) for score in scores]
    total = sum(exps)
    return [value / total for value in exps]

def attend(causal):
    d = len(VECTORS[0])
    print("causal" if causal else "bidirectional")
    for i, query in enumerate(VECTORS):
        scores = []
        for j, key in enumerate(VECTORS):
            score = dot(query, key) / math.sqrt(d)
            if causal and j > i:
                score = float("-inf")
            scores.append(score)
        weights = softmax(scores)
        shown = " ".join(f"{TOKENS[j]}:{weights[j]:.2f}" for j in range(len(TOKENS)))
        print(f"  {TOKENS[i]:6} {shown}")

attend(False)
attend(True)
`,
      },
    ],
    followUps: [
      {
        q: "Why sqrt(d)?",
        a: "The variance of a dot product grows with the number of dimensions. Large scores push softmax toward one-hot weights and starve the gradient. Dividing by sqrt(d) keeps the scores in a range softmax can still soften.",
      },
      {
        q: "Encoder or decoder for RAG?",
        a: "The embedding model is often an encoder, or a dual encoder trained so questions and passages share a space. The answer model is a decoder. They are different models with different jobs.",
      },
    ],
    pitfalls: [
      "Saying attention is a dictionary lookup and stopping there. Name queries, keys, values, and the mask.",
      "Confusing tokenization with embedding.",
      "Describing GPT as an encoder-decoder. It is a causal decoder.",
    ],
  },
  {
    slug: "hallucinations",
    title: "How do you prevent hallucinations?",
    round: "genai",
    priority: "high",
    minutes: 12,
    technologies: ["grounding", "citations", "reranking", "evaluation"],
    interviewerWants:
      "You cannot promise zero hallucinations. You can constrain the model, measure it, and refuse.",
    sayIn60:
      "I treat a hallucination as an answer that is not supported by an allowed source. Prevention starts with retrieval quality: the right passage has to be in the prompt. The prompt tells the model to use only those passages and to cite chunk ids. If the top score is below a threshold, or a citation check cannot find the claim in the passage, the service returns a refusal or asks a clarifying question. I evaluate with a labeled set: did we retrieve the gold passage, and does the answer stay inside it. A confident tone is not a metric.",
    fiveMinute: [
      "Separate retrieval failure from generation failure.",
      "Ground the prompt. Do not ask the model for facts it was not given.",
      "Require citations that you verify against the chunk text.",
      "Refuse or escalate when support is missing.",
      "Track a hallucination rate on a fixed eval set after every index or prompt change.",
    ],
    sections: [
      {
        heading: "Grounding is a product decision",
        paragraphs: [
          "Some answers are allowed to use general knowledge, such as how to format a date. Policy, price, and eligibility are not. I split those intents. A policy question that misses retrieval does not get a fluent guess. It gets 'I could not find this in the current manual' and, if the workflow needs it, a handoff to a person.",
          "Temperature and a smaller context do not by themselves create truth. They change randomness and what the model can see. The control that matters is the source text plus a check that the claim appears there.",
        ],
      },
      {
        heading: "What I measure",
        paragraphs: [
          "Retrieval recall: the gold chunk is in the top k. Faithfulness: each claim is entailed by the cited chunk, judged by a rubric or a second model you have calibrated against humans. Citation precision: the cited id was actually retrieved, not invented. I would rather ship a higher refusal rate than a lower one I cannot audit.",
        ],
      },
    ],
    examples: [
      {
        id: "cite-or-refuse",
        title: "Accept a claim only when the passage contains it",
        language: "python",
        summary:
          "Runs in the browser. This is a lexical support check, not a full entailment model. It shows the gate you want in front of the user.",
        code: `PASSAGES = {
    "returns-dairy": "opened dairy can be refunded within 7 days with a receipt",
}

def supported(claim, passage):
    return claim.lower() in passage.lower()

def decide(doc_id, claim):
    passage = PASSAGES.get(doc_id)
    if passage is None:
        print("refuse: citation", doc_id, "was not retrieved")
        return
    if supported(claim, passage):
        print("show:", claim, "| source", doc_id)
        return
    print("refuse: claim is not in", doc_id)

decide("returns-dairy", "refunded within 7 days")
decide("returns-dairy", "refunded within 90 days")
decide("invented-doc", "refunded within 7 days")
`,
      },
    ],
    followUps: [
      {
        q: "Will a bigger model stop this?",
        a: "A stronger model follows instructions and quotes more carefully. It still invents when the prompt asks for a fact that was not retrieved. I change the evidence and the gate, not only the model name.",
      },
      {
        q: "How do you handle partial answers?",
        a: "Answer the part the passages support and name the part they do not. A single unsupported sentence fails the whole answer in a strict policy bot.",
      },
    ],
    pitfalls: [
      "Using the model's own confidence wording as a probability.",
      "Letting the model cite documents that were not in the retrieved set.",
      "No refusal path, so every question produces a paragraph.",
    ],
  },
  {
    slug: "mcp",
    title: "What is MCP?",
    round: "genai",
    priority: "high",
    minutes: 12,
    technologies: ["MCP", "tools", "resources", "prompts", "JSON-RPC"],
    interviewerWants:
      "Client and server roles, and the difference between tools, resources, and prompts.",
    sayIn60:
      "The Model Context Protocol is a standard way for an AI client to talk to a server that exposes capabilities. The client is the application with the model, such as an IDE or an agent runtime. The server exposes three things: tools, which are functions the model can call; resources, which are readable data such as a file or a record; and prompts, which are reusable prompt templates. The messages are JSON-RPC. I use MCP so each system publishes its own tools once, and any compatible client can discover them, instead of hard-coding a new adapter for every assistant.",
    fiveMinute: [
      "Client hosts the model. Server hosts the capability.",
      "Tools have a name, a JSON schema, and a side effect or a query.",
      "Resources are data to read, addressed by a URI.",
      "Prompts are templates the client can request.",
      "Discovery first: list tools, then call one with validated arguments.",
      "Authorization still belongs to the server. The protocol does not replace it.",
    ],
    sections: [
      {
        heading: "Why a protocol instead of another SDK",
        paragraphs: [
          "Without a shared contract, every assistant integrates every backend in its own function-calling dialect. MCP draws a boundary. The retail inventory service can run an MCP server that lists get_on_hand and a resource for the store calendar. Cursor, Claude Desktop, or your own agent can be the client. The model still decides when to call a tool. The server decides what the call is allowed to do.",
        ],
      },
      {
        heading: "Tools, resources, prompts",
        paragraphs: [
          "A tool is an action with a schema: get store hours, create a ticket, run an approved query. A resource is context the client can attach: policy://returns/dairy. A prompt is a named template with arguments, such as a weekly trading summary that expects a region. Mixing them up is a common answer. If the model should choose to invoke it, it is a tool. If the user or the client should attach it as context, it is a resource.",
        ],
      },
    ],
    examples: [
      {
        id: "mcp-dispatch",
        title: "Discover a tool, validate arguments, then call it",
        language: "python",
        summary:
          "Runs in the browser. A tiny client and server in one process. The schema check is the part that keeps a model from calling get_store_hours with a missing store id.",
        code: `def hours(arguments):
    return {"store_id": arguments["store_id"], "hours": "07:00-22:00"}

SERVER = {
    "tools": {
        "get_store_hours": {
            "description": "Opening hours for one store.",
            "required": ["store_id"],
            "call": hours,
        }
    },
    "resources": {
        "policy://returns/dairy": "Opened dairy can be refunded within 7 days with a receipt.",
    },
}

def list_tools(server):
    found = []
    for name, spec in server["tools"].items():
        found.append({"name": name, "required": spec["required"]})
    return found

def call_tool(server, name, arguments):
    spec = server["tools"].get(name)
    if spec is None:
        return {"error": "unknown tool " + name}
    missing = [key for key in spec["required"] if key not in arguments]
    if missing:
        return {"error": "missing " + ", ".join(missing)}
    return spec["call"](arguments)

print("discover", list_tools(SERVER))
print("read", SERVER["resources"]["policy://returns/dairy"])
print("call ok", call_tool(SERVER, "get_store_hours", {"store_id": "S12"}))
print("call bad", call_tool(SERVER, "get_store_hours", {}))
`,
      },
    ],
    followUps: [
      {
        q: "MCP or native function calling?",
        a: "Function calling is the model's ability to emit a tool name and arguments. MCP is the transport and discovery layer between the client and the tool server. You use both: the model emits a call, the MCP client forwards it to the server that advertised that tool.",
      },
      {
        q: "Where do secrets live?",
        a: "On the server, in its own credential store. The model sees a tool schema, not a database password. The server checks the caller's identity before it runs the tool.",
      },
    ],
    pitfalls: [
      "Calling every API route a tool with no schema and no authz.",
      "Putting secrets in the prompt because the tool needed them.",
      "Describing MCP as a vector database or as a model.",
    ],
  },
  {
    slug: "langchain-langgraph",
    title: "LangChain vs LangGraph",
    round: "genai",
    priority: "high",
    minutes: 12,
    technologies: ["LangChain", "LangGraph", "state machines", "agents"],
    interviewerWants:
      "Chains and integrations versus a stateful graph with explicit transitions.",
    sayIn60:
      "LangChain is a toolkit for composing model calls, prompts, retrievers, and vendor integrations in a directed sequence. A chain is a pipeline: retrieve, then prompt, then parse. LangGraph is for workflows that loop, branch, and remember state. You define a state object and nodes that update it, plus conditional edges, such as 'grade the documents, and only generate if they are relevant'. I use a chain when the path is fixed. I use a graph when the system must retry retrieval, call tools, or stop. The library is optional. The design is the state and the edges.",
    fiveMinute: [
      "A chain has a known order. A graph has a state and routers.",
      "Show one conditional edge from a grader to generate or refuse.",
      "State is explicit: question, documents, tool result, answer.",
      "Cycles need a stop: max steps, or a grader that can halt.",
      "Vendor wrappers are convenient and are not the architecture.",
    ],
    sections: [
      {
        heading: "What each library is for",
        paragraphs: [
          "LangChain grew up around prompt templates, output parsers, retrievers, and chat-model wrappers. That is valuable when you want a standard interface over several providers. It becomes hard to operate when control flow hides inside an agent that may call tools forever. LangGraph makes the control flow a graph you can draw, test, and persist. Checkpointers store state so a long workflow can resume.",
          "I do not import a framework to hide a single prompt. I import it when several people will maintain the same integrations, or when the workflow has branches I need to see in code review.",
        ],
      },
      {
        heading: "The stateful pattern",
        paragraphs: [
          "Each node is a function from state to a partial update. Edges say what runs next. A conditional edge reads state and returns the name of the next node. That is the difference from a chain, which cannot decide to go back and rewrite the query unless you bury that loop inside one function.",
        ],
      },
    ],
    examples: [
      {
        id: "chain-vs-graph",
        title: "A fixed chain and a graph that can refuse",
        language: "python",
        summary:
          "Runs in the browser. No LangChain install. The first function is a chain. The second is a graph with an explicit router.",
        code: `POLICIES = {
    "refund": "Opened dairy can be refunded within 7 days with a receipt.",
}

def chain(question):
    # Fixed path: retrieve, then always phrase an answer.
    passage = POLICIES["refund"]
    return f"Chain says: {passage}"

def retrieve(state):
    if "refund" in state["question"].lower() or "dairy" in state["question"].lower():
        state["docs"] = [POLICIES["refund"]]
    else:
        state["docs"] = []
    return state

def route(state):
    if state["docs"]:
        return "generate"
    return "refuse"

def generate(state):
    state["answer"] = "From policy: " + state["docs"][0]
    return state

def refuse(state):
    state["answer"] = "No grounded passage. Refusing."
    return state

NODES = {"retrieve": retrieve, "generate": generate, "refuse": refuse}

def run_graph(question):
    state = {"question": question, "docs": [], "answer": ""}
    state = NODES["retrieve"](state)
    nxt = route(state)
    state = NODES[nxt](state)
    return state["answer"]

print(chain("What is the weather?"))
print("graph:", run_graph("Can I refund dairy?"))
print("graph:", run_graph("What is the weather?"))
`,
      },
    ],
    followUps: [
      {
        q: "Do you need either library?",
        a: "No. A few plain functions are easier to test for a single RAG call. I reach for LangGraph when there are branches, retries, and a state I want to persist. I reach for LangChain when its retriever and model interfaces save real integration work.",
      },
      {
        q: "How do you stop an agent loop?",
        a: "A max step count, a grader node that can halt, and tool allowlists. A loop without a budget is an incident.",
      },
    ],
    pitfalls: [
      "An agent with tools and no stop condition.",
      "Using LangChain as the explanation of RAG. The index and the eval are the explanation.",
      "Hiding branch logic inside one giant prompt.",
    ],
  },
  {
    slug: "embeddings-llms",
    title: "LLMs and embeddings",
    round: "genai",
    priority: "core",
    minutes: 10,
    technologies: ["LLM", "embeddings", "bi-encoder", "context window"],
    interviewerWants:
      "You can separate a generative decoder from a model that only places text in a vector space.",
    sayIn60:
      "A large language model generates the next token from a context. An embedding model maps a text to a vector so that similar texts land nearby. I use the embedding model for retrieval and clustering, and the language model to write an answer from retrieved text. They are trained differently. Swapping a new embedding model means re-embedding the corpus, because vectors from two models do not share a space. The context window is how many tokens the generator can read at once, which is why retrieval selects passages instead of attaching the whole archive.",
    fiveMinute: [
      "Generation is next-token prediction. Embedding is a fixed vector.",
      "Bi-encoders embed query and document separately. Cross-encoders score a pair and are used to rerank.",
      "Dimensions and normalization must match the index.",
      "Re-embed when you change models. Do not mix vectors.",
      "Long context does not remove the need to select evidence.",
    ],
    sections: [
      {
        heading: "Two models, two costs",
        paragraphs: [
          "Embedding a chunk is cheap and happens mostly offline. Generating an answer is more expensive and happens on the user path. I spend design time on what enters the generator, because every extra passage costs latency and can distract the model. A cross-encoder reranker reads the query and the passage together, which is slower than a bi-encoder and more accurate for the final few candidates.",
        ],
      },
    ],
    examples: [
      {
        id: "same-space",
        title: "Nearest chunk in a shared vector space",
        language: "python",
        summary:
          "Runs in the browser. These vectors stand in for an embedding model's output. The generator is not involved until after the nearest chunk is chosen.",
        code: `import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb)

corpus = {
    "dairy-refund": [0.91, 0.12, 0.20],
    "promo-tag": [0.15, 0.88, 0.10],
    "waste": [0.20, 0.18, 0.90],
}
question = [0.86, 0.18, 0.22]
ranked = sorted(
    ((cosine(question, vec), name) for name, vec in corpus.items()),
    reverse=True,
)
print("nearest", ranked[0][1], round(ranked[0][0], 3))
print("generator would see only this chunk, then phrase the answer")
`,
      },
    ],
    followUps: [
      {
        q: "Can the same model embed and generate?",
        a: "Some APIs offer both from one provider. They are still different endpoints and different outputs. I do not take a hidden state from the generator and drop it into an index built with another embedding model.",
      },
    ],
    pitfalls: [
      "Mixing two embedding models in one index.",
      "Assuming a 1 million token window makes retrieval unnecessary.",
      "Calling the embedding the answer. It is an address.",
    ],
  },
  {
    slug: "chunking-retrieval",
    title: "Chunking and retrieval",
    round: "genai",
    priority: "core",
    minutes: 12,
    technologies: ["chunking", "overlap", "hybrid search", "reranking"],
    interviewerWants:
      "How you split documents, and how you know the retriever found the right passage.",
    sayIn60:
      "I chunk on structure first: headings and paragraphs, then a size limit with overlap so a rule is not cut in half with no copy of the full rule. Each chunk stores document id, section title, and version. Retrieval is hybrid when the domain has exact tokens such as SKU codes: a keyword search and a vector search, merged. I evaluate with questions whose gold chunk I know, and I report recall at k. If the gold chunk is usually in the top 20 but not the top 4, I add a reranker instead of stuffing more text into the prompt.",
    fiveMinute: [
      "Structure first, character size second.",
      "Overlap is how you keep a sentence that sits on a boundary.",
      "Parent-child chunks: retrieve a small child, send the parent section to the model.",
      "Hybrid search for codes and names. Vector search for paraphrases.",
      "recall@k on a labeled set before you tune the prompt.",
    ],
    sections: [
      {
        heading: "Size is a compromise",
        paragraphs: [
          "A chunk that is too small loses the condition of a rule. A chunk that is too large dilutes the embedding and wastes context. I start near a few hundred tokens of meaningful text, keep the heading with the body, and overlap by a short paragraph. Tables often deserve their own chunk with the column headers repeated, because a row without headers is not an answer.",
        ],
      },
      {
        heading: "Retrieval is a measured step",
        paragraphs: [
          "Top-k is not a quality strategy. I label 50 to 200 real questions with the passage that should have been found. recall@5 tells me whether the index can succeed before the model speaks. Failures cluster: scanned PDFs with broken reading order, two policies with the same title, or a question that uses a SKU the embedding never saw as a word. Hybrid search and metadata filters are the usual fixes.",
        ],
      },
    ],
    examples: [
      {
        id: "overlap-chunks",
        title: "Split a policy with overlap and keep the heading",
        language: "python",
        summary:
          "Runs in the browser. Windows of 12 words, step 8, so neighboring chunks share 4 words. The heading is prefixed onto every chunk.",
        code: `policy = (
    "Dairy returns. Opened dairy can be refunded within seven days "
    "with a receipt. Unopened dairy follows the standard perishable rule. "
    "Milk past the sell-by date is written off and is not donated."
)
words = policy.split()
size = 12
step = 8
chunks = []
start = 0
while start < len(words):
    window = words[start:start + size]
    if not window:
        break
    body = " ".join(window)
    if not body.startswith("Dairy returns."):
        body = "Dairy returns. " + body
    chunks.append(body)
    if start + size >= len(words):
        break
    start += step

for index, chunk in enumerate(chunks, start=1):
    print(index, chunk)
print("chunks", len(chunks))
`,
      },
    ],
    followUps: [
      {
        q: "How much overlap?",
        a: "Enough to cover a typical sentence that would otherwise be cut, often 10 to 20 percent of the chunk. I confirm with the eval set. More overlap costs index size and duplicate hits.",
      },
      {
        q: "What is hybrid search?",
        a: "Combine a lexical score, such as BM25 on SKU and policy names, with a vector score. Fuse the rankings. Exact codes fail in pure vector search more often than paraphrases do.",
      },
    ],
    pitfalls: [
      "Fixed character cuts through the middle of every rule.",
      "No heading on the chunk, so the model cannot tell which policy it is reading.",
      "Tuning k by vibes instead of recall on labeled questions.",
    ],
  },
  {
    slug: "tool-calling",
    title: "Tool calling",
    round: "genai",
    priority: "core",
    minutes: 10,
    technologies: ["function calling", "JSON schema", "allowlists"],
    interviewerWants:
      "The model proposes a call. Your code validates it and executes it. The model does not hold credentials.",
    sayIn60:
      "Tool calling lets the model emit a structured request, usually a function name and a JSON object, instead of guessing a number it cannot know. My service parses that object, checks it against the tool schema and an allowlist, runs the tool in our backend, and sends the result back for the model to phrase. If parsing fails, I retry once with the error, then fail closed. Tools that change data require an explicit user confirmation. Read tools still enforce authorization on the server.",
    fiveMinute: [
      "The model chooses the tool. The server executes it.",
      "Schema validation before any side effect.",
      "Allowlist of tool names. Ignore anything else.",
      "Put the tool result back into the conversation as data, not as a new system prompt from the user.",
      "Confirm writes. Log the arguments without secrets.",
    ],
    sections: [
      {
        heading: "A call is data until you accept it",
        paragraphs: [
          "Models emit tool calls that are almost JSON. Production code treats them as untrusted input. Unknown tool names, extra fields, and the wrong types are rejected. The function that hits the database is an ordinary function in your service, tested like any other. The model never receives a connection string.",
        ],
      },
    ],
    examples: [
      {
        id: "parse-tool-call",
        title: "Parse a tool call and fail closed",
        language: "python",
        summary:
          "Runs in the browser. One valid call, one broken JSON blob, one tool that is not on the allowlist.",
        code: `import json

ALLOWED = {"get_on_hand", "get_store_hours"}

def on_hand(args):
    return {"sku": args["sku"], "store_id": args["store_id"], "units": 14}

IMPLEMENTATIONS = {"get_on_hand": on_hand, "get_store_hours": lambda args: {"hours": "07:00-22:00"}}

def dispatch(raw):
    try:
        call = json.loads(raw)
        name = call["name"]
        args = call["arguments"]
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        print("reject parse:", exc.__class__.__name__)
        return
    if name not in ALLOWED:
        print("reject tool:", name)
        return
    if not isinstance(args, dict):
        print("reject arguments")
        return
    print("ok", IMPLEMENTATIONS[name](args))

dispatch('{"name":"get_on_hand","arguments":{"sku":"MLK","store_id":"S12"}}')
dispatch('{"name":"get_on_hand","arguments":')
dispatch('{"name":"drop_table","arguments":{}}')
`,
      },
    ],
    followUps: [
      {
        q: "How is this different from RAG?",
        a: "RAG reads passages you indexed. A tool reads or writes a live system. Prices and on-hand counts should come from tools, not from a chunk that was embedded last week.",
      },
    ],
    pitfalls: [
      "Executing model text with eval.",
      "A tool that takes a raw SQL string from the model.",
      "No allowlist, so a renamed function still runs.",
    ],
  },
  {
    slug: "evals-guardrails",
    title: "Evaluation and guardrails",
    round: "genai",
    priority: "core",
    minutes: 12,
    technologies: ["eval sets", "refusal", "PII", "allowlists"],
    interviewerWants:
      "A repeatable eval, and guards that fail closed around tools, data, and unsupported answers.",
    sayIn60:
      "I keep a fixed set of questions with the passage or tool result that should have been used, plus questions that should be refused. Every prompt or index change runs that set. I report retrieval recall, answer faithfulness, and the refusal rate on out-of-scope questions. Guardrails sit in code: schema checks, an allowlist of tools, a filter so one store cannot retrieve another's documents, and a redaction step for card numbers and similar secrets before text is logged or sent to a model. The model is not the access-control layer.",
    fiveMinute: [
      "Golden questions, golden passages, and deliberate refusal cases.",
      "Run the set in CI. Block a drop in recall or a drop in correct refusals.",
      "Separate safety guards from quality evals.",
      "Redact secrets before logging prompts.",
      "Authorization is a query filter, not a sentence in the system prompt.",
    ],
    sections: [
      {
        heading: "Evals you can regress",
        paragraphs: [
          "A demo that looks good on three questions will not survive a policy update. I store cases as data: question, allowed document ids, expected refusal or expected facts, and tags such as region. The scorer can be exact for refusals and for citation ids, and a rubric for wording. If I use a model as a judge, I calibrate it on a human-labeled subset and I do not let the same model grade its own unseen trick.",
        ],
      },
      {
        heading: "Guardrails in the service",
        paragraphs: [
          "Input guards reject empty questions and strip credentials that a user pasted. Retrieval guards apply tenant filters in the query. Output guards check citations and can replace an answer with a refusal. Tool guards validate schemas. None of these are a single 'moderation' checkbox. Each one is a test.",
        ],
      },
    ],
    examples: [
      {
        id: "eval-gate",
        title: "Score refusals and block a bad prompt change",
        language: "python",
        summary:
          "Runs in the browser. Three labeled cases. The gate fails the build if a question that should refuse gets an answer.",
        code: `CASES = [
    {"q": "Refund opened dairy?", "expect_refuse": False, "must_cite": "returns-dairy"},
    {"q": "Weather in Paris?", "expect_refuse": True, "must_cite": None},
    {"q": "Donate expired milk?", "expect_refuse": False, "must_cite": "waste-milk"},
]

# This candidate system answers everything and cites nothing.
def bad_system(question):
    return {"refused": False, "cite": None, "text": "Sure, here is a guess."}

def score(system):
    failures = []
    for case in CASES:
        result = system(case["q"])
        if result["refused"] != case["expect_refuse"]:
            failures.append(case["q"] + " refusal")
        if case["must_cite"] and result.get("cite") != case["must_cite"]:
            failures.append(case["q"] + " citation")
    return failures

failures = score(bad_system)
print("failures", failures)
if failures:
    print("CI gate: do not promote this prompt")
else:
    print("CI gate: promote")
`,
      },
    ],
    followUps: [
      {
        q: "What do you log?",
        a: "Question id, retrieved chunk ids, tool names, latency, token counts, and whether the guard refused. I redact emails, card numbers, and secrets before the log line is written. I do not log raw credentials to debug a prompt.",
      },
    ],
    pitfalls: [
      "Evaluating on the same five questions you used to write the prompt.",
      "A system prompt that says 'only answer from context' with no code that checks.",
      "Letting a model-as-judge be the only release gate.",
    ],
  },
];
