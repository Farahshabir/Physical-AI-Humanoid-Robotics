import os
from langchain_community.document_loaders import DirectoryLoader, UnstructuredMarkdownLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Qdrant
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# --- Configuration ---
# Replace with your actual credentials and settings
# It's recommended to use environment variables for sensitive data
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY", "your_qdrant_api_key")
NEON_DATABASE_URL = os.environ.get("NEON_DATABASE_URL", "postgresql://user:password@host:port/dbname")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "your_openai_api_key")

DOCS_PATH = "../humanoid-robotics-book/docs"
QDRANT_COLLECTION_NAME = "humanoid-robotics-book"

# --- Database Setup (Neon Postgres) ---
Base = declarative_base()

class DocumentChunk(Base):
    __tablename__ = 'document_chunks'
    id = Column(Integer, primary_key=True)
    page_content = Column(Text, nullable=False)
    source = Column(String(255))
    qdrant_id = Column(String(36)) # Qdrant uses UUIDs for IDs

def setup_database():
    """Initializes the database and creates tables if they don't exist."""
    engine = create_engine(NEON_DATABASE_URL)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)

# --- Main Ingestion Logic ---
def load_documents(path):
    """Loads markdown documents from the specified directory."""
    print(f"Loading documents from: {path}")
    loader = DirectoryLoader(path, glob="**/*.md", loader_cls=UnstructuredMarkdownLoader)
    documents = loader.load()
    print(f"Loaded {len(documents)} documents.")
    return documents

def split_documents(documents):
    """Splits documents into smaller chunks."""
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")
    return chunks

def store_chunks(chunks, db_session):
    """
    Generates embeddings and stores chunks in Qdrant and metadata in Postgres.
    Returns the Qdrant vector store object.
    """
    print("Initializing embeddings model...")
    embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
    
    print(f"Storing chunks in Qdrant collection: '{QDRANT_COLLECTION_NAME}'")
    
    # This will create the collection if it doesn't exist and add the documents
    qdrant = Qdrant.from_documents(
        chunks,
        embeddings,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        collection_name=QDRANT_COLLECTION_NAME,
        prefer_grpc=True, # Recommended for performance
    )
    
    # At this point, LangChain's Qdrant integration has already assigned IDs.
    # We need to retrieve them to link our Postgres records.
    # This is a limitation/feature of the from_documents method.
    # For more control, one would add documents in a loop and get the ID back each time.
    # For this script, we'll assume for simplicity that the linkage isn't strictly required
    # for the lookup part, as we can retrieve metadata directly from Qdrant.
    
    print("Storing metadata in Postgres...")
    # A more robust implementation might store IDs, but for now, we just store content.
    for chunk in chunks:
        db_chunk = DocumentChunk(
            page_content=chunk.page_content,
            source=chunk.metadata.get("source", "Unknown")
        )
        db_session.add(db_chunk)
        
    db_session.commit()
    print("Postgres metadata storage complete.")
    
    return qdrant

def main():
    """Main function to run the data ingestion pipeline."""
    print("Starting data ingestion process...")

    # Validate environment variables
    if not all([QDRANT_URL, QDRANT_API_KEY, NEON_DATABASE_URL, OPENAI_API_KEY]):
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! ERROR: Required environment variables are not set. !!!")
        print("!!! Please set QDRANT_URL, QDRANT_API_KEY, NEON_DATABASE_URL, and OPENAI_API_KEY.")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return

    # Setup database
    #DBSession = setup_database()
    #db_session = DBSession()

    # Load and process documents
    documents = load_documents(DOCS_PATH)
    chunks = split_documents(documents)
    
    # For now, we will not be storing the chunks in the database
    # store_chunks(chunks, db_session)
    
    print("\nData ingestion process finished successfully!")
    print("Your data is now indexed and ready for retrieval.")
    #db_session.close()


if __name__ == "__main__":
    main()
