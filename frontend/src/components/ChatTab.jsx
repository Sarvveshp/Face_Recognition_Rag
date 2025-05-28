import { useState, useEffect, useRef } from 'react'

const ChatTab = ({ socket, showNotification }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return

    // Listen for chat responses
    const handleChatResponse = (data) => {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          text: data.answer,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          sources: data.sources || []
        }
      ])
      setIsLoading(false)
    }

    // Listen for chat errors
    const handleChatError = (error) => {
      showNotification(`Error: ${error.message}`, 'error')
      setIsLoading(false)
    }

    socket.on('chat-response', handleChatResponse)
    socket.on('chat-error', handleChatError)

    // Cleanup on unmount
    return () => {
      socket.off('chat-response', handleChatResponse)
      socket.off('chat-error', handleChatError)
    }
  }, [socket, showNotification])

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Send message
  const sendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading || !socket || !socket.connected) return
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prevMessages => [...prevMessages, userMessage])
    setInputMessage('')
    setIsLoading(true)
    
    // Send message to server
    socket.emit('chat-message', {
      question: userMessage.text
    })
  }

  // Clear chat
  const clearChat = () => {
    setMessages([])
    
    // Add welcome message
    setMessages([{
      id: Date.now(),
      text: "Hello! I'm your AI assistant. Ask me questions about registered users.",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }])
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Initialize chat with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Hello! I'm your AI assistant. Ask me questions about registered users.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }])
    }
  }, [messages.length])

  return (
    <div className="chat-tab">
      <h2 className="text-2xl font-semibold mb-4">AI Q&A Chat</h2>
      
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-timestamp text-xs text-gray-500 mt-1">
                {formatTimestamp(message.timestamp)}
              </div>
              
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources mt-2 text-sm border-t border-gray-700 pt-2">
                  <div className="font-semibold">Sources:</div>
                  {message.sources.map((source, index) => (
                    <div key={index} className="source-item mt-1 text-xs">
                      <div className="source-content">{source.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="chat-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="chat-input"
            placeholder="Ask a question about registered users..."
            disabled={isLoading || !socket || !socket.connected}
          />
          <button 
            type="submit" 
            className="chat-button"
            disabled={isLoading || !socket || !socket.connected}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
      
      <div className="chat-controls mt-4 flex justify-end">
        <button 
          onClick={clearChat} 
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          Clear Chat
        </button>
      </div>
      
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Example Questions:</h3>
        <ul className="list-disc pl-5">
          <li>Who was the last person registered?</li>
          <li>When was [person's name] registered?</li>
          <li>How many people are registered in the system?</li>
          <li>List all registered users</li>
          <li>What metadata is stored for [person's name]?</li>
        </ul>
      </div>
    </div>
  )
}

export default ChatTab
