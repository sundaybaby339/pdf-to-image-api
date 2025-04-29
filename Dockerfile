# Base image
FROM node:18

# Cài thêm poppler-utils
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Làm việc trong thư mục /app
WORKDIR /app

# Copy package.json và cài đặt
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
