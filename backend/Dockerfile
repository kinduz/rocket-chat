FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

FROM base AS dev

CMD ["npm", "run", "start:dev"]

FROM base AS builder

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
