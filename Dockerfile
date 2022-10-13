FROM node:18-alpine

WORKDIR /usr/app
COPY package*.json .
COPY src ./src

RUN npm install

CMD ["sleep", "infinity"]