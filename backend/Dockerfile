FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./
COPY db.js ./
COPY seed.js ./
COPY seed-data ./seed-data

EXPOSE 8080

CMD ["npm", "start"]
