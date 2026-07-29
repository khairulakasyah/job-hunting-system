FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Install Chromium AND its system dependencies
RUN playwright install --with-deps chromium

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]