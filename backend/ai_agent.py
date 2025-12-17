from ai_agent import Agent, Runner, OpenAIChatCompletionsModel, AsyncOpenAI
from ai_agent import function_tool
import os
from dotenv import load_dotenv


# enable_verbose_stdout_logging()

load_dotenv()
# set_tracing_disabled(disabled=True)

gemini_api_key = os.getenv("AIzaSyBk3cTPJNSkfQY6fSqU8dPnijUAt6xW4oE")
provider = AsyncOpenAI(
    api_key=gemini_api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

model = OpenAIChatCompletionsModel(
    model="gemini-2.0-flash",
    openai_client=provider
)
import cohere
from qdrant_client import QdrantClient

# Initialize Cohere client
cohere_api_key = os.getenv("9CicxGuCel2Aalc6GOtzKeVNo54iHDvGj0c9f7Ul")
if not cohere_api_key:
    raise ValueError("COHERE_API_KEY environment variable not set.")
cohere_client = cohere.Client(cohere_api_key)

# Connect to Qdrant
qdrant_url = os.getenv("https://4ed71eb1-ca62-43fe-92ba-b71bd23f74e7.europe-west3-0.gcp.cloud.qdrant.io:6333")
qdrant_api_key = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.mib6iZt45Y23gGrzgivagXGM77YjMCdbv1ZBROpHOtI")
if not qdrant_url or not qdrant_api_key:
    raise ValueError("QDRANT_URL or QDRANT_API_KEY environment variables not set.")
qdrant = QdrantClient(
    url=qdrant_url,
    api_key=qdrant_api_key
)

def get_embedding(text):
    """Get embedding vector from Cohere Embed v3"""
    response = cohere_client.embed(
        model="embed-english-v3.0",
        input_type="search_query",  # Use search_query for queries
        texts=[text],
    )
    return response.embeddings[0]  # Return the first embedding

@function_tool
def retrieve(query: str):
    embedding = get_embedding(query)
    result = qdrant.query_points(
        collection_name="humanoid_ai_book",
        query=embedding,
        limit=5
    )
    return [point.payload for point in result.points]

agent = Agent(
    name="Assistant",
    instruction="""
You are an AI tutor for the Physical AI & Humanoid Robotics textbook.
To answer the user question, first call the tool `retrieve` with the user query.
Use ONLY the returned content from `retrieve` to answer.
If the answer is not in the retrieved content, say "I don't know".
""",
    model=model,
    tools=[retrieve]
)


import asyncio
from ai_agent import InMemoryRunner

async def main():
    """Runs the agent."""
    runner = InMemoryRunner(agent=agent)
    events = await runner.run_debug("what is physical ai?")
    
    # Find the final text response from the events
    final_output = ""
    for event in reversed(events):
        if event.is_final_response() and event.content and event.content.parts:
            final_output = "".join(
                part.text for part in event.content.parts if part.text
            )
            if final_output:
                break
    
    print(final_output)

if __name__ == "__main__":
    asyncio.run(main())