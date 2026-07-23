# ---- stage 1: install production dependencies only ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- stage 2: minimal runtime image ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# copy the installed prod deps from the deps stage (no dev deps, no npm cache)
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
# run as the non-root 'node' user shipped in the official image
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
