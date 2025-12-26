FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["bun", "run", "src/index.ts"]
