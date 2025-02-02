# Use the official Node.js image as the base
FROM node:22.13.1

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD [ "npm", "run", "start" ]
