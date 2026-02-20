# Stage 1: Build React App
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
# В нашем случае мы используем внешний nginx.conf через volume в docker-compose,
# но базовый образ всё равно должен быть nginx.
FROM nginx:alpine

# Копируем собранные файлы в стандартную папку nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Порт 80 открыт по умолчанию в nginx образе
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
