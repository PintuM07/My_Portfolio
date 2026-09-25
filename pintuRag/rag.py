"""
Pintu Mahato - Portfolio RAG API Server
Provides real-time semantic retrieval and intelligent contextual Q&A
for Pintu's portfolio assistant.
"""
import json
import math
import os
import re
from collections import Counter
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Load Knowledge Base ────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "pintu-data.json"

if not DATA_FILE.exists():
    raise FileNotFoundError(f"Knowledge base not found at {DATA_FILE}")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    raw_data: Dict[str, Any] = json.load(f)

# ── Document Chunking & Indexing ───────────────────────────────────────────────
class DocChunk:
    def __init__(self, topic: str, title: str, text: str):
        self.topic = topic
        self.title = title
        self.text = text

    def full_text(self) -> str:
        return f"{self.topic} - {self.title}: {self.text}"

documents: List[DocChunk] = []

# Personal info
personal = raw_data.get("personal", {})
for k, v in personal.items():
    documents.append(DocChunk(topic="Personal", title=k.title(), text=str(v)))

# Skills
skills = raw_data.get("skills", [])
documents.append(DocChunk(
    topic="Skills",
    title="Technical Skills",
    text=f"Pintu's technical skills include: {', '.join(skills)}."
))
for skill in skills:
    documents.append(DocChunk(
        topic="Skill",
        title=skill,
        text=f"Proficient in {skill} for building scalable backend and frontend web systems."
    ))

# Experience
experience = raw_data.get("experience", {})
for exp_title, exp_desc in experience.items():
    documents.append(DocChunk(topic="Experience", title=exp_title, text=str(exp_desc)))

# Education
education = raw_data.get("education", {})
for edu_inst, edu_desc in education.items():
    documents.append(DocChunk(topic="Education", title=edu_inst, text=str(edu_desc)))

# Projects
projects = raw_data.get("projects", {})
for proj_name, proj_desc in projects.items():
    documents.append(DocChunk(topic="Project", title=proj_name, text=str(proj_desc)))

print(f"[*] Loaded and indexed {len(documents)} knowledge chunks from {DATA_FILE.name}.")

# ── Pure-Python TF-IDF Engine ─────────────────────────────────────────────────
def tokenize(text: str) -> List[str]:
    return re.findall(r"\b\w+\b", text.lower())

doc_tokens = [tokenize(d.full_text()) for d in documents]
N = len(documents)
df = Counter()
for tokens in doc_tokens:
    for t in set(tokens):
        df[t] += 1

def idf(term: str) -> float:
    return math.log((N + 1) / (df.get(term, 0) + 1)) + 1.0

def tfidf_vector(tokens: List[str]) -> Dict[str, float]:
    tf = Counter(tokens)
    total = len(tokens) or 1
    return {t: (c / total) * idf(t) for t, c in tf.items()}

doc_vectors = [tfidf_vector(t) for t in doc_tokens]

