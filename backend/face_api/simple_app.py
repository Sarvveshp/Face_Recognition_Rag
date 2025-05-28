"""
Simplified version of the Face Recognition API.
This version doesn't rely on the face_recognition library.
"""
import os
import json
import datetime
import random
from typing import Dict, Any, List, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger
import numpy as np

from db import Database
from simple_rag_engine import SimpleRAGEngine

# Configure logger
logger.add("face_api.log", rotation="10 MB", level="INFO")

# Initialize FastAPI app
app = FastAPI(title="Face Recognition API", description="API for face registration, recognition, and Q&A")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db = Database()

# Initialize simplified RAG engine
rag_engine = SimpleRAGEngine(db)

# Define request/response models
class RegisterFaceRequest(BaseModel):
    name: str
    image: str  # Base64 encoded image
    metadata: Optional[Dict[str, Any]] = None

class RegisterFaceResponse(BaseModel):
    id: str
    name: str
    message: str

class RecognizeFacesRequest(BaseModel):
    image: str  # Base64 encoded image

class RecognizeFacesResponse(BaseModel):
    faces: List[Dict[str, Any]]
    message: str

class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    answer: str
    sources: Optional[List[Dict[str, Any]]] = None


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Face Recognition API is running"}

@app.post("/register-face", response_model=RegisterFaceResponse)
async def register_face(request: RegisterFaceRequest):
    """
    Register a face with name and metadata.
    
    Args:
        request: RegisterFaceRequest containing name, image, and metadata
        
    Returns:
        RegisterFaceResponse containing ID, name, and message
    """
    try:
        # Create a mock face encoding (128-dimensional vector of random values)
        face_encoding = [random.random() for _ in range(128)]
        
        # Prepare metadata
        metadata = request.metadata or {}
        metadata["registration_time"] = datetime.datetime.now().isoformat()
        
        # Store face encoding in database
        face_id = db.store_face_encoding(request.name, face_encoding, metadata)
        
        # Refresh RAG engine
        rag_engine.refresh_vector_store()
        
        return RegisterFaceResponse(
            id=face_id,
            name=request.name,
            message=f"Face registered successfully for {request.name}"
        )
    except Exception as e:
        logger.error(f"Failed to register face: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recognize-faces", response_model=RecognizeFacesResponse)
async def recognize_faces(request: RecognizeFacesRequest):
    """
    Recognize faces in an image.
    
    Args:
        request: RecognizeFacesRequest containing image
        
    Returns:
        RecognizeFacesResponse containing recognized faces and message
    """
    try:
        # Get all face encodings from database
        known_faces = db.get_all_face_encodings()
        
        # If no faces in database, return empty result
        if not known_faces:
            return RecognizeFacesResponse(
                faces=[],
                message="No faces found in database"
            )
        
        # For demo purposes, just return the first face in the database
        mock_face = known_faces[0]
        
        recognized_faces = [{
            "name": mock_face["name"],
            "confidence": 0.95,
            "bounding_box": {
                "top": 50,
                "right": 150,
                "bottom": 150,
                "left": 50
            },
            "person_id": str(mock_face.get("_id", ""))
        }]
        
        return RecognizeFacesResponse(
            faces=recognized_faces,
            message=f"Recognized {len(recognized_faces)} faces"
        )
    except Exception as e:
        logger.error(f"Failed to recognize faces: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer-question", response_model=QuestionResponse)
async def answer_question(request: QuestionRequest):
    """
    Answer a question about registered users.
    
    Args:
        request: QuestionRequest containing question
        
    Returns:
        QuestionResponse containing answer and sources
    """
    try:
        # Answer question
        result = rag_engine.answer_question(request.question)
        
        return QuestionResponse(
            answer=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        logger.error(f"Failed to answer question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/refresh-rag")
async def refresh_rag():
    """Refresh the RAG engine."""
    try:
        rag_engine.refresh_vector_store()
        return {"message": "RAG engine refreshed successfully"}
    except Exception as e:
        logger.error(f"Failed to refresh RAG engine: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear-chat-history")
async def clear_chat_history():
    """Clear the chat history."""
    try:
        rag_engine.clear_chat_history()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting Face Recognition API on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
