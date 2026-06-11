FROM node:22-alpine

WORKDIR /app
COPY package.json README.md LICENSE ./
RUN npm install --omit=dev
COPY src ./src
COPY public ./public
COPY scripts ./scripts

ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787

CMD ["node", "src/server.js"]
