# Dockerfile — Containerized dev server for hexa-studio
# Runtime prerequisites: Docker >= 20.10
# Usage: docker build -t hexa-studio . && docker run -p 3000:3000 hexa-studio

FROM node:20-alpine

WORKDIR /app

# Copy project files
COPY package.json ./
COPY dev-server.js ./
COPY index.html ./
COPY scene.js ./
COPY staging.js ./
COPY gate.js ./
COPY hero-options.js ./
COPY light-options.js ./
COPY theme.css ./
COPY publish.css ./
COPY 404.html ./
COPY favicon.svg ./
COPY robots.txt ./
COPY sitemap.xml ./
COPY shared/ ./shared/
COPY assets/ ./assets/
COPY media/ ./media/
COPY CLIPS/ ./CLIPS/
COPY prompt/ ./prompt/

# Install dev dependencies
RUN npm install --omit=dev 2>/dev/null || true

EXPOSE 3000

CMD ["node", "dev-server.js"]
