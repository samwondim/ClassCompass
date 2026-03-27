# --- Base image for building the app ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy rest of app
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN yarn build

# --- Production image ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app from builder stage
COPY --from=builder /package.json ./
COPY --from=builder /yarn.lock ./
COPY --from=builder /prisma ./prisma
COPY --from=builder /.next ./.next
COPY --from=builder /public ./public
COPY --from=builder /node_modules ./node_modules

EXPOSE 3000

CMD ["yarn", "start"]

