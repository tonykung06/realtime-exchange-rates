FROM node:8.1.4

RUN mkdir -p /usr/src/app
WORKDIR  /usr/src/app

COPY package.json /usr/src/app

RUN npm i

COPY . /usr/src/app

RUN npm run build

EXPOSE 8080

CMD [ "npm", "start" ]
