FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install chart.js react-chartjs-2

COPY . .

RUN npm run build
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]