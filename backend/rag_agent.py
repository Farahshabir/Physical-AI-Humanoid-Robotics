import os
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter
from openai import OpenAI
from cohere import Client as CohereClient

# Load API keys
OPENAI_API_KEY="AIzaSyBk3cTPJNSkfQY6fSqU8dPnijUAt6xW4oE"
COHERE_API_KEY="9CicxGuCel2Aalc6GOtzKeVNo54iHDvGj0c9f7Ul"
QDRANT_URL = os.getenv("https://4ed71eb1-ca62-43fe-92ba-b71bd23f74e7.europe-west3-0.gcp.cloud.qdrant.io:6333")
QDRANT_API_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.mib6iZt45Y23gGrzgivagXGM77YjMCdbv1ZBROpHOtI")

# Initialize clients
openai_client = OpenAI(api_key=OPENAI_API_KEY)
cohere_client = CohereClient(api_key=COHERE_API_KEY)
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

VECTOR_COLLECTION = "rag_embedding"

def get_answer(user_query: str, selected_text: str = None):
    # Step 1: Generate embedding for the query
    if selected_text:
        # use selected text as context
        query_embedding = cohere_client.embed([selected_text]).embeddings[0]
    else:
        query_embedding = cohere_client.embed([user_query]).embeddings[0]

    # Step 2: Search in Qdrant
    search_result = qdrant_client.search(
        collection_name=VECTOR_COLLECTION,
        query_vector=query_embedding,
        limit=3  # top 3 relevant chunks
    )

    if not search_result:
        return "I don’t have enough information in this book to answer that.", []

    # Prepare context from retrieved chunks
    context = "\n\n".join([hit.payload.get("text", "") for hit in search_result])
    sources = [hit.payload.get("url", "") for hit in search_result]

    # Step 3: Generate answer with OpenAI Agent
    prompt = f"""
    You are an AI assistant. Answer the user query based only on the following context:

    Context:
    {context}

    User Query:
    {user_query}

    If the answer is not present in the context, reply:
    "I don’t have enough information in this book to answer that."
    """

    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    answer_text = response.choices[0].message.content
    return answer_text, sources
