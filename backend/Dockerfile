FROM node:18-alpine

WORKDIR /app

# 1. 依存関係の定義ファイルをコピー
COPY package*.json ./
COPY prisma ./prisma/

# 2. パッケージをインストール
RUN npm install

# 3. 残りの全ファイルをコピー
COPY . .

# 4. Prisma Clientの生成（DB操作に必要）
RUN npx prisma generate

# 5. TypeScriptをビルド（これが重要！ここで dist/index.js が作られます）
RUN npm run build

EXPOSE 3000

# 6. DBのマイグレーションを実行してからサーバーを起動
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]