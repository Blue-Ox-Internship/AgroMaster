FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Create .env file from example if it doesn't exist
RUN cp .env.example .env 2>/dev/null || true

EXPOSE 5000

CMD ["npm", "start"]
