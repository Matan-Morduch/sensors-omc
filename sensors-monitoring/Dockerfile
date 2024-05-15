# Base image
FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

RUN mkdir -p ./sensors-monitoring

# Install app dependencies by copying
# package.json and package-lock.json
COPY sensors-monitoring/package*.json ./sensors-monitoring/

# Install all dependencies

# Copy the rest of the application code
COPY ./shared ./shared
COPY ./sensors-monitoring ./sensors-monitoring

WORKDIR /usr/src/app/sensors-monitoring

RUN npm install

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the app
CMD ["npm", "start"]
