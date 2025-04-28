# Sử dụng Node.js làm base image
FROM node:18

# Cài đặt GraphicsMagick và Ghostscript
RUN apt-get update && apt-get install -y graphicsmagick ghostscript

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Expose port
EXPOSE 3000

# Chạy server
CMD ["npm", "start"]
