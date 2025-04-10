FROM node:16-alpine

WORKDIR /app

COPY package.json ./
COPY .meshrc.yaml ./

RUN npm install

EXPOSE 4000

CMD ["npm", "start"]
