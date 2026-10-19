FROM node:24-alpine AS build
WORKDIR /app/frontend
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci
COPY shared /app/shared
COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/build /usr/share/nginx/html
EXPOSE 80
