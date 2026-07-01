ARG BASE_IMAGE=node:22-alpine
FROM ${BASE_IMAGE}

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline

COPY . .
RUN chmod +x /app/scripts/start-container.sh

EXPOSE 3000

CMD ["/bin/sh", "/app/scripts/start-container.sh"]
