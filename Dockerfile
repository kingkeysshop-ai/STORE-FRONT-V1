FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ git

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8000
CMD ["npm", "run", "start"]
