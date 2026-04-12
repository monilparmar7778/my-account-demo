# ----------- BUILD STAGE -----------
FROM node:20 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Angular app
RUN npm run build


# ----------- RUN STAGE -----------
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output (IMPORTANT PATH)
COPY --from=build /app/dist/my-account-demo/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
