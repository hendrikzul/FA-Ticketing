FROM node:22-slim

WORKDIR /app

# Minimal deps for headless browser
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 \
    libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
    libasound2t64 libgtk-3-0t64 libgdk-pixbuf2.0-0 \
    xvfb curl ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install camofox-browser globally
RUN npm install -g camofox-browser@latest

ENV DISPLAY=:99
ENV PORT=9377
ENV CAMOFOX_NO_GPU=1
ENV CAMOFOX_HEADLESS=1

EXPOSE 9377

CMD Xvfb :99 -screen 0 1280x720x24 -ac +extension RANDR 2>/dev/null & \
    sleep 2 && \
    camofox-browser
