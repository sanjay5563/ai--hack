FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpoppler-cpp-dev \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY scripts/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

# Copy application code
COPY scripts/ /app/

# Create uploads directory
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

# Expose port
EXPOSE 8001

# Run the application
CMD ["python", "-m", "uvicorn", "smartemr-backend:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
