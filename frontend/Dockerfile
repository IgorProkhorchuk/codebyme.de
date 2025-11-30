# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the SvelteKit app (outputs to build/ directory via adapter-node)
RUN npm run build

# Remove development dependencies to keep image small
RUN npm prune --production

# Stage 2: Run the server
FROM node:20-alpine
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose the internal port
EXPOSE 3000

# Start the node server
CMD ["node", "build"]
