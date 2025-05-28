"""
MongoDB setup script for Face Recognition Platform.
Creates necessary collections and indexes.
"""
import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "face_recognition_db")

def setup_database():
    """Set up MongoDB database with required collections and indexes."""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        logger.info(f"Connected to MongoDB: {DB_NAME}")
        
        # Create face_encodings collection if it doesn't exist
        if "face_encodings" not in db.list_collection_names():
            db.create_collection("face_encodings")
            logger.info("Created face_encodings collection")
        
        # Create registration_logs collection if it doesn't exist
        if "registration_logs" not in db.list_collection_names():
            db.create_collection("registration_logs")
            logger.info("Created registration_logs collection")
        
        # Create indexes
        # Index on name for face_encodings collection
        db.face_encodings.create_index([("name", ASCENDING)], unique=True)
        logger.info("Created index on name for face_encodings collection")
        
        # Index on created_at for face_encodings collection
        db.face_encodings.create_index([("created_at", ASCENDING)])
        logger.info("Created index on created_at for face_encodings collection")
        
        # Index on timestamp for registration_logs collection
        db.registration_logs.create_index([("timestamp", ASCENDING)])
        logger.info("Created index on timestamp for registration_logs collection")
        
        # Index on person_name for registration_logs collection
        db.registration_logs.create_index([("person_name", ASCENDING)])
        logger.info("Created index on person_name for registration_logs collection")
        
        logger.info("Database setup completed successfully")
        
        # Close connection
        client.close()
        logger.info("Closed MongoDB connection")
        
        return True
    except Exception as e:
        logger.error(f"Failed to set up database: {e}")
        return False

if __name__ == "__main__":
    setup_database()
