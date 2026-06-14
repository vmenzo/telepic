FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json README.md LICENSE ./
RUN npm ci
COPY client ./client
COPY public ./public
COPY src ./src
COPY tsconfig.json tsconfig.client.json tsconfig.server.json vite.config.ts ./
RUN npm run build
COPY scripts ./scripts
RUN npm prune --omit=dev

ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787

CMD ["node", "dist/server.js"]
