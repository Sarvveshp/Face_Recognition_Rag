import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import RegisteredUsers from './RegisteredUsers'

const RegistrationTab = ({ socket, showNotification }) => {
  const [capturedImage, setCapturedImage] = useState(null)
  const [name, setName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const webcamRef = useRef(null)

  // Webcam configuration
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  }

  // Capture image from webcam
  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      setCapturedImage(imageSrc)
    }
  }, [webcamRef])

  // Reset captured image
  const resetImage = () => {
    setCapturedImage(null)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!capturedImage || !name.trim()) {
      showNotification('Please capture an image and enter a name', 'error')
      return
    }
    
    setIsRegistering(true)
    
    try {
      // Check if socket is connected
      if (!socket || !socket.connected) {
        throw new Error('WebSocket connection not established')
      }
      
      // Send registration data to server
      socket.emit('register-face', {
        name: name.trim(),
        image: capturedImage,
        metadata: {
          registeredAt: new Date().toISOString(),
          registeredFrom: 'web-client'
        }
      })
      
      // Listen for response
      socket.once('registration-response', (response) => {
        setIsRegistering(false)
        
        if (response.success) {
          showNotification(`Face registered successfully for ${response.name}`, 'success')
          // Reset form
          setCapturedImage(null)
          setName('')
        } else {
          showNotification(`Registration failed: ${response.message}`, 'error')
        }
      })
      
      // Listen for error
      socket.once('registration-error', (error) => {
        setIsRegistering(false)
        showNotification(`Registration failed: ${error.message}`, 'error')
      })
    } catch (error) {
      setIsRegistering(false)
      showNotification(`Registration failed: ${error.message}`, 'error')
    }
  }

  return (
    <div className="registration-tab">
      <h2 className="text-2xl font-semibold mb-4">Face Registration</h2>
      
      <div className="webcam-container mb-4">
        {!capturedImage ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="webcam-video"
          />
        ) : (
          <div className="captured-image-container">
            <img src={capturedImage} alt="Captured" className="webcam-video" />
          </div>
        )}
      </div>
      
      <div className="controls-container mb-4">
        {!capturedImage ? (
          <button 
            onClick={captureImage} 
            className="capture-button"
          >
            Capture Photo
          </button>
        ) : (
          <button 
            onClick={resetImage} 
            className="capture-button bg-gray-600 hover:bg-gray-700"
          >
            Retake Photo
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Enter your name"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isRegistering || !capturedImage}
        >
          {isRegistering ? 'Registering...' : 'Register Face'}
        </button>
      </form>
      
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal pl-5">
          <li>Position your face clearly in the webcam view</li>
          <li>Ensure good lighting for better recognition</li>
          <li>Click "Capture Photo" when ready</li>
          <li>Enter your name in the form</li>
          <li>Click "Register Face" to complete registration</li>
        </ol>
      </div>
      
      {/* Display registered users with delete functionality */}
      <RegisteredUsers socket={socket} showNotification={showNotification} />
    </div>
  )
}

export default RegistrationTab
