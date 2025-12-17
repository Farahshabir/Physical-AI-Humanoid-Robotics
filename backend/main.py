import os
import cohere
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from openai import OpenAI
from starlette.responses import StreamingResponse
import json

# Use load_dotenv from python-dotenv if you have a .env file
# from dotenv import load_dotenv
# load_dotenv()

app = FastAPI()

# --- CORS Middleware ---
# This allows the frontend (running on http://localhost:3000)
# to communicate with this backend.
origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Client Initialization ---
# Securely load API keys and other configurations from environment variables.
try:
    COHERE_API_KEY = os.environ['COHERE_API_KEY']
    QDRANT_URL = os.environ['QDRANT_URL']
    QDRANT_API_KEY = os.environ['QDRANT_API_KEY']
    OPENAI_API_KEY = os.environ['OPENAI_API_KEY']
except KeyError as e:
    raise RuntimeError(f"Environment variable {e} not set. Please check your configuration.") from e

co = cohere.Client(COHERE_API_KEY)
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

COLLECTION_NAME = "humanoid-robotics-book"

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    query: str

# --- RAG Logic ---
async def perform_rag(query: str):
    """
    Performs the full RAG pipeline:
    1. Embeds the query.
    2. Searches Qdrant for relevant documents.
    3. Streams an answer from OpenAI based on the context.
    """
    # 1. Embed the query using Cohere
    query_embedding = co.embed(
        texts=[query],
        model="embed-english-light-v3.0",
        input_type="search_query"
    ).embeddings[0]

    # 2. Search Qdrant for relevant documents
    search_result = qdrant_client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        limit=3,
        with_payload=True
    )

    context = "\n".join(
        hit.payload.get("text", "") for hit in search_result
    )
    
    sources = [hit.payload for hit in search_result]

    # 3. Stream the answer from OpenAI
    stream = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for the AI Humanoid Textbook. Answer the user's question based *only* on the provided context. If the answer is not in the context, say 'I don’t have enough information in this book to answer that.'"},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion:\n{query}"}
        ],
        stream=True
    )

    # First, yield the sources
    yield f"data: {json.dumps({'sources': sources})}\n\n"

    # Then, stream the content chunks
    for chunk in stream:
        if content := chunk.choices[0].delta.content:
            yield f"data: {json.dumps({'content': content})}\n\n"

# --- API Endpoint ---
@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Endpoint to handle chat requests. It streams the RAG response.
    """
    return StreamingResponse(perform_rag(req.query), media_type="text/event-stream")
