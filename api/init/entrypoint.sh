#!/bin/bash

# Wait for MySQL to be ready
/app/init/wait-for-it.sh -t 60 mysql:3306 --

# Execute your commands
cd /app/database

# Check if index.js exists
if [ -e "update.js" ]; then
  node update.js
else
  echo "update.js does not exist. Waiting for 30 seconds..."
  sleep 30

  # Check again
  if [ -e "update.js" ]; then
    node update.js
  else
    echo "update.js still does not exist. Skipping."
  fi
fi

cd /app
npm start
cron