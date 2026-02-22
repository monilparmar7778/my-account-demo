# -------- Stage 1: Build Angular App --------
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# -------- Stage 2: Serve Using Nginx --------
FROM nginx:alpine

COPY --from=build /app/dist/my-account-demo/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
