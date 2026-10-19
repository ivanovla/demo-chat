FROM node:24-alpine AS build
WORKDIR /app/backend
COPY backend/package*.json backend/.npmrc ./
RUN npm ci
COPY shared /app/shared
COPY backend ./
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY backend/package.json ./
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
