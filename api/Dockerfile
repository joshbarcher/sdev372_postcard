# node:22-slim, not :latest and not the full image. A tag that moves is a build
# that is not reproducible, and the full image is ~1 GB of things this app never
# calls.
FROM node:22-slim

WORKDIR /app

# package files FIRST, on their own layer. Docker caches a layer until its
# inputs change -- copying src/ before npm install means every source edit
# reinstalls every dependency.
COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

# The node image already has a `node` user. Running as root inside a container
# is the default and it should not be: a process that escapes is then root on
# something it should never have reached.
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/server.js"]
