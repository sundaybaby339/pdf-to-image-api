# Stage 1: Cài đặt GraphicsMagick và Ghostscript
FROM node:18 AS builder

# Cố gắng chạy apt-get trong stage này
RUN apt-get update && apt-get install -y graphicsmagick ghostscript

# Stage 2: Tạo image chính
FROM node:18

# Copy các binary từ stage 1 (nếu có)
COPY --from=builder /usr/bin/gm /usr/bin/gm
COPY --from=builder /usr/bin/gs /usr/bin/gs
COPY --from=builder /usr/lib /usr/lib

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
