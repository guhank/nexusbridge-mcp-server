FROM node:20-slim

WORKDIR /app

# Install all dependencies (including devDependencies for tsx + tsc)
COPY package.json tsconfig.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose port for Smithery HTTP transport
EXPOSE 8000

# Start in HTTP mode (Smithery connects via HTTP)
CMD ["node", "dist/index.js"]
