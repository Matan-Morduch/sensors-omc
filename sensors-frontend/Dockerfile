# Use an official Node.js image as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Install production dependencies only
RUN npm ci --only=production

# Copy the server file
COPY server.js .

# Expose the port the server will run on
EXPOSE 8000

# Command to run the server
CMD ["node", "server.js"]
