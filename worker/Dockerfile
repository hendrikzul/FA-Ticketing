ARG BASE_IMAGE=python:3.12-slim
ARG SKIP_SYSTEM_DEPS=0
FROM ${BASE_IMAGE}

WORKDIR /app

RUN if [ "${SKIP_SYSTEM_DEPS}" = "0" ]; then \
        apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        git \
        && rm -rf /var/lib/apt/lists/*; \
    fi

COPY requirements.txt ./
RUN pip install --no-cache-dir --retries 5 -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
