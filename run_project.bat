@echo off
echo Starting Face Recognition Platform...
echo.
echo Starting Python Backend (Face API)...
start cmd /k "cd c:\Users\Sarvvesh\CascadeProjects\face-rag-platform\backend\face_api && python simple_app.py"
echo.
echo Starting Node.js WebSocket Server...
start cmd /k "cd c:\Users\Sarvvesh\CascadeProjects\face-rag-platform\backend\node_ws_server && npm start"
echo.
echo Starting Frontend (React + Vite)...
start cmd /k "cd c:\Users\Sarvvesh\CascadeProjects\face-rag-platform\frontend && npm run dev"
echo.
echo All components started! Once the frontend is ready, open your browser and go to:
echo http://localhost:5173
echo.
echo Press any key to exit this window (the project will continue running)...
pause > nul
