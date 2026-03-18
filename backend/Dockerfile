FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3001
EXPOSE 9229

CMD ["npm", "run", "start:dev"]

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
