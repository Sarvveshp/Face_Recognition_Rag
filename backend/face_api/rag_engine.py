"""
RAG (Retrieval-Augmented Generation) engine for the Face Recognition Platform.
Uses LangChain, FAISS, and Google's Gemini to provide AI-powered Q&A about registered users.
"""
import os
from typing import List, Dict, Any
import datetime
from loguru import logger
from dotenv import load_dotenv

import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.schema import Document

# Load environment variables
load_dotenv()

# Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


class RAGEngine:
    """RAG Engine for answering questions about registered users."""

    def __init__(self, db_instance):
        """
        Initialize RAG Engine.
        
        Args:
            db_instance: Database instance for accessing face data
        """
        if not GEMINI_API_KEY:
            logger.error("Gemini API key not found. Set GEMINI_API_KEY in .env file.")
            raise ValueError("Gemini API key not found")
        
        self.db = db_instance
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=GEMINI_API_KEY
        )
        self.text_splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=1000,
            chunk_overlap=200
        )
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            temperature=0,
            google_api_key=GEMINI_API_KEY
        )
        self.vector_store = None
        self.qa_chain = None
        self.chat_history = []
        
        # Initialize the vector store
        self._initialize_vector_store()
        
        logger.info("RAG Engine initialized")

    def _initialize_vector_store(self):
        """Initialize the vector store with documents from the database."""
        try:
            # Get all face encodings and registration logs
            face_data = self.db.get_all_face_encodings()
            registration_logs = self.db.get_registration_logs()
            
            # Create documents from face data
            documents = []
            
            # Process face data
            for face in face_data:
                # Format timestamp
                created_at = face.get("created_at", datetime.datetime.now()).strftime("%Y-%m-%d %H:%M:%S")
                
                # Create document content
                content = f"""
                Person: {face.get('name', 'Unknown')}
                Registration Date: {created_at}
                ID: {face.get('_id', '')}
                """
                
                # Add metadata if available
                if "metadata" in face and face["metadata"]:
                    content += "Metadata:\n"
                    for key, value in face["metadata"].items():
                        content += f"  {key}: {value}\n"
                
                # Create document
                doc = Document(
                    page_content=content,
                    metadata={
                        "name": face.get("name", "Unknown"),
                        "id": str(face.get("_id", "")),
                        "created_at": created_at
                    }
                )
                documents.append(doc)
            
            # Process registration logs
            for log in registration_logs:
                # Format timestamp
                timestamp = log.get("timestamp", datetime.datetime.now()).strftime("%Y-%m-%d %H:%M:%S")
                
                # Create document content
                content = f"""
                Action: {log.get('action', 'Unknown')}
                Person: {log.get('person_name', 'Unknown')}
                Timestamp: {timestamp}
                """
                
                # Add details if available
                if "details" in log and log["details"]:
                    content += "Details:\n"
                    for key, value in log["details"].items():
                        content += f"  {key}: {value}\n"
                
                # Create document
                doc = Document(
                    page_content=content,
                    metadata={
                        "action": log.get("action", "Unknown"),
                        "person_name": log.get("person_name", "Unknown"),
                        "timestamp": timestamp
                    }
                )
                documents.append(doc)
            
            # Split documents
            texts = self.text_splitter.split_documents(documents)
            
            # Create vector store
            self.vector_store = FAISS.from_documents(texts, self.embeddings)
            
            # Create QA chain
            self.qa_chain = ConversationalRetrievalChain.from_llm(
                self.llm,
                retriever=self.vector_store.as_retriever(),
                return_source_documents=True
            )
            
            logger.info(f"Vector store initialized with {len(texts)} documents")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise

    def refresh_vector_store(self):
        """Refresh the vector store with the latest data from the database."""
        try:
            self._initialize_vector_store()
            logger.info("Vector store refreshed")
        except Exception as e:
            logger.error(f"Failed to refresh vector store: {e}")
            raise

    def answer_question(self, question: str) -> Dict[str, Any]:
        """
        Answer a question about registered users.
        
        Args:
            question: Question to answer
            
        Returns:
            Dictionary containing the answer and source documents
        """
        try:
            if not self.qa_chain:
                logger.error("QA chain not initialized")
                return {"answer": "I'm sorry, but the QA system is not initialized properly."}
            
            # Get answer from QA chain
            result = self.qa_chain({"question": question, "chat_history": self.chat_history})
            
            # Update chat history
            self.chat_history.append((question, result["answer"]))
            
            # Limit chat history length
            if len(self.chat_history) > 10:
                self.chat_history = self.chat_history[-10:]
            
            # Format source documents
            sources = []
            for doc in result.get("source_documents", []):
                sources.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata
                })
            
            logger.info(f"Answered question: {question}")
            
            return {
                "question": question,
                "answer": result["answer"],
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Failed to answer question: {e}")
            return {"answer": f"I'm sorry, but I encountered an error: {str(e)}"}

    def clear_chat_history(self):
        """Clear the chat history."""
        self.chat_history = []
        logger.info("Chat history cleared")
