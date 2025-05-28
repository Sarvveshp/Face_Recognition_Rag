"""
Simplified RAG (Retrieval-Augmented Generation) engine for the Face Recognition Platform.
This version avoids issues with FAISS and provides mock responses for testing.
"""
import os
from typing import List, Dict, Any
import datetime
from loguru import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SimpleRAGEngine:
    """Simple RAG Engine for answering questions about registered users."""

    def __init__(self, db_instance):
        """
        Initialize Simple RAG Engine.
        
        Args:
            db_instance: Database instance for accessing face data
        """
        self.db = db_instance
        self.chat_history = []
        logger.info("Simple RAG Engine initialized")

    def refresh_vector_store(self):
        """Mock refresh the vector store."""
        logger.info("Vector store refreshed (mock)")
        return True

    def answer_question(self, question: str) -> Dict[str, Any]:
        """
        Answer a question about registered users with mock responses.
        
        Args:
            question: Question to answer
            
        Returns:
            Dictionary containing the answer and source documents
        """
        try:
            # Get all face data to use in the mock response
            face_data = self.db.get_all_face_encodings()
            
            # Create a mock response based on the question and available face data
            if "who" in question.lower() and face_data:
                names = [face.get("name", "Unknown") for face in face_data]
                answer = f"I know about the following people: {', '.join(names)}."
            elif "how many" in question.lower() and face_data:
                answer = f"There are {len(face_data)} people registered in the system."
            elif face_data:
                # Generic response mentioning the first person
                answer = f"I have information about {face_data[0].get('name', 'Unknown')} and others. What would you like to know specifically?"
            else:
                answer = "I don't have any information about registered users yet. Please register some faces first."
            
            # Update chat history
            self.chat_history.append((question, answer))
            
            # Limit chat history length
            if len(self.chat_history) > 10:
                self.chat_history = self.chat_history[-10:]
            
            # Create mock sources from face data
            sources = []
            for face in face_data[:2]:  # Limit to first 2 for simplicity
                sources.append({
                    "content": f"Person: {face.get('name', 'Unknown')}\nRegistration Date: {face.get('created_at', datetime.datetime.now()).strftime('%Y-%m-%d %H:%M:%S')}",
                    "metadata": {
                        "name": face.get("name", "Unknown"),
                        "id": str(face.get("_id", ""))
                    }
                })
            
            logger.info(f"Answered question: {question}")
            
            return {
                "question": question,
                "answer": answer,
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Failed to answer question: {e}")
            return {"answer": f"I'm sorry, but I encountered an error: {str(e)}"}

    def clear_chat_history(self):
        """Clear the chat history."""
        self.chat_history = []
        logger.info("Chat history cleared")
