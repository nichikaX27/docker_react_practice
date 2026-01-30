FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

# 修正前
# CMD ["npm", "run", "start"] 

# 修正後
CMD npx prisma migrate deploy && npm run start
