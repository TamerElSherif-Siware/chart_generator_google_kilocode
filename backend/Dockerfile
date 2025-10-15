# Use the official Node.js image.
FROM node:18

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy backend package.json to install dependencies.
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source and frontend static files into the image.
COPY backend ./
COPY frontend ./frontend

# Set environment to production.
ENV NODE_ENV=production

# Expose port.
EXPOSE 5001

# Start the server.
CMD ["node", "server.js"]