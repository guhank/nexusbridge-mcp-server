FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy source
COPY . .

# Expose port for Smithery HTTP transport
EXPOSE 8000

# Start in HTTP mode (Smithery connects via HTTP)
CMD ["npx", "tsx", "index.ts"]
