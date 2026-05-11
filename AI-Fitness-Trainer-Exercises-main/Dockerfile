FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY models/ ./models/
COPY utils/ ./utils/

# Expose port (docker-compose sets PORT, typically 11003)
EXPOSE 11003

# Run the application
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-11003}
