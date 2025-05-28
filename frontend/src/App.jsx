import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import io from 'socket.io-client'
import RegistrationTab from './components/RegistrationTab'
import RecognitionTab from './components/RecognitionTab'
import ChatTab from './components/ChatTab'

// Socket.io server URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001'

function App() {
  const [socket, setSocket] = useState(null)
  const [notification, setNotification] = useState(null)
  const location = useLocation()

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL)
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })
    
    newSocket.on('new-face-registered', (data) => {
      showNotification(`New face registered: ${data.name}`, 'success')
    })
    
    setSocket(newSocket)
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])
  
  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="text-3xl font-bold mb-6">Face Recognition Platform</h1>
        <nav className="tab-container">
          <Link 
            to="/" 
            className={`tab ${location.pathname === '/' ? 'active' : ''}`}
          >
            Registration
          </Link>
          <Link 
            to="/recognition" 
            className={`tab ${location.pathname === '/recognition' ? 'active' : ''}`}
          >
            Recognition
          </Link>
          <Link 
            to="/chat" 
            className={`tab ${location.pathname === '/chat' ? 'active' : ''}`}
          >
            Chat
          </Link>
        </nav>
      </header>
      
      <main className="app-content mt-6">
        <Routes>
          <Route 
            path="/" 
            element={<RegistrationTab socket={socket} showNotification={showNotification} />} 
          />
          <Route 
            path="/recognition" 
            element={<RecognitionTab socket={socket} showNotification={showNotification} />} 
          />
          <Route 
            path="/chat" 
            element={<ChatTab socket={socket} showNotification={showNotification} />} 
          />
        </Routes>
      </main>
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <footer className="app-footer mt-8 text-center text-gray-500 text-sm">
        <p>Face Recognition Platform with Real-Time AI Q&A</p>
        <p>Developed for Katomaran Hackathon</p>
      </footer>
    </div>
  )
}

export default App
