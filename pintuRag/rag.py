import json
import faiss
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load your portfolio data
with open('pintu-data.json') as f:
    data = json.load(f)

# Flatten data
documents = []
for k,v in data.items():
    if isinstance(v, dict):
        for key, val in v.items():
            documents.append(f"{key}: {val}")
    elif isinstance(v, list):
        documents.append(f"{k}: {', '.join(v)}")
    else:
        documents.append(f"{k}: {v}")

# Create embeddings
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
doc_embeddings = embed_model.encode(documents, convert_to_numpy=True)

# Build FAISS index
dim = doc_embeddings.shape[1]
index = faiss.IndexFlatL2(dim)
index.add(doc_embeddings)

# Load LLM
tokenizer = AutoTokenizer.from_pretrained("TheBloke/vicuna-7B-1.1-HF")
model = AutoModelForCausalLM.from_pretrained("TheBloke/vicuna-7B-1.1-HF", device_map="auto")

# FastAPI setup
app = FastAPI()

class Query(BaseModel):
    question: str

def rag_query(query, top_k=3):
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    D, I = index.search(q_emb, top_k)
    context = "\n".join([documents[i] for i in I[0]])
    input_text = f"Answer the question using only the context below.\nContext:\n{context}\nQuestion: {query}\nAnswer:"
    inputs = tokenizer(input_text, return_tensors="pt").to(model.device)
    output = model.generate(**inputs, max_new_tokens=150)
    return tokenizer.decode(output[0], skip_special_tokens=True)

@app.post("/query")
def answer_question(q: Query):
    response = rag_query(q.question)
    return {"answer": response}
