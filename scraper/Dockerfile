FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN playwright install --with-deps chromium

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD python -c "import http.client; c=http.client.HTTPConnection('localhost',5000); c.request('GET','/health'); r=c.getresponse(); assert r.status==200; r.read()"

CMD ["python", "app.py"]
