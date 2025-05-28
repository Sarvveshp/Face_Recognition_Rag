"""
Database module for the Face Recognition API.
Handles MongoDB connections and operations.
"""
import os
import datetime
from typing import Dict, List, Any, Optional
from pymongo import MongoClient
from loguru import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "face_recognition_db")


class Database:
    """MongoDB database handler for face recognition data."""

    def __init__(self):
        """Initialize MongoDB connection."""
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client[DB_NAME]
            self.face_collection = self.db["face_encodings"]
            self.logs_collection = self.db["registration_logs"]
            logger.info(f"Connected to MongoDB: {DB_NAME}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def store_face_encoding(self, name: str, encoding: List[float], metadata: Dict[str, Any]) -> str:
        """
        Store face encoding and metadata in the database.
        
        Args:
            name: Name of the person
            encoding: Face encoding as a list of floats
            metadata: Additional metadata (timestamp, etc.)
            
        Returns:
            ID of the inserted document
        """
        try:
            # Prepare document
            document = {
                "name": name,
                "encoding": encoding,
                "metadata": metadata,
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now()
            }
            
            # Insert document
            result = self.face_collection.insert_one(document)
            
            # Log registration
            self.logs_collection.insert_one({
                "action": "registration",
                "person_id": result.inserted_id,
                "person_name": name,
                "timestamp": datetime.datetime.now(),
                "details": metadata
            })
            
            logger.info(f"Stored face encoding for {name} with ID {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Failed to store face encoding: {e}")
            raise

    def get_all_face_encodings(self) -> List[Dict[str, Any]]:
        """
        Retrieve all face encodings from the database.
        
        Returns:
            List of documents containing face encodings
        """
        try:
            documents = list(self.face_collection.find())
            logger.info(f"Retrieved {len(documents)} face encodings")
            return documents
        except Exception as e:
            logger.error(f"Failed to retrieve face encodings: {e}")
            raise

    def get_face_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve face encoding by name.
        
        Args:
            name: Name of the person
            
        Returns:
            Document containing face encoding or None if not found
        """
        try:
            document = self.face_collection.find_one({"name": name})
            if document:
                logger.info(f"Retrieved face encoding for {name}")
            else:
                logger.info(f"No face encoding found for {name}")
            return document
        except Exception as e:
            logger.error(f"Failed to retrieve face encoding for {name}: {e}")
            raise

    def get_registration_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve registration logs.
        
        Args:
            limit: Maximum number of logs to retrieve
            
        Returns:
            List of registration logs
        """
        try:
            logs = list(self.logs_collection.find().sort("timestamp", -1).limit(limit))
            logger.info(f"Retrieved {len(logs)} registration logs")
            return logs
        except Exception as e:
            logger.error(f"Failed to retrieve registration logs: {e}")
            raise

    def close(self):
        """Close MongoDB connection."""
        try:
            self.client.close()
            logger.info("Closed MongoDB connection")
        except Exception as e:
            logger.error(f"Failed to close MongoDB connection: {e}")
