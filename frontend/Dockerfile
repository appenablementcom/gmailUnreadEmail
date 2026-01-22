FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci

COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
