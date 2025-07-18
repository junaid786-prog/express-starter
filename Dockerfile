# Use Node 18 base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app code
COPY . .

# Expose API port
EXPOSE 3000

# Start app
CMD ["node", "server.js"]
