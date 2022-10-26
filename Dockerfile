FROM node:18-alpine3.15

WORKDIR /dwn

COPY package.json .
COPY src ./src
COPY etc ./etc

# DWN's levelDB has issues running on m1, so we have to install prerequisites and build from source
RUN apk add --update python3 make g++
RUN npm install --build-from-source

CMD node --es-module-specifier-resolution=node src