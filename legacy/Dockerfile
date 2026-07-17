FROM node:20-slim

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy shared and backend package files
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies (will use npm workspaces)
RUN npm ci

# Copy source code
COPY shared ./shared
COPY backend ./backend

# Build shared and backend
RUN npm run build --workspace=@king-of-tokyo/shared
RUN npm run build --workspace=king-of-tokyo-backend

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start backend
CMD ["npm", "start", "--workspace=king-of-tokyo-backend"]
