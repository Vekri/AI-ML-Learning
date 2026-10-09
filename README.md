# AI/ML Interview Lab

Senior-level interview preparation for Python, SQL, classical machine learning, retrieval-augmented generation, deployment, and project leadership.

Every Python and SQL lesson runs in the browser. Python uses [Pyodide](https://pyodide.org/). SQL runs on a small retail sample (stores, products, sales) with AlaSQL. pandas and scikit-learn download into the browser the first time an example needs them.

These rounds are study areas. They are not a claim about any company's interview sequence.

## Lessons

1. Python, SQL, and programming
2. Machine learning and statistics
3. GenAI, RAG, and agents
4. Architecture and deployment
5. Project deep dive and leadership

The leadership round is a practice narrative. Replace it with systems you actually built and numbers you can defend.

## Local development

```bash
npm install
npm run dev
```

Check the standard-library Python examples and the SQL examples from the command line:

```bash
npm run check-examples
```

## Deploy

The app is a Next.js project and deploys on Vercel with no extra build settings.