def cosine_similarity(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    common_keys = set(v1.keys()) & set(v2.keys())
    if not common_keys:
        return 0.0
    dot = sum(v1[k] * v2[k] for k in common_keys)
    mag1 = math.sqrt(sum(v * v for v in v1.values()))
    mag2 = math.sqrt(sum(v * v for v in v2.values()))
    return dot / (mag1 * mag2) if (mag1 and mag2) else 0.0

def retrieve(query: str, top_k: int = 3) -> List[DocChunk]:
    q_tokens = tokenize(query)
    if not q_tokens:
        return []
    q_vec = tfidf_vector(q_tokens)
    scores = []
    for i, dv in enumerate(doc_vectors):
        score = cosine_similarity(q_vec, dv)
        # Bonus if query keywords match title directly
        title_lower = documents[i].title.lower()
        for tok in q_tokens:
            if tok in title_lower:
                score += 0.2
        if score > 0:
            scores.append((score, i))
    scores.sort(reverse=True, key=lambda x: x[0])
    return [documents[i] for _, i in scores[:top_k]]

# ── Intelligent Answer Synthesizer ────────────────────────────────────────────
def generate_answer(query: str) -> str:
    q_clean = query.strip().lower()

    # Greetings
    if re.search(r"\b(hi|hello|hey|greetings|hola)\b", q_clean):
        return (
            "Hi there! I'm Pintu's AI Assistant. "
            "Ask me anything about his technical skills, projects, work experience at TRPGLOBAL, or how to get in touch!"
        )

    # Contact / Hire info
    if re.search(r"\b(contact|email|phone|call|hire|reach|linkedin|github)\b", q_clean):
        p = raw_data.get("personal", {})
        return (
            f"You can get in touch with Pintu directly via:\n"
            f"• Email: {p.get('email', 'mahatopintu63@gmail.com')}\n"
            f"• Phone: {p.get('phone', '+91 89182 53874')}\n"
            f"• LinkedIn: {p.get('linkedin', 'https://www.linkedin.com/in/pintu-mahato-software-developer/')}\n"
            f"• GitHub: {p.get('github', 'https://github.com/PintuM07')}\n"
            f"He is based in Kolkata, WB, and is open to Full-time, Hybrid, and Remote opportunities."
        )

    # Current role / Company
    if re.search(r"\b(current|job|company|work now|trpglobal|present)\b", q_clean):
        return (
            "Pintu currently works as an Analyst / Software Developer at TRPGLOBAL in Kolkata (May 2025 – Present). "
            "His core focus includes building robust backend systems with Java and Spring Boot, developing applications with Oracle APEX & SQL, "
            "and working on web frontend architectures using Next.js and React."
        )

    # General skills summary
    if re.search(r"\b(skills|tech stack|technologies|tools|languages)\b", q_clean):
        skills_str = ", ".join(raw_data.get("skills", []))
        return (
            f"Pintu's primary tech stack:\n"
            f"• Core Backend: Java, Spring Boot, Hibernate, JPA, REST APIs, Microservices\n"
            f"• Databases & Enterprise: MySQL, PostgreSQL, Oracle APEX, SQL\n"
            f"• Frontend: React.js, Next.js, JavaScript, HTML5, CSS3\n"
            f"• DevOps & AI: AWS Basics, CI/CD, Git, Ollama, DeepSeek AI\n"
            f"All skills: {skills_str}"
        )

    # Education query
    if re.search(r"\b(education|degree|college|university|btech|diploma|cgpa)\b", q_clean):
        edu = raw_data.get("education", {})
        lines = [f"• {inst}: {desc}" for inst, desc in edu.items()]
        return "Pintu's Educational Background:\n" + "\n".join(lines)

    # Retrieve matching chunks
    hits = retrieve(query, top_k=3)
    if not hits:
        return (
            "I'm Pintu's AI Assistant. I can tell you all about his Java/Spring Boot development experience, "
            "projects like the TRPGLOBAL website, DeepSeek AI integration, Blog & Banking apps, or contact details. "
            "Could you please specify your question?"
        )

    # Format retrieved context into crisp answer
    lines = []
    seen = set()
    for h in hits:
        entry = f"{h.title}: {h.text}"
        if entry not in seen:
            seen.add(entry)
            lines.append(f"• {entry}")

    return "\n".join(lines)

# ── FastAPI App Configuration ──────────────────────────────────────────────────
app = FastAPI(
    title="Pintu Mahato Portfolio RAG API",
    description="Intelligent RAG backend for Pintu Mahato's developer portfolio",
    version="1.0.0"
)

# Enable CORS for all local and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "Pintu Mahato Portfolio RAG API",
        "version": "1.0.0",
        "chunks_indexed": len(documents),
        "endpoint": "POST /query"
    }

@app.get("/data")
def get_portfolio_data():
    return raw_data

@app.post("/query")
def answer_question(req: QueryRequest):
    answer = generate_answer(req.question)
    return {"answer": answer}

if __name__ == "__main__":
    import uvicorn
    print("[*] Starting Pintu Portfolio RAG Server on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
