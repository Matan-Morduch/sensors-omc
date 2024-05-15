# Base image
FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

RUN mkdir -p ./sensors-gateway

# Install app dependencies by copying
# package.json and package-lock.json
COPY sensors-gateway/package*.json ./sensors-gateway/

# Install all dependencies

# Copy the rest of the application code
COPY ./shared ./shared
COPY ./sensors-gateway ./sensors-gateway

WORKDIR /usr/src/app/sensors-gateway

RUN npm install

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]
