# Face Recognition Platform with Real-Time AI Q&A

A modular, clean, and scalable platform that combines face recognition with a RAG (Retrieval-Augmented Generation) system for real-time AI Q&A about registered users.

## 🚀 Features

- **Face Registration**: Register faces with associated metadata
- **Real-Time Face Recognition**: Identify registered faces through webcam
- **AI-Powered Q&A**: Ask questions about registered users using RAG technology
- **WebSocket Communication**: Real-time chat interface

## 🏗️ Architecture

The application follows a microservice architecture:

1. **Frontend (React + Vite)**
   - Registration interface
   - Recognition interface
   - Chat interface

2. **Backend**
   - Python Face Recognition API
   - RAG Engine (LangChain + FAISS + OpenAI)
   - Node.js WebSocket Server

3. **Database**
   - MongoDB for storing face encodings and metadata

![Architecture Diagram](./architecture-diagram.png)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- MongoDB (local or Atlas)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd face-rag-platform
   ```

2. **Set up the Python backend**
   ```
   cd backend/face_api
   pip install -r ../../requirements.txt
   ```

3. **Set up the Node.js WebSocket server**
   ```
   cd ../node_ws_server
   npm install
   ```

4. **Set up the React frontend**
   ```
   cd ../../frontend
   npm install
   ```

5. **Environment Variables**
   - Create `.env` files in both backend directories with necessary API keys and configuration

### Running the Application

1. **Start MongoDB** (if using local instance)
   ```
   mongod
   ```

2. **Start the Python Face API**
   ```
   cd backend/face_api
   python app.py
   ```

3. **Start the Node.js WebSocket Server**
   ```
   cd backend/node_ws_server
   node index.js
   ```

4. **Start the React Frontend**
   ```
   cd frontend
   npm run dev
   ```

5. **Access the application** at `http://localhost:5173`

## 📝 Usage

1. **Registration**: Navigate to the Registration tab, capture your face using the webcam, and enter your name
2. **Recognition**: Go to the Recognition tab to see real-time face recognition
3. **Chat**: Use the Chat tab to ask questions about registered users

## 🧩 Project Structure

```
face-rag-platform/
│
├── frontend/ (React + Vite)
│ ├── src/
│ │ ├── components/
│ │ │ ├── RegistrationTab.jsx
│ │ │ ├── RecognitionTab.jsx
│ │ │ └── ChatTab.jsx
│ │ ├── App.jsx
│ │ ├── main.jsx
│ │ └── index.css
│ ├── vite.config.js
│ └── package.json
│
├── backend/
│ ├── face_api/ (Python)
│ │ ├── app.py
│ │ ├── rag_engine.py
│ │ ├── face_utils.py
│ │ └── db.py
│ ├── node_ws_server/
│ │ ├── index.js
│ │ └── package.json
│
├── requirements.txt
├── architecture-diagram.png
└── README.md
```

## 📊 Hackathon Submission

This project was created for the [Katomaran Hackathon](https://katomaran.com).

## 📄 License

MIT
