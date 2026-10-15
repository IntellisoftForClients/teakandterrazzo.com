FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node prisma/apply-client-brief.js && node server/index.js"]
