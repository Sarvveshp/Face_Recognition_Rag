import { useState, useEffect } from 'react'

const RegisteredUsers = ({ socket, showNotification }) => {
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch registered users when component mounts
  useEffect(() => {
    fetchRegisteredUsers()
  }, [])

  // Fetch registered users from the server
  const fetchRegisteredUsers = async () => {
    setIsLoading(true)
    
    try {
      // Check if socket is connected
      if (!socket || !socket.connected) {
        throw new Error('WebSocket connection not established')
      }
      
      // Create a promise to handle the async socket response
      const fetchPromise = new Promise((resolve, reject) => {
        // Send request to get all registered users
        socket.emit('get-registered-users')
        
        // Listen for response
        socket.once('registered-users-response', (response) => {
          resolve(response.users || [])
        })
        
        // Listen for error
        socket.once('registered-users-error', (error) => {
          reject(new Error(error.message))
        })
        
        // Set timeout
        setTimeout(() => reject(new Error('Request timed out')), 5000)
      })
      
      const users = await fetchPromise
      setRegisteredUsers(users)
    } catch (error) {
      showNotification(`Failed to fetch registered users: ${error.message}`, 'error')
      setRegisteredUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a registered user
  const deleteUser = async (userId, userName) => {
    if (isDeleting) return
    
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      // Check if socket is connected
      if (!socket || !socket.connected) {
        throw new Error('WebSocket connection not established')
      }
      
      // Create a promise to handle the async socket response
      const deletePromise = new Promise((resolve, reject) => {
        // Send request to delete user
        socket.emit('delete-face', { faceId: userId })
        
        // Listen for response
        socket.once('delete-face-response', (response) => {
          if (response.success) {
            resolve()
          } else {
            reject(new Error(response.message))
          }
        })
        
        // Listen for error
        socket.once('delete-face-error', (error) => {
          reject(new Error(error.message))
        })
        
        // Set timeout
        setTimeout(() => reject(new Error('Request timed out')), 5000)
      })
      
      await deletePromise
      showNotification(`${userName} deleted successfully`, 'success')
      
      // Refresh the list
      fetchRegisteredUsers()
    } catch (error) {
      showNotification(`Failed to delete user: ${error.message}`, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="registered-users mt-8">
      <h3 className="text-xl font-semibold mb-4">Registered Users</h3>
      
      <button 
        onClick={fetchRegisteredUsers}
        className="refresh-button bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Refresh List'}
      </button>
      
      {isLoading ? (
        <p>Loading registered users...</p>
      ) : registeredUsers.length > 0 ? (
        <div className="users-list">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Registration Date</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registeredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => deleteUser(user._id, user.name)}
                      className="delete-button bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No registered users found.</p>
      )}
    </div>
  )
}

export default RegisteredUsers
