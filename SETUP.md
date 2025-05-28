# Setup Guide for Face Recognition Platform

This guide will walk you through setting up and running the Face Recognition Platform with Real-Time AI Q&A.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.8+**
   - Required for the Face Recognition API and RAG Engine
   - Includes libraries: face_recognition, FastAPI, LangChain, etc.

2. **Node.js 16+**
   - Required for the WebSocket server and React frontend
   - Includes npm for package management

3. **MongoDB**
   - Either a local installation or MongoDB Atlas account
   - Used to store face encodings and registration logs

4. **OpenAI API Key**
   - Required for the RAG Engine
   - Sign up at [OpenAI](https://platform.openai.com/) to get an API key

## Step 1: Clone the Repository

If you're using version control, clone the repository. Otherwise, ensure all files are in the correct directory structure.

## Step 2: Set Up Environment Variables

1. **Python Backend (.env file)**
   - Navigate to `backend/face_api/`
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB connection string and OpenAI API key

   ```bash
   cd backend/face_api
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Node.js WebSocket Server (.env file)**
   - Navigate to `backend/node_ws_server/`
   - Copy `.env.example` to `.env`
   - Configure the Python API URL if needed

   ```bash
   cd ../node_ws_server
   cp .env.example .env
   # Edit .env with your values
   ```

3. **React Frontend (.env file)**
   - Navigate to `frontend/`
   - Copy `.env.example` to `.env`
   - Configure the WebSocket server URL if needed

   ```bash
   cd ../../frontend
   cp .env.example .env
   # Edit .env with your values
   ```

## Step 3: Install Dependencies

1. **Python Backend**
   - Install required Python packages

   ```bash
   cd ../
   pip install -r requirements.txt
   ```

2. **Node.js WebSocket Server**
   - Install required Node.js packages

   ```bash
   cd backend/node_ws_server
   npm install
   ```

3. **React Frontend**
   - Install required Node.js packages

   ```bash
   cd ../../frontend
   npm install
   ```

## Step 4: Start MongoDB

If you're using a local MongoDB installation, start the MongoDB service:

```bash
# On Windows
net start MongoDB

# On macOS/Linux
mongod --config /usr/local/etc/mongod.conf
```

If you're using MongoDB Atlas, ensure your connection string in the `.env` file is correct.

## Step 5: Start the Services

1. **Python Backend**
   - Start the Face Recognition API

   ```bash
   cd ../../backend/face_api
   python app.py
   ```

   The API should be running at `http://localhost:8000`

2. **Node.js WebSocket Server**
   - Start the WebSocket server

   ```bash
   cd ../node_ws_server
   npm start
   ```

   The WebSocket server should be running at `http://localhost:3001`

3. **React Frontend**
   - Start the React development server

   ```bash
   cd ../../frontend
   npm run dev
   ```

   The frontend should be running at `http://localhost:5173`

## Step 6: Access the Application

Open your web browser and navigate to `http://localhost:5173`

You should see the Face Recognition Platform with three tabs:
- Registration
- Recognition
- Chat

## Troubleshooting

### Face Recognition Issues

- Ensure good lighting for better face detection
- Position your face clearly in the webcam view
- Check that the Python backend is running and accessible

### WebSocket Connection Issues

- Verify that the WebSocket server is running
- Check that the WebSocket URL in the frontend `.env` file is correct
- Check browser console for connection errors

### MongoDB Connection Issues

- Verify that MongoDB is running
- Check the connection string in the Python backend `.env` file
- Ensure the database name is correct

### OpenAI API Issues

- Verify that your OpenAI API key is valid
- Check for any rate limiting or quota issues
- Ensure the API key is correctly set in the Python backend `.env` file

## Next Steps

- Customize the UI to match your brand
- Add user authentication
- Implement more advanced face recognition features
- Expand the RAG capabilities with additional data sources
