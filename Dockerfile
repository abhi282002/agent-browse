FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --ignore-scripts

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app ./

EXPOSE 3000
CMD ["npm", "run", "start"]
