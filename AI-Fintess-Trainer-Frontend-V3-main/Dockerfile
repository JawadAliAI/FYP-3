FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Strip direct API URL lines from env files before Vite runs. On some setups .env.production
# overrides empty ENV and bakes http://IP:11002 → browser CORS from :11000.
RUN set -e; \
    if [ -f .env.production ]; then sed -i '/^VITE_EXERCISE_API_URL=/d;/^VITE_WORKOUT_API_URL=/d;/^VITE_ASSISTANT_API_URL=/d' .env.production; fi; \
    if [ -f .env ]; then sed -i '/^VITE_EXERCISE_API_URL=/d;/^VITE_WORKOUT_API_URL=/d;/^VITE_ASSISTANT_API_URL=/d' .env; fi; \
    if [ -f .env.local ]; then sed -i '/^VITE_EXERCISE_API_URL=/d;/^VITE_WORKOUT_API_URL=/d;/^VITE_ASSISTANT_API_URL=/d' .env.local; fi; \
    if [ -f .env.production.local ]; then sed -i '/^VITE_EXERCISE_API_URL=/d;/^VITE_WORKOUT_API_URL=/d;/^VITE_ASSISTANT_API_URL=/d' .env.production.local; fi

# Extra guard: empty env for the docker build process
ENV VITE_EXERCISE_API_URL=""
ENV VITE_WORKOUT_API_URL=""
ENV VITE_ASSISTANT_API_URL=""

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN npm run build

# ─── Production image: nginx serves the built files ───
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
