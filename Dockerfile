# Docker instructions necessary for Docker Engine to build an image of my service

# Parent (base) image to use as a starting point for our own image
# use specific version to make sure our image is as close to our dev env as possible

# Stage 0: use larger base node image to install dependencies
FROM node:16.14.0@sha256:fd86131ddf8e0faa8ba7a3e49b6bf571745946e663e4065f3bff0a07204c1dde AS dependencies

# LABEL adds metadata to an image
LABEL maintainer="Yoonkyung Kim" \
      description="Fragments node.js microservice"

# Environmental variables become part of the build image and will persist in any containers run using this image
# Note we can define things that will always be different at run-time instead of build-time

ENV NODE_ENV=production

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
COPY package*.json ./

# Install only production dependencies defined in package-lock.json
RUN npm ci --only=production \
    && npm uninstall sharp \
    && npm install --platform=linuxmusl sharp@0.30.3
###################################################

# Stage 1..
FROM node:16.14.0-alpine3.14@sha256:98a87dfa76dde784bb4fe087518c839697ce1f0e4f55e6ad0b49f0bfd5fbe52c AS main

RUN apk add --no-cache dumb-init=~1.2.5 curl=~7.79.1

WORKDIR /app

ENV NODE_ENV=production

# Copy cached dependencies from previous stage so we don't have to download
COPY --chown=node:node --from=dependencies /app /app/

# Copy source code into the image
COPY --chown=node:node ./src ./src

# Copy our HTPASSWD file
COPY --chown=node:node ./tests/.htpasswd ./tests/.htpasswd

USER node

# Start the container by running our server
CMD ["dumb-init", "node", "src/index.js"]

# We run our service on port 8080
# The EXPOSE instruction is mostly for documentation
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=30s --start-period=5s --retries=3 \
CMD curl --fail localhost:8080 || exit 1