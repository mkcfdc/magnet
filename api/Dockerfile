# Use an official Node.js runtime as a parent image
FROM node:18

# # Create a subdirectory for database and set it as the working directory
WORKDIR /app/database

# # Copy database-specific package.json and package-lock.json
COPY database/package.json ./
COPY database/update.js ./

RUN npm install


# # Copy the cron file
COPY database/mycron /etc/cron.d/mycron

# # Set the working directory to /app
WORKDIR /app

# # Copy in the wait-for-it script
COPY /init/wait-for-it.sh /app/wait-for-it.sh

# Copy package.json and package-lock.json to the working directory
COPY package.json index.js ./

# Install app dependencies
#RUN npm install

# Install cron
RUN apt-get update && apt-get install -y cron && npm install

# Expose port 3030
EXPOSE 3030

# # Copy the shell script into the container
COPY /init/entrypoint.sh /app/init/entrypoint.sh

# Make the shell script executable
RUN chmod +x /app/init/entrypoint.sh

CMD ["/app/init/entrypoint.sh"]

# Set the entrypoint to run the shell script
# ENTRYPOINT ["/init/entrypoint.sh"]
