#!/bin/bash
# Install dependencies and run the SmartEMR backend server

echo "Installing Python dependencies..."
pip install -r scripts/requirements.txt

echo "Starting SmartEMR Backend Server..."
echo "Make sure to set OPENAI_API_KEY in your environment variables"
echo "Server will run on http://localhost:8001"

cd scripts
python -m uvicorn smartemr-backend:app --reload --port 8001 --host 0.0.0.0
