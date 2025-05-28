"""
Face utilities module for the Face Recognition API.
Handles face detection, encoding, and recognition.
"""
import base64
import io
import numpy as np
from typing import List, Dict, Any, Tuple
import face_recognition
from PIL import Image
from loguru import logger


class FaceUtils:
    """Utility class for face recognition operations."""

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
        Extract face encodings from an image.
        
        Args:
            image: Numpy array representing the image
            
        Returns:
            List of face encodings
        """
        try:
            # Find face locations in the image
            face_locations = face_recognition.face_locations(image)
            
            if not face_locations:
                logger.warning("No faces detected in the image")
                return []
            
            # Extract face encodings
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            # Convert to list of lists (for JSON serialization)
            encodings = [encoding.tolist() for encoding in face_encodings]
            
            logger.info(f"Extracted {len(encodings)} face encodings")
            return encodings
        except Exception as e:
            logger.error(f"Failed to extract face encoding: {e}")
            raise

    @staticmethod
    def recognize_faces(image: np.ndarray, known_faces: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Recognize faces in an image using known face encodings.
        
        Args:
            image: Numpy array representing the image
            known_faces: List of documents containing known face encodings
            
        Returns:
            List of recognized faces with bounding boxes and names
        """
        try:
            # Find face locations in the image
            face_locations = face_recognition.face_locations(image)
            
            if not face_locations:
                logger.warning("No faces detected in the image")
                return []
            
            # Extract face encodings
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            # Prepare known face encodings and names
            known_encodings = [np.array(face["encoding"]) for face in known_faces]
            known_names = [face["name"] for face in known_faces]
            
            # Initialize results
            results = []
            
            # Match each face encoding with known encodings
            for i, (face_encoding, face_location) in enumerate(zip(face_encodings, face_locations)):
                # Compare face with known faces
                matches = face_recognition.compare_faces(known_encodings, face_encoding)
                face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                
                # Find the best match
                if True in matches:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = known_names[best_match_index]
                        confidence = 1 - face_distances[best_match_index]
                        
                        # Convert face location to bounding box
                        top, right, bottom, left = face_location
                        
                        # Add to results
                        results.append({
                            "name": name,
                            "confidence": float(confidence),
                            "bounding_box": {
                                "top": top,
                                "right": right,
                                "bottom": bottom,
                                "left": left
                            },
                            "person_id": str(known_faces[best_match_index].get("_id", ""))
                        })
                else:
                    # Unknown face
                    top, right, bottom, left = face_location
                    results.append({
                        "name": "Unknown",
                        "confidence": 0.0,
                        "bounding_box": {
                            "top": top,
                            "right": right,
                            "bottom": bottom,
                            "left": left
                        },
                        "person_id": ""
                    })
            
            logger.info(f"Recognized {len(results)} faces")
            return results
        except Exception as e:
            logger.error(f"Failed to recognize faces: {e}")
            raise
