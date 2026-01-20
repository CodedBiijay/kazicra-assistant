# Use the latest Node 23 slim image for a smaller footprint
FROM node:23

WORKDIR /app
ENV NODE_ENV=production

# Copy dependency files first to leverage Docker cache
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Run the app directly using the experimental flags (no tsc needed)
CMD ["node", "--experimental-strip-types", "--disable-warning=ExperimentalWarning", "src/main.ts"]
