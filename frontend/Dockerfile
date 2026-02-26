# frontend/Dockerfile 
# ========================= Stage 1: 
# build
FROM node:20.19-alpine AS builder 
WORKDIR /app
# Копируем package.json и 
# package-lock.json
COPY package*.json ./
# Устанавливаем ВСЕ зависимости, включая 
# devDependencie

RUN npm install --legacy-peer-deps \
&& npm install -g vite@latest
# Копируем исходники
COPY . .
# Сборка Vite

RUN npm run build
# Stage 2: production
FROM nginx:stable-alpine
# Копируем сборку
COPY --from=builder /app/dist /usr/share/nginx/html

# Опционально: убираем default конфиг 
# nginx
RUN rm /etc/nginx/conf.d/default.conf 

# Можно добавить свой конфиг (если нужен 
# SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
