import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'

const RecognitionTab = ({ socket, showNotification }) => {
  const [recognizedFaces, setRecognizedFaces] = useState([])
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const webcamRef = useRef(null)
  const intervalRef = useRef(null)

  // Webcam configuration
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Start face recognition stream
  const startStream = useCallback(() => {
    if (isStreaming || !socket || !socket.connected) return
    
    setIsStreaming(true)
    setRecognizedFaces([])
    
    // Set up interval to capture and recognize faces
    intervalRef.current = setInterval(() => {
      if (webcamRef.current && !isRecognizing) {
        const imageSrc = webcamRef.current.getScreenshot()
        if (imageSrc) {
          recognizeFaces(imageSrc)
        }
      }
    }, 1000) // Recognize every 1 second
    
    showNotification('Face recognition started', 'success')
  }, [socket, isStreaming, isRecognizing, showNotification])

  // Stop face recognition stream
  const stopStream = useCallback(() => {
    if (!isStreaming) return
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setIsStreaming(false)
    showNotification('Face recognition stopped', 'success')
  }, [isStreaming, showNotification])

  // Recognize faces in image
  const recognizeFaces = async (imageSrc) => {
    if (!socket || !socket.connected || isRecognizing) return
    
    setIsRecognizing(true)
    
    try {
      // Send image to server for recognition
      socket.emit('recognize-faces', {
        image: imageSrc
      })
      
      // Listen for response
      socket.once('recognition-response', (response) => {
        setIsRecognizing(false)
        setRecognizedFaces(response.faces || [])
      })
      
      // Listen for error
      socket.once('recognition-error', (error) => {
        setIsRecognizing(false)
        showNotification(`Recognition failed: ${error.message}`, 'error')
      })
    } catch (error) {
      setIsRecognizing(false)
      showNotification(`Recognition failed: ${error.message}`, 'error')
    }
  }

  // Render face boxes
  const renderFaceBoxes = () => {
    if (!recognizedFaces.length) return null
    
    return recognizedFaces.map((face, index) => {
      const { name, confidence } = face
      
      // Get webcam dimensions
      const webcamElement = webcamRef.current?.video
      const displayWidth = webcamElement?.clientWidth || 640
      const displayHeight = webcamElement?.clientHeight || 480
      
      // Create a centered box that will cover most faces
      const boxWidth = displayWidth * 0.4  // 40% of webcam width
      const boxHeight = displayHeight * 0.6 // 60% of webcam height
      
      // Center the box in the webcam
      const boxStyle = {
        position: 'absolute',
        top: `${(displayHeight - boxHeight) / 2}px`,
        left: `${(displayWidth - boxWidth) / 2}px`,
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
        border: '3px solid',  // Thicker border for better visibility
        boxSizing: 'border-box',
        zIndex: 10
      }
      
      // Position the label at the top of the box
      const labelStyle = {
        position: 'absolute',
        top: `${(displayHeight - boxHeight) / 2 - 30}px`,
        left: `${(displayWidth - boxWidth) / 2}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 11
      }
      
      // Set color based on confidence
      const confidenceColor = confidence > 0.7 ? '#00ff00' : confidence > 0.5 ? '#ffff00' : '#ff0000'
      
      return (
        <div key={index}>
          <div 
            style={{
              ...boxStyle,
              borderColor: confidenceColor
            }}
          />
          <div style={labelStyle}>
            {name} ({Math.round(confidence * 100)}%)
          </div>
        </div>
      )
    })
  }

  return (
    <div className="recognition-tab">
      <h2 className="text-2xl font-semibold mb-4">Face Recognition</h2>
      
      <div className="webcam-container mb-4">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam-video"
        />
        {renderFaceBoxes()}
      </div>
      
      <div className="controls-container mb-4 flex gap-4 justify-center">
        {!isStreaming ? (
          <button 
            onClick={startStream} 
            className="capture-button"
            disabled={!socket || !socket.connected}
          >
            Start Recognition
          </button>
        ) : (
          <button 
            onClick={stopStream} 
            className="capture-button bg-red-600 hover:bg-red-700"
          >
            Stop Recognition
          </button>
        )}
      </div>
      
      <div className="recognition-results mt-6">
        <h3 className="text-xl font-semibold mb-2">Recognition Results:</h3>
        {recognizedFaces.length > 0 ? (
          <ul className="list-disc pl-5">
            {recognizedFaces.map((face, index) => (
              <li key={index}>
                {face.name} (Confidence: {Math.round(face.confidence * 100)}%)
              </li>
            ))}
          </ul>
        ) : (
          <p>No faces recognized yet.</p>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal pl-5">
          <li>Position your face clearly in the webcam view</li>
          <li>Click "Start Recognition" to begin real-time face detection</li>
          <li>Recognized faces will be highlighted with bounding boxes</li>
          <li>Click "Stop Recognition" when finished</li>
        </ol>
      </div>
    </div>
  )
}

export default RecognitionTab
