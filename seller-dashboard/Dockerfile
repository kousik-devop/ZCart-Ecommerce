FROM node:18-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /usr/src/app
USER app

EXPOSE 3006

CMD ["node", "server.js"]
