
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cohere
import os
from dotenv import load_dotenv
from typing import List
from deep_translator import GoogleTranslator # Import GoogleTranslator

from qdrant_client import QdrantClient # Import QdrantClient directly
# from qdrant_client.models import Distance, VectorParams # Removed as it might interfere
from qdrant_client.http.models import SearchRequest # Import SearchRequest for lower-level API

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Translator
translator = GoogleTranslator()

# Get API keys from environment variables
cohere_api_key = os.getenv("COHERE_API_KEY")
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

# Check if the keys are loaded
if not all([cohere_api_key, qdrant_url, qdrant_api_key]):
    raise HTTPException(
        status_code=500,
        detail="API keys or Qdrant URL not found. Please check your .env file."
    )

# Initialize Cohere and Qdrant clients
try:
    co = cohere.Client(cohere_api_key)
    qc = QdrantClient( # Use the directly imported QdrantClient
        url=qdrant_url,
        api_key=qdrant_api_key,
    )
    COLLECTION_NAME = "rag_embedding"
    
    # Check if the collection exists (optional, as main.py creates it)
    # This just ensures we are aware of its presence
    try:
        qc.get_collection(collection_name=COLLECTION_NAME)
        print(f"Collection '{COLLECTION_NAME}' is available.")
    except Exception:
        # If the collection does not exist, main.py should be run first.
        # This app should not create it to avoid race conditions or misconfiguration.
        print(f"Collection '{COLLECTION_NAME}' not found. Please run backend/main.py first to ingest data.")
        raise HTTPException(
            status_code=500,
            detail=f"Qdrant collection '{COLLECTION_NAME}' not found. Please ingest data."
        )

except Exception as e:
    raise HTTPException(
        status_code=500,
        detail=f"Failed to initialize Cohere or Qdrant client: {e}"
    )

# --- Embedding Function (from main.py) ---
def embed(texts: List[str]) -> List[List[float]]:
    """
    Generates embeddings for a list of texts using Cohere.
    """
    if not texts:
        return []
    try:
        response = co.embed(
            texts=texts,
            model='embed-english-v3.0',
            input_type='search_query' # Changed to search_query for user queries
        )
        return response.embeddings
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate embeddings: {e}"
        )

class ChatRequest(BaseModel):
    query: str
    selected_text: str | None = None

@app.post("/chat")
async def chat(request: ChatRequest):
    user_query = request.query
    selected_context = request.selected_text

    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # 1. Generate embedding for the user query
    query_embedding = embed([user_query])[0]

    # 2. Query Qdrant for relevant documents
    try:
        search_result = qc.query_points(
            collection_name=COLLECTION_NAME,
            query=query_embedding, # Corrected: Use 'query' instead of 'query_vector'
            limit=3,
            with_payload=True
        )
    except Exception as e:
        print(f"Error searching Qdrant: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search Qdrant: {e}"
        )

    context_chunks = []
    for hit in search_result:
        context_chunks.append(hit.payload["text"])
    
    # Add selected text to context if provided
    if selected_context:
        context_chunks.insert(0, selected_context) # Give priority to selected text

    # 3. Prepare prompt for Cohere generation
    # Limit context to avoid token limits and focus on most relevant parts
    
    # The actual Cohere generate model call will be streaming.
    # For now, let's just make a placeholder response.
    # We will implement the streaming in the next step.
    
    combined_context = "\n".join(context_chunks[:5]) # Take top 5 context chunks
    
    prompt = f"""You are an AI assistant for a humanoid robotics book. 
Answer the following question based only on the provided context. 
If the answer is not available in the context, politely state that you don't have enough information.

Context:
{combined_context}

Question: {user_query}
Answer:"""

    try:
        response = co.generate(
            prompt=prompt,
            model='command-r-plus', # Or 'command' or 'command-r'
            max_tokens=500,
            temperature=0.3,
            stream=True # We will implement streaming
        )
        
        # Placeholder for streaming response
        # In a real implementation, you'd iterate through the stream
        # and yield chunks.
        full_response = ""
        for token in response:
            full_response += token.text
        
        return {"response": full_response}
    except Exception as e:
        print(f"Error generating Cohere response: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {e}"
        )
        
        
        
        class TranslateRequest(BaseModel):
        
            text: str
        
            target_language: str
            source_language: str | None = None # Added source_language
        
        
        
        @app.post("/translate")
        
        async def translate(request: TranslateRequest):
        
            try:
                # Use the global translator object
                translated = translator.translate(
                    request.text, 
                    dest=request.target_language, 
                    src=request.source_language or 'auto' # Detect source if not provided
                )
                return {"translated_text": translated.text}
            except Exception as e:
                print(f"Error during translation: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Translation failed: {e}"
                )
        
        
        if __name__ == "__main__":
        
            import uvicorn
        
            uvicorn.run(app, host="0.0.0.0", port=8000)
