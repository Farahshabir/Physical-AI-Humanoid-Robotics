import os
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Qdrant
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.tools import BaseTool
from typing import Any, List, Optional, Type
from pydantic import BaseModel as LCBaseModel
from langchain_core.callbacks import CallbackManagerForToolRun
from langchain_core.messages import HumanMessage # Added for direct LLM with selected text

# --- Configuration ---
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
QDRANT_COLLECTION_NAME = "humanoid-robotics-book"

# --- FastAPI App Initialization ---
app = FastAPI()

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    query: str
    selected_text: str | None = None

# --- LangChain/RAG Setup ---

# This custom tool definition demonstrates how one would create a tool.
# In the LCEL chain below, we directly use the retriever, so this tool is
# not strictly used by the main RAG chain, but it's kept for illustrative purposes
# if an agent-based approach were chosen later.
class QdrantRetrievalInput(LCBaseModel):
    query: str = Field(description="The query string to search within the Qdrant vector store.")

class QdrantRetrievalTool(BaseTool):
    name: str = "qdrant_retrieval"
    description: str = "Retrieves contextually relevant information from the Qdrant vector store based on a query. Input should be a single string query."
    args_schema: Type[LCBaseModel] = QdrantRetrievalInput
    qdrant_retriever: Any # This will be the Qdrant vector store as a retriever

    def _run(self, query: str, run_manager: Optional[CallbackManagerForToolRun] = None) -> str:
        """Synchronously retrieves information from Qdrant."""
        docs = self.qdrant_retriever.get_relevant_documents(query)
        if not docs:
            return "No relevant information found in the knowledge base."
        return "\n\n".join([doc.page_content for doc in docs])

    async def _arun(self, query: str, run_manager: Optional[CallbackManagerForToolRun] = None) -> str:
        """Asynchronously retrieves information from Qdrant."""
        # For simplicity, we'll call the sync version in an async context.
        # In a real async application, consider running this in a thread pool executor.
        return self._run(query, run_manager)

def initialize_rag_pipeline():
    """Initializes the components required for the RAG pipeline using LCEL."""
    if not all([QDRANT_URL, OPENAI_API_KEY]):
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! WARNING: QDRANT_URL and OPENAI_API_KEY environment variables must be set. !!!")
        print("!!! The /chat endpoint will not work until these are set and Qdrant is accessible.")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return None

    embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
    
    # Initialize Qdrant client
    qdrant = Qdrant.from_existing_collection(
        embedding=embeddings,
        collection_name=QDRANT_COLLECTION_NAME,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
    )
    
    llm = ChatOpenAI(
        api_key=OPENAI_API_KEY,
        model="gpt-4o-mini",
        temperature=0.1,
        streaming=True
    )
    
    retriever = qdrant.as_retriever()
    
    # RAG prompt
    template = """You are an assistant for question-answering tasks. 
    Use the following retrieved context to answer the question. 
    If you don't know the answer, just say that you don't know. 
    Use three sentences maximum and keep the answer concise.
    
    Question: {question}
    Context: {context}
    Answer:"""
    rag_prompt = PromptTemplate(
        template=template
    )

    # LCEL Chain to retrieve documents and then pass to LLM
    def format_docs(docs):
        return "\n\n".join([doc.page_content for doc in docs])

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | rag_prompt
        | llm
        | StrOutputParser()
    )
    
    return rag_chain

qa_pipeline = None
try:
    qa_pipeline = initialize_rag_pipeline()
except Exception as e:
    print(f"Error initializing RAG pipeline: {e}")
    # The app will run but /chat will fail until env vars are set

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"Status": "Online"}

async def stream_rag_response(chain, query: str):
    """Streams the response from the RAG chain."""
    async for chunk in chain.astream(query):
        yield chunk

@app.post("/chat")
async def chat(request: ChatRequest):
    if qa_pipeline is None:
        return StreamingResponse(
            (chunk for chunk in ["Sorry, the RAG pipeline is not initialized. Please check server configuration and environment variables."]),
            media_type="text/plain"
        )

    query = request.query
    
    # If user has selected text, prioritize it as context
    if request.selected_text:
        # For direct LLM interaction with selected text, we can build a simple chain
        # or just pass a formatted message to the LLM.
        llm_for_direct_query = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4o-mini", streaming=True, temperature=0.1)
        
        async def stream_direct_response():
            messages = [
                HumanMessage(
                    content=f"Based on the following text, answer the user's question.\n\nText: \"{request.selected_text}\"\n\nQuestion: {query}"
                )
            ]
            async for chunk in llm_for_direct_query.astream(messages):
                yield chunk.content
        
        return StreamingResponse(stream_direct_response(), media_type="text/event-stream")

    # If no text is selected, use the full RAG pipeline
    return StreamingResponse(stream_rag_response(qa_pipeline, query), media_type="text/event-stream")

# --- CORS Middleware ---
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Docusaurus app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    if not all([QDRANT_URL, OPENAI_API_KEY]):
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! WARNING: Required environment variables are not set. !!!")
        print("!!! The server will run, but the /chat endpoint will not work.")
        print("!!! Please set QDRANT_URL and OPENAI_API_KEY.")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    uvicorn.run(app, host="0.0.0.0", port=8000)