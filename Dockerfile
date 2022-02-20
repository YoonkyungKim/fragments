# Docker instructions necessary for Docker Engine to build an image of my service

# Parent (base) image to use as a starting point for our own image
# use specific version to make sure our image is as close to our dev env as possible
FROM node:16.14.0

# LABEL adds metadata to an image
LABEL maintainer="Yoonkyung Kim"
LABEL description="Fragments node.js microservice"

# Environmental variables become part of the build image and will persist in any containers run using this image
# Note we can define things that will always be different at run-time instead of build-time

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
# It'll create /app and enter it, so all subsequent commands will be relative to /app
WORKDIR /app

# Copy the package.json and package-lock.json files into /app
# (copy files & folders from build context to a path inside image)
COPY package*.json /app/

# since we WORKDIR is set to /app, we could use relative path too
# COPY package*.json ./

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD npm start

# We run our service on port 8080
# The EXPOSE instruction is mostly for documentation
EXPOSE 8080