# Base image
FROM node:18

# Install poppler-utils for PDF processing
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose app port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
