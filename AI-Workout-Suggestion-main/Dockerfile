FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY main.py .
COPY models.py .
COPY config.py .
COPY workout_engine.py .
COPY llm_generator.py .

# Expose port
EXPOSE 10000

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
