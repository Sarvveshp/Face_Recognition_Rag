/**
 * WebSocket server for Face Recognition Platform
 * Acts as a middleware between React frontend and Python RAG engine
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const winston = require('winston');

// Configuration
const PORT = process.env.PORT || 3001;
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ws-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // For production, specify exact origins
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    try {
      logger.info(`Received question from ${socket.id}: ${data.question}`);

      // Send question to Python RAG engine
      const response = await axios.post(`${PYTHON_API_URL}/answer-question`, {
        question: data.question
      });

      // Send answer back to client
      socket.emit('chat-response', {
        question: data.question,
        answer: response.data.answer,
        sources: response.data.sources || []
      });

      logger.info(`Sent answer to ${socket.id}`);
    } catch (error) {
      logger.error(`Error processing question: ${error.message}`);
      socket.emit('chat-error', {
        message: 'Failed to process your question',
        error: error.message
      });
    }
  });

  // Handle face registration
  socket.on('register-face', async (data) => {
    try {
      logger.info(`Received face registration for ${data.name}`);

      // Send registration to Python API
      const response = await axios.post(`${PYTHON_API_URL}/register-face`, {
        name: data.name,
        image: data.image,
        metadata: data.metadata || {}
      });

      // Send response back to client
      socket.emit('registration-response', {
        success: true,
        id: response.data.id,
        name: response.data.name,
        message: response.data.message
      });

      // Broadcast to all clients that a new face was registered
      io.emit('new-face-registered', {
        name: data.name,
        timestamp: new Date().toISOString()
      });

      logger.info(`Face registered successfully for ${data.name}`);
    } catch (error) {
      logger.error(`Error registering face: ${error.message}`);
      socket.emit('registration-error', {
        message: 'Failed to register face',
        error: error.message
      });
    }
  });

  // Handle face recognition
  socket.on('recognize-faces', async (data) => {
    try {
      logger.info('Received face recognition request');

      // Send recognition request to Python API
      const response = await axios.post(`${PYTHON_API_URL}/recognize-faces`, {
        image: data.image
      });

      // Send response back to client
      socket.emit('recognition-response', {
        faces: response.data.faces,
        message: response.data.message
      });

      logger.info(`Recognized ${response.data.faces.length} faces`);
    } catch (error) {
      logger.error(`Error recognizing faces: ${error.message}`);
      socket.emit('recognition-error', {
        message: 'Failed to recognize faces',
        error: error.message
      });
    }
  });

  // Handle get registered users request
  socket.on('get-registered-users', async () => {
    try {
      logger.info('Received request to get all registered users');

      // Get all registered users from Python API
      const response = await axios.get(`${PYTHON_API_URL}/faces`);

      // Send response back to client
      socket.emit('registered-users-response', {
        users: response.data.faces || []
      });

      logger.info(`Sent ${response.data.faces?.length || 0} registered users to ${socket.id}`);
    } catch (error) {
      logger.error(`Error getting registered users: ${error.message}`);
      socket.emit('registered-users-error', {
        message: 'Failed to get registered users',
        error: error.message
      });
    }
  });

  // Handle delete face request
  socket.on('delete-face', async (data) => {
    try {
      const faceId = data.faceId;
      logger.info(`Received request to delete face with ID: ${faceId}`);

      // Delete face from Python API
      const response = await axios.delete(`${PYTHON_API_URL}/delete-face/${faceId}`);

      // Send response back to client
      socket.emit('delete-face-response', {
        success: true,
        message: response.data.message
      });

      // Broadcast to all clients that a face was deleted
      io.emit('face-deleted', {
        faceId: faceId,
        timestamp: new Date().toISOString()
      });

      logger.info(`Face with ID ${faceId} deleted successfully`);
    } catch (error) {
      logger.error(`Error deleting face: ${error.message}`);
      socket.emit('delete-face-error', {
        message: 'Failed to delete face',
        error: error.message
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Express routes
app.get('/', (req, res) => {
  res.json({ message: 'WebSocket server for Face Recognition Platform' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
server.listen(PORT, () => {
  logger.info(`WebSocket server running on port ${PORT}`);
  logger.info(`Connected to Python API at ${PYTHON_API_URL}`);
});
