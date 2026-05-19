# ---- Base Node ----
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# ---- Dependencies ----
FROM base AS dependencies
RUN pnpm install --frozen-lockfile
# ---- Build ----
FROM dependencies AS build
ENV CI=true
COPY . .
# Create a default .env file from example (will be overridden by runtime env)
COPY .env.example .env
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID}
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=${NEXT_PUBLIC_VERSION}
RUN pnpm run build
# ---- Production ----
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@11.1.0 --activate
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/next.config.js ./next.config.js
# Expose the port the app will run on
EXPOSE 3000
# Start the application
CMD ["pnpm", "start"]
