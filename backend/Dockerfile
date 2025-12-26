FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y python3 make g++
COPY package.json ./
RUN bun install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["bun", "run", "src/index.ts"]
