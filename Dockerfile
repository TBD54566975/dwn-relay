FROM node:18-alpine

RUN apk add --update python3 make g++

WORKDIR /usr/app
COPY package*.json .
COPY src ./src

RUN npm install --build-from-source

CMD node --es-module-specifier-resolution=node src