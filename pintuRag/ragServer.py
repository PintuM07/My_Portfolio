"""
Pintu RAG Server entrypoint.
Imports and runs the FastAPI app from rag.py.
"""
from pathlib import Path
import sys

# Ensure pintuRag directory is in path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rag import app

if __name__ == "__main__":
    import uvicorn
    print("[*] Starting Pintu Portfolio RAG Server on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
