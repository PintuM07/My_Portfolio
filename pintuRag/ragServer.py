"""
Pintu RAG Server — lightweight, no blocked DLLs.
Uses pure-Python TF-IDF keyword search (no scipy, no sklearn, no sentence-transformers).
Dependencies: fastapi, uvicorn  (both already installed)
"""
import json
import math
import re
from collections import Counter
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Load & flatten portfolio knowledge base ───────────────────────────────────
with open('pintu-data.json') as f:
    data = json.load(f)

documents = []
for k, v in data.items():
    if isinstance(v, dict):
        for key, val in v.items():
            documents.append(f"{key}: {val}")
    elif isinstance(v, list):
        documents.append(f"{k}: {', '.join(str(i) for i in v)}")
    else:
        documents.append(f"{k}: {v}")

print(f"Loaded {len(documents)} knowledge chunks.")

# ── Pure-Python TF-IDF index ──────────────────────────────────────────────────
def tokenize(text: str):
    return re.findall(r'\b\w+\b', text.lower())

# Build IDF
doc_tokens = [tokenize(d) for d in documents]
N = len(documents)
df = Counter()
for tokens in doc_tokens:
    for t in set(tokens):
        df[t] += 1

def idf(term):
    return math.log((N + 1) / (df.get(term, 0) + 1)) + 1

def tfidf_vec(tokens):
    tf = Counter(tokens)
    total = len(tokens) or 1
    return {t: (c / total) * idf(t) for t, c in tf.items()}

doc_vecs = [tfidf_vec(t) for t in doc_tokens]

def cosine(a, b):
    keys = set(a) & set(b)
    if not keys:
        return 0.0
    dot = sum(a[k] * b[k] for k in keys)
    mag_a = math.sqrt(sum(v * v for v in a.values()))
    mag_b = math.sqrt(sum(v * v for v in b.values()))
    return dot / (mag_a * mag_b) if (mag_a and mag_b) else 0.0

def search(query: str, top_k: int = 3):
    q_vec = tfidf_vec(tokenize(query))
    scores = [(cosine(q_vec, dv), i) for i, dv in enumerate(doc_vecs)]
    scores.sort(reverse=True)
    return [documents[i] for _, i in scores[:top_k] if _ > 0]

print("TF-IDF index ready.")

# ── FastAPI ───────────────────────────────────────────────────────────────────
app = FastAPI(title="Pintu RAG API", version="3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str

@app.get("/")
def health():
    return {"status": "ok", "docs_indexed": len(documents)}

@app.post("/query")
def answer_question(q: Query):
    hits = search(q.question)
    if not hits:
        return {"answer": "Sorry, I couldn't find relevant information about that."}
    answer = "\n".join(f"• {hit}" for hit in hits)
    return {"answer": answer}

