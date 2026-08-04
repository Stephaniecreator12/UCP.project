FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend_PPM /app/backend_PPM

WORKDIR /app/backend_PPM

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
