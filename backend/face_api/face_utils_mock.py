"""
Mock Face utilities module for the Face Recognition API.
This is a simplified version that doesn't require face_recognition library.
"""
import base64
import io
import numpy as np
from typing import List, Dict, Any, Tuple
from PIL import Image
from loguru import logger


class FaceUtils:
    """Utility class for face recognition operations (mock version)."""

    @staticmethod
    def decode_image(base64_image: str) -> np.ndarray:
        """
        Decode base64 image to numpy array.
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            Numpy array representing the image
        """
        try:
            # Remove data URL prefix if present
            if "base64," in base64_image:
                base64_image = base64_image.split("base64,")[1]
            
            # Decode base64 image
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            # Convert to numpy array
            return np.array(image)
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            raise

    @staticmethod
    def extract_face_encoding(image: np.ndarray) -> List[List[float]]:
        """
        Extract face encodings from an image (mock version).
        
        Args:
            image: Numpy array representing the image
            
        Returns:
            List of face encodings (mock data)
        """
        try:
            # Return a mock face encoding (128-dimensional vector of random values)
            mock_encoding = np.random.rand(128).tolist()
            logger.info("Using mock face encoding")
            return [mock_encoding]
        except Exception as e:
            logger.error(f"Failed to extract face encoding: {e}")
            raise

    @staticmethod
    def recognize_faces(image: np.ndarray, known_faces: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Recognize faces in an image using known face encodings (mock version).
        
        Args:
            image: Numpy array representing the image
            known_faces: List of documents containing known face encodings
            
        Returns:
            List of recognized faces with bounding boxes and names
        """
        try:
            # Return mock data for testing
            if not known_faces:
                logger.warning("No known faces in database")
                return []
            
            # Just return the first known face as a mock result
            mock_face = known_faces[0]
            
            results = [{
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
            
            logger.info(f"Returning mock face recognition result")
            return results
        except Exception as e:
            logger.error(f"Failed to recognize faces: {e}")
            raise
